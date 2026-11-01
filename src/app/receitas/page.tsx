import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import { recipes } from "@/lib/content";

export const metadata: Metadata = {
  title: "Receitas",
  description:
    "Receitas deliciosas e saudáveis preparadas com os produtos JPPereira.",
};

export default function ReceitasPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-jp-honey">
          Mão na massa
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold text-jp-blue-900">
          Nossas Receitas
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Ideias práticas e saborosas para aproveitar os produtos JPPereira no
          seu dia a dia.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {recipes.map((r, i) => (
          <Reveal key={r.id} delay={i * 60}>
            <Link
              href={`/receitas/${r.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-jp-blue-100/70 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {r.cover && (
                <div className="relative aspect-square overflow-hidden">
                  <Image
                    src={r.cover}
                    alt={r.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-jp-honey">
                  Receita
                </span>
                <h2 className="mt-2 font-display text-lg font-extrabold leading-snug text-jp-blue-900 group-hover:text-jp-blue-600">
                  {r.title}
                </h2>
                <span className="mt-auto pt-4 text-sm font-bold text-jp-red-500">
                  Ver receita →
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
