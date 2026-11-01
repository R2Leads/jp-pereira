import { requireAdmin } from "@/lib/locator/session";
import { apiError, json, readJson } from "@/lib/locator/http";
import { pointAction, updatePoint } from "@/lib/locator/service";
import { LocatorError } from "@/lib/locator/domain";
type Context={params:Promise<{id:string}>};
export const runtime="nodejs";
function idValue(raw:string){if(!/^[1-9]\d*$/.test(raw)) throw new LocatorError("Ponto de venda inválido.");return Number(raw);}
export async function PATCH(request:Request,context:Context){
 try{await requireAdmin(request,true);const id=idValue((await context.params).id);const body=await readJson(request);
  if(typeof body.version!=="number" || typeof body.action!=="string") throw new LocatorError("Atualize o cadastro e tente novamente.");
  const point=body.action==="update"?await updatePoint(id,body.point,body.version):await pointAction(id,body.action,body.version);
  return json({point});
 }catch(error){return apiError(error);}
}
export async function DELETE(request:Request,context:Context){
 try{await requireAdmin(request,true);const body=await readJson(request);if(typeof body.version!=="number")throw new LocatorError("Atualize o cadastro e tente novamente.");
  return json({point:await pointAction(idValue((await context.params).id),"trash",body.version)});
 }catch(error){return apiError(error);}
}

