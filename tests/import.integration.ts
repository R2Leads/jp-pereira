import test from "node:test";
import assert from "node:assert/strict";
import {randomUUID,createHash} from "node:crypto";
import {and,eq} from "drizzle-orm";
import {db,pool} from "../src/db";
import {locatorPoints} from "../src/db/schema";
import {assertDemoDatabase} from "../scripts/local-db-guard";
import {importPoint} from "../src/lib/locator/service";
import type {GeocodeResult} from "../src/lib/locator/domain";

const point={name:`TESTE IMPORTAÇÃO ${randomUUID()}`,address:"Rua de teste, 10, Centro",city:"São Paulo",state:"SP",postalCode:"01234000",phone:"",whatsapp:""};
const location:GeocodeResult={latitude:-23.55,longitude:-46.63,label:"Localização de teste",confidence:1,precision:"building",source:"demo"};
const snapshot=async()=>createHash("sha256").update(JSON.stringify(await db.select().from(locatorPoints).orderBy(locatorPoints.id))).digest("hex");

test("importação persiste lote, pula repetição e lixeira, exige revisão e faz rollback dos dados de teste",async()=>{
 assertDemoDatabase();const before=await snapshot();const rollback=new Error("rollback controlado");
 await assert.rejects(db.transaction(async tx=>{
  const first=await importPoint({...point,active:true,latitude:10},async()=>location,tx);
  assert.equal(first.status,"imported");assert.equal(first.point.active,false);assert.equal(first.point.geocodeStatus,"needs_review");
  const duplicate=await importPoint({...point,name:point.name.toLowerCase()},async()=>{throw new Error("não deveria consultar novamente");},tx);
  assert.equal(duplicate.status,"duplicate");assert.equal(duplicate.point.id,first.point.id);
  const failed=await importPoint({...point,name:point.name+" sem localização"},async()=>{throw new Error("private provider details");},tx);
  assert.equal(failed.status,"imported");assert.equal(failed.point.active,false);assert.equal(failed.point.geocodeStatus,"error");assert.ok(!failed.point.geocodeError?.includes("private"));
  await tx.update(locatorPoints).set({deletedAt:new Date()}).where(eq(locatorPoints.id,first.point.id));
  const trashed=await importPoint(point,async()=>location,tx);
  assert.equal(trashed.status,"duplicate");assert.ok(trashed.point.deletedAt);
  throw rollback;
 }),error=>error===rollback);
 assert.equal(await snapshot(),before,"O conteúdo dos cadastros anteriores deve ser preservado.");
});

test("dois envios simultâneos do mesmo parceiro criam um único cadastro",async()=>{
 assertDemoDatabase();const before=await snapshot();const input={...point,name:point.name+" concorrente"};let id:number|undefined;
 try{
  const outcomes=await Promise.all([importPoint(input,async()=>location),importPoint(input,async()=>location)]);
  id=outcomes.find(value=>value.status==="imported")?.point.id;
  assert.deepEqual(outcomes.map(value=>value.status).sort(),["duplicate","imported"]);
  assert.equal(outcomes[0].point.id,outcomes[1].point.id);
  const saved=await db.select().from(locatorPoints).where(eq(locatorPoints.name,input.name));
  assert.equal(saved.length,1);
 }finally{
  if(id)await db.delete(locatorPoints).where(and(eq(locatorPoints.id,id),eq(locatorPoints.name,input.name)));
 }
 assert.equal(await snapshot(),before,"Somente o registro criado por este teste deve ser removido.");
});
test.after(async()=>{await pool.end();});
