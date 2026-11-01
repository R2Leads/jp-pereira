import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { db } = await import("@/db");
    await db.execute(sql`select 1`);
    const apiKey = (process.env.GEOAPIFY_API_KEY || "").trim();
    let geoStatus = "unset";
    let geoError = null;
    if (apiKey) {
      try {
        const res = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=teste&filter=countrycode:br&apiKey=${apiKey}`, { cache: "no-store" });
        geoStatus = res.ok ? "ok" : `http_${res.status}`;
        if (!res.ok) geoError = (await res.text()).slice(0, 300);
      } catch (e: any) {
        geoStatus = "fetch_failed";
        geoError = e?.message || String(e);
      }
    }
    return NextResponse.json({
      ok: true,
      geoapify: {
        hasKey: Boolean(apiKey),
        keyLength: apiKey.length,
        status: geoStatus,
        error: geoError,
      }
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message }, { status: 500 });
  }
}
