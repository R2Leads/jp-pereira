import { requireAdmin } from "@/lib/locator/session";
import { apiError } from "@/lib/locator/http";
import { createImportTemplate } from "@/lib/locator/spreadsheet";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function GET(request:Request) {
 try{
  await requireAdmin(request);
  return new Response(new Uint8Array(await createImportTemplate()),{headers:{
   "Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
   "Content-Disposition":'attachment; filename="modelo-parceiros-jp-pereira.xlsx"',
   "Cache-Control":"no-store","X-Content-Type-Options":"nosniff",
  }});
 }catch(error){return apiError(error);}
}
