import { LocatorError, validatePointInput, type PointInput } from "./domain";

export const IMPORT_MAX_ROWS = 500;
export const IMPORT_MAX_BYTES = 2 * 1024 * 1024;
export const IMPORT_COLUMNS: {key:keyof PointInput;label:string;width:number;required:boolean}[] = [
 {key:"name",label:"Nome do estabelecimento",width:34,required:true},
 {key:"address",label:"Endereço completo, com número e bairro",width:52,required:true},
 {key:"city",label:"Cidade",width:25,required:true},
 {key:"state",label:"UF",width:10,required:true},
 {key:"postalCode",label:"CEP",width:16,required:true},
];
// Aceita os modelos antigos; os contatos não fazem parte do cadastro atual.
export const LEGACY_IMPORT_COLUMNS: {key:keyof PointInput;label:string}[] = [
 {key:"phone",label:"Telefone com DDD"},
 {key:"whatsapp",label:"WhatsApp com DDD"},
];
export type ImportRow = {rowNumber:number;point:unknown;cellError?:string};
export type ImportPreviewRow = {rowNumber:number;point:PointInput|null;name:string;status:"ready"|"invalid"|"duplicate";message:string};
export type ImportExistingPoint = Pick<PointInput,"name"|"address"|"city"|"state"|"postalCode"> & {id:number;deletedAt?:Date|string|null};
export const normalizeImportText = (value:string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/\s+/g," ");
export function pointImportKey(point:Pick<PointInput,"name"|"address"|"city"|"state"|"postalCode">) {
 return JSON.stringify([point.name,point.address,point.city,point.state,point.postalCode.replace(/\D/g,"")].map(normalizeImportText));
}
export function previewImportRows(rows:ImportRow[],existing:ImportExistingPoint[]):ImportPreviewRow[] {
 if(!Array.isArray(rows)||rows.length===0)throw new LocatorError("A planilha não tem parceiros. Preencha a aba Parceiros a partir da linha 2.");
 if(rows.length>IMPORT_MAX_ROWS)throw new LocatorError(`Envie até ${IMPORT_MAX_ROWS} parceiros por arquivo. Divida a planilha em arquivos menores.`);
 const rowNumbers=new Set<number>();
 const saved=new Map(existing.map(point=>[pointImportKey(point),point]));
 const seen=new Map<string,number>();
 return rows.map(row=>{
  if(!row||!Number.isSafeInteger(row.rowNumber)||row.rowNumber<2||row.rowNumber>1048576||rowNumbers.has(row.rowNumber))throw new LocatorError("A numeração das linhas da planilha é inválida.");
  rowNumbers.add(row.rowNumber);
  let name="Parceiro sem nome";
  if(row.point&&typeof row.point==="object"&&"name" in row.point&&typeof row.point.name==="string")name=row.point.name.slice(0,160)||name;
  try{
   if(row.cellError)throw new LocatorError(row.cellError);
   const point=validatePointInput(row.point),key=pointImportKey(point),match=saved.get(key),previous=seen.get(key);
   if(match)return {rowNumber:row.rowNumber,point,name:point.name,status:"duplicate",message:match.deletedAt?`Já está na lixeira (#${match.id}). Restaure o cadastro existente se necessário.`:`Já cadastrado (#${match.id}). Será ignorado, sem alterar os dados existentes.`};
   if(previous!==undefined)return {rowNumber:row.rowNumber,point,name:point.name,status:"duplicate",message:`Repetido na linha ${previous} desta planilha. Será ignorado.`};
   seen.set(key,row.rowNumber);
   return {rowNumber:row.rowNumber,point,name:point.name,status:"ready",message:"Pronto para importar. A localização será consultada após a confirmação."};
  }catch(error){
   if(!(error instanceof LocatorError))throw error;
   return {rowNumber:row.rowNumber,point:null,name,status:"invalid",message:error.message};
  }
 });
}
