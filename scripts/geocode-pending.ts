import {mkdir,writeFile} from "node:fs/promises";
import {join} from "node:path";
import {setTimeout as delay} from "node:timers/promises";
import {pool} from "../src/db";
import {listPoints,pointAction} from "../src/lib/locator/service";
import {geocodeAddress} from "../src/lib/locator/geocoding";
import {LocatorError} from "../src/lib/locator/domain";
import {assertDemoDatabase} from "./local-db-guard";

// Uso local: tsx --env-file=.env.local scripts/geocode-pending.ts [--apply]
// Sem --apply, apenas informa o escopo. Nenhuma confirmação/ativação é feita.
async function main(){
 assertDemoDatabase();
 const targets=(await listPoints()).filter(point=>!point.deletedAt&&!point.active&&point.geocodeStatus==="error");
 const configured=Boolean(process.env.GEOAPIFY_API_KEY?.trim());
 const apply=process.argv.includes("--apply");
 console.log(JSON.stringify({mode:apply?"apply":"preview",pending:targets.length,geocodingConfigured:configured}));
 if(!apply||targets.length===0)return;
 if(!configured)throw new LocatorError("Configure o serviço antes de consultar os endereços.",503,"GEOCODER_NOT_CONFIGURED");

 const lock=await pool.connect();let acquired=false;
 try{
  const result=await lock.query<{locked:boolean}>("select pg_try_advisory_lock(hashtextextended('jp-pereira-geocode-pending',0)) as locked");
  acquired=result.rows[0].locked;
  if(!acquired)throw new LocatorError("Já existe uma consulta em lote em andamento.",409,"BATCH_ALREADY_RUNNING");
  // Uma consulta conhecida valida a conexão antes de alterar qualquer cadastro.
  await geocodeAddress("18010000");
  console.log(JSON.stringify({preflight:"ok"}));
  const directory=join(process.cwd(),".demo","geocoding-runs",new Date().toISOString().replace(/[:.]/g,"-"));
  await mkdir(directory,{recursive:true});
  await writeFile(join(directory,"before.json"),JSON.stringify(targets,null,2),{flag:"wx"});
  let stopping=false;
  const stop=()=>{stopping=true;};process.once("SIGINT",stop);process.once("SIGTERM",stop);
  const report={total:targets.length,processed:0,located:0,notLocated:0,conflicts:0,failed:0,interrupted:false,results:[] as {id:number;status:string;code?:string;precision?:string|null;confidence?:number|null}[]};
  let serviceFailures=0;
  try{
   for(const original of targets){
    if(stopping){report.interrupted=true;break;}
    // No máximo uma consulta por segundo, além do tempo de resposta do serviço.
    await delay(1000);
    try{
     const saved=await pointAction(original.id,"geocode",original.version);
     if(saved.geocodeStatus==="needs_review"){
      report.located++;serviceFailures=0;
      report.results.push({id:saved.id,status:"needs_review",precision:saved.geocodePrecision,confidence:saved.geocodeConfidence});
     }else{
      report.notLocated++;
      const unavailable=saved.geocodeError?.startsWith("Não foi possível consultar o endereço agora.")===true;
      serviceFailures=unavailable?serviceFailures+1:0;
      report.results.push({id:saved.id,status:"error",code:unavailable?"GEOCODER_UNAVAILABLE":"ADDRESS_NOT_FOUND"});
     }
    }catch(error){
     const code=error instanceof LocatorError?error.code:"SERVICE_UNAVAILABLE";
     if(code==="STALE_POINT")report.conflicts++;else report.failed++;
     report.results.push({id:original.id,status:"skipped",code});
     if(!(error instanceof LocatorError))serviceFailures++;
    }
    report.processed++;
    if(serviceFailures>=3){report.interrupted=true;stopping=true;}
    await writeFile(join(directory,"report.json"),JSON.stringify(report,null,2));
    if(report.processed%10===0||stopping)console.log(JSON.stringify({processed:report.processed,total:report.total,located:report.located,notLocated:report.notLocated,conflicts:report.conflicts,failed:report.failed,interrupted:report.interrupted}));
   }
  }finally{
   process.removeListener("SIGINT",stop);process.removeListener("SIGTERM",stop);
   await writeFile(join(directory,"report.json"),JSON.stringify(report,null,2));
  }
  console.log(JSON.stringify({done:!report.interrupted,processed:report.processed,total:report.total,located:report.located,notLocated:report.notLocated,conflicts:report.conflicts,failed:report.failed,reportPath:join(directory,"report.json")}));
 }finally{
  if(acquired)await lock.query("select pg_advisory_unlock(hashtextextended('jp-pereira-geocode-pending',0))");
  lock.release();
 }
}
try{await main();}catch(error){console.error(JSON.stringify({error:error instanceof LocatorError?error.code:"BATCH_FAILED"}));process.exitCode=1;}finally{await pool.end();}
