import test from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { db, pool } from "../src/db";
import { locatorPoints } from "../src/db/schema";
import { assertDemoDatabase } from "../scripts/local-db-guard";
import { createPoint, listCityPartners, updatePoint, pointAction, searchPoints } from "../src/lib/locator/service";
import type { GeocodeResult } from "../src/lib/locator/domain";
const input={name:"Teste descartável de integração",address:"Endereço de teste, 10",city:"Sorocaba",state:"SP",postalCode:"18010000",phone:"",whatsapp:""};
const coordinate:GeocodeResult={latitude:-23.4991,longitude:-47.4584,label:"Endereço ilustrativo de teste",confidence:1,precision:"building",source:"demo"};
test("cadastro persistido exige revisão, invalida confirmação após mudança de endereço e permite lixeira/restauração", async () => {
 assertDemoDatabase();
 let id:number|undefined;
 try{
  const created=await createPoint(input,async()=>coordinate); id=created?.id;
  assert.equal(created.active,false); assert.equal(created.geocodeStatus,"needs_review");
  await assert.rejects(pointAction(created.id,"activate",created.version),{code:"LOCATION_NOT_CONFIRMED"});
  const active=await pointAction(created.id,"confirm",created.version);
  assert.equal(active.active,true);
  const publicPage=await searchPoints(-23.4991,-47.4584);
  assert.ok(publicPage.points.some(row=>row.id===created.id && row.distanceKm===0));
  const edited=await updatePoint(active.id,{...input,name:"Nome editado"},active.version,async()=>coordinate);
  assert.equal(edited.active,true);
  await assert.rejects(pointAction(active.id,"deactivate",active.version),{code:"STALE_POINT"});
  const moved=await updatePoint(edited.id,{...input,address:"Outro endereço, 20"},edited.version,async()=>coordinate);
  assert.equal(moved.active,false); assert.equal(moved.geocodeStatus,"needs_review");
  const trashed=await pointAction(moved.id,"trash",moved.version);
  assert.ok(trashed.deletedAt); assert.equal(trashed.active,false);
  assert.ok(!(await searchPoints(-23.4991,-47.4584)).points.some(row=>row.id===id));
  const restored=await pointAction(trashed.id,"restore",trashed.version);
  assert.equal(restored.deletedAt,null); assert.equal(restored.active,false);
 }finally{if(id) await db.delete(locatorPoints).where(eq(locatorPoints.id,id));}
});
test("falha de geocodificação mantém cadastro recuperável e fora da busca",async()=>{
 assertDemoDatabase();let id:number|undefined;
 try{
  const point=await createPoint({...input,name:"Teste sem coordenadas"},async()=>{throw new Error("upstream private details");}); id=point?.id;
  assert.equal(point.geocodeStatus,"error"); assert.equal(point.latitude,null);
  assert.ok(!point.geocodeError?.includes("private"));
  await assert.rejects(pointAction(point.id,"confirm",point.version));
 }finally{if(id) await db.delete(locatorPoints).where(eq(locatorPoints.id,id));}
});
test("pendentes da cidade aparecem com endereço original e link do Maps, sem coordenadas",async()=>{
 assertDemoDatabase();let id:number|undefined;
 try{
  const pending=await createPoint({...input,name:"Teste pendente por cidade",address:"Rua Sem Numero, 10, Centro"},async()=>{throw new Error("upstream private details");});
  id=pending.id;
  assert.equal(pending.geocodeStatus,"error");
  const cityPartners=await listCityPartners("Sorocaba","SP");
  const found=cityPartners.find(point=>point.id===id);
  assert.ok(found);
  assert.equal(found.address,"Rua Sem Numero, 10, Centro");
  const url=new URL(found.mapsUrl);
  assert.equal(url.searchParams.get("query"),"Rua Sem Numero, 10, Centro, Sorocaba - SP, 18010-000, Brasil");
  assert.equal("latitude" in found,false);
  assert.equal("geocodeError" in found,false);
  assert.ok(!(await listCityPartners("Itu","SP")).some(point=>point.id===id));
  assert.ok(!(await listCityPartners("Sorocaba","RJ")).some(point=>point.id===id));
 }finally{if(id)await db.delete(locatorPoints).where(eq(locatorPoints.id,id));}
});
test("parceiro sem coordenadas pode ser ocultado e publicado por cidade sem virar ativo por GPS",async()=>{
 assertDemoDatabase();let id:number|undefined;
 try{
  const pending=await createPoint({...input,name:"Teste visibilidade por cidade"},async()=>{throw new Error("upstream private details");});
  id=pending.id;
  assert.ok((await listCityPartners("Sorocaba","SP")).some(point=>point.id===id));
  const hidden=await pointAction(id,"hide-from-city",pending.version);
  assert.equal(hidden.active,false);
  assert.equal(hidden.latitude,null);
  assert.equal(hidden.longitude,null);
  assert.equal(hidden.cityListingVisible,false);
  assert.ok(!(await listCityPartners("Sorocaba","SP")).some(point=>point.id===id));
  const shown=await pointAction(id,"show-by-city",hidden.version);
  assert.equal(shown.active,false);
  assert.equal(shown.latitude,null);
  assert.equal(shown.longitude,null);
  assert.equal(shown.cityListingVisible,true);
  const publicPoint=(await listCityPartners("Sorocaba","SP")).find(point=>point.id===id);
  assert.ok(publicPoint);
  assert.equal("distanceKm" in publicPoint,false);
  assert.equal("latitude" in publicPoint,false);
  assert.equal("phone" in publicPoint,false);
  const deactivated=await pointAction(id,"deactivate",shown.version);
  assert.equal(deactivated.cityListingVisible,false);
  assert.ok(!(await listCityPartners("Sorocaba","SP")).some(point=>point.id===id));
 }finally{if(id)await db.delete(locatorPoints).where(eq(locatorPoints.id,id));}
});
test.after(async()=>{await pool.end();});

