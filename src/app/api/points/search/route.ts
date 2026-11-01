import { apiError, json, readJson } from "@/lib/locator/http";
import { listCityPartners, locateOrigin, searchPoints } from "@/lib/locator/service";
import { assertLocalRequest, assertSameOrigin, takeRateLimit } from "@/lib/locator/security";
import { LocatorError } from "@/lib/locator/domain";
import { parseSearchOffset, parseSearchRadius } from "@/lib/locator/results";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export async function POST(request:Request){
 try{
  assertLocalRequest(request,process.env.DEMO_LOCAL_ONLY==="true");assertSameOrigin(request);
  if(!takeRateLimit("public-search",60,60000)) throw new LocatorError("Aguarde um minuto antes de fazer uma nova busca.",429,"RATE_LIMITED");
  const body=await readJson(request);
  const radiusKm=parseSearchRadius(body.radiusKm);
  const offset=parseSearchOffset(body.offset);
  const origin=await locateOrigin(body);
  const [page,cityPartners]=await Promise.all([
    searchPoints(origin.latitude,origin.longitude,radiusKm,offset),
    listCityPartners(origin.city,origin.state),
  ]);
  return json({origin,radiusKm,...page,cityPartners});
 }catch(error){return apiError(error);}
}

