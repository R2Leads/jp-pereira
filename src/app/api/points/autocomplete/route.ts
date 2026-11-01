import { apiError, json, readJson } from "@/lib/locator/http";
import { autocompleteAddress } from "@/lib/locator/geocoding";
import { assertLocalRequest, assertSameOrigin, takeRateLimit } from "@/lib/locator/security";
import { LocatorError } from "@/lib/locator/domain";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 try{
  assertLocalRequest(request,process.env.DEMO_LOCAL_ONLY==="true");assertSameOrigin(request);
  if(!takeRateLimit("public-autocomplete",120,60000)) throw new LocatorError("Aguarde um instante antes de tentar novamente.",429,"RATE_LIMITED");
  const body=await readJson(request);
  if(typeof body.query!=="string") throw new LocatorError("Informe um endereço para buscar sugestões.");
  const query=body.query.trim();
  if(query.length>300||/[\u0000-\u001f]/.test(query)) throw new LocatorError("Confira o endereço informado.");
  if(query.length<3) return json({options:[]});
  return json({options:await autocompleteAddress(query)});
 }catch(error){return apiError(error);}
}
