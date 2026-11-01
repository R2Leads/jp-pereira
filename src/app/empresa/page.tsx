import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import { brands, company } from "@/lib/content";

export const metadata: Metadata = {
  title: "Quem Somos",
  description:
    "Conheça a história da JPPereira, empresa de alimentos naturais com mais de 70 produtos em marca própria.",
};

export default function EmpresaPage() {
  return (
    <>
      <section className="bg-jp-blue-800 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-widest text-jp-honey">
              Sobre nós
            </p>
            <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">
              Nossa História
            </h1>
            <blockquote className="mx-auto mt-6 max-w-2xl border-l-4 border-jp-honey pl-5 text-left text-lg italic leading-relaxed text-jp-blue-100">
              “{company.historyQuote}”
            </blockquote>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <Reveal>
          <div className="jp-prose text-base sm:text-lg">
            {company.history.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-12 grid gap-4 sm:grid-cols-3">
          {[
            { icon: "📅", title: "1958", text: "Sr. José Pereira inicia no ramo de produtos macrobióticos" },
            { icon: "🏭", title: "1995", text: "Nasce a distribuidora própria da família Pereira" },
            { icon: "🌾", title: "Hoje", text: "Mais de 70 produtos em marca própria" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-jp-blue-100/70 bg-white p-6 text-center shadow-sm"
            >
              <span className="text-3xl" aria-hidden>{item.icon}</span>
              <h3 className="mt-3 font-display text-xl font-extrabold text-jp-blue-900">
                {item.title}
              </h3>
              <p className="mt-1 text-sm text-slate-600">{item.text}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <h2 className="font-display text-3xl font-extrabold text-jp-blue-900">
              Nossas marcas
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {brands.map((b, i) => (
              <Reveal key={b.slug} delay={i * 80}>
                <Link
                  href={`/marcas/${b.slug}`}
                  className="group flex h-full flex-col items-center rounded-3xl border border-jp-blue-100/70 bg-jp-cream p-8 text-center transition duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <Image
                    src={b.logo}
                    alt={`Logotipo ${b.name}`}
                    width={110}
                    height={110}
                    className="h-22 w-22 rounded-full object-contain"
                  />
                  <h3 className="mt-4 text-lg font-extrabold text-jp-blue-900">{b.name}</h3>
                  <span className="mt-2 text-sm font-bold text-jp-blue-600 opacity-0 transition group-hover:opacity-100">
                    Conhecer →
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
