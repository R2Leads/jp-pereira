import { writeFile } from "node:fs/promises";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Defina DATABASE_URL para exportar os dados.");
  process.exit(1);
}

const pool = new Pool({ connectionString });

const COLUMNS = [
  "id",
  "version",
  "seed_key",
  "name",
  "address",
  "city",
  "state",
  "postal_code",
  "phone",
  "whatsapp",
  "latitude",
  "longitude",
  "geocode_status",
  "geocode_label",
  "geocode_confidence",
  "geocode_precision",
  "geocode_source",
  "geocode_error",
  "confirmed_at",
  "active",
  "city_listing_visible",
  "is_demo",
  "created_at",
  "updated_at",
  "deleted_at",
];

function literal(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  if (value instanceof Date) return `'${value.toISOString()}'`;
  return `'${String(value).replaceAll("'", "''")}'`;
}

async function main() {
  const { rows } = await pool.query(
    `SELECT ${COLUMNS.join(", ")} FROM locator_points
     WHERE seed_key IS NULL OR seed_key NOT LIKE 'demo-%'
     ORDER BY id`
  );

  const lines = [];
  lines.push("-- Dados reais de parceiros JP Pereira para o banco de produção.");
  lines.push("-- Gerado a partir do banco local homologado. Não contém os 6 exemplos ilustrativos.");
  lines.push(`-- Registros: ${rows.length}`);
  lines.push("");
  lines.push("BEGIN;");
  lines.push("");

  for (const row of rows) {
    const values = COLUMNS.map((column) =>
      column === "is_demo" ? "false" : literal(row[column])
    );
    lines.push(
      `INSERT INTO locator_points (${COLUMNS.join(", ")}) VALUES (${values.join(", ")}) ON CONFLICT (id) DO NOTHING;`
    );
  }

  lines.push("");
  lines.push(
    "SELECT setval(pg_get_serial_sequence('locator_points', 'id'), COALESCE((SELECT MAX(id) FROM locator_points), 1));"
  );
  lines.push("COMMIT;");
  lines.push("");

  const target = new URL("../db/dados-producao.sql", import.meta.url);
  await writeFile(target, lines.join("\n"), "utf8");
  console.log(`Exportados ${rows.length} registros para db/dados-producao.sql`);
}

main()
  .catch((error) => {
    console.error("Falha ao exportar:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
