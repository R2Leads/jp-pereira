import { NextResponse } from "next/server";
import { LocatorError } from "./domain";
export function json(data: unknown, status=200) {
 return NextResponse.json(data,{status,headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
}
export function apiError(error: unknown) {
 if(error instanceof LocatorError) return json({error:error.message,code:error.code},error.status);
 return json({error:"Não foi possível acessar os dados agora. Confira se o banco local está em execução.",code:"SERVICE_UNAVAILABLE"},503);
}
export async function readJson(request:Request):Promise<Record<string,unknown>> {
 if(!request.headers.get("content-type")?.includes("application/json")) throw new LocatorError("Envie os dados no formato esperado.",415);
 const text=await request.text();
 if(text.length>12000) throw new LocatorError("O cadastro enviado é muito grande.",413);
 try{
  const body:unknown=JSON.parse(text);
  if(!body || typeof body!=="object" || Array.isArray(body)) throw new Error();
  return body as Record<string,unknown>;
 }catch{throw new LocatorError("Dados enviados inválidos.");}
}

