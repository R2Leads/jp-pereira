import test from "node:test";
import assert from "node:assert/strict";
import {createStructuredGeocoder,parseStructuredAddress} from "../src/lib/locator/structured-geocoding.ts";

const point={name:"Parceiro de teste",address:"R. Costa e Silva, 387 - Jardim Irene",city:"Iperó",state:"SP",postalCode:"18560000",phone:"",whatsapp:""};
const candidate={lat:-23.35,lon:-47.68,country_code:"br",city:"Iperó",state_code:"SP",postcode:"18560-000",street:"Rua Costa e Silva",housenumber:"387",formatted:"Rua Costa e Silva, 387, Iperó - SP",result_type:"building",rank:{confidence:1}};
const fake=(results:unknown[])=>async()=>Response.json({results});

test("separa rua e número sem alterar o endereço original ou usar números do nome da rua",()=>{
 const original={...point,address:"RUA 15 DE NOVEMBRO, 1.312 B - CENTRO"};
 assert.deepEqual(parseStructuredAddress(original),{street:"Rua 15 DE NOVEMBRO",housenumber:"1312B",city:"Iperó",state:"SP",postcode:"18560000"});
 assert.equal(original.address,"RUA 15 DE NOVEMBRO, 1.312 B - CENTRO");
 assert.equal(parseStructuredAddress({...point,address:"AVENIDA AV. GONCALVES JUNIOR, 393 - VILA BARAO"}).street,"Avenida GONCALVES JUNIOR");
});
test("recusa número ausente, quilômetro e complemento ambíguo antes da consulta",()=>{
 for(const address of ["Rua Exemplo, S/N - Centro","Rua Exemplo, SN - Centro","Rodovia Raposo Tavares KM 105-B, S/N - Itanguá","Rodovia Exemplo, KM 10 - Centro","Rua 15 de Novembro, Centro","Rua Exemplo sem separador 10","Rua Exemplo, 387-389 - Centro","Rua Exemplo, 387 - 1 - Centro"]){
  assert.throws(()=>parseStructuredAddress({...point,address}),{code:"ADDRESS_NEEDS_DETAILS"});
 }
});
test("sufixo com hífen não pode ativar o imóvel de número sem sufixo",async()=>{
 const input={...point,address:"R. Costa e Silva, 387-B - Jardim Irene"};
 assert.equal(parseStructuredAddress(input).housenumber,"387B");
 await assert.rejects(createStructuredGeocoder({apiKey:"x",fetcher:fake([candidate])})(input),{code:"ADDRESS_NOT_FOUND"});
 const result=await createStructuredGeocoder({apiKey:"x",fetcher:fake([{...candidate,housenumber:"387-B"}])})(input);
 assert.equal(result.precision,"building");
 assert.equal(parseStructuredAddress({...point,address:"Rua Costa e Silva, 387 - Bairro Irene"}).housenumber,"387");
});
test("número composto ou ponto decimal do provedor não pode virar outro número simples",async()=>{
 for(const [requested,returned] of [["1001","100-1"],["387","38.7"]]){
  const input={...point,address:`Rua Costa e Silva, ${requested} - Jardim Irene`};
  await assert.rejects(createStructuredGeocoder({apiKey:"x",fetcher:fake([{...candidate,housenumber:returned}])})(input),{code:"ADDRESS_NOT_FOUND"});
 }
 const result=await createStructuredGeocoder({apiKey:"x",fetcher:fake([{...candidate,housenumber:"1.001"}])})({...point,address:"Rua Costa e Silva, 1001 - Centro"});
 assert.equal(result.precision,"building");
});
test("envia componentes separados e aceita edificação com todos os campos correspondentes",async()=>{
 const geocode=createStructuredGeocoder({apiKey:"test-private-key",fetcher:async input=>{
  const url=new URL(String(input));
  assert.equal(url.searchParams.has("text"),false);
  assert.equal(url.searchParams.get("street"),"Rua Costa e Silva");
  assert.equal(url.searchParams.get("housenumber"),"387");
  assert.equal(url.searchParams.get("city"),"Iperó");
  assert.equal(url.searchParams.get("postcode"),"18560000");
  assert.equal(url.searchParams.get("filter"),"countrycode:br");
  return Response.json({results:[candidate]});
 }});
 const result=await geocode(point);
 assert.equal(result.precision,"building");assert.equal(result.latitude,candidate.lat);assert.equal(result.source,"geoapify");
});
test("exige correspondência de rua, número, cidade, UF, CEP, precisão e coordenadas",async()=>{
 for(const mismatch of [
  {street:"Rua Costa Pereira"},{housenumber:"389"},{city:"Sorocaba"},{state_code:"PR"},{postcode:"18560001"},
  {country_code:"us"},{result_type:"postcode"},{result_type:"street"},{lat:999},{rank:{confidence:0.5}},
  {street:undefined},{housenumber:undefined},{city:undefined},{state_code:undefined},
 ]){
  await assert.rejects(createStructuredGeocoder({apiKey:"x",fetcher:fake([{...candidate,...mismatch}])})(point),{code:"ADDRESS_NOT_FOUND"});
 }
});
test("normaliza abreviações conhecidas, sufixo numérico e nome da UF sem ampliar correspondência",async()=>{
 const geocode=createStructuredGeocoder({apiKey:"x",fetcher:fake([{...candidate,street:"R Costa e Silva",housenumber:"387 B",state_code:undefined,state:"São Paulo"}])});
 const result=await geocode({...point,address:"Rua Costa e Silva, 387B - Jardim Irene"});
 assert.equal(result.precision,"building");
 await assert.rejects(geocode(point),{code:"ADDRESS_NOT_FOUND"});
});
test("reconhece UF devolvida como county somente com nome, sigla e macrorregião compatíveis",async()=>{
 const hierarchy={...candidate,state_code:undefined,state:"Sudeste",county:"São Paulo",county_code:"SP"};
 const result=await createStructuredGeocoder({apiKey:"x",fetcher:fake([hierarchy])})(point);
 assert.equal(result.precision,"building");
 for(const mismatch of [{county:"Campinas"},{county_code:"35"},{state:"Norte"},{state_code:"PR"}]){
  await assert.rejects(createStructuredGeocoder({apiKey:"x",fetcher:fake([{...hierarchy,...mismatch}])})(point),{code:"ADDRESS_NOT_FOUND"});
 }
});
test("analisa os candidatos sem aceitar o primeiro de outra cidade",async()=>{
 const result=await createStructuredGeocoder({apiKey:"x",fetcher:fake([{...candidate,city:"Sorocaba"},candidate])})(point);
 assert.equal(result.latitude,candidate.lat);
});
test("falhas de API e resposta inválida permanecem temporárias e não expõem a chave",async()=>{
 for(const fetcher of [async()=>{throw new Error("apiKey=test-private-key");},async()=>Response.json({message:"Not allowed"},{status:401}),async()=>Response.json({wrong:[]})]){
  await assert.rejects(createStructuredGeocoder({apiKey:"test-private-key",fetcher})(point),error=>{
   assert.equal((error as {code:string}).code,"GEOCODER_UNAVAILABLE");assert.equal(String(error).includes("test-private-key"),false);return true;
  });
 }
 await assert.rejects(createStructuredGeocoder({apiKey:""})(point),{code:"GEOCODER_NOT_CONFIGURED"});
});
