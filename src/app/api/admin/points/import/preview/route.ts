import { requireAdmin } from "@/lib/locator/session";
import { apiError, json } from "@/lib/locator/http";
import { listPoints } from "@/lib/locator/service";
import { previewImportRows } from "@/lib/locator/import";
import { readImportSpreadsheet, readSpreadsheetUpload } from "@/lib/locator/spreadsheet";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request) {
 try{
  await requireAdmin(request,true);
  const rows=await readImportSpreadsheet(await readSpreadsheetUpload(request));
  return json({rows:previewImportRows(rows,await listPoints())});
 }catch(error){return apiError(error);}
}
