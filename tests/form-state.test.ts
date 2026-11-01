import test from "node:test";
import assert from "node:assert/strict";
import { hasUnsavedChanges } from "../src/lib/locator/form-state";
const saved={name:"Loja",address:"Rua A, 10",city:"Sorocaba",state:"SP",postalCode:"18010000",phone:"",whatsapp:""};
test("edições não salvas bloqueiam ações sobre a localização anterior",()=>{
  assert.equal(hasUnsavedChanges({...saved},saved),false);
  for(const changed of [{address:"Rua B, 20"},{name:"Outro nome"},{phone:"15999999999"},{city:"Itu"}]){
    assert.equal(hasUnsavedChanges({...saved,...changed},saved),true);
  }
});
