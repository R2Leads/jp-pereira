import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import { brands, productsByBrand } from "@/lib/content";

export const metadata: Metadata = {
  title: "Nossas Marcas",
  description:
    "Conheça as marcas da JPPereira: JPPereira, Naturabem e D'Laiz.",
};

export default function MarcasPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-jp-honey">
          Portfólio
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold text-jp-blue-900">
          Nossas Marcas
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Uma família de marcas dedicadas a levar alimentos naturais para a sua mesa.
        </p>
      </div>

      <div className="mt-12 space-y-8">
        {brands.map((b, i) => {
          const brandProducts = productsByBrand(b.slug);
          return (
            <Reveal key={b.slug} delay={i * 60}>
              <div className="grid items-center gap-8 rounded-3xl border border-jp-blue-100/70 bg-white p-8 shadow-sm sm:p-10 lg:grid-cols-[auto_1fr_auto]">
                <Image
                  src={b.logo}
                  alt={`Logotipo ${b.name}`}
                  width={140}
                  height={140}
                  className="mx-auto h-28 w-28 rounded-full object-contain lg:mx-0"
                />
                <div className="text-center lg:text-left">
                  <h2 className="font-display text-2xl font-extrabold text-jp-blue-900">
                    {b.name}
                  </h2>
                  {b.tagline && (
                    <p className="mt-1 text-sm font-bold text-jp-red-500">{b.tagline}</p>
                  )}
                  {b.description ? (
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
                      {b.description}
                    </p>
                  ) : (
                    <p className="mt-3 max-w-2xl text-sm italic leading-relaxed text-slate-400">
                      {b.pendingNote}
                    </p>
                  )}
                  <p className="mt-3 text-xs font-bold uppercase tracking-wider text-jp-honey">
                    {brandProducts.length}{" "}
                    {brandProducts.length === 1 ? "produto" : "produtos"} no catálogo
                  </p>
                </div>
                <div className="flex justify-center lg:justify-end">
                  <Link
                    href={`/marcas/${b.slug}`}
                    className="rounded-full bg-jp-blue-600 px-7 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-jp-blue-700"
                  >
                    Ver produtos
                  </Link>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
