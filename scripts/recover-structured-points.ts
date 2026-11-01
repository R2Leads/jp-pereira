import {mkdir,readFile,writeFile,rename} from "node:fs/promises";
import {join,resolve,sep} from "node:path";
import {setTimeout as delay} from "node:timers/promises";
import {pool} from "../src/db";
import type {LocatorPoint} from "../src/db/schema";
import {listPoints,pointAction} from "../src/lib/locator/service";
import {LocatorError,validCoordinates,type GeocodeResult} from "../src/lib/locator/domain";
import {fetchGeoapify,geocodeAddress} from "../src/lib/locator/geocoding";
import {createStructuredGeocoder} from "../src/lib/locator/structured-geocoding";
import {assertDemoDatabase} from "./local-db-guard";
import {completedQueryIds,completedApplicationIds,upsertCheckpoint} from "./recovery-checkpoint";

type Attempt={id:number;status:"accepted"|"rejected"|"temporary_error";result?:GeocodeResult;code?:string;message?:string;attempts:number;candidates:unknown[]};
type Applied={id:number;status:"active"|"conflict"|"failed";code?:string};
type Report={total:number;sampleIds:number[];interrupted:boolean;results:Attempt[];applied:Applied[]};
const pointer=join(process.cwd(),".demo","structured-current-run.json");
async function checkpoint(directory:string,report:Report){
 const file=join(directory,"report.json");await writeFile(file+".tmp",JSON.stringify(report,null,2));await rename(file+".tmp",file);
}
const evenly=(points:LocatorPoint[],count:number)=>Array.from({length:Math.min(count,points.length)},(_,i)=>points[Math.floor(i*points.length/Math.min(count,points.length))]);
const errorCode=(error:unknown)=>error instanceof LocatorError?error.code:"BATCH_FAILED";

async function main(){
 assertDemoDatabase();
 const mode=process.argv[2];if(!["--sample","--continue","--apply"].includes(mode))throw new Error("Use --sample, --continue ou --apply.");
 const lock=await pool.connect();let acquired=false;
 try{
  acquired=(await lock.query<{locked:boolean}>("select pg_try_advisory_lock(hashtextextended('jp-pereira-geocode-pending',0)) as locked")).rows[0].locked;
  if(!acquired)throw new LocatorError("Já existe outro lote em andamento.",409,"BATCH_ALREADY_RUNNING");
  let directory:string,before:LocatorPoint[],report:Report;
  if(mode==="--sample"){
   const all=await listPoints();before=all.filter(point=>!point.deletedAt&&!point.active&&point.geocodeStatus==="error");
   directory=join(process.cwd(),".demo","structured-runs",new Date().toISOString().replace(/[:.]/g,"-"));await mkdir(directory,{recursive:true});
   await writeFile(join(directory,"all-before.json"),JSON.stringify(all,null,2),{flag:"wx"});
   await writeFile(join(directory,"before.json"),JSON.stringify(before,null,2),{flag:"wx"});
   const temporary=before.filter(point=>point.geocodeError?.startsWith("Não foi possível consultar"));
   const other=before.filter(point=>!temporary.some(item=>item.id===point.id));
   const sample=[...evenly(temporary,6),...evenly(other,14)];
   report={total:before.length,sampleIds:sample.map(point=>point.id),interrupted:false,results:[],applied:[]};
   await checkpoint(directory,report);await writeFile(pointer,JSON.stringify({directory}));
  }else{
   directory=resolve(JSON.parse(await readFile(pointer,"utf8")).directory);
   if(!directory.startsWith(resolve(process.cwd(),".demo","structured-runs")+sep))throw new Error("INVALID_RUN_DIRECTORY");
   before=JSON.parse(await readFile(join(directory,"before.json"),"utf8"));
   report=JSON.parse(await readFile(join(directory,"report.json"),"utf8"));
  }
  if(report.total!==before.length||new Set(report.results.map(item=>item.id)).size!==report.results.length||report.results.some(item=>!before.some(point=>point.id===item.id)))throw new Error("INVALID_CHECKPOINT");
  if(mode!=="--apply"){
   if(mode==="--continue"&&!report.results.some(item=>item.status==="accepted"))throw new Error("SAMPLE_WITHOUT_RECOVERY");
   await geocodeAddress("18010000");
   const already=completedQueryIds(report.results);
   const targets=before.filter(point=>!already.has(point.id)&&(mode!=="--sample"||report.sampleIds.includes(point.id)));
   console.log(JSON.stringify({mode,pending:targets.length,total:report.total,preflight:"ok",directory}));
   let stopping=false,serviceFailures=0;
   const stop=()=>{stopping=true;};process.once("SIGINT",stop);process.once("SIGTERM",stop);report.interrupted=false;
   try{
    for(const original of targets){
     if(stopping){report.interrupted=true;break;}
     const entry:Attempt={id:original.id,status:"rejected",attempts:0,candidates:[]};
     const geocode=createStructuredGeocoder({apiKey:process.env.GEOAPIFY_API_KEY?.trim()??"",fetcher:async(input,init)=>{
      const response=await fetchGeoapify(new URL(String(input)),init??{}),body=await response.json();
      const rows=body&&typeof body==="object"&&"results" in body&&Array.isArray(body.results)?body.results:[];
      entry.candidates=rows.map(row=>({city:row.city,state:row.state_code??row.state,county:row.county,countyCode:row.county_code,street:row.street,number:row.housenumber,postcode:row.postcode,precision:row.result_type,confidence:row.rank?.confidence}));
      return Response.json(body,{status:response.ok?200:503});
     }});
     for(let attempt=1;attempt<=2;attempt++){
      await delay(1000);entry.attempts=attempt;
      try{entry.result=await geocode(original);entry.status="accepted";delete entry.code;delete entry.message;break;}catch(error){
       entry.code=errorCode(error);entry.message=error instanceof LocatorError?error.message:"Falha na consulta estruturada.";
       entry.status=entry.code==="GEOCODER_UNAVAILABLE"?"temporary_error":"rejected";
       if(entry.status!=="temporary_error")break;
      }
     }
     report.results=upsertCheckpoint(report.results,entry);serviceFailures=entry.status==="temporary_error"?serviceFailures+1:0;
     if(serviceFailures>=3){report.interrupted=true;stopping=true;}
     await checkpoint(directory,report);
     if(report.results.length%5===0||stopping)console.log(JSON.stringify({queried:report.results.length,total:report.total,accepted:report.results.filter(item=>item.status==="accepted").length,temporary:report.results.filter(item=>item.status==="temporary_error").length,interrupted:report.interrupted}));
    }
   }finally{process.removeListener("SIGINT",stop);process.removeListener("SIGTERM",stop);await checkpoint(directory,report);}
   console.log(JSON.stringify({phase:mode,queried:report.results.length,total:report.total,accepted:report.results.filter(item=>item.status==="accepted").length,interrupted:report.interrupted,directory}));
   return;
  }
  if(report.interrupted||report.results.length!==report.total)throw new Error("QUERIES_NOT_COMPLETE");
  const completed=completedApplicationIds(report.applied);
  const targets=report.results.filter(item=>item.status==="accepted"&&!completed.has(item.id));
  console.log(JSON.stringify({mode,accepted:targets.length,total:report.total}));
  for(const entry of targets){
   const original=before.find(point=>point.id===entry.id)!,result=entry.result!;
   try{
    let point=(await listPoints()).find(point=>point.id===entry.id);
    if(!point||point.deletedAt)throw new LocatorError("Cadastro alterado.",409,"STALE_POINT");
    const same=point.latitude===result.latitude&&point.longitude===result.longitude&&point.geocodeLabel===result.label;
    if(point.active&&point.geocodeStatus==="confirmed"&&point.version===original.version+2&&same){report.applied=upsertCheckpoint<Applied>(report.applied,{id:entry.id,status:"active"});}
    else{
     if(point.version===original.version&&!point.active&&point.geocodeStatus==="error")point=await pointAction(point.id,"geocode",point.version,async()=>result);
     else if(!(point.version===original.version+1&&!point.active&&point.geocodeStatus==="needs_review"&&same))throw new LocatorError("Cadastro alterado.",409,"STALE_POINT");
     await pointAction(point.id,"confirm",point.version);report.applied=upsertCheckpoint<Applied>(report.applied,{id:entry.id,status:"active"});
    }
   }catch(error){const code=errorCode(error);report.applied=upsertCheckpoint<Applied>(report.applied,{id:entry.id,status:code==="STALE_POINT"?"conflict":"failed",code});}
   await checkpoint(directory,report);
  }
  const allBefore:LocatorPoint[]=JSON.parse(await readFile(join(directory,"all-before.json"),"utf8"));
  const after=await listPoints(),byId=new Map(after.map(point=>[point.id,point]));
  const fields=["name","address","city","state","postalCode","phone","whatsapp","isDemo","seedKey","createdAt","deletedAt"] as const;
  const changedBusiness=allBefore.filter(original=>fields.some(key=>JSON.stringify(original[key])!==JSON.stringify(byId.get(original.id)?.[key])));
  const activeBefore=allBefore.filter(point=>point.active&&!point.deletedAt);
  const activeChanged=activeBefore.filter(original=>JSON.stringify(original)!==JSON.stringify(byId.get(original.id)));
  const pending=after.filter(point=>!point.deletedAt&&point.geocodeStatus==="error");
  const validation={expected:allBefore.length,found:after.length,queried:report.results.length,recovered:report.applied.filter(item=>item.status==="active").length,conflicts:report.applied.filter(item=>item.status==="conflict").length,failed:report.applied.filter(item=>item.status==="failed").length,active:after.filter(point=>!point.deletedAt&&point.active).length,pending:pending.length,trash:after.filter(point=>point.deletedAt).length,businessFieldsPreserved:changedBusiness.length===0,preexistingActiveUnchanged:activeChanged.length===0,invalidActive:after.filter(point=>point.active&&(point.deletedAt||point.geocodeStatus!=="confirmed"||!validCoordinates(point.latitude,point.longitude))).length};
  await writeFile(join(directory,"validation.json"),JSON.stringify(validation,null,2));
  const safe=(value:unknown)=>String(value??"").replace(/[|<>\r\n]/g," ");
  const lines=["# Resultado da consulta estruturada",`\n${validation.recovered} parceiros recuperados e ativados. ${validation.active} ativos no total; ${pending.length} endereços ainda pendentes.`,"\nOs endereços originais foram preservados. Não foi utilizado centro de CEP, bairro ou cidade como localização do estabelecimento.","\n## Pendências","| ID | Parceiro | Endereço original | Cidade / UF | CEP | Motivo da consulta estruturada |","| --- | --- | --- | --- | --- | --- |",...pending.map(point=>{const entry=report.results.find(item=>item.id===point.id);return `| ${point.id} | ${safe(point.name)} | ${safe(point.address)} | ${safe(point.city)} / ${point.state} | ${point.postalCode} | ${safe(entry?.message??point.geocodeError)} |`;})];
  await writeFile(join(directory,"resultado.md"),lines.join("\n"));
  console.log(JSON.stringify({...validation,directory}));
 }finally{if(acquired)await lock.query("select pg_advisory_unlock(hashtextextended('jp-pereira-geocode-pending',0))");lock.release();}
}
try{await main();}catch(error){console.error(JSON.stringify({error:errorCode(error)}));process.exitCode=1;}finally{await pool.end();}
