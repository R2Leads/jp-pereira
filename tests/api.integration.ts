import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { eq } from "drizzle-orm";
import { db,pool } from "../src/db";
import { locatorPoints } from "../src/db/schema";
import { assertDemoDatabase } from "../scripts/local-db-guard";
const base="http://127.0.0.1:3218";
let cookie="";
async function call(path:string,method="GET",body?:unknown,headers:Record<string,string>={}){
 const response=await fetch(base+path,{method,headers:{"Content-Type":"application/json",Origin:base,...(cookie?{Cookie:cookie}:{}),...headers},...(body?{body:JSON.stringify(body)}:{})});
 const data=await response.json();return {response,data};
}
test("API exige login/origem e mantém cadastro, ativação, edição e lixeira coerentes com a busca pública",async()=>{
 assertDemoDatabase();let id:number|undefined;
 try{
  assert.equal((await call("/api/admin/points")).response.status,401);
  assert.equal((await call("/api/admin/login","POST",{username:"admin",password:"invalid"},{Origin:"https://evil.example"})).response.status,403);
  assert.equal((await call("/api/admin/login","POST",{username:"admin",password:"invalid"})).response.status,401);
  const access=JSON.parse(await readFile(".demo/access.json","utf8"));
  const login=await call("/api/admin/login","POST",access);
  assert.equal(login.response.status,200);
  const sessionCookie=login.response.headers.get("set-cookie")??"";
  assert.ok(sessionCookie.toLowerCase().includes("httponly"));
  assert.ok(sessionCookie.toLowerCase().includes("samesite=strict"));
  cookie=sessionCookie.split(";")[0];
  const create=await call("/api/admin/points","POST",{name:"Teste HTTP descartável",address:"Praça Coronel Fernando Prestes, s/n, Centro",city:"Sorocaba",state:"SP",postalCode:"18010000",phone:"",whatsapp:"",active:true});
  assert.equal(create.response.status,201);id=create.data.point.id;
  assert.equal(create.data.point.active,false);assert.equal(create.data.point.geocodeStatus,"needs_review");
  const path="/api/admin/points/"+id;
  assert.equal((await call(path,"PATCH",{action:"activate",version:create.data.point.version})).response.status,409);
  const hidden=await call(path,"PATCH",{action:"hide-from-city",version:create.data.point.version});
  assert.equal(hidden.response.status,200);assert.equal(hidden.data.point.cityListingVisible,false);assert.equal(hidden.data.point.active,false);
  const shown=await call(path,"PATCH",{action:"show-by-city",version:hidden.data.point.version});
  assert.equal(shown.response.status,200);assert.equal(shown.data.point.cityListingVisible,true);assert.equal(shown.data.point.active,false);
  const confirmed=await call(path,"PATCH",{action:"confirm",version:shown.data.point.version});
  assert.equal(confirmed.response.status,200);assert.equal(confirmed.data.point.active,true);
  const lookup=await call("/api/points/search","POST",{latitude:confirmed.data.point.latitude,longitude:confirmed.data.point.longitude});
  assert.equal(lookup.response.status,200);
  assert.ok(lookup.data.points.some((p:{id:number;distanceKm:number})=>p.id===id&&p.distanceKm===0));
  assert.ok(lookup.data.points.every((p:Record<string,unknown>)=>!("geocodeError" in p)&&!("version" in p)));
  assert.ok(Array.isArray(lookup.data.cityPartners));
  assert.ok(lookup.data.cityPartners.every((p:Record<string,unknown>)=>!("latitude" in p)&&!("geocodeError" in p)&&!("version" in p)));
  assert.ok("city" in lookup.data.origin&&"state" in lookup.data.origin);
  assert.equal((await call(path,"PATCH",{action:"deactivate",version:confirmed.data.point.version},{Origin:"https://evil.example"})).response.status,403);
  const changed=await call(path,"PATCH",{action:"update",version:confirmed.data.point.version,point:{name:"Teste HTTP editado",address:"Praça Padre Miguel, s/n, Centro",city:"Itu",state:"SP",postalCode:"13300000",phone:"",whatsapp:""}});
  assert.equal(changed.response.status,200);assert.equal(changed.data.point.active,false);assert.equal(changed.data.point.geocodeStatus,"needs_review");
  assert.equal(changed.data.point.confirmedAt,null);
  assert.equal((await call(path,"PATCH",{action:"activate",version:changed.data.point.version})).response.status,409);
  assert.ok(!(await call("/api/points/search","POST",{latitude:changed.data.point.latitude,longitude:changed.data.point.longitude})).data.points.some((p:{id:number})=>p.id===id));
  const trashed=await call(path,"DELETE",{version:changed.data.point.version});
  assert.ok(trashed.data.point.deletedAt);
  const restored=await call(path,"PATCH",{action:"restore",version:trashed.data.point.version});
  assert.equal(restored.data.point.deletedAt,null);assert.equal(restored.data.point.active,false);
  const listing=await call("/api/admin/points");
  assert.ok(listing.data.points.some((p:{id:number;name:string})=>p.id===id&&p.name==="Teste HTTP editado"));
  assert.equal((await call("/api/points/search","POST",{latitude:999,longitude:0})).response.status,400);
  assert.equal((await call("/api/points/search","POST",{query:""})).response.status,400);
  assert.equal((await call("/api/admin/logout","POST")).response.status,200);
 }finally{if(id)await db.delete(locatorPoints).where(eq(locatorPoints.id,id));}
});
test("autocomplete aceita consulta curta sem chamar o provedor e protege a origem",async()=>{
 const short=await call("/api/points/autocomplete","POST",{query:"Ru"});
 assert.equal(short.response.status,200);
 assert.deepEqual(short.data.options,[]);
 assert.equal((await call("/api/points/autocomplete","POST",{query:"Rua"},{Origin:"https://evil.example"})).response.status,403);
 assert.equal((await call("/api/points/autocomplete","POST",{})).response.status,400);
});
test.after(async()=>{await pool.end();});

