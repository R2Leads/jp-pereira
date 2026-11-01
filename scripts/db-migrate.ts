import { readFile } from "node:fs/promises";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Defina DATABASE_URL antes de rodar a migração.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function main() {
  for (const file of [
    "0001_locator.sql",
    "0002_demo_contact.sql",
    "0003_city_listing.sql",
  ]) {
    const sql = await readFile(new URL("../migrations/" + file, import.meta.url), "utf8");
    await pool.query(sql);
    console.log(`Aplicado: ${file}`);
  }
  console.log("Estrutura de produção pronta.");
}

main()
  .catch((error) => {
    console.error("Falha na migração:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
