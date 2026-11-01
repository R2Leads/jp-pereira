import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import ContactForm from "@/components/ContactForm";
import { company } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Entre em contato com a JPPereira: telefone, e-mail e formulário de atendimento.",
};

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-jp-honey">
          Atendimento
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold text-jp-blue-900">
          Entre em Contato
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Dúvidas, sugestões ou interesse nos nossos produtos? Fale com a gente.
        </p>
      </div>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
        <Reveal>
          <div className="flex h-full flex-col gap-4">
            <div className="rounded-3xl border border-jp-blue-100/70 bg-white p-7 shadow-sm">
              <span className="text-2xl" aria-hidden>📍</span>
              <h2 className="mt-3 font-display text-lg font-extrabold text-jp-blue-900">
                Endereço
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {company.address}
              </p>
            </div>
            <div className="rounded-3xl border border-jp-blue-100/70 bg-white p-7 shadow-sm">
              <span className="text-2xl" aria-hidden>📞</span>
              <h2 className="mt-3 font-display text-lg font-extrabold text-jp-blue-900">
                Telefone
              </h2>
              <a
                href="tel:+551532171785"
                className="mt-1 block text-sm font-semibold text-jp-blue-600 hover:underline"
              >
                {company.phone}
              </a>
            </div>
            <div className="rounded-3xl border border-jp-blue-100/70 bg-white p-7 shadow-sm">
              <span className="text-2xl" aria-hidden>✉️</span>
              <h2 className="mt-3 font-display text-lg font-extrabold text-jp-blue-900">
                E-mail
              </h2>
              <a
                href={`mailto:${company.email}`}
                className="mt-1 block text-sm font-semibold text-jp-blue-600 hover:underline"
              >
                {company.email}
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="rounded-3xl border border-jp-blue-100/70 bg-white p-6 shadow-sm sm:p-10">
            <h2 className="font-display text-2xl font-extrabold text-jp-blue-900">
              Envie sua mensagem
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Responderemos pelo e-mail informado.
            </p>
            <div className="mt-8">
              <ContactForm origin="contato" />
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
