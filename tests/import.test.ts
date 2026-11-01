import test from "node:test";
import assert from "node:assert/strict";
import ExcelJS from "exceljs";
import {readFile} from "node:fs/promises";
import { previewImportRows, pointImportKey, IMPORT_COLUMNS, LEGACY_IMPORT_COLUMNS } from "../src/lib/locator/import";
import { createImportTemplate, readImportSpreadsheet } from "../src/lib/locator/spreadsheet";

const point = {name:"Parceiro de teste",address:"Rua de teste, 10, Centro",city:"São Paulo",state:"SP",postalCode:"01234000",phone:"",whatsapp:""};
const row = (number:number, changes={}) => ({rowNumber:number,point:{...point,...changes}});
async function workbook(values:ExcelJS.CellValue[][], headers=IMPORT_COLUMNS.map(c=>c.label)) {
 const book=new ExcelJS.Workbook(); const sheet=book.addWorksheet("Parceiros");
 sheet.addRow(headers); values.forEach(value=>sheet.addRow(value));
 return Buffer.from(await book.xlsx.writeBuffer());
}
const values:ExcelJS.CellValue[]=[point.name,point.address,point.city,"SP","01234-000"];

test("prévia normaliza cadastro, aponta erro de CEP e não aceita ativação enviada",()=>{
 const result=previewImportRows([row(2,{state:"sp",phone:"(11) 99999-1234",active:true}),row(4,{postalCode:"123"})],[]);
 assert.equal(result[0].status,"ready"); assert.equal(result[0].point?.postalCode,"01234000");
 assert.equal(result[0].point?.phone,"11999991234"); assert.equal("active" in result[0].point!,false);
 assert.equal(result[1].status,"invalid"); assert.equal(result[1].rowNumber,4);
 assert.match(result[1].message,/CEP/);
});
test("prévia marca duplicados no arquivo e na base, incluindo a lixeira, sem confundir filiais",()=>{
 const result=previewImportRows([row(2,{name:"PARCEIRO DÉ TESTE"}),row(3),row(4,{address:"Rua de teste, 20, Centro"})],[{...point,id:42,deletedAt:"2026-10-01"}]);
 assert.equal(result[0].status,"duplicate"); assert.match(result[0].message,/lixeira/i);
 assert.equal(result[1].status,"duplicate"); assert.equal(result[2].status,"ready");
 assert.equal(pointImportKey(point),pointImportKey({...point,name:"  PARCEIRO DÉ TESTE  ",city:"Sao Paulo"}));
 assert.notEqual(pointImportKey(point),pointImportKey({...point,address:"Rua de teste, 100, Centro"}));
 const within=previewImportRows([row(2),row(3)],[]);
 assert.equal(within[0].status,"ready");assert.equal(within[1].status,"duplicate");
});
test("limita lote e rejeita coleção ou numeração de linhas inválidas",()=>{
 assert.throws(()=>previewImportRows(Array.from({length:501},(_,i)=>row(i+2)),[]));
 assert.throws(()=>previewImportRows([],[]));
 assert.throws(()=>previewImportRows([row(0)],[]));
});
test("modelo Excel vazio tem cinco colunas de endereço e CEP como texto",async()=>{
 const buffer=await createImportTemplate(); const book=new ExcelJS.Workbook();await book.xlsx.load(Uint8Array.from(buffer).buffer);
 const sheet=book.getWorksheet("Parceiros")!;
 assert.equal(sheet.getCell("E2").numFmt,"@");assert.equal(sheet.columnCount,5);
 assert.equal(sheet.getCell("A2").value,null);assert.ok(book.getWorksheet("Instruções"));
 const headers=sheet.getRow(1).values;assert.ok(Array.isArray(headers));
 assert.deepEqual(headers.slice(1),["Nome do estabelecimento","Endereço completo, com número e bairro","Cidade","UF","CEP"]);
 await assert.rejects(readImportSpreadsheet(buffer),/preencha|nenhum/i);
});
test("lê modelo, ignora linhas vazias, preserva zeros iniciais e a linha original",async()=>{
 const rows=await readImportSpreadsheet(await workbook([[],values]));
 assert.equal(rows.length,1);assert.equal(rows[0].rowNumber,3);
 const preview=previewImportRows(rows,[]);
 assert.equal(preview[0].status,"ready");assert.equal(preview[0].point?.postalCode,"01234000");
 assert.equal(preview[0].point?.phone,"");assert.equal(preview[0].point?.whatsapp,"");
});
test("aceita modelo anterior sem exigir nem importar os contatos",async()=>{
 const headers=[...IMPORT_COLUMNS,...LEGACY_IMPORT_COLUMNS].map(column=>column.label);
 const rows=await readImportSpreadsheet(await workbook([[...values,"contato antigo ignorado","(11) 99999-1234"]],headers));
 const preview=previewImportRows(rows,[]);
 assert.equal(preview[0].status,"ready");
 assert.equal(preview[0].point?.phone,"");assert.equal(preview[0].point?.whatsapp,"");
 await assert.rejects(readImportSpreadsheet(await workbook([values.slice(0,4)],IMPORT_COLUMNS.slice(0,4).map(column=>column.label))),/cinco colunas/);
});
test("rejeita fórmula mesmo com resultado em cache, sem afetar as demais linhas",async()=>{
 const rows=await readImportSpreadsheet(await workbook([[...values.slice(0,4),{formula:'"01234000"',result:"01234000"}],values]));
 const preview=previewImportRows(rows,[]);
 assert.equal(preview[0].status,"invalid");assert.match(preview[0].message,/fórmula/i);
 assert.equal(preview[1].status,"ready");
});
test("cabeçalhos ausentes/repetidos e dados em colunas extras geram orientação",async()=>{
 await assert.rejects(readImportSpreadsheet(await workbook([values],["Nome",...IMPORT_COLUMNS.slice(1).map(c=>c.label)])),/coluna|modelo/i);
 await assert.rejects(readImportSpreadsheet(await workbook([values],[...IMPORT_COLUMNS.map(c=>c.label),"CEP"])),/coluna|modelo/i);
 const rows=await readImportSpreadsheet(await workbook([[...values,"não perder este dado"]]));
 assert.equal(previewImportRows(rows,[])[0].status,"invalid");
});
test("arquivo corrompido, grande ou com mais parceiros é recusado",async()=>{
 await assert.rejects(readImportSpreadsheet(Buffer.from("arquivo inválido")));
 await assert.rejects(readImportSpreadsheet(Buffer.alloc(2*1024*1024+1)),/2 MB/);
 await assert.rejects(readImportSpreadsheet(await workbook(Array.from({length:501},()=>values))),/500/);
});
test("planilha com comentários de outro editor mantém os dados e a rejeição de fórmulas",async()=>{
 const buffer=await readFile(new URL("./fixtures/import-comments.xlsx",import.meta.url));
 const rows=await readImportSpreadsheet(buffer);
 const preview=previewImportRows(rows,[]);
 assert.equal(preview.length,2);
 assert.equal(preview[0].status,"ready");assert.equal(preview[0].point?.postalCode,"01234000");
 assert.equal(preview[0].point?.name,"Parceiro de teste");
 assert.equal(preview[1].status,"invalid");assert.match(preview[1].message,/fórmula/i);
});
