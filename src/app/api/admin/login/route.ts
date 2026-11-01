import { apiError, json, readJson } from "@/lib/locator/http";
import { LocatorError } from "@/lib/locator/domain";
import { adminSession, credentialVersion } from "@/lib/locator/session";
import { assertLocalRequest, assertSameOrigin, takeRateLimit, verifyPassword } from "@/lib/locator/security";
export const runtime="nodejs";
export async function POST(request:Request) {
 try{
  assertLocalRequest(request,process.env.DEMO_LOCAL_ONLY==="true"); assertSameOrigin(request);
  if(!takeRateLimit("admin-login",10,15*60*1000)) throw new LocatorError("Muitas tentativas. Aguarde quinze minutos antes de tentar novamente.",429,"RATE_LIMITED");
  const body=await readJson(request);
  if(typeof body.username!=="string" || typeof body.password!=="string" || body.password.length>256) throw new LocatorError("Confira o usuário e a senha.",401,"INVALID_LOGIN");
  const valid=await verifyPassword(body.password,process.env.ADMIN_PASSWORD_HASH??"");
  if(!valid || body.username!==process.env.ADMIN_USERNAME) throw new LocatorError("Confira o usuário e a senha.",401,"INVALID_LOGIN");
  const session=await adminSession(); session.admin=true; session.credentialVersion=credentialVersion(); await session.save();
  return json({ok:true});
 }catch(error){return apiError(error);}
}

