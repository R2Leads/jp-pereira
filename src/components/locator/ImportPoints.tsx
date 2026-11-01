"use client";
import {useEffect,useRef,useState,type ChangeEvent} from "react";
import {useRouter} from "next/navigation";
import {IMPORT_MAX_BYTES,IMPORT_MAX_ROWS,type ImportPreviewRow} from "@/lib/locator/import";
import type {ClientPoint} from "@/lib/locator/client-types";

type Outcome={status:"imported"|"duplicate"|"failed";message:string};
type Phase="idle"|"checking"|"ready"|"importing"|"done";
export default function ImportPoints({disabled,onImported,onBusyChange}:{disabled:boolean;onImported:(point:ClientPoint)=>void;onBusyChange:(busy:boolean)=>void}){
 const router=useRouter(),stop=useRef(false);
 const [open,setOpen]=useState(false),[phase,setPhase]=useState<Phase>("idle");
 const [rows,setRows]=useState<ImportPreviewRow[]>([]),[fileName,setFileName]=useState("");
 const [error,setError]=useState(""),[outcomes,setOutcomes]=useState<Record<number,Outcome>>({});
 const [progress,setProgress]=useState(0),[stopping,setStopping]=useState(false);
 const working=phase==="checking"||phase==="importing";
 const ready=rows.filter(row=>row.status==="ready"),invalid=rows.filter(row=>row.status==="invalid").length;
 const duplicate=rows.filter(row=>row.status==="duplicate").length;
 const imported=Object.values(outcomes).filter(outcome=>outcome.status==="imported").length;
 const skipped=Object.values(outcomes).filter(outcome=>outcome.status==="duplicate").length;
 useEffect(()=>()=>{stop.current=true;},[]);
 useEffect(()=>{
  if(phase!=="importing")return;
  const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();};
  window.addEventListener("beforeunload",warn);return()=>window.removeEventListener("beforeunload",warn);
 },[phase]);
 async function responseBody(response:Response){
  if(response.status===401){router.replace("/admin/login");throw new Error("Sua sessão terminou. Entre novamente e envie a planilha para continuar.");}
  let body;
  try{body=await response.json();}catch{throw new Error("Não foi possível confirmar a resposta do painel. Confira a lista e envie a mesma planilha novamente para continuar sem repetir os já salvos.");}
  if(!response.ok)throw new Error(body.error??"Não foi possível concluir a operação.");return body;
 }
 async function preview(event:ChangeEvent<HTMLInputElement>){
  const file=event.target.files?.[0];event.target.value="";if(!file)return;
  setError("");setRows([]);setOutcomes({});setProgress(0);setFileName(file.name);setPhase("idle");
  if(!file.name.toLowerCase().endsWith(".xlsx")){setError("Selecione uma planilha Excel no formato .xlsx.");return;}
  if(file.size>IMPORT_MAX_BYTES){setError("A planilha deve ter até 2 MB. Divida os parceiros em arquivos menores.");return;}
  setPhase("checking");onBusyChange(true);
  try{
   const form=new FormData();form.append("file",file);
   const body=await responseBody(await fetch("/api/admin/points/import/preview",{method:"POST",body:form}));
   setRows(body.rows);setPhase("ready");
  }catch(error){setError(error instanceof Error?error.message:"Não foi possível conferir a planilha.");setPhase("idle");}
  finally{onBusyChange(false);}
 }
 async function importRows(){
  if(disabled||working||phase!=="ready"||!ready.length)return;
  stop.current=false;setStopping(false);setError("");setPhase("importing");onBusyChange(true);
  try{
   for(const row of ready){
    if(stop.current)break;
    try{
     const body=await responseBody(await fetch("/api/admin/points/import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({point:row.point})}));
     if(!body.point||!["imported","duplicate"].includes(body.status))throw new Error("A resposta não confirmou a gravação. Confira a lista e reenvie a planilha.");
     const point=body.point as ClientPoint;
     const message=body.status==="duplicate"?"Já cadastrado. Ignorado sem alterar os dados.":point.geocodeStatus==="error"?"Salvo. Endereço não localizado; abra o cadastro para corrigir.":"Salvo. Abra o cadastro para conferir a localização e ativar.";
     setOutcomes(current=>({...current,[row.rowNumber]:{status:body.status,message}}));
     onImported(point);setProgress(value=>value+1);
    }catch(error){
     setOutcomes(current=>({...current,[row.rowNumber]:{status:"failed",message:"Gravação não confirmada. Confira a lista e reenvie a planilha."}}));
     setError(error instanceof Error?error.message:"A importação foi interrompida. Confira a lista e reenvie a planilha.");break;
    }
   }
  }finally{setPhase("done");onBusyChange(false);}
 }
 const label=(row:ImportPreviewRow)=>{
  const result=outcomes[row.rowNumber];if(result)return result.status==="imported"?"Importado":result.status==="duplicate"?"Já cadastrado":"Não confirmado";
  return row.status==="ready"?(phase==="done"?"Não importado":"Pronto"):row.status==="duplicate"?"Repetido":"Corrigir";
 };
 return <section aria-labelledby="import-title" className="mt-8 min-w-0 rounded-2xl border border-jp-blue-100 bg-white">
  <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
   <div><h2 id="import-title" className="font-display text-xl font-bold text-jp-blue-900">Importar parceiros por planilha</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">Cadastre vários estabelecimentos de uma vez. Baixe o modelo, preencha e confira os dados antes de salvar.</p></div>
   <button type="button" className="locator-secondary" disabled={working||disabled} aria-expanded={open} aria-controls="import-content" onClick={()=>setOpen(value=>!value)}>{open?"Recolher importação":"Importar planilha"}</button>
  </div>
  {open&&<div id="import-content" className="border-t border-jp-blue-100 p-5 sm:p-6">
   <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <div><h3 className="text-sm font-bold text-jp-blue-900">1. Preencha o modelo</h3><p id="import-instructions" className="mt-2 text-sm leading-relaxed text-slate-600">Use uma linha por parceiro e mantenha as cinco colunas: nome do estabelecimento, endereço completo, cidade, UF e CEP.</p><a href="/api/admin/points/import/template" download className="locator-secondary mt-4">Baixar planilha modelo (.xlsx)</a></div>
    <div><h3 className="text-sm font-bold text-jp-blue-900">2. Envie para conferir</h3><label htmlFor="partners-file" className="mt-2 block text-sm leading-relaxed text-slate-600">Planilha preenchida — até {IMPORT_MAX_ROWS} parceiros e 2 MB por arquivo.</label><input id="partners-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={disabled||working} onChange={event=>void preview(event)} aria-describedby="import-instructions" className="mt-4 block min-h-11 w-full min-w-0 rounded-xl border border-jp-blue-100 bg-slate-50 p-2 text-sm text-slate-600 file:mr-3 file:min-h-10 file:rounded-lg file:border-0 file:bg-jp-blue-100 file:px-3 file:font-semibold file:text-jp-blue-900 disabled:opacity-50"/>{disabled&&!working&&<p className="mt-2 text-xs text-amber-800">Salve ou descarte as alterações do cadastro antes de importar.</p>}</div>
   </div>
   {fileName&&<p className="mt-4 break-words text-xs text-slate-500">Arquivo selecionado: {fileName}</p>}
   {error&&<p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-relaxed text-red-800">{error}</p>}
   {phase==="checking"&&<p role="status" className="mt-5 text-sm font-semibold text-jp-blue-800">Conferindo a planilha… Nenhum parceiro foi salvo.</p>}
   {rows.length>0&&<>
    <div className="mt-6 border-t border-jp-blue-100 pt-5"><h3 className="text-sm font-bold text-jp-blue-900">3. Confira e confirme</h3><p className="mt-2 break-words text-sm text-slate-600">{fileName} · {rows.length} {rows.length===1?"linha preenchida":"linhas preenchidas"}</p><div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-emerald-50 px-3 py-2 text-emerald-900">{ready.length} prontos</span><span className="rounded-full bg-amber-50 px-3 py-2 text-amber-900">{invalid} para corrigir</span><span className="rounded-full bg-slate-100 px-3 py-2 text-slate-600">{duplicate} repetidos</span></div>
     {phase==="ready"&&<p className="mt-4 text-sm leading-relaxed text-slate-600">Nenhum parceiro foi salvo. A confirmação importa somente as linhas prontas. Linhas com erro e repetidas serão ignoradas; os cadastros existentes serão preservados.</p>}
    </div>
    <div role="region" aria-label="Prévia dos parceiros da planilha" tabIndex={0} className="mt-4 max-h-96 overflow-auto rounded-xl border border-jp-blue-100">
     <table className="w-full min-w-[640px] text-left text-sm"><thead className="sticky top-0 bg-jp-blue-50 text-xs text-jp-blue-900"><tr><th scope="col" className="p-3">Linha</th><th scope="col" className="p-3">Parceiro</th><th scope="col" className="p-3">Cidade / CEP</th><th scope="col" className="p-3">Resultado</th></tr></thead><tbody className="divide-y divide-jp-blue-50">{rows.map(row=><tr key={row.rowNumber}><th scope="row" className="p-3 align-top font-medium text-slate-500">{row.rowNumber}</th><td className="max-w-xs break-words p-3 align-top"><span className="font-semibold text-jp-blue-900">{row.name}</span>{row.point&&<span className="mt-1 block text-xs leading-relaxed text-slate-500">{row.point.address}</span>}</td><td className="p-3 align-top text-xs leading-relaxed text-slate-500">{row.point?<>{row.point.city} – {row.point.state}<br/>{row.point.postalCode.slice(0,5)}-{row.point.postalCode.slice(5)}</>:"—"}</td><td className="max-w-sm p-3 align-top"><span className={"font-semibold "+(outcomes[row.rowNumber]?.status==="failed"||row.status==="invalid"?"text-red-800":row.status==="duplicate"?"text-slate-600":"text-jp-blue-800")}>{label(row)}</span><span className="mt-1 block text-xs leading-relaxed text-slate-500">{outcomes[row.rowNumber]?.message??row.message}</span></td></tr>)}</tbody></table>
    </div>
    <p className="mt-4 text-sm leading-relaxed text-slate-600">Depois de importar, abra cada parceiro na lista para conferir a localização e ativar. Se o endereço não for encontrado, o cadastro ficará salvo para correção.</p>
    {phase==="ready"&&ready.length>0&&<button type="button" className="locator-primary mt-5" disabled={disabled} onClick={()=>void importRows()}>Confirmar e importar {ready.length} {ready.length===1?"parceiro":"parceiros"}</button>}
    {phase==="importing"&&<div className="mt-5 rounded-xl bg-jp-blue-50 p-4"><p role="status" aria-live="polite" className="text-sm font-semibold text-jp-blue-900">Importando: {progress} de {ready.length} processados. {stopping?"Parando após o parceiro atual…":"Mantenha esta página aberta."}</p><progress aria-label="Progresso da importação" value={progress} max={ready.length} className="mt-3 h-3 w-full accent-[#1c3f94]"/><button type="button" disabled={stopping} onClick={()=>{stop.current=true;setStopping(true);}} className="mt-3 min-h-11 text-sm font-semibold text-jp-blue-800 underline">Parar após o parceiro atual</button></div>}
    {phase==="done"&&<div role="status" className="mt-5 rounded-xl border border-jp-blue-100 bg-jp-blue-50 p-4 text-sm leading-relaxed text-jp-blue-900"><strong>{imported} {imported===1?"parceiro importado":"parceiros importados"}.</strong> {duplicate+skipped} repetidos ignorados. {invalid} linhas precisam de correção.{progress<ready.length&&<> A importação parou antes do fim.</>} Você pode corrigir e selecionar a planilha novamente; os parceiros já salvos serão reconhecidos e ignorados.</div>}
   </>}
  </div>}
 </section>;
}
