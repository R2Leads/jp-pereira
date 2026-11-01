import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { assertDemoDatabase } from "./scripts/local-db-guard";

config({ path: ".env.local", quiet: true });
assertDemoDatabase();

// O CLI prioriza este arquivo sobre o JSON legado do template.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./migrations/generated",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
