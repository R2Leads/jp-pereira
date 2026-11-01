import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db,pool } from "../src/db";
import { contactMessages } from "../src/db/schema";
import { assertDemoDatabase } from "../scripts/local-db-guard";
const base="http://127.0.0.1:3218";

test("formulários existentes de Contato e Revenda persistem apenas no banco isolado",async()=>{
 assertDemoDatabase();
 const table=await pool.query("select to_regclass('public.contact_messages')::text as name");
 assert.equal(table.rows[0].name,"contact_messages","A preparação da demo deve incluir a tabela dos formulários existentes.");
 const email=`teste-${randomUUID()}@example.invalid`;
 try{
  for(const origin of ["contato","revenda"]){
   const payload={origin,name:"Teste descartável da demonstração",email,company:"Empresa fictícia de teste",phone:"",message:"Teste automático local e descartável. Não enviar mensagens."};
   const response=await fetch(base+"/api/contact",{method:"POST",headers:{"Content-Type":"application/json",Origin:base},body:JSON.stringify(payload)});
   assert.equal(response.status,200);
   assert.deepEqual(await response.json(),{ok:true});
  }
  const rows=await db.select().from(contactMessages).where(eq(contactMessages.email,email));
  assert.equal(rows.length,2);
  assert.deepEqual(rows.map(row=>row.origin).sort(),["contato","revenda"]);
  assert.ok(rows.every(row=>row.name==="Teste descartável da demonstração"));
 }finally{await db.delete(contactMessages).where(eq(contactMessages.email,email));}
});

test("formulário inválido é recusado e páginas existentes continuam acessíveis",async()=>{
 const response=await fetch(base+"/api/contact",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:"",email:"inválido",message:""})});
 assert.equal(response.status,400);
 for(const path of ["/","/empresa","/marcas","/produtos","/produtos/acucar-demerara-500g","/receitas","/blog","/contato","/revenda"]){
  const page=await fetch(base+path);
  assert.equal(page.status,200,`A página ${path} deve continuar acessível.`);
  assert.ok(page.headers.get("content-type")?.includes("text/html"));
 }
 const health=await fetch(base+"/api/health");
 assert.equal(health.status,200);assert.deepEqual(await health.json(),{ok:true});
});
test.after(async()=>{await pool.end();});
