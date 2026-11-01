import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/locator/session";
import AdminPoints from "@/components/locator/AdminPoints";
import DemoBanner from "@/components/locator/DemoBanner";
import { listPoints } from "@/lib/locator/service";
import type { ClientPoint } from "@/lib/locator/client-types";
export const metadata:Metadata={title:"Gerenciar pontos de venda",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function Admin(){
 if(!await isAdmin())redirect("/admin/login");
 let points:ClientPoint[]=[];let initialError="";
 try{points=JSON.parse(JSON.stringify(await listPoints()));}catch{initialError="Não foi possível acessar os cadastros. Confira se o banco local está em execução e clique em Atualizar.";}
 const localDemo=process.env.DEMO_LOCAL_ONLY==="true";
 return <>{localDemo&&<DemoBanner/>}<AdminPoints initialPoints={points} initialError={initialError} localDemo={localDemo} freeSearch={Boolean(process.env.GEOAPIFY_API_KEY?.trim())}/></>;
}

