import {LocatorError,validCoordinates,type GeocodeResult,type PointInput} from "./domain.ts";
import {fetchGeoapify} from "./geocoding.ts";

type Options={apiKey:string;fetcher?:typeof fetch};
type StructuredAddress={street:string;housenumber:string;city:string;state:string;postcode:string};
type Candidate={lat?:number;lon?:number;country_code?:string;city?:string;state_code?:string;state?:string;county_code?:string;county?:string;postcode?:string;street?:string;housenumber?:string;formatted?:string;result_type?:string;rank?:{confidence?:number}};
const states:Record<string,string>={AC:"Acre",AL:"Alagoas",AP:"Amapá",AM:"Amazonas",BA:"Bahia",CE:"Ceará",DF:"Distrito Federal",ES:"Espírito Santo",GO:"Goiás",MA:"Maranhão",MT:"Mato Grosso",MS:"Mato Grosso do Sul",MG:"Minas Gerais",PA:"Pará",PB:"Paraíba",PR:"Paraná",PE:"Pernambuco",PI:"Piauí",RJ:"Rio de Janeiro",RN:"Rio Grande do Norte",RS:"Rio Grande do Sul",RO:"Rondônia",RR:"Roraima",SC:"Santa Catarina",SP:"São Paulo",SE:"Sergipe",TO:"Tocantins"};
const normalize=(value:unknown)=>typeof value==="string"?value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g," "):"";
const streetTypes:Record<string,string>={r:"Rua",rua:"Rua",av:"Avenida",avenida:"Avenida",rod:"Rodovia",rodovia:"Rodovia",est:"Estrada",estrada:"Estrada",pca:"Praça",praca:"Praça",trav:"Travessa",travessa:"Travessa",al:"Alameda",alameda:"Alameda"};
const abbreviations:Record<string,string>={dr:"Doutor",dra:"Doutora",prof:"Professor",profa:"Professora",sta:"Santa",sto:"Santo"};
const regions:Record<string,string[]>={norte:["AC","AP","AM","PA","RO","RR","TO"],nordeste:["AL","BA","CE","MA","PB","PE","PI","RN","SE"],centrooeste:["DF","GO","MT","MS"],sudeste:["ES","MG","RJ","SP"],sul:["PR","RS","SC"]};
function cleanStreet(value:string){
 let street=value.trim().replace(/\s+/g," ");
 const prefix=street.match(/^(\S+)\s+(.+)$/);
 const type=prefix&&streetTypes[normalize(prefix[1])];
 if(type&&prefix){
  let rest=prefix[2];
  const duplicate=rest.match(/^(\S+)\s+(.+)$/);
  if(duplicate&&streetTypes[normalize(duplicate[1])]===type)rest=duplicate[2];
  street=type+" "+rest;
 }
 return street.replace(/\b(dr|dra|prof|profa|sta|sto)\.?(?=\s)/gi,token=>abbreviations[normalize(token)]??token);
}
const streetKey=(value:string)=>normalize(cleanStreet(value));
const numberKey=(value:string)=>{
 const number=value.toUpperCase().replace(/\s/g,"").match(/^(\d{1,3}(?:\.\d{3})+|\d+)(?:-?([A-Z]))?$/);
 return number?number[1].replace(/\./g,"")+(number[2]??""):"";
};
export function parseStructuredAddress(point:PointInput):StructuredAddress{
 const comma=point.address.indexOf(",");
 const street=cleanStreet(point.address.slice(0,comma));
 const rest=point.address.slice(comma+1).trim();
 const number=rest.match(/^(?:n[ºo°.]*\s*)?(\d{1,3}(?:\.\d{3})+|\d+)(?:\s*-?\s*([a-z])(?=\s*(?:[-,]|$)))?(?=\s*(?:[-,]|$))/i);
 const numericCompound=number&&/^\s*-\s*\d/.test(rest.slice(number[0].length));
 if(comma<1||!street||/\bkm\b/i.test(street)||!number||numericCompound||!point.city.trim()||!states[point.state]||!/^\d{8}$/.test(point.postalCode)){
  throw new LocatorError("Não foi possível separar rua e número com segurança. Confira o número do imóvel ou o quilômetro e complemento do endereço.",422,"ADDRESS_NEEDS_DETAILS");
 }
 return {street,housenumber:numberKey(number[1]+(number[2]??"")),city:point.city.trim(),state:point.state,postcode:point.postalCode};
}
function matches(row:Candidate,address:StructuredAddress){
 if(!row||row.country_code!=="br"||!validCoordinates(row.lat,row.lon)||typeof row.formatted!=="string"||!row.formatted.trim()||
  typeof row.rank?.confidence!=="number"||!Number.isFinite(row.rank.confidence)||row.rank.confidence<0.6||row.rank.confidence>1||!["building","amenity"].includes(row.result_type??""))return false;
 let stateCode=typeof row.state_code==="string"?row.state_code.replace(/^BR[-_]/i,"").toUpperCase():Object.keys(states).find(code=>normalize(states[code])===normalize(row.state));
 // Alguns resultados brasileiros vêm com a macrorregião em state e a UF em county.
 // Só aceitar essa hierarquia quando sigla, nome oficial e região forem coerentes.
 if(!row.state_code&&!stateCode&&typeof row.county_code==="string"){
  const countyCode=row.county_code.replace(/^BR[-_]/i,"").toUpperCase();
  if(regions[normalize(row.state).replace(/ /g,"")]?.includes(countyCode)&&normalize(row.county)===normalize(states[countyCode]))stateCode=countyCode;
 }
 return stateCode===address.state&&normalize(row.city)===normalize(address.city)&&
  typeof row.street==="string"&&streetKey(row.street)===streetKey(address.street)&&
  typeof row.housenumber==="string"&&numberKey(row.housenumber)===address.housenumber&&
  (row.postcode===undefined||(typeof row.postcode==="string"&&row.postcode.replace(/\D/g,"")===address.postcode));
}
export function createStructuredGeocoder(options:Options){
 return async(point:PointInput):Promise<GeocodeResult>=>{
  const address=parseStructuredAddress(point);
  if(!options.apiKey.trim())throw new LocatorError("Configure o serviço de localização antes de consultar os endereços.",503,"GEOCODER_NOT_CONFIGURED");
  const url=new URL("https://api.geoapify.com/v1/geocode/search");
  for(const [key,value] of Object.entries(address))url.searchParams.set(key,key==="state"?states[value]:value);
  url.searchParams.set("country","Brasil");url.searchParams.set("filter","countrycode:br");
  url.searchParams.set("lang","pt");url.searchParams.set("format","json");url.searchParams.set("limit","3");url.searchParams.set("apiKey",options.apiKey);
  let rows:Candidate[];
  try{
   const response=await (options.fetcher??fetchGeoapify)(url,{signal:AbortSignal.timeout(8000),cache:"no-store"});
   if(!response.ok)throw new Error("Provider unavailable");
   const body:unknown=await response.json();
   if(!body||typeof body!=="object"||!("results" in body)||!Array.isArray(body.results))throw new Error("Invalid provider response");
   rows=body.results;
  }catch{
   throw new LocatorError("Não foi possível consultar o endereço agora. Tente novamente em instantes.",503,"GEOCODER_UNAVAILABLE");
  }
  const row=rows.find(candidate=>matches(candidate,address));
  if(!row)throw new LocatorError("A consulta não encontrou uma edificação com rua, número, cidade e UF correspondentes ao cadastro. Confira os dados do endereço.",422,"ADDRESS_NOT_FOUND");
  return {latitude:row.lat!,longitude:row.lon!,label:row.formatted!.slice(0,500),confidence:row.rank!.confidence!,precision:row.result_type!,source:"geoapify"};
 };
}
export const geocodeStructuredAddress=createStructuredGeocoder({apiKey:process.env.GEOAPIFY_API_KEY?.trim()??""});
