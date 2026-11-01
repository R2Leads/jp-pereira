"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
export default function AdminLogin(){
 const router=useRouter();const[error,setError]=useState("");const[busy,setBusy]=useState(false);
 async function login(event:FormEvent<HTMLFormElement>){
  event.preventDefault();setBusy(true);setError("");
  const data=new FormData(event.currentTarget);
  try{
   const response=await fetch("/api/admin/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username:data.get("username"),password:data.get("password")})});
   const body=await response.json();if(!response.ok)throw new Error(body.error);
   router.replace("/admin/pontos-de-venda");router.refresh();
  }catch(error){setError(error instanceof Error?error.message:"Não foi possível entrar.");}
  finally{setBusy(false);}
 }
 return <form onSubmit={login} className="mt-7 space-y-5">
  {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{error}</p>}
  <div><label htmlFor="username" className="text-sm font-semibold text-jp-blue-900">Usuário</label><input id="username" name="username" required maxLength={80} autoComplete="username" className="locator-input mt-2"/></div>
  <div><label htmlFor="password" className="text-sm font-semibold text-jp-blue-900">Senha</label><input id="password" name="password" type="password" required maxLength={256} autoComplete="current-password" className="locator-input mt-2"/></div>
  <button disabled={busy} className="locator-primary w-full">{busy?"Entrando…":"Entrar"}</button>
 </form>;
}

