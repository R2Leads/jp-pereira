import ExcelJS from "exceljs";
import JSZip from "jszip";
import { inflateRawSync } from "node:zlib";
import { LocatorError } from "./domain";
import { IMPORT_COLUMNS, LEGACY_IMPORT_COLUMNS, IMPORT_MAX_BYTES, IMPORT_MAX_ROWS, normalizeImportText, type ImportRow } from "./import";

// Limita também o tamanho descompactado: um XLSX pequeno pode conter XML enorme.
function assertSafeArchive(buffer:Buffer) {
 const eocd=buffer.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
 if(eocd<0||eocd+22>buffer.length)throw new Error("Invalid ZIP");
 const count=buffer.readUInt16LE(eocd+10),directorySize=buffer.readUInt32LE(eocd+12);
 let offset=buffer.readUInt32LE(eocd+16),expanded=0;
 if(count===0||count>256||offset+directorySize>eocd)throw new Error("Unsupported ZIP");
 for(let i=0;i<count;i++){
  if(offset+46>eocd||buffer.readUInt32LE(offset)!==0x02014b50)throw new Error("Invalid directory");
  const flags=buffer.readUInt16LE(offset+8),method=buffer.readUInt16LE(offset+10),compressed=buffer.readUInt32LE(offset+20),size=buffer.readUInt32LE(offset+24);
  const local=buffer.readUInt32LE(offset+42);
  if(flags&1||![0,8].includes(method)||local+30>buffer.length||buffer.readUInt32LE(local)!==0x04034b50)throw new Error("Unsupported entry");
  const start=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28);
  if(start+compressed>buffer.length||size>16*1024*1024-expanded)throw new Error("Expanded file too large");
  const packed=buffer.subarray(start,start+compressed);
  const actual=method===0?packed:inflateRawSync(packed,{maxOutputLength:16*1024*1024-expanded+1});
  expanded+=actual.length;
  if(actual.length!==size||expanded>16*1024*1024)throw new Error("Invalid expanded size");
  offset+=46+buffer.readUInt16LE(offset+28)+buffer.readUInt16LE(offset+30)+buffer.readUInt16LE(offset+32);
 }
}
async function withoutWorkbookComments(buffer:Buffer):Promise<Buffer> {
 const archive=await JSZip.loadAsync(buffer);
 let changed=false;
 for(const entry of archive.file(/^xl\/worksheets\/_rels\/[^/]+\.rels$/)){
  const xml=await entry.async("string");
  const clean=xml.replace(/<(?:[\w.-]+:)?Relationship\b[^>]*\/>/g,tag=>
   /\bType\s*=\s*["'][^"']*\/(?:comments|vmlDrawing)["']/.test(tag)?"":tag);
  if(clean!==xml){archive.file(entry.name,clean);changed=true;}
 }
 if(!changed)return buffer;
 // Os comentários são metadados auxiliares. ExcelJS não reconhece todas as
 // formas válidas de armazená-los; importar somente as células evita a falha
 // de reconciliação, sem alterar valores, fórmulas ou os arquivos no disco.
 for(const entry of archive.file(/^xl\/worksheets\/[^/]+\.xml$/)){
  const xml=await entry.async("string");
  archive.file(entry.name,xml.replace(/<(?:[\w.-]+:)?legacyDrawing\b[^>]*(?:\/>|>\s*<\/(?:[\w.-]+:)?legacyDrawing\s*>)/g,""));
 }
 return archive.generateAsync({type:"nodebuffer",compression:"DEFLATE"});
}
export async function createImportTemplate():Promise<Buffer> {
 const book=new ExcelJS.Workbook();book.creator="JP Pereira";
 const sheet=book.addWorksheet("Parceiros",{views:[{state:"frozen",ySplit:1}]});
 sheet.columns=IMPORT_COLUMNS.map(column=>({header:column.label,key:column.key,width:column.width,style:{numFmt:"@",font:{name:"Calibri",size:11}}}));
 sheet.getRow(1).height=44;
 sheet.getRow(1).eachCell((cell,index)=>{
  cell.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FF1C3F94"}};
  cell.font={name:"Calibri",size:11,bold:true,color:{argb:"FFFFFFFF"}};
  cell.alignment={vertical:"middle",wrapText:true};
  cell.note=IMPORT_COLUMNS[index-1].required?"Campo obrigatório. Não altere o título da coluna.":"Campo opcional. Informe o DDD se preencher. Não altere o título da coluna.";
 });
 for(let row=2;row<=IMPORT_MAX_ROWS+1;row++)for(let col=1;col<=IMPORT_COLUMNS.length;col++)sheet.getCell(row,col).numFmt="@";
 sheet.autoFilter={from:"A1",to:"E1"};
 const instructions=book.addWorksheet("Instruções");instructions.getColumn(1).width=105;
 const notes=["Como preencher a planilha de parceiros", "1. Preencha a aba Parceiros a partir da linha 2. Use uma linha por estabelecimento.",
  "2. Não altere os títulos das cinco colunas. Não use fórmulas, células mescladas ou imagens.",
  "3. Nome, endereço completo (rua, número e bairro), cidade, UF e CEP são obrigatórios.",
  "4. CEP deve ter oito números, com ou sem hífen. Mantenha o CEP como texto para preservar zeros iniciais.",
  `5. Envie no máximo ${IMPORT_MAX_ROWS} parceiros por arquivo .xlsx, com até 2 MB.`,
  "6. Revise a prévia no painel. Só as linhas válidas serão importadas após sua confirmação.",
  "7. Mesmo nome, endereço, cidade, UF e CEP é tratado como repetido. Cadastros existentes não serão alterados, inclusive na lixeira.",
  "8. Depois de importar, abra os parceiros para conferir a localização e ativar. Endereços não encontrados ficam pendentes de correção.",
  "9. Se interromper a importação, você pode enviar a mesma planilha novamente: os parceiros já salvos serão ignorados."];
 notes.forEach((note,index)=>{const r=instructions.addRow([note]);r.height=index===0?32:42;r.alignment={wrapText:true,vertical:"middle"};});
 instructions.getRow(1).font={bold:true,size:16,color:{argb:"FF1C3F94"}};
 return Buffer.from(await book.xlsx.writeBuffer());
}
function cellText(cell:ExcelJS.Cell):string {
 const value=cell.value;
 if(value===null||value===undefined)return "";
 if(cell.isMerged)throw new LocatorError("Desfaça as células mescladas desta linha e preencha uma informação por coluna.");
 if(typeof value==="string")return value.trim();
 if(typeof value==="number"&&Number.isSafeInteger(value))return String(value);
 if(typeof value==="object"&&"richText" in value)return value.richText.map(part=>part.text).join("").trim();
 if(typeof value==="object"&&("formula" in value||"sharedFormula" in value))throw new LocatorError("Há uma fórmula nesta linha. Copie e cole apenas os valores como texto.");
 if(typeof value==="object"&&"hyperlink" in value)return value.text.trim();
 throw new LocatorError("Confira as células desta linha. Use texto, sem datas, erros ou fórmulas.");
}
export async function readImportSpreadsheet(buffer:Buffer):Promise<ImportRow[]> {
 if(buffer.length>IMPORT_MAX_BYTES)throw new LocatorError("Envie um arquivo Excel de até 2 MB.",413);
 const book=new ExcelJS.Workbook();
 try{assertSafeArchive(buffer);const cells=await withoutWorkbookComments(buffer);await book.xlsx.load(Uint8Array.from(cells).buffer);}catch{throw new LocatorError("Não foi possível abrir a planilha. Use o modelo .xlsx do painel, sem senha, imagens ou arquivos incorporados.");}
 const sheet=book.getWorksheet("Parceiros");
 if(!sheet)throw new LocatorError('A aba "Parceiros" não foi encontrada. Baixe o modelo do painel e mantenha o nome da aba.');
 const indices=new Map<string,number>();
 try{sheet.getRow(1).eachCell((cell,index)=>{
  const label=normalizeImportText(cellText(cell));if(!label)return;
  const column=[...IMPORT_COLUMNS,...LEGACY_IMPORT_COLUMNS].find(c=>normalizeImportText(c.label)===label);
  if(!column||indices.has(column.key))throw new Error();indices.set(column.key,index);
 });}catch{throw new LocatorError("Os títulos das colunas não correspondem ao modelo ou estão repetidos. Baixe o modelo e mantenha os títulos da primeira linha.");}
 if(IMPORT_COLUMNS.some(column=>!indices.has(column.key)))throw new LocatorError("Faltam colunas na planilha. Use as cinco colunas do modelo: nome, endereço completo, cidade, UF e CEP.");
 const rows:ImportRow[]=[];
 sheet.eachRow((row,rowNumber)=>{
  if(rowNumber===1)return;
  const nonempty:ExcelJS.Cell[]=[];row.eachCell(cell=>{if(cell.value!==null&&cell.value!==undefined&&cell.value!=="")nonempty.push(cell);});
  if(!nonempty.length||nonempty.every(cell=>typeof cell.value==="string"&&!cell.value.trim()))return;
  if(rows.length>=IMPORT_MAX_ROWS)throw new LocatorError(`Envie até ${IMPORT_MAX_ROWS} parceiros por arquivo. Divida a planilha em arquivos menores.`);
  const point:Record<string,string>={};let cellError:string|undefined;
  try{
   if(nonempty.some(cell=>![...indices.values()].includes(Number(cell.col))))throw new LocatorError("Há dados em uma coluna fora do modelo. Confira esta linha antes de importar.");
   for(const [key,index] of indices){
    const value=cellText(row.getCell(index));
    if(IMPORT_COLUMNS.some(column=>column.key===key))point[key]=value;
   }
  }catch(error){cellError=error instanceof LocatorError?error.message:"Confira os dados desta linha.";}
  rows.push({rowNumber,point,cellError});
 });
 if(!rows.length)throw new LocatorError("A planilha está vazia. Preencha a aba Parceiros a partir da linha 2.");
 return rows;
}

export async function readSpreadsheetUpload(request:Request):Promise<Buffer> {
 const type=request.headers.get("content-type")??"";
 if(!type.startsWith("multipart/form-data"))throw new LocatorError("Selecione um arquivo Excel .xlsx.",415);
 const max=IMPORT_MAX_BYTES+65536;
 if(Number(request.headers.get("content-length"))>max)throw new LocatorError("Envie um arquivo Excel de até 2 MB.",413);
 const reader=request.body?.getReader();if(!reader)throw new LocatorError("Selecione uma planilha.");
 const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>max){await reader.cancel();throw new LocatorError("Envie um arquivo Excel de até 2 MB.",413);}chunks.push(value);}}finally{reader.releaseLock();}
 let form:FormData;
 try{form=await new Response(Buffer.concat(chunks),{headers:{"content-type":type}}).formData();}catch{throw new LocatorError("Não foi possível receber a planilha. Selecione o arquivo novamente.");}
 const file=form.get("file");
 if(!(file instanceof File)||!file.name.toLowerCase().endsWith(".xlsx"))throw new LocatorError("Selecione uma planilha Excel no formato .xlsx.");
 if(file.size>IMPORT_MAX_BYTES)throw new LocatorError("Envie um arquivo Excel de até 2 MB.",413);
 return Buffer.from(await file.arrayBuffer());
}
