import type { Metadata } from "next";
import StoreLocator from "@/components/locator/StoreLocator";
import DemoBanner from "@/components/locator/DemoBanner";
import { PinIcon } from "@/components/locator/Icons";
export const metadata:Metadata={title:"Onde comprar",description:"Compre os produtos JP Pereira online pelo TikTok Shop ou encontre o ponto de venda mais próximo usando o seu CEP."};
const TIKTOK_URL="https://www.tiktok.com/@jppereirasaudaveis";
const highlights=[
 {title:"Frete pela plataforma",text:"Envio e rastreio direto pelo TikTok Shop."},
 {title:"Cupons e lives",text:"Ofertas exclusivas durante as transmissões."},
 {title:"Loja oficial",text:"Produtos originais direto da JP Pereira."},
];
export const dynamic="force-dynamic";
export default function OndeComprar(){
 const localDemo=process.env.DEMO_LOCAL_ONLY==="true";
 return <>
  {localDemo&&<DemoBanner/>}
  <section className="bg-jp-blue-900 text-white">
   <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 pb-16 pt-12 sm:px-6 sm:pb-20 lg:px-8">
    <div className="max-w-2xl">
     <p className="text-xs font-bold uppercase tracking-[0.18em] text-jp-honey">Onde comprar</p>
     <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">Um ponto de venda<br className="hidden sm:block"/> mais perto de você.</h1>
     <p className="mt-5 max-w-xl text-base leading-relaxed text-jp-blue-100 sm:text-lg">Informe seu endereço ou CEP e encontre os pontos cadastrados, do mais próximo ao mais distante, além dos parceiros da sua cidade.</p>
    </div>
    <div className="hidden h-32 w-32 shrink-0 items-center justify-center rounded-full border border-jp-blue-600 bg-jp-blue-800 sm:flex"><PinIcon className="h-16 w-16 text-jp-honey"/></div>
   </div>
  </section>
  <section className="bg-jp-cream pb-20 pt-10 sm:pt-12">
   <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <div className="relative overflow-hidden rounded-[2rem] bg-[#0d0d12] p-6 text-white shadow-xl shadow-jp-blue-900/10 sm:p-10">
     <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[#25f4ee]/25 blur-3xl" aria-hidden/>
     <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-[#fe2c55]/25 blur-3xl" aria-hidden/>
     <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
      <div className="max-w-xl">
       <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#0d0d12]">
         <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor" aria-hidden><path d="M16.6 5.82A5.83 5.83 0 0 1 15.1 2h-3v13.2a2.62 2.62 0 1 1-2.62-2.62c.27 0 .53.04.78.12V9.6a5.72 5.72 0 0 0-.78-.05A5.65 5.65 0 1 0 15.1 15.2V9.01a8.7 8.7 0 0 0 5.06 1.61V7.55a5.82 5.82 0 0 1-3.56-1.73Z"/></svg>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/80"><span className="h-1.5 w-1.5 rounded-full bg-[#25f4ee]" aria-hidden/>Canal oficial</span>
       </div>
       <h2 className="mt-5 font-display text-3xl font-extrabold leading-tight sm:text-4xl">Compre online pelo TikTok Shop</h2>
       <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">A loja JP Pereira no TikTok reúne as granolas, sementes, farinhas e mel da nossa linha. Aproveite cupons e condições especiais durante as lives.</p>
       <a href={TIKTOK_URL} target="_blank" rel="noreferrer noopener" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-extrabold text-[#0d0d12] transition hover:-translate-y-0.5 hover:bg-white/90">Abrir loja no TikTok<svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M7 17 17 7M9 7h8v8"/></svg></a>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3 lg:w-[320px] lg:grid-cols-1">{highlights.map(item=><li key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"><span className="block h-1.5 w-8 rounded-full bg-[#25f4ee]" aria-hidden/><p className="mt-2 text-sm font-bold text-white">{item.title}</p><p className="mt-0.5 text-xs leading-relaxed text-white/60">{item.text}</p></li>)}</ul>
     </div>
    </div>
   </div>
  </section>
  <StoreLocator localDemo={localDemo} freeSearch={Boolean(process.env.GEOAPIFY_API_KEY?.trim())}/>
 </>;
}

