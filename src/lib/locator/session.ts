import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { LocatorError } from "./domain";
import { assertLocalRequest, assertSameOrigin } from "./security";
type AdminSession={admin?:boolean;credentialVersion?:string};
export function credentialVersion() {return createHash("sha256").update(process.env.ADMIN_PASSWORD_HASH??"").digest("hex");}
export async function adminSession() {
 const secret=process.env.SESSION_SECRET??"";
 if(secret.length<32) throw new LocatorError("O acesso administrativo ainda não foi configurado nesta máquina.",503,"AUTH_NOT_CONFIGURED");
 return getIronSession<AdminSession>(await cookies(),{
  password:secret,cookieName:"jp_locator_admin",ttl:8*60*60,
  cookieOptions:{httpOnly:true,sameSite:"strict",secure:process.env.DEMO_LOCAL_ONLY!=="true",path:"/"},
 });
}
export async function isAdmin() {
 const session=await adminSession();
 return session.admin===true && session.credentialVersion===credentialVersion();
}
export async function requireAdmin(request:Request,write=false) {
 assertLocalRequest(request,process.env.DEMO_LOCAL_ONLY==="true");
 if(write) assertSameOrigin(request);
 if(!await isAdmin()) throw new LocatorError("Entre na área administrativa para continuar.",401,"UNAUTHORIZED");
}

