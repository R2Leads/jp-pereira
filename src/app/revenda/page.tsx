import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import ContactForm from "@/components/ContactForm";
import { company } from "@/lib/content";

export const metadata: Metadata = {
  title: "Revenda",
  description:
    "Aumente suas vendas com os produtos JPPereira. Preencha o formulário e entraremos em contato.",
};

export default function RevendaPage() {
  return (
    <>
      <section className="bg-jp-blue-800 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-widest text-jp-honey">
              Para o seu negócio
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
              {company.resale.headline}
            </h1>
            <div className="mx-auto mt-6 max-w-2xl space-y-2 text-lg text-jp-blue-100">
              <p>{company.resale.lines[0]}</p>
              <p className="font-bold text-white">{company.resale.lines[1]}</p>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="rounded-3xl border border-jp-blue-100/70 bg-white p-6 shadow-sm sm:p-10">
            <h2 className="font-display text-2xl font-extrabold text-jp-blue-900">
              Fale com nossa equipe comercial
            </h2>
            <p className="mt-2 text-sm text-slate-600">{company.resale.lines[2]}</p>
            <div className="mt-8">
              <ContactForm origin="revenda" showCompany />
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
