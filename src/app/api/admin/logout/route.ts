import { adminSession } from "@/lib/locator/session";
import { assertLocalRequest, assertSameOrigin } from "@/lib/locator/security";
import { apiError, json } from "@/lib/locator/http";
export async function POST(request:Request){
 try{assertLocalRequest(request,process.env.DEMO_LOCAL_ONLY==="true");assertSameOrigin(request);const session=await adminSession();session.destroy();return json({ok:true});}
 catch(error){return apiError(error);}
}

