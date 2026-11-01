import { sql } from "drizzle-orm";
import { healthCheckResponse } from "./health-diagnostics";

export const dynamic = "force-dynamic";

export async function GET() {
  return healthCheckResponse(async () => {
    const { db } = await import("@/db");
    await db.execute(sql`select 1`);
  });
}
