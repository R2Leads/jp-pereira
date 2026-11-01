import { requireAdmin } from "@/lib/locator/session";
import { apiError, json, readJson } from "@/lib/locator/http";
import { createPoint, listPoints } from "@/lib/locator/service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request){
 try{await requireAdmin(request);return json({points:await listPoints(),geocodingConfigured:Boolean(process.env.GEOAPIFY_API_KEY?.trim()),localDemo:process.env.DEMO_LOCAL_ONLY==="true"});}
 catch(error){return apiError(error);}
}
export async function POST(request:Request){
 try{await requireAdmin(request,true);return json({point:await createPoint(await readJson(request))},201);}
 catch(error){return apiError(error);}
}

