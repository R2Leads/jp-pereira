import test from "node:test";
import assert from "node:assert/strict";
import { assertDemoDatabase } from "../scripts/local-db-guard";
import type { SearchResult } from "../src/lib/locator/client-types";
type Coordinates={latitude:number;longitude:number};
type GeoSearchResult={origin:SearchResult["origin"]&Coordinates;points:Array<SearchResult["points"][number]&Coordinates>};

const base="http://127.0.0.1:3218";
async function search(query:string) {
 assertDemoDatabase();
 assert.ok(process.env.GEOAPIFY_API_KEY?.trim(),"Configure a chave privada antes dos testes reais.");
 const response=await fetch(base+"/api/points/search",{method:"POST",headers:{"Content-Type":"application/json",Origin:base},body:JSON.stringify({query}),signal:AbortSignal.timeout(15000)});
 const body=await response.text();
 assert.ok(!body.includes(process.env.GEOAPIFY_API_KEY!.trim()),"A resposta pública deve omitir a chave.");
 return {status:response.status,data:JSON.parse(body)};
}
function checkDistances(data:GeoSearchResult) {
 assert.equal(data.origin.source,"geoapify");
 assert.ok(data.points.length>0&&data.points.length<=10);
 const rad=(value:number)=>value*Math.PI/180;
 for(const [index,point] of data.points.entries()) {
  // Lei esférica dos cossenos: conferência independente do Haversine da aplicação.
  const cosine=Math.sin(rad(data.origin.latitude))*Math.sin(rad(point.latitude))+
   Math.cos(rad(data.origin.latitude))*Math.cos(rad(point.latitude))*Math.cos(rad(point.longitude-data.origin.longitude));
  const expected=6371.0088*Math.acos(Math.min(1,Math.max(-1,cosine)));
  assert.ok(Math.abs(expected-point.distanceKm)<0.001,"Distância geográfica deve conferir com tolerância de um metro.");
  if(index)assert.ok(data.points[index-1].distanceKm<=point.distanceKm);
  const route=new URL(point.mapsUrl);
  assert.equal(route.hostname,"www.google.com");
  assert.equal(route.searchParams.get("api"),"1");
  assert.equal(route.searchParams.get("destination"),`${point.latitude},${point.longitude}`);
  assert.equal(route.searchParams.has("key"),false);
 }
}

test("CEPs reais com e sem hífen localizam Centro, Votorantim e Itu e ordenam as distâncias",async()=>{
 for(const [query,name] of [["18010-000","Centro"],["18110000","Votorantim"],["13300-000","Itu"]]) {
  const result=await search(query);
  assert.equal(result.status,200,`CEP ${query} deve ser localizado.`);
  checkDistances(result.data);
  assert.equal(result.data.points[0].name,`Ponto de demonstração · ${name}`);
 }
 const formatted=await search("18110-000");
 const plain=await search("13300000");
 for(const result of [formatted,plain]){assert.equal(result.status,200);checkDistances(result.data);}
 assert.equal(formatted.data.points[0].name,"Ponto de demonstração · Votorantim");
 assert.equal(plain.data.points[0].name,"Ponto de demonstração · Itu");
});

test("endereços livres reais encontram Centro e Campolim",async()=>{
 for(const [query,name] of [["Praça Coronel Fernando Prestes, Centro, Sorocaba, SP","Centro"],["Avenida Antônio Carlos Comitre, 1000, Sorocaba, SP","Campolim"]]) {
  const result=await search(query);
  assert.equal(result.status,200);
  checkDistances(result.data);
  assert.equal(result.data.points[0].name,`Ponto de demonstração · ${name}`);
 }
});

test("CEP manual fora dos atalhos usa geocodificação real e ordena os pontos",async()=>{
 const result=await search("01001-000");
 assert.equal(result.status,200);
 checkDistances(result.data);
});

test("CEP inválido e texto inexistente recebem mensagem própria sem dados privados",async()=>{
 for(const query of ["00000-000","zzqxvknmtr 99999999"]){
  const result=await search(query);
  assert.equal(result.status,422);
  assert.equal(result.data.code,"ADDRESS_NOT_FOUND");
  assert.ok(typeof result.data.error==="string"&&result.data.error.includes("Confira"));
 }
});
