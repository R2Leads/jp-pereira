import test from "node:test";
import assert from "node:assert/strict";
import { addressMapsUrl, distanceKm, normalizePlaceName, validatePointInput, assertActivatable } from "../src/lib/locator/domain.ts";

const valid = {
  name: "Loja de demonstração", address: "Rua de exemplo, 10, Centro",
  city: "Sorocaba", state: "SP", postalCode: "18010-000", phone: "", whatsapp: "",
};
test("distância em linha reta ordena corretamente coordenadas conhecidas", () => {
  assert.ok(Math.abs(distanceKm(0, 0, 0, 1) - 111.195) < 0.01);
  assert.equal(distanceKm(-23.5, -47.4, -23.5, -47.4), 0);
});
test("cadastro normaliza CEP e UF sem aceitar campos desconhecidos", () => {
  const point = validatePointInput({ ...valid, state: "sp", active: true });
  assert.equal(point.postalCode, "18010000");
  assert.equal(point.state, "SP");
  assert.equal("active" in point, false);
});
test("cadastro rejeita CEP incompleto, UF inexistente e conteúdo longo", () => {
  for (const bad of [{postalCode:"123"}, {state:"XX"}, {name:"a".repeat(161)}]) {
    assert.throws(() => validatePointInput({...valid, ...bad}));
  }
});
test("link do Maps usa o endereço escrito, sem depender de coordenadas salvas", () => {
  const url = new URL(addressMapsUrl({ address: "Rua de exemplo, 10, Centro", city: "Sorocaba", state: "SP", postalCode: "18010000" }));
  assert.equal(url.hostname, "www.google.com");
  assert.equal(url.pathname, "/maps/search/");
  assert.equal(url.searchParams.get("api"), "1");
  assert.equal(url.searchParams.get("query"), "Rua de exemplo, 10, Centro, Sorocaba - SP, 18010-000, Brasil");
  assert.equal(url.searchParams.has("key"), false);
});
test("comparação de cidade ignora acentos, caixa e espaços extras", () => {
  assert.equal(normalizePlaceName("  Araçariguama "), normalizePlaceName("ARACARIGUAMA"));
  assert.notEqual(normalizePlaceName("São Roque"), normalizePlaceName("Sorocaba"));
});
test("ativação exige coordenadas válidas e confirmação administrativa", () => {
  assert.throws(() => assertActivatable({ latitude: null, longitude: null, geocodeStatus: "error", deletedAt: null }));
  assert.throws(() => assertActivatable({ latitude: -23.5, longitude: -47.4, geocodeStatus: "needs_review", deletedAt: null }));
  assert.throws(() => assertActivatable({ latitude: 999, longitude: -47.4, geocodeStatus: "confirmed", deletedAt: null }));
  assert.throws(() => assertActivatable({ latitude: -23.5, longitude: -47.4, geocodeStatus: "confirmed", deletedAt: new Date() }));
  assert.doesNotThrow(() => assertActivatable({ latitude: -23.5, longitude: -47.4, geocodeStatus: "confirmed", deletedAt: null }));
});

