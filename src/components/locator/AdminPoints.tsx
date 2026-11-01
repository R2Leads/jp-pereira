"use client";
import { useCallback, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ClientPoint } from "@/lib/locator/client-types";
import { mapsUrl, STATES, type PointInput } from "@/lib/locator/domain";
import { DEMO_POINTS } from "@/lib/locator/demo-data";
import { hasUnsavedChanges } from "@/lib/locator/form-state";
import { PinIcon } from "./Icons";
import ImportPoints from "./ImportPoints";

const empty:PointInput={name:"",address:"",city:"",state:"SP",postalCode:"",phone:"",whatsapp:""};
const pointInput=(p:PointInput):PointInput=>({name:p.name,address:p.address,city:p.city,state:p.state,postalCode:p.postalCode,phone:p.phone,whatsapp:p.whatsapp});
export default function AdminPoints({initialPoints,localDemo,freeSearch,initialError=""}:{initialPoints:ClientPoint[];localDemo:boolean;freeSearch:boolean;initialError?:string}){
 const router=useRouter();
 const[points,setPoints]=useState<ClientPoint[]>(initialPoints);
 const[selected,setSelected]=useState<ClientPoint|null>(null);
 const[form,setForm]=useState<PointInput>({...empty});
 const[loading,setLoading]=useState(false);const[busy,setBusy]=useState(false);
 const[importing,setImporting]=useState(false);
 const[error,setError]=useState(initialError);const[notice,setNotice]=useState("");
 const[trash,setTrash]=useState(false);const[filter,setFilter]=useState("");
 const[reviewed,setReviewed]=useState(false);const[deleteConfirm,setDeleteConfirm]=useState(false);
 const dirty=hasUnsavedChanges(form,selected?pointInput(selected):empty);
 const editor=useRef<HTMLDivElement>(null);
 const api=useCallback(async(path:string,options:RequestInit={})=>{
  const response=await fetch(path,{...options,headers:{"Content-Type":"application/json",...options.headers},cache:"no-store"});
  const body=await response.json();
  if(response.status===401){router.replace("/admin/login");throw new Error("Sua sessão terminou. Entre novamente.");}
  if(!response.ok)throw new Error(body.error??"Não foi possível concluir a operação.");
  return body;
 },[router]);
 const load=useCallback(async()=>{
  if(dirty){setError("Salve ou descarte as alterações antes de atualizar a lista.");return;}
  setLoading(true);
  try{const data=await api("/api/admin/points");setError("");setPoints(data.points);
   if(selected){const fresh=data.points.find((point:ClientPoint)=>point.id===selected.id)??null;setSelected(fresh);setForm(fresh?pointInput(fresh):{...empty});setReviewed(false);}
  }
  catch(error){setError(error instanceof Error?error.message:"Não foi possível carregar a lista.");}
  finally{setLoading(false);}
 },[api,dirty,selected]);
 function open(point:ClientPoint|null){
  if(dirty){setError("Salve ou descarte as alterações antes de abrir outro cadastro.");return;}
  setSelected(point);setForm(point?pointInput(point):{...empty});setReviewed(false);setDeleteConfirm(false);setError("");setNotice("");
  if(window.innerWidth<1024)editor.current?.scrollIntoView({block:"start",behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
 }
 function accept(point:ClientPoint){
  setSelected(point);setForm(pointInput(point));setReviewed(false);setDeleteConfirm(false);
  setPoints(current=>[point,...current.filter(item=>item.id!==point.id)]);
 }
 async function save(event:FormEvent){
  event.preventDefault();setBusy(true);setError("");setNotice("");
  try{
   const data=await api(selected?"/api/admin/points/"+selected.id:"/api/admin/points",{
    method:selected?"PATCH":"POST",body:JSON.stringify(selected?{action:"update",point:form,version:selected.version}:form),
   });
   accept(data.point);
   setNotice(data.point.geocodeStatus==="error"?"Cadastro salvo. A localização está pendente de correção.":data.point.geocodeStatus==="needs_review"?"Cadastro salvo. Confira e confirme a localização abaixo.":"Alterações salvas.");
  }catch(error){setError(error instanceof Error?error.message:"Não foi possível salvar.");}
  finally{setBusy(false);}
 }
 async function action(kind:string,point=selected){
  if(dirty){setError("Salve ou descarte as alterações antes de alterar a situação do ponto.");return;}
  if(!point)return;setBusy(true);setError("");setNotice("");
  try{
   const data=await api("/api/admin/points/"+point.id,{method:kind==="trash"?"DELETE":"PATCH",body:JSON.stringify({action:kind,version:point.version})});
   accept(data.point);
   const messages:Record<string,string>={confirm:"Localização confirmada. O ponto já aparece na busca por proximidade.",activate:"Ponto ativado.",deactivate:"Ponto desativado e ocultado das buscas.",trash:"Cadastro movido para a lixeira. Você pode restaurá-lo.",restore:"Cadastro restaurado, inativo e oculto das buscas.",geocode:"Endereço consultado. Confira o resultado.","show-by-city":"Parceiro exibido por cidade, sem distância calculada.","hide-from-city":"Parceiro ocultado da busca por cidade."};
   setNotice(messages[kind]??"Cadastro atualizado.");
  }catch(error){setError(error instanceof Error?error.message:"Não foi possível concluir a ação.");}
  finally{setBusy(false);}
 }
 async function logout(){
  setBusy(true);
  try{await api("/api/admin/logout",{method:"POST"});router.replace("/admin/login");router.refresh();}
  catch(error){setError(error instanceof Error?error.message:"Não foi possível sair.");setBusy(false);}
 }
 const shown=points.filter(p=>Boolean(p.deletedAt)===trash&&[p.name,p.city,p.postalCode].some(value=>value.toLowerCase().includes(filter.toLowerCase())));
 const activeCount=points.filter(p=>p.active&&!p.deletedAt).length;
 const cityVisibleCount=points.filter(p=>p.cityListingVisible&&p.geocodeStatus!=="confirmed"&&!p.deletedAt).length;
 function field(name:keyof PointInput,label:string,maxLength:number,required=true){
  return <div key={name}><label htmlFor={"point-"+name} className="text-sm font-semibold text-jp-blue-900">{label}{!required&&<span className="ml-1 font-normal text-slate-400">(opcional)</span>}</label><input id={"point-"+name} name={name} value={form[name]} onChange={event=>{setForm(current=>({...current,[name]:event.target.value}));setReviewed(false);}} required={required} maxLength={maxLength} disabled={busy||loading} className="locator-input mt-2" inputMode={name==="postalCode"?"numeric":name==="phone"||name==="whatsapp"?"tel":undefined}/></div>;
 }
 return <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
  <div className="flex flex-wrap items-start justify-between gap-4">
   <div><p className="text-xs font-bold uppercase tracking-widest text-jp-blue-600">Área administrativa</p><h1 className="mt-2 font-display text-3xl font-bold text-jp-blue-900">Pontos de venda</h1><p className="mt-3 text-sm text-slate-500">{activeCount} {activeCount===1?"ponto ativo com localização confirmada":"pontos ativos com localização confirmada"} · {cityVisibleCount} {cityVisibleCount===1?"visível por cidade":"visíveis por cidade"}.</p></div>
   <div className="flex flex-wrap gap-3"><Link href="/onde-comprar" aria-disabled={importing} onClick={event=>{if(importing)event.preventDefault();}} className="locator-secondary">Ver página pública</Link><button type="button" onClick={logout} disabled={busy||loading||importing} className="locator-secondary">Sair</button></div>
  </div>
  {error&&<p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
  {notice&&<p role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}
  {localDemo&&!freeSearch&&<div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-950"><strong>Endereços de exemplo disponíveis.</strong> O serviço de busca livre ainda não foi configurado. Você pode cadastrar e localizar os exemplos; outros endereços ficam salvos com localização pendente.</div>}
  <ImportPoints disabled={busy||loading||dirty} onBusyChange={setImporting} onImported={point=>setPoints(current=>[point,...current.filter(item=>item.id!==point.id)])}/>
  <fieldset disabled={importing} aria-label="Cadastro individual de parceiros" className="contents">
  <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
   <div className="min-w-0 rounded-2xl border border-jp-blue-100 bg-white">
    <div className="border-b border-jp-blue-100 p-5 sm:p-6">
     <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-xl font-bold text-jp-blue-900">Estabelecimentos</h2><button type="button" onClick={()=>open(null)} disabled={busy||loading} className="locator-primary">+ Novo ponto</button></div>
     <label htmlFor="point-filter" className="sr-only">Filtrar cadastros por nome, cidade ou CEP</label><input id="point-filter" value={filter} onChange={e=>setFilter(e.target.value)} className="locator-input mt-5" placeholder="Buscar nome, cidade ou CEP"/>
     <div className="mt-4 flex items-center gap-4 text-sm"><button type="button" disabled={busy||loading} onClick={()=>setTrash(false)} aria-pressed={!trash} className={"min-h-11 border-b-2 px-1 font-semibold "+(!trash?"border-jp-blue-600 text-jp-blue-700":"border-transparent text-slate-500")}>Cadastros ({points.filter(p=>!p.deletedAt).length})</button><button type="button" disabled={busy||loading} onClick={()=>setTrash(true)} aria-pressed={trash} className={"min-h-11 border-b-2 px-1 font-semibold "+(trash?"border-jp-blue-600 text-jp-blue-700":"border-transparent text-slate-500")}>Lixeira ({points.filter(p=>p.deletedAt).length})</button><button type="button" onClick={()=>void load()} disabled={busy||loading} className="ml-auto min-h-11 text-xs font-semibold text-jp-blue-700 underline">Atualizar</button></div>
    </div>
    {loading?<p role="status" className="p-6 text-sm text-slate-500">Carregando cadastros…</p>:shown.length===0?<p className="p-6 text-sm text-slate-500">{trash?"Nenhum cadastro na lixeira.":"Nenhum cadastro encontrado."}</p>:
     <ul className="max-h-[800px] divide-y divide-jp-blue-50 overflow-auto">{shown.map(point=><li key={point.id} className={selected?.id===point.id?"bg-jp-blue-50/70":""}>
      <button type="button" disabled={busy||loading} onClick={()=>open(point)} className="flex w-full items-start gap-3 p-5 text-left transition hover:bg-jp-blue-50 sm:px-6">
       <PinIcon className="mt-1 h-5 w-5 shrink-0 text-jp-blue-500"/><div className="min-w-0 flex-1"><span className="block font-semibold leading-relaxed text-jp-blue-900">{point.name}</span><span className="mt-1 block text-xs text-slate-500">{point.city} – {point.state} · {point.postalCode.slice(0,5)}-{point.postalCode.slice(5)}</span><div className="mt-3 flex flex-wrap gap-2"><span className={"inline-block rounded-full px-2.5 py-1 text-xs font-semibold "+(point.deletedAt?"bg-slate-100 text-slate-600":point.active?"bg-emerald-50 text-emerald-800":point.geocodeStatus!=="confirmed"?"bg-amber-50 text-amber-900":"bg-slate-100 text-slate-600")}>{point.deletedAt?"Na lixeira":point.active?"Localização ativa":point.geocodeStatus==="needs_review"?"Aguardando confirmação":point.geocodeStatus==="error"?"Localização pendente":"Inativo"}</span>{point.cityListingVisible&&!point.deletedAt&&point.geocodeStatus!=="confirmed"&&<span className="inline-block rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">Visível por cidade</span>}</div></div><span className="mt-1 text-xs font-semibold text-jp-blue-600">Abrir →</span>
      </button>
     </li>)}</ul>}
   </div>
   <div ref={editor} className="min-w-0 scroll-mt-28 rounded-2xl border border-jp-blue-100 bg-white p-5 sm:p-7">
    <div className="flex items-center justify-between gap-3"><h2 className="font-display text-xl font-bold text-jp-blue-900">{selected?"Editar ponto de venda":"Novo ponto de venda"}</h2>{selected&&<span className="text-xs text-slate-400">#{selected.id}</span>}</div>
    {dirty&&<div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-sm leading-relaxed text-amber-950">Há alterações não salvas. Salve antes de confirmar, ativar ou excluir este ponto.</p><button type="button" disabled={busy||loading} onClick={()=>{setForm(selected?pointInput(selected):{...empty});setReviewed(false);setError("");}} className="mt-2 min-h-11 text-sm font-bold text-jp-blue-700 underline">Descartar alterações</button></div>}
    {selected?.deletedAt?<div className="mt-6 rounded-xl bg-slate-50 p-5"><p className="font-semibold text-jp-blue-900">{selected.name}</p><p className="mt-2 text-sm text-slate-600">Este cadastro está na lixeira e não aparece na busca. Ao restaurar, ele continuará inativo.</p><button type="button" className="locator-primary mt-5" disabled={busy||loading||dirty} onClick={()=>void action("restore")}>Restaurar cadastro</button></div>:<>
     {localDemo&&<div className="mt-5"><label htmlFor="demo-address" className="text-xs font-semibold text-slate-500">Preencher com um endereço ilustrativo</label><select id="demo-address" value="" disabled={busy||loading} onChange={event=>{
      const sample=DEMO_POINTS[Number(event.target.value)];if(sample){setForm(pointInput({...sample,phone:"",whatsapp:""}));setReviewed(false);}
     }} className="locator-input mt-2"><option value="" disabled>Escolha um exemplo para testar</option>{DEMO_POINTS.map((p,index)=><option value={index} key={p.postalCode}>{p.city} · {p.name.replace("Ponto de demonstração · ","")}</option>)}</select></div>}
     <form onSubmit={save} className="mt-6 space-y-5">
      {field("name","Nome do estabelecimento",160)}
      {field("address","Endereço completo, com número e bairro",250)}
      <div className="grid grid-cols-[minmax(0,1fr)_90px] gap-4">{field("city","Cidade",100)}<div><label htmlFor="point-state" className="text-sm font-semibold text-jp-blue-900">UF</label><select id="point-state" disabled={busy||loading} className="locator-input mt-2" value={form.state} onChange={e=>{setForm(current=>({...current,state:e.target.value}));setReviewed(false);}}>{STATES.map(uf=><option key={uf}>{uf}</option>)}</select></div></div>
      {field("postalCode","CEP",9)}
      <button disabled={busy||loading} className="locator-primary w-full">{busy?"Salvando…":selected?"Salvar alterações":"Cadastrar e localizar"}</button>
      <p className="text-xs leading-relaxed text-slate-500">Ao alterar o endereço, será preciso conferir e confirmar a nova localização antes de ativar o ponto.</p>
     </form>
     {selected&&<section aria-labelledby="location-review" className="mt-7 border-t border-jp-blue-100 pt-6">
      <h3 id="location-review" className="font-display text-base font-bold text-jp-blue-900">Localização do estabelecimento</h3>
      {selected.geocodeStatus==="error"?<div className="mt-3 rounded-xl bg-amber-50 p-4"><p className="text-sm leading-relaxed text-amber-950">{selected.geocodeError??"Não foi possível localizar o endereço."}</p><button type="button" onClick={()=>void action("geocode")} disabled={busy||loading} className="mt-4 min-h-11 text-sm font-bold text-jp-blue-700 underline">Consultar endereço novamente</button></div>:<div className="mt-3 rounded-xl bg-jp-blue-50 p-4">
       <p className="text-sm leading-relaxed text-jp-blue-900">{selected.geocodeLabel}</p>
       <p className="mt-2 text-xs text-slate-500">{selected.geocodeSource==="demo"?"Coordenadas ilustrativas para testar o fluxo.":selected.geocodeConfidence!==null?"Confiança informada pelo serviço: "+Math.round(selected.geocodeConfidence*100)+"%. Confira o local antes de confirmar.":"Confira o local antes de confirmar."}</p>
       {selected.latitude!==null&&selected.longitude!==null&&<a className="mt-3 inline-flex min-h-11 items-center text-sm font-bold text-jp-blue-700 underline" href={mapsUrl(selected.latitude,selected.longitude,false)} target="_blank" rel="noreferrer">Conferir no Google Maps ↗</a>}
       {selected.geocodeStatus==="needs_review"?<><label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-jp-blue-900"><input type="checkbox" disabled={busy||loading||dirty} checked={reviewed} onChange={e=>setReviewed(e.target.checked)} className="mt-1 h-5 w-5 shrink-0 accent-[#1c3f94]"/>Conferi o endereço localizado e confirmo que este é o ponto desejado.</label><button type="button" disabled={busy||loading||dirty||!reviewed} onClick={()=>void action("confirm")} className="locator-primary mt-4 w-full">Confirmar localização e ativar</button></>:<div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-jp-blue-100 pt-4"><p className="text-sm font-semibold text-jp-blue-900">Localização confirmada · {selected.active?"ponto ativo":"ponto inativo"}</p><button type="button" disabled={busy||loading||dirty} onClick={()=>void action(selected.active?"deactivate":"activate")} className="locator-secondary">{selected.active?"Desativar ponto":"Ativar ponto"}</button></div>}
      </div>}
      {selected.geocodeStatus!=="confirmed"&&<div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-jp-blue-100 pt-5"><div><p className="text-sm font-semibold text-jp-blue-900">Exibição na busca por cidade</p><p className="mt-1 text-xs leading-relaxed text-slate-500">{selected.cityListingVisible?"Este parceiro aparece pelo endereço, sem distância calculada.":"Este parceiro não aparece na busca pública até ser exibido por cidade ou ter a localização confirmada."}</p></div><button type="button" disabled={busy||loading||dirty} onClick={()=>void action(selected.cityListingVisible?"hide-from-city":"show-by-city")} className="locator-secondary">{selected.cityListingVisible?"Ocultar por cidade":"Exibir por cidade"}</button></div>}
      <div className="mt-6 border-t border-slate-100 pt-5">{deleteConfirm?<div role="alert"><p className="text-sm text-slate-600">Mover este cadastro para a lixeira? Ele deixará de aparecer na busca e poderá ser restaurado.</p><div className="mt-3 flex flex-wrap gap-3"><button type="button" disabled={busy||loading||dirty} onClick={()=>void action("trash")} className="min-h-11 rounded-xl bg-red-50 px-4 text-sm font-bold text-red-800">Mover para lixeira</button><button type="button" disabled={busy||loading} onClick={()=>setDeleteConfirm(false)} className="min-h-11 px-4 text-sm text-slate-600">Cancelar</button></div></div>:<button type="button" disabled={busy||loading||dirty} onClick={()=>setDeleteConfirm(true)} className="min-h-11 text-sm font-semibold text-red-700 underline">Excluir cadastro</button>}</div>
     </section>}
    </>}
   </div>
  </div>
  </fieldset>
 </section>;
}

