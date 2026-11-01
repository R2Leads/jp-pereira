import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {randomUUID,createHash} from "node:crypto";
import ExcelJS from "exceljs";
import {db,pool} from "../src/db";
import {locatorPoints} from "../src/db/schema";
import {assertDemoDatabase} from "../scripts/local-db-guard";
const base="http://127.0.0.1:3218";
const snapshot=async()=>createHash("sha256").update(JSON.stringify(await db.select().from(locatorPoints).orderBy(locatorPoints.id))).digest("hex");

test("API protege modelo/prévia/confirmação e confere a planilha sem gravar cadastros",async()=>{
 assertDemoDatabase();const before=await snapshot();
 assert.equal((await fetch(base+"/api/admin/points/import/template")).status,401);
 assert.equal((await fetch(base+"/api/admin/points/import/preview",{method:"POST",headers:{Origin:base}})).status,401);
 const login=await fetch(base+"/api/admin/login",{method:"POST",headers:{Origin:base,"Content-Type":"application/json"},body:await readFile(".demo/access.json","utf8")});
 assert.equal(login.status,200);
 const headers={Origin:base,Cookie:(login.headers.get("set-cookie")??"").split(";")[0]};
 const model=await fetch(base+"/api/admin/points/import/template",{headers});assert.equal(model.status,200);
 assert.match(model.headers.get("content-disposition")??"",/modelo-parceiros.*xlsx/);
 const book=new ExcelJS.Workbook();await book.xlsx.load(await model.arrayBuffer());const sheet=book.getWorksheet("Parceiros")!;
 const name="TESTE PRÉVIA "+randomUUID();
 sheet.getRow(2).values=[name,"Rua teste, 10, Centro","São Paulo","SP","01234000"];
 sheet.getRow(3).values=[name,"Rua teste, 10, Centro","São Paulo","SP","01234000"];
 sheet.getRow(4).values=["Linha incompleta","", "São Paulo","SP","123"];
 const [existing]=await db.select().from(locatorPoints).limit(1);
 if(existing)sheet.getRow(5).values=[existing.name,existing.address,existing.city,existing.state,existing.postalCode];
 const data=await book.xlsx.writeBuffer();
 const form=()=>{const f=new FormData();f.append("file",new Blob([data]),"parceiros.xlsx");return f;};
 const badOrigin=await fetch(base+"/api/admin/points/import/preview",{method:"POST",headers:{...headers,Origin:"https://invalid.example"},body:form()});assert.equal(badOrigin.status,403);
 const preview=await fetch(base+"/api/admin/points/import/preview",{method:"POST",headers,body:form()});assert.equal(preview.status,200);
 const body=await preview.json();assert.deepEqual(body.rows.slice(0,3).map((row:{status:string})=>row.status),["ready","duplicate","invalid"]);
 assert.equal(body.rows[0].point.postalCode,"01234000");if(existing)assert.equal(body.rows[3].status,"duplicate");
 const commented=new FormData();commented.append("file",new Blob([await readFile(new URL("./fixtures/import-comments.xlsx",import.meta.url))]),"comentarios.xlsx");
 const commentPreview=await fetch(base+"/api/admin/points/import/preview",{method:"POST",headers,body:commented});
 assert.equal(commentPreview.status,200,"Comentários de outro editor não podem impedir a abertura da planilha.");
 const commentsBody=await commentPreview.json();assert.deepEqual(commentsBody.rows.map((row:{status:string})=>row.status),["ready","invalid"]);
 const wrongType=new FormData();wrongType.append("file",new Blob(["arquivo"]),"parceiros.csv");
 assert.equal((await fetch(base+"/api/admin/points/import/preview",{method:"POST",headers,body:wrongType})).status,400);
 assert.equal((await fetch(base+"/api/admin/points/import/preview",{method:"POST",headers:{...headers,"Content-Type":"application/json"},body:"{}"})).status,415);
 assert.equal((await fetch(base+"/api/admin/points/import",{method:"POST",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify({point:{active:true}})})).status,400);
 if(existing){
  const duplicate=await fetch(base+"/api/admin/points/import",{method:"POST",headers:{...headers,"Content-Type":"application/json"},body:JSON.stringify({point:existing})});
  assert.equal(duplicate.status,200);assert.equal((await duplicate.json()).status,"duplicate");
 }
 assert.equal(await snapshot(),before,"Modelo, prévia e confirmação de duplicado não devem alterar nenhum cadastro existente.");
});
test.after(async()=>{await pool.end();});
