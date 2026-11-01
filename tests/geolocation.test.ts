import test from "node:test";
import assert from "node:assert/strict";
import { geolocationErrorMessage } from "../src/lib/locator/geolocation";
test("recusa de permissão oferece pesquisa manual sem pedir nova permissão",()=>{
 assert.match(geolocationErrorMessage(1),/negada/i);
 assert.match(geolocationErrorMessage(1),/digitar um endereço ou CEP/i);
});
test("tempo esgotado e posição indisponível explicam como continuar",()=>{
 assert.match(geolocationErrorMessage(3),/demorou/i);
 assert.match(geolocationErrorMessage(2),/Não foi possível determinar/i);
});

