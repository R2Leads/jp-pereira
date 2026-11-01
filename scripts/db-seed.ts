import { assertDemoDatabase } from "./local-db-guard";
import { pool, db } from "../src/db";
import { locatorPoints } from "../src/db/schema";
import { DEMO_POINTS } from "../src/lib/locator/demo-data";
async function main() {
  assertDemoDatabase();
  let inserted=0;
  for (const [index, point] of DEMO_POINTS.entries()) {
    const rows=await db.insert(locatorPoints).values({...point,seedKey:"demo-"+index,phone:"",whatsapp:"",
      active:true,isDemo:true,geocodeStatus:"confirmed",geocodeSource:"demo",geocodePrecision:"demo",
      geocodeLabel:point.address+", "+point.city+" - "+point.state+" · localização ilustrativa",confirmedAt:new Date()})
      .onConflictDoNothing({target:locatorPoints.seedKey}).returning({id:locatorPoints.id});
    inserted+=rows.length;
  }
  console.log("Dados ilustrativos preparados. Novos registros: "+inserted+". Registros existentes preservados.");
}
main().catch(() => { console.error("Falha ao preparar os exemplos no banco local."); process.exitCode=1; }).finally(() => pool.end());

