import test from "node:test";
import assert from "node:assert/strict";
import https from "node:https";
import { Readable } from "node:stream";
import { EventEmitter } from "node:events";
import type { IncomingMessage } from "node:http";
import { createGeocoder, createReverseGeocoder } from "../src/lib/locator/geocoding.ts";

test("geocodificação usa IPv4 quando a conexão padrão seria recusada pela lista de IPs", async t => {
  const defaultFetch = t.mock.method(globalThis, "fetch", async () =>
    Response.json({message:"Not allowed"}, {status:401}));
  t.mock.method(https, "get", (...args: unknown[]) => {
    const url = args[0] as URL;
    const options = args[1] as https.RequestOptions;
    const receive = args[2] as (response: IncomingMessage) => void;
    assert.equal(url.hostname, "api.geoapify.com");
    const allowed = options.family === 4;
    const body = allowed ? {results:[{lat:-23.5,lon:-47.4,country_code:"br",formatted:"Sorocaba, SP, Brasil",result_type:"postcode",rank:{confidence:1}}]} : {message:"Not allowed"};
    const response = Object.assign(Readable.from([JSON.stringify(body)]), {statusCode:allowed?200:401});
    queueMicrotask(() => receive(response as IncomingMessage));
    return new EventEmitter() as ReturnType<typeof https.get>;
  });
  const result = await createGeocoder({apiKey:"test-private-key",localDemo:false})("18010-000");
  assert.equal(result.source, "geoapify");
  assert.equal(result.latitude, -23.5);
  assert.equal(defaultFetch.mock.callCount(), 0);
});
test("exemplos locais funcionam sem chave e nunca viram geocodificação de produção", async () => {
  const demo = createGeocoder({ apiKey: "", localDemo: true });
  const result = await demo("18010-000");
  assert.equal(result.source, "demo");
  assert.equal(result.latitude, -23.4991);
  await assert.rejects(demo("Rua não cadastrada, 999, Sorocaba"), { code: "GEOCODER_NOT_CONFIGURED" });
  await assert.rejects(createGeocoder({apiKey:"",localDemo:false})("18010-000"), { code: "GEOCODER_NOT_CONFIGURED" });
});
test("consulta Geoapify restringe Brasil e extrai endereço e coordenadas", async () => {
  const geocode = createGeocoder({apiKey:"test-private-key",localDemo:false,fetcher:async input => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get("filter"), "countrycode:br");
    assert.equal(url.searchParams.get("type"), "postcode");
    return Response.json({results:[{lat:-23.5,lon:-47.4,country_code:"br",formatted:"Sorocaba, SP, Brasil",result_type:"postcode",rank:{confidence:1,match_type:"full_match"}}]});
  }});
  const result=await geocode("18010-000");
  assert.deepEqual(result,{latitude:-23.5,longitude:-47.4,label:"Sorocaba, SP, Brasil",confidence:1,precision:"postcode",source:"geoapify"});
});
test("consulta extrai cidade e UF para a listagem por cidade", async () => {
  const geocode = createGeocoder({apiKey:"test-private-key",localDemo:false,fetcher:async()=>Response.json({results:[
    {lat:-23.5,lon:-47.4,country_code:"br",formatted:"Sorocaba - SP, Brasil",result_type:"postcode",city:"Sorocaba",state_code:"BR-SP",rank:{confidence:1}},
  ]})});
  const result = await geocode("18010-000");
  assert.equal(result.city, "Sorocaba");
  assert.equal(result.state, "SP");
});
test("geocodificação reversa identifica a cidade a partir das coordenadas", async () => {
  const reverse = createReverseGeocoder({apiKey:"test-private-key",fetcher:async input => {
    const url = new URL(String(input));
    assert.equal(url.pathname, "/v1/geocode/reverse");
    assert.equal(url.searchParams.get("lat"), "-23.5");
    assert.equal(url.searchParams.get("lon"), "-47.4");
    return Response.json({results:[{lat:-23.5,lon:-47.4,country_code:"br",city:"Votorantim",state_code:"SP"}]});
  }});
  assert.deepEqual(await reverse(-23.5, -47.4), {city:"Votorantim",state:"SP"});
});
test("lê a UF em county_code quando o provedor manda a macrorregião em state", async () => {
  const reverse = createReverseGeocoder({apiKey:"test-private-key",fetcher:async()=>Response.json({results:[
    {lat:-23.5015,lon:-47.4526,country_code:"br",city:"Sorocaba",state:"Sudeste",county:"São Paulo",county_code:"BR-SP",postcode:"18010-082"},
  ]})});
  assert.deepEqual(await reverse(-23.5015, -47.4526), {city:"Sorocaba",state:"SP"});
});
test("resultado fora do Brasil ou sem precisão suficiente não é aceito", async () => {
  for(const row of [
    {lat:-23.5,lon:-47.4,country_code:"br",rank:{confidence:0.2}},
    {lat:10,lon:10,country_code:"xx",rank:{confidence:1}},
    {lat:999,lon:10,country_code:"br",rank:{confidence:1}},
  ]) {
    await assert.rejects(createGeocoder({apiKey:"x",localDemo:false,fetcher:async()=>Response.json({results:[row]})})("Rua exemplo"),{code:"ADDRESS_NOT_FOUND"});
  }
});
test("erro do provedor não expõe URL, chave ou resposta externa", async () => {
  const geocode=createGeocoder({apiKey:"test-private-key",localDemo:false,fetcher:async()=>{throw new Error("URL com apiKey=test-private-key");}});
  await assert.rejects(geocode("Rua de exemplo"),error => {
    assert.equal((error as {code:string}).code,"GEOCODER_UNAVAILABLE");
    assert.ok(!String(error).includes("test-private-key"));
    return true;
  });
});

test("endereço sem número preserva o logradouro na consulta ao provedor",async()=>{
 const geocode=createGeocoder({apiKey:"test-private-key",localDemo:false,fetcher:async input=>{
  const url=new URL(String(input));
  assert.equal(url.searchParams.get("text"),"Praça Coronel Fernando Prestes, Centro, Sorocaba, SP, 18010000, Brasil");
  return Response.json({results:[{lat:-23.5002267,lon:-47.4578056,country_code:"br",formatted:"Praça Coronel Fernando Prestes, Centro, Sorocaba - SP, Brasil",result_type:"amenity",rank:{confidence:1}}]});
 }});
 const result=await geocode("Praça Coronel Fernando Prestes, s/n, Centro, Sorocaba, SP, 18010000, Brasil");
 assert.equal(result.source,"geoapify");assert.equal(result.confidence,1);
});

