import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "../../db";
import { locatorPoints, type LocatorPoint } from "../../db/schema";
import { addressMapsUrl, addressQuery, assertActivatable, distanceKm, LocatorError, mapsUrl, normalizePlaceName, STATES, validCoordinates, validatePointInput, type GeocodeResult, type PointInput } from "./domain";
import { geocodeAddress, reverseGeocode } from "./geocoding";
import { geocodeStructuredAddress } from "./structured-geocoding";
import { pointImportKey } from "./import";
import { parseSearchOffset, parseSearchRadius, searchNearbyPage, type SearchRadius } from "./results";
type Geocoder = (query: string) => Promise<GeocodeResult>;

async function geocodeFields(input: PointInput, geocoder: Geocoder) {
  try {
    let result:GeocodeResult;
    try{result=await geocoder(addressQuery(input));}catch(error){
      if(geocoder===geocodeAddress&&error instanceof LocatorError&&error.code==="ADDRESS_NOT_FOUND")result=await geocodeStructuredAddress(input);
      else throw error;
    }
    if (!validCoordinates(result.latitude, result.longitude)) throw new LocatorError("Localização inválida.");
    return { latitude: result.latitude, longitude: result.longitude, geocodeStatus: "needs_review",
      geocodeLabel: result.label, geocodeConfidence: result.confidence, geocodePrecision: result.precision,
      geocodeSource: result.source, geocodeError: null, confirmedAt: null, active: false };
  } catch (error) {
    return { latitude: null, longitude: null, geocodeStatus: "error", geocodeLabel: null,
      geocodeConfidence: null, geocodePrecision: null, geocodeSource: null,
      geocodeError: error instanceof LocatorError ? error.message : "Não foi possível localizar o endereço. Confira os dados e tente novamente.",
      confirmedAt: null, active: false };
  }
}
async function getPoint(id: number) {
  if (!Number.isSafeInteger(id) || id < 1) throw new LocatorError("Ponto de venda inválido.");
  const [point] = await db.select().from(locatorPoints).where(eq(locatorPoints.id, id));
  if (!point) throw new LocatorError("Ponto de venda não encontrado.", 404, "NOT_FOUND");
  return point;
}
function assertVersion(point: LocatorPoint, version: number) {
  if (!Number.isSafeInteger(version) || version !== point.version) {
    throw new LocatorError("Este cadastro foi alterado em outra tela. Atualize a lista antes de continuar.", 409, "STALE_POINT");
  }
}
async function saveMutation(point: LocatorPoint, version: number, values: Partial<typeof locatorPoints.$inferInsert>) {
  assertVersion(point, version);
  const [saved] = await db.update(locatorPoints).set({...values,version:version+1,updatedAt:new Date()})
    .where(and(eq(locatorPoints.id,point.id),eq(locatorPoints.version,version))).returning();
  if (!saved) throw new LocatorError("Este cadastro mudou durante a operação. Atualize a lista.", 409, "STALE_POINT");
  return saved;
}
export async function listPoints() {
  return db.select().from(locatorPoints).orderBy(desc(locatorPoints.updatedAt), desc(locatorPoints.id));
}
export async function createPoint(input: unknown, geocoder: Geocoder = geocodeAddress): Promise<LocatorPoint> {
  const point = validatePointInput(input);
  const location = await geocodeFields(point, geocoder);
  const [created] = await db.insert(locatorPoints).values({...point,...location,isDemo:process.env.DEMO_LOCAL_ONLY==="true"}).returning();
  return created;
}
export async function importPoint(input: unknown, geocoder: Geocoder = geocodeAddress, store: Pick<typeof db,"transaction"> = db): Promise<{status:"imported"|"duplicate";point:LocatorPoint}> {
  const point=validatePointInput(input),key=pointImportKey(point);
  return store.transaction(async tx=>{
    // Duas confirmações simultâneas da mesma linha não podem criar dois registros.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${key}, 0))`);
    const existing=(await tx.select().from(locatorPoints)).find(saved=>pointImportKey(saved)===key);
    if(existing)return {status:"duplicate",point:existing};
    const location=await geocodeFields(point,geocoder);
    const [created]=await tx.insert(locatorPoints).values({...point,...location,isDemo:process.env.DEMO_LOCAL_ONLY==="true"}).returning();
    return {status:"imported",point:created};
  });
}
export async function updatePoint(id: number, input: unknown, version: number, geocoder: Geocoder = geocodeAddress): Promise<LocatorPoint> {
  const point = await getPoint(id); assertVersion(point,version);
  if (point.deletedAt) throw new LocatorError("Restaure o cadastro antes de editar.",409);
  const next = validatePointInput(input);
  const moved = ["address","city","state","postalCode"].some(key => next[key as keyof PointInput] !== point[key as keyof PointInput]);
  const location = moved ? await geocodeFields(next,geocoder) : {};
  return saveMutation(point,version,{...next,...location});
}
export async function pointAction(id: number, action: string, version: number, geocoder:Geocoder=geocodeAddress): Promise<LocatorPoint> {
  const point = await getPoint(id); assertVersion(point,version);
  if (point.deletedAt && action!=="restore") throw new LocatorError("O cadastro está na lixeira.",409);
  if (action==="restore") {
    if (!point.deletedAt) throw new LocatorError("O cadastro já está fora da lixeira.",409);
    return saveMutation(point,version,{deletedAt:null,active:false,cityListingVisible:false});
  }
  if (action==="trash") return saveMutation(point,version,{deletedAt:new Date(),active:false,cityListingVisible:false});
  if (action==="deactivate") return saveMutation(point,version,{active:false,cityListingVisible:false});
  if (action==="show-by-city" || action==="hide-from-city") {
    if(point.geocodeStatus==="confirmed") throw new LocatorError("Este ponto já tem localização confirmada. Use a opção de ativar ou desativar.",409);
    return saveMutation(point,version,{cityListingVisible:action==="show-by-city"});
  }
  if (action==="activate") {
    assertActivatable(point);
    return saveMutation(point,version,{active:true,cityListingVisible:false});
  }
  if (action==="confirm") {
    if (point.geocodeStatus!=="needs_review" || !validCoordinates(point.latitude,point.longitude)) throw new LocatorError("Não há uma localização válida para confirmar.",409);
    if (point.geocodeSource==="demo" && process.env.DEMO_LOCAL_ONLY!=="true") throw new LocatorError("Localizações ilustrativas só podem ser ativadas na demo local.",409);
    return saveMutation(point,version,{geocodeStatus:"confirmed",confirmedAt:new Date(),active:true,cityListingVisible:false});
  }
  if (action==="geocode") {
    return saveMutation(point,version,await geocodeFields(point,geocoder));
  }
  throw new LocatorError("Ação inválida.");
}
export async function searchPoints(latitude: number, longitude: number, radiusKm: SearchRadius = 30, offset = 0) {
  if (!validCoordinates(latitude,longitude)) throw new LocatorError("Localização inválida.");
  const radius = parseSearchRadius(radiusKm);
  const start = parseSearchOffset(offset);
  const rows=await db.select().from(locatorPoints).where(and(
    eq(locatorPoints.active,true),eq(locatorPoints.geocodeStatus,"confirmed"),isNull(locatorPoints.deletedAt),
    process.env.DEMO_LOCAL_ONLY==="true" ? undefined : eq(locatorPoints.isDemo,false),
  ));
  const candidates=rows.filter(point=>validCoordinates(point.latitude,point.longitude))
    .map(point=>({id:point.id,name:point.name,address:point.address,city:point.city,state:point.state,
      postalCode:point.postalCode,isDemo:point.isDemo,
      latitude:point.latitude!,longitude:point.longitude!,
      distanceKm:distanceKm(latitude,longitude,point.latitude!,point.longitude!),
      mapsUrl:mapsUrl(point.latitude!,point.longitude!)}))
  return searchNearbyPage(candidates, radius, start);
}
export async function listCityPartners(city: string | null | undefined, state: string | null | undefined) {
  if (!city?.trim()) return [];
  const targetCity=normalizePlaceName(city);
  const targetState=state?.trim().toUpperCase()||null;
  const rows=await db.select().from(locatorPoints).where(and(
    eq(locatorPoints.cityListingVisible,true),isNull(locatorPoints.deletedAt),
    process.env.DEMO_LOCAL_ONLY==="true" ? undefined : eq(locatorPoints.isDemo,false),
  ));
  return rows.filter(point=>point.geocodeStatus!=="confirmed" &&
    normalizePlaceName(point.city)===targetCity && (!targetState||point.state===targetState))
    .sort((a,b)=>a.name.localeCompare(b.name,"pt-BR")||a.id-b.id)
    .map(point=>({id:point.id,name:point.name,address:point.address,city:point.city,state:point.state,
      postalCode:point.postalCode,isDemo:point.isDemo,mapsUrl:addressMapsUrl(point)}));
}
export async function locateOrigin(input: unknown) {
  if (!input || typeof input!=="object" || Array.isArray(input)) throw new LocatorError("Informe um endereço ou permita a localização.");
  const raw=input as Record<string,unknown>;
  if ("query" in raw) {
    if ("latitude" in raw || "longitude" in raw || typeof raw.query!=="string" || !raw.query.trim()) throw new LocatorError("Informe um endereço ou CEP.");
    const found=await geocodeAddress(raw.query.trim());
    return {latitude:found.latitude,longitude:found.longitude,label:found.label,precision:found.precision,
      approximate:found.precision!=="building",source:found.source,city:found.city??null,state:found.state??null};
  }
  if (!validCoordinates(raw.latitude,raw.longitude)) throw new LocatorError("Localização inválida.");
  const text=(field:string,max:number)=>{
    const value=raw[field];
    if(typeof value!=="string"||!value.trim()||value.length>max||/[\u0000-\u001f]/.test(value))return null;
    return value.trim();
  };
  const label=text("label",300);
  const precision=text("precision",40);
  const providedCity=text("city",100);
  let providedState=text("state",2)?.toUpperCase()??null;
  if(providedState&&!STATES.includes(providedState))providedState=null;
  let place:{city:string|null;state:string|null}={city:providedCity,state:providedState};
  // A cidade de referência permite listar também os parceiros ainda sem coordenadas.
  if ((!place.city||!place.state)&&process.env.GEOAPIFY_API_KEY?.trim()) {
    try{place=await reverseGeocode(raw.latitude as number,raw.longitude as number);}catch{/* A busca por proximidade continua funcionando sem a cidade. */}
  }
  return {latitude:raw.latitude as number,longitude:raw.longitude as number,
    label:label??"Sua localização atual",precision,
    approximate:precision?precision!=="building":true,
    source:label?"selected":"browser",city:place.city,state:place.state};
}


