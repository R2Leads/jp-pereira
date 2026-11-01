import { readFile } from "node:fs/promises";
import { assertDemoDatabase } from "./local-db-guard";
import { pool } from "../src/db";
async function main() {
  assertDemoDatabase();
  for(const file of ["0001_locator.sql","0002_demo_contact.sql","0003_city_listing.sql"]){
    await pool.query(await readFile(new URL("../migrations/"+file, import.meta.url), "utf8"));
  }
  console.log("Tabelas do localizador e dos formulários preparadas no banco isolado.");
}
main().catch(() => { console.error("Falha ao preparar o banco local. Confira se o contêiner está saudável e a configuração local está preenchida."); process.exitCode=1; }).finally(() => pool.end());

