import {mkdir,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {pool} from "../src/db";
import {listPoints,pointAction} from "../src/lib/locator/service";
import {LocatorError,validCoordinates} from "../src/lib/locator/domain";
import {assertDemoDatabase} from "./local-db-guard";

// Operação pontual autorizada pela usuária: usar as coordenadas do serviço,
// dispensando a conferência manual. Sem --apply, apenas informa o escopo.
async function main(){
 assertDemoDatabase();
 const apply=process.argv.includes("--apply");
 const lock=await pool.connect();let acquired=false;
 try{
  const result=await lock.query<{locked:boolean}>("select pg_try_advisory_lock(hashtextextended('jp-pereira-geocode-pending',0)) as locked");
  acquired=result.rows[0].locked;
  if(!acquired)throw new LocatorError("Outro lote está em andamento.",409,"BATCH_ALREADY_RUNNING");
  const before=await listPoints();
  const targets=before.filter(point=>!point.deletedAt&&!point.active&&validCoordinates(point.latitude,point.longitude)&&["needs_review","confirmed"].includes(point.geocodeStatus));
  const pending=before.filter(point=>!point.deletedAt&&!validCoordinates(point.latitude,point.longitude));
  console.log(JSON.stringify({mode:apply?"apply":"preview",eligible:targets.length,alreadyActive:before.filter(point=>!point.deletedAt&&point.active).length,pendingWithoutLocation:pending.length,trash:before.filter(point=>point.deletedAt).length}));
  if(!apply)return;
  const directory=join(process.cwd(),".demo","activation-runs",new Date().toISOString().replace(/[:.]/g,"-"));
  await mkdir(directory,{recursive:true});
  await writeFile(join(directory,"before.json"),JSON.stringify(before,null,2),{flag:"wx"});
  const report={authorization:"Ativar os pontos com as coordenadas encontradas, sem conferência manual, conforme solicitação da usuária nesta conversa.",activated:0,conflicts:0,failed:0,pendingWithoutLocation:pending.map(point=>point.id),results:[] as {id:number;status:string;code?:string}[]};
  for(const original of targets){
   try{
    const saved=await pointAction(original.id,original.geocodeStatus==="needs_review"?"confirm":"activate",original.version);
    if(!saved.active)throw new Error("ACTIVATION_FAILED");
    report.activated++;report.results.push({id:saved.id,status:"active"});
   }catch(error){
    const code=error instanceof LocatorError?error.code:"ACTIVATION_FAILED";
    if(code==="STALE_POINT")report.conflicts++;else report.failed++;
    report.results.push({id:original.id,status:"skipped",code});
   }
   await writeFile(join(directory,"report.json"),JSON.stringify(report,null,2));
  }
  const after=await listPoints(),byId=new Map(after.map(point=>[point.id,point]));
  const mutable=new Set(["active","geocodeStatus","confirmedAt","version","updatedAt"]);
  const unchanged=before.every(original=>{
   const saved=byId.get(original.id);
   return saved&&Object.keys(original).filter(key=>!mutable.has(key)).every(key=>JSON.stringify(original[key as keyof typeof original])===JSON.stringify(saved[key as keyof typeof saved]));
  });
  const validation={total:after.length,active:after.filter(point=>!point.deletedAt&&point.active).length,pending:after.filter(point=>!point.deletedAt&&point.geocodeStatus==="error").length,trash:after.filter(point=>point.deletedAt).length,businessFieldsAndCoordinatesPreserved:unchanged,invalidActive:after.filter(point=>point.active&&(!validCoordinates(point.latitude,point.longitude)||point.geocodeStatus!=="confirmed"||point.deletedAt)).length};
  await writeFile(join(directory,"validation.json"),JSON.stringify(validation,null,2));
  console.log(JSON.stringify({activated:report.activated,conflicts:report.conflicts,failed:report.failed,...validation,reportDirectory:directory}));
 }finally{
  if(acquired)await lock.query("select pg_advisory_unlock(hashtextextended('jp-pereira-geocode-pending',0))");
  lock.release();
 }
}
try{await main();}catch(error){console.error(JSON.stringify({error:error instanceof LocatorError?error.code:"ACTIVATION_FAILED"}));process.exitCode=1;}finally{await pool.end();}
