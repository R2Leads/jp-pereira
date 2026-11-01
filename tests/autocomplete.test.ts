import test from "node:test";
import assert from "node:assert/strict";
import { createAutocomplete } from "../src/lib/locator/geocoding.ts";

test("autocomplete devolve opções com cidade e UF para desambiguar a mesma rua", async () => {
  const autocomplete = createAutocomplete({apiKey:"test-private-key",fetcher:async input=>{
    const url = new URL(String(input));
    assert.equal(url.pathname, "/v1/geocode/autocomplete");
    assert.equal(url.searchParams.get("text"), "Rua Pedro José da Silva");
    assert.equal(url.searchParams.get("filter"), "countrycode:br");
    assert.equal(url.searchParams.get("limit"), "6");
    assert.equal(url.searchParams.get("apiKey"), "test-private-key");
    return Response.json({results:[
      {lat:-23.5,lon:-47.4,country_code:"br",formatted:"Rua Pedro José da Silva, Centro, Sorocaba - SP, 18010-000, Brasil",city:"Sorocaba",state_code:"BR-SP",postcode:"18010-000",result_type:"building"},
      {lat:-23.6,lon:-46.7,country_code:"br",formatted:"Rua Pedro José da Silva, Capão Redondo, São Paulo - SP, 05789-001, Brasil",city:"São Paulo",state_code:"SP",postcode:"05789-001"},
    ]});
  }});
  const options = await autocomplete("Rua Pedro José da Silva");
  assert.deepEqual(options.map(option=>`${option.city}/${option.state}`), ["Sorocaba/SP", "São Paulo/SP"]);
  assert.equal(options[0].postalCode, "18010000");
  assert.equal(options[0].latitude, -23.5);
  assert.equal(options[0].longitude, -47.4);
  assert.equal(options[0].precision, "building");
  assert.ok(options[0].label.includes("Sorocaba - SP"));
});

test("autocomplete ignora consulta curta, resultados de outro país e duplicados", async () => {
  let called = 0;
  const short = createAutocomplete({apiKey:"x",fetcher:async()=>{called++;return Response.json({results:[]});}});
  assert.deepEqual(await short("Ru"), []);
  assert.equal(called, 0);
  const autocomplete = createAutocomplete({apiKey:"x",fetcher:async()=>Response.json({results:[
    {lat:-23.5,lon:-47.4,country_code:"xx",formatted:"Rua A, Sorocaba - SP, Brasil",city:"Sorocaba",state_code:"SP"},
    {lat:-23.5,lon:-47.4,country_code:"br",formatted:"Rua A, Sorocaba - SP, Brasil",city:"Sorocaba",state_code:"SP"},
    {lat:-23.5,lon:-47.4,country_code:"br",formatted:"Rua A, Sorocaba - SP, Brasil",city:"Sorocaba",state_code:"SP"},
    {lat:999,lon:-47.4,country_code:"br",formatted:"Rua inválida, Sorocaba - SP, Brasil",city:"Sorocaba",state_code:"SP"},
  ]})});
  const options = await autocomplete("Rua A");
  assert.equal(options.length, 1);
  assert.equal(options[0].city, "Sorocaba");
});

test("autocomplete limita a cinco opções e lê a UF em county_code", async () => {
  const autocomplete = createAutocomplete({apiKey:"x",fetcher:async()=>Response.json({results:
    Array.from({length:8},(_,index)=>({
      lat:-23.5+index/100, lon:-47.4, country_code:"br",
      formatted:`Rua ${index}, Sorocaba - Sudeste, Brasil`,
      city:"Sorocaba", state:"Sudeste", county:"São Paulo", county_code:"BR-SP",
    })),
  })});
  const options = await autocomplete("Rua exemplo");
  assert.equal(options.length, 5);
  assert.ok(options.every(option=>option.state === "SP"));
});

test("falha do provedor de sugestões não expõe a chave", async () => {
  const autocomplete = createAutocomplete({apiKey:"test-private-key",fetcher:async()=>{throw new Error("apiKey=test-private-key");}});
  await assert.rejects(autocomplete("Rua Pedro"), error => {
    assert.equal((error as {code:string}).code, "GEOCODER_UNAVAILABLE");
    assert.ok(!String(error).includes("test-private-key"));
    return true;
  });
  await assert.rejects(createAutocomplete({apiKey:"",fetcher:async()=>Response.json({results:[]})})("Rua Pedro"), {code:"GEOCODER_NOT_CONFIGURED"});
});
