"use client";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import type { AutocompleteOption, SearchResult } from "@/lib/locator/client-types";
import { geolocationErrorMessage } from "@/lib/locator/geolocation";
import { widerSearchRadii, type SearchRadius } from "@/lib/locator/results";
import { ArrowIcon, LocateIcon, PinIcon, SearchIcon } from "./Icons";
const distance=new Intl.NumberFormat("pt-BR",{maximumFractionDigits:1});
function originBody(origin:SearchResult["origin"]){
 return {latitude:origin.latitude,longitude:origin.longitude,label:origin.label,precision:origin.precision,city:origin.city,state:origin.state};
}
export default function StoreLocator({localDemo,freeSearch}:{localDemo:boolean;freeSearch:boolean}){
 const [query,setQuery]=useState("");
 const [result,setResult]=useState<SearchResult|null>(null);
 const [error,setError]=useState("");
 const [loading,setLoading]=useState(false);
 const [loadingMore,setLoadingMore]=useState(false);
 const [locating,setLocating]=useState(false);
 const [suggestions,setSuggestions]=useState<AutocompleteOption[]>([]);
 const [suggesting,setSuggesting]=useState(false);
 const [suggestError,setSuggestError]=useState("");
 const [showSuggestions,setShowSuggestions]=useState(false);
 const [activeIndex,setActiveIndex]=useState(-1);
 const pending=useRef<AbortController|null>(null);
 const suggestController=useRef<AbortController|null>(null);
 const skipSuggest=useRef(false);
 const dismissed=useRef(false);
 const boxRef=useRef<HTMLDivElement|null>(null);
 useEffect(()=>{
  const text=query.trim();
  suggestController.current?.abort();
  if(skipSuggest.current){skipSuggest.current=false;return;}
  // CEP já é específico; nesse caso não há o que escolher.
  if(text.length<3||/^\d{5}-?\d{3}$/.test(text))return;
  const timer=setTimeout(()=>{
   const controller=new AbortController();suggestController.current=controller;
   setSuggesting(true);
   fetch("/api/points/autocomplete",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({query:text}),signal:controller.signal})
    .then(async response=>{const data=await response.json();if(!response.ok)throw new Error(data.error??"Não foi possível carregar as sugestões.");return data as {options:AutocompleteOption[]};})
    .then(data=>{if(controller.signal.aborted)return;setSuggestions(data.options);setActiveIndex(data.options.length?0:-1);if(!dismissed.current)setShowSuggestions(true);})
    .catch(failure=>{if(controller.signal.aborted)return;setSuggestions([]);setActiveIndex(-1);setSuggestError(failure instanceof Error?failure.message:"Não foi possível carregar as sugestões.");if(!dismissed.current)setShowSuggestions(true);})
    .finally(()=>{if(!controller.signal.aborted)setSuggesting(false);});
  },350);
  return ()=>{clearTimeout(timer);};
 },[query]);
 useEffect(()=>{
  function close(event:PointerEvent){
   if(boxRef.current&&!boxRef.current.contains(event.target as Node)){dismissed.current=true;setShowSuggestions(false);}
  }
  document.addEventListener("pointerdown",close);
  return ()=>document.removeEventListener("pointerdown",close);
 },[]);
 useEffect(()=>()=>{suggestController.current?.abort();},[]);
 async function search(body:Record<string,unknown>,radiusKm:SearchRadius=30){
  dismissed.current=true;suggestController.current?.abort();setSuggesting(false);setShowSuggestions(false);
  pending.current?.abort(); const controller=new AbortController();pending.current=controller;setLoadingMore(false);
  setError("");setLoading(true);
  try{
   const response=await fetch("/api/points/search",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...body,radiusKm,offset:0}),signal:controller.signal});
   const data=await response.json();
   if(!response.ok) throw new Error(data.error??"Não foi possível realizar a busca.");
   setResult(data);
  }catch(failure){if(!controller.signal.aborted){setResult(null);setError(failure instanceof Error?failure.message:"Não foi possível realizar a busca.");}}
  finally{if(!controller.signal.aborted)setLoading(false);}
 }
 async function loadMore(){
  if(!result?.hasMore||loadingMore)return;
  pending.current?.abort();const controller=new AbortController();pending.current=controller;
  setError("");setLoadingMore(true);
  try{
   const response=await fetch("/api/points/search",{method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({...originBody(result.origin),radiusKm:result.radiusKm,offset:result.points.length}),signal:controller.signal});
   const data=await response.json();
   if(!response.ok)throw new Error(data.error??"Não foi possível carregar mais pontos.");
   setResult(current=>current?{...data,points:[...current.points,...data.points]}:data);
  }catch(failure){if(!controller.signal.aborted)setError(failure instanceof Error?failure.message:"Não foi possível carregar mais pontos.");}
  finally{setLoadingMore(false);}
 }
 function choose(option:AutocompleteOption){
  const display=option.label.replace(/,\s*Brasil$/i,"");
  skipSuggest.current=true;
  setQuery(display);
  setSuggestions([]);setSuggestError("");setShowSuggestions(false);setActiveIndex(-1);
  void search({latitude:option.latitude,longitude:option.longitude,label:display,city:option.city,state:option.state,precision:option.precision});
 }
 function onInputKeyDown(event:KeyboardEvent<HTMLInputElement>){
  if(!showSuggestions)return;
  if(event.key==="ArrowDown"){event.preventDefault();setActiveIndex(index=>suggestions.length?(index+1)%suggestions.length:-1);return;}
  if(event.key==="ArrowUp"){event.preventDefault();setActiveIndex(index=>suggestions.length?(index-1+suggestions.length)%suggestions.length:-1);return;}
  if(event.key==="Escape"){event.preventDefault();dismissed.current=true;setShowSuggestions(false);return;}
  if(event.key==="Enter"&&activeIndex>=0&&suggestions[activeIndex]){event.preventDefault();choose(suggestions[activeIndex]);}
 }
 function submit(event:FormEvent){
  event.preventDefault();
  if(showSuggestions&&activeIndex>=0&&suggestions[activeIndex]){choose(suggestions[activeIndex]);return;}
  if(query.trim())void search({query:query.trim()});
 }
 function searchTyped(){
  dismissed.current=true;setShowSuggestions(false);
  if(query.trim())void search({query:query.trim()});
 }
 function locate(){
  if(!navigator.geolocation){setError("Este navegador não oferece localização. Digite um endereço ou CEP.");return;}
  setError("");setLocating(true);dismissed.current=true;suggestController.current?.abort();setSuggesting(false);setShowSuggestions(false);
  navigator.geolocation.getCurrentPosition(position=>{
   setLocating(false);void search({latitude:position.coords.latitude,longitude:position.coords.longitude});
  },failure=>{
   setLocating(false);
   setError(geolocationErrorMessage(failure.code));
  },{timeout:10000,maximumAge:60000,enableHighAccuracy:false});
 }
 const busy=loading||locating;
 return <section className="mx-auto grid max-w-7xl items-start gap-8 px-4 pb-20 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:gap-12 lg:px-8">
  <aside className="relative -mt-7 rounded-3xl border border-jp-blue-100 bg-white p-6 shadow-lg shadow-jp-blue-900/5 sm:p-8 lg:sticky lg:top-28">
   <h2 className="font-display text-xl font-bold text-jp-blue-900">Por onde começamos?</h2>
   <form onSubmit={submit} className="mt-6">
    <label htmlFor="location-query" className="text-sm font-semibold text-jp-blue-900">Seu endereço ou CEP</label>
    <div ref={boxRef} className="relative mt-2">
     <input id="location-query" name="query" value={query}
      onChange={event=>{
       skipSuggest.current=false;dismissed.current=false;
       const value=event.target.value;
       setQuery(value);setSuggestions([]);setSuggestError("");setActiveIndex(-1);
       const trimmed=value.trim();
       const active=trimmed.length>=3&&!/^\d{5}-?\d{3}$/.test(trimmed);
       setShowSuggestions(active);setSuggesting(active);
      }}
      onKeyDown={onInputKeyDown}
      onFocus={()=>{const trimmed=query.trim();if(trimmed.length>=3&&!/^\d{5}-?\d{3}$/.test(trimmed)){dismissed.current=false;setShowSuggestions(true);}}}
      placeholder="Ex.: Rua da Penha, Sorocaba ou 18010-000" maxLength={300} required autoComplete="street-address"
      role="combobox" aria-autocomplete="list" aria-expanded={showSuggestions} aria-controls="location-suggestions"
      className="locator-input"/>
     {showSuggestions&&<div id="location-suggestions" role="listbox" className="absolute left-0 right-0 z-30 mt-2 max-h-80 overflow-y-auto rounded-xl border border-jp-blue-100 bg-white shadow-xl shadow-jp-blue-900/15">
      {suggesting?<p className="px-4 py-3 text-xs text-slate-500">Buscando endereços…</p>:
       suggestError?<div className="px-4 py-3"><p className="text-xs leading-relaxed text-amber-800">{suggestError}</p><button type="button" onClick={searchTyped} className="mt-2 text-xs font-bold text-jp-blue-700 underline">Buscar pelo texto digitado</button></div>:
       suggestions.length===0?<div className="px-4 py-3"><p className="text-xs leading-relaxed text-slate-500">Nenhum endereço encontrado. Inclua a cidade/UF ou use o CEP.</p><button type="button" onClick={searchTyped} className="mt-2 text-xs font-bold text-jp-blue-700 underline">Buscar pelo texto digitado</button></div>:
       suggestions.map((option,index)=><button type="button" role="option" aria-selected={index===activeIndex} key={`${option.latitude}|${option.longitude}|${option.label}`} onMouseEnter={()=>setActiveIndex(index)} onClick={()=>choose(option)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left text-sm last:border-0 ${index===activeIndex?"bg-jp-blue-50":"bg-white hover:bg-slate-50"}`}>
        <span className="flex items-start justify-between gap-3"><span className="min-w-0 font-semibold leading-snug text-jp-blue-900">{option.label.replace(/,\s*Brasil$/i,"")}</span>{option.city&&<span className="shrink-0 rounded-full bg-jp-blue-50 px-2 py-0.5 text-[11px] font-bold text-jp-blue-700">{[option.city,option.state].filter(Boolean).join(" – ")}</span>}</span>
       </button>)}
     </div>}
    </div>
    <button type="submit" disabled={busy||!query.trim()} className="locator-primary mt-3 w-full"><SearchIcon className="h-5 w-5"/>{loading?"Buscando…":"Encontrar pontos de venda"}</button>
   </form>
   <div className="my-5 flex items-center gap-3 text-xs text-slate-400"><span className="h-px flex-1 bg-slate-200"/>ou<span className="h-px flex-1 bg-slate-200"/></div>
   <button type="button" onClick={locate} disabled={busy} className="locator-secondary w-full"><LocateIcon className="h-5 w-5"/>{locating?"Obtendo localização…":"Usar minha localização"}</button>
   <p className="mt-3 text-xs leading-relaxed text-slate-500">A permissão será pedida pelo navegador. Sua localização não é salva nesta busca.</p>
   <div className="mt-7 rounded-xl bg-jp-blue-50 p-4 text-xs leading-relaxed text-jp-blue-800"><strong>Distância aproximada.</strong> O cálculo é em linha reta. Use “Ver rota” para conferir o caminho no Google Maps.</div>
   {freeSearch&&<p className="mt-5 text-xs text-slate-500">Localização por <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer" className="underline">Geoapify</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">© OpenStreetMap</a></p>}
  </aside>
  <div className="min-w-0 pt-1 lg:pt-9" aria-busy={busy}>
   {error&&<p role="alert" className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm leading-relaxed text-red-800">{error}</p>}
   {loading?<div role="status" className="rounded-3xl border border-jp-blue-100 bg-white px-6 py-12 text-center text-jp-blue-700"><SearchIcon className="mx-auto mb-4 h-8 w-8"/>Procurando os pontos mais próximos…</div>:
    result?<div>
     <div className="mb-6" role="status"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{result.total} {result.total===1?"ponto encontrado":"pontos encontrados"} em até {result.radiusKm} km</p><h2 className="mt-2 font-display text-2xl font-bold text-jp-blue-900">Mais próximos de você</h2><p className="mt-2 text-sm leading-relaxed text-slate-500">{result.origin.label}</p>{result.origin.approximate&&<p className="mt-1 text-xs text-slate-500">Localização de referência aproximada.</p>}</div>
     {result.points.length===0?<div className="rounded-2xl border border-jp-blue-100 bg-white p-8"><h3 className="font-semibold text-jp-blue-900">Nenhum ponto com localização confirmada em até {result.radiusKm} km.</h3><p className="mt-2 text-sm text-slate-600">{result.cityPartners.length>0?"Veja abaixo os parceiros da cidade, com o endereço original.":"Ainda não há estabelecimentos ativos com localização confirmada neste raio."}</p>
      {widerSearchRadii(result.radiusKm).length>0&&<div className="mt-5 flex flex-wrap gap-3" aria-label="Ampliar raio da busca">
       {widerSearchRadii(result.radiusKm).map(radius=><button key={radius} type="button" onClick={()=>void search(originBody(result.origin),radius)} className="rounded-full border border-jp-blue-200 px-5 py-3 text-sm font-bold text-jp-blue-800 transition hover:bg-jp-blue-50">Buscar até {radius} km</button>)}
      </div>}
     </div>:
      <ol className="space-y-4">{result.points.map(point=><li key={point.id} className="rounded-2xl border border-jp-blue-100 bg-white p-5 sm:p-6">
       <div className="flex items-start gap-4"><span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-jp-blue-50 text-jp-blue-600 sm:flex"><PinIcon className="h-6 w-6"/></span><div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-display text-lg font-bold text-jp-blue-900">{point.name}</h3></div><span className="whitespace-nowrap rounded-full bg-jp-sand px-3 py-1.5 text-sm font-bold text-jp-blue-900">≈ {distance.format(point.distanceKm)} km</span></div>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{point.address}<br/>{point.city} – {point.state} · CEP {point.postalCode.slice(0,5)}-{point.postalCode.slice(5)}</p>
        <div className="mt-4 flex justify-end"><a href={point.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-jp-red-600 hover:underline">Ver rota no Google Maps<ArrowIcon className="h-4 w-4"/></a></div>
       </div></div>
      </li>)}</ol>}
     {result.hasMore&&<div className="mt-6 text-center"><button type="button" onClick={()=>void loadMore()} disabled={loadingMore} className="rounded-full bg-jp-blue-800 px-7 py-3.5 text-sm font-bold text-white transition hover:bg-jp-blue-700 disabled:cursor-wait disabled:opacity-60">{loadingMore?"Carregando…":"Ver mais"}</button></div>}
     {result.cityPartners.length>0&&result.origin.city&&<section className="mt-10" aria-labelledby="city-partners-title">
      <div className="flex flex-wrap items-end justify-between gap-3 border-t border-jp-blue-100 pt-8"><div>
       <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Sem distância calculada</p>
       <h2 id="city-partners-title" className="mt-2 font-display text-2xl font-bold text-jp-blue-900">Outros parceiros em {result.origin.city}</h2>
       <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-500">Endereços informados pela JP Pereira. A distância até eles não é calculada; use “Abrir no Google Maps” para ver a rota.</p>
      </div><span className="rounded-full bg-jp-blue-50 px-3 py-1.5 text-xs font-bold text-jp-blue-700">{result.cityPartners.length} {result.cityPartners.length===1?"parceiro":"parceiros"}</span></div>
      <ul className="mt-5 grid gap-4 sm:grid-cols-2">{result.cityPartners.map(point=><li key={point.id} className="rounded-2xl border border-jp-blue-100 bg-white p-5">
       <h3 className="font-display text-base font-bold text-jp-blue-900">{point.name}</h3>
       
       <p className="mt-2 text-sm leading-relaxed text-slate-600">{point.address}<br/>{point.city} – {point.state} · CEP {point.postalCode.slice(0,5)}-{point.postalCode.slice(5)}</p>
       <div className="mt-4"><a href={point.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-jp-red-600 hover:underline">Abrir no Google Maps<ArrowIcon className="h-4 w-4"/></a></div>
      </li>)}</ul>
     </section>}
     {!localDemo&&<p className="mt-5 text-xs text-slate-500">Consulte a disponibilidade dos produtos no estabelecimento antes de sair.</p>}
    </div>:!error&&<div className="rounded-3xl border border-dashed border-jp-blue-200 bg-white/70 px-6 py-14 text-center sm:py-20">
     <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-jp-blue-50 text-jp-blue-600"><PinIcon className="h-8 w-8"/></span><h2 className="mt-5 font-display text-2xl font-bold text-jp-blue-900">Encontre seu próximo destino</h2><p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-500">Faça uma busca para ver os pontos cadastrados e escolher a melhor rota para chegar.</p>
    </div>}
   <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-jp-blue-100 pt-6 text-sm"><p className="text-slate-500">Quer levar a JP Pereira para o seu negócio?</p><Link href="/revenda" className="inline-flex min-h-11 items-center gap-2 font-bold text-jp-blue-700">Seja um revendedor<ArrowIcon className="h-4 w-4"/></Link></div>
  </div>
 </section>;
}

