import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/locator/session";
import AdminLogin from "@/components/locator/AdminLogin";
import { PinIcon } from "@/components/locator/Icons";
export const metadata:Metadata={title:"Acesso administrativo",robots:{index:false,follow:false}};
export const dynamic="force-dynamic";
export default async function Login(){
 if(await isAdmin())redirect("/admin/pontos-de-venda");
 return <section className="mx-auto max-w-md px-4 py-14 sm:py-20">
  <div className="rounded-3xl border border-jp-blue-100 bg-white p-7 shadow-sm sm:p-9"><PinIcon className="h-9 w-9 text-jp-red-500"/><p className="mt-5 text-xs font-bold uppercase tracking-wider text-jp-blue-600">Área administrativa</p><h1 className="mt-2 font-display text-2xl font-bold text-jp-blue-900">Pontos de venda</h1><p className="mt-3 text-sm leading-relaxed text-slate-500">Entre para gerenciar os estabelecimentos cadastrados.</p><AdminLogin/></div>
 </section>;
}

