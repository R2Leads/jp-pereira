import { requireAdmin } from "@/lib/locator/session";
import { apiError, json, readJson } from "@/lib/locator/http";
import { importPoint } from "@/lib/locator/service";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request) {
 try{
  await requireAdmin(request,true);
  const body=await readJson(request);
  const result=await importPoint(body.point);
  return json(result,result.status==="imported"?201:200);
 }catch(error){return apiError(error);}
}
