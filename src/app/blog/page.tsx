import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import { articles } from "@/lib/content";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Artigos sobre alimentação saudável, alimentos integrais e bem-estar, do blog da JPPereira.",
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-jp-honey">
          Conteúdo
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold text-jp-blue-900">
          Nosso Blog
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Dicas e informações sobre alimentos naturais e uma vida mais saudável.
        </p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {articles.map((a, i) => (
          <Reveal key={a.id} delay={i * 60}>
            <Link
              href={`/blog/${a.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-jp-blue-100/70 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              {a.cover && (
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={a.cover}
                    alt={a.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 320px"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <time className="text-xs font-semibold text-slate-400" dateTime={a.date}>
                  {formatDate(a.date)}
                </time>
                <h2 className="mt-2 font-display text-lg font-extrabold leading-snug text-jp-blue-900 group-hover:text-jp-blue-600">
                  {a.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm text-slate-600">{a.excerpt}</p>
                <span className="mt-auto pt-4 text-sm font-bold text-jp-red-500">
                  Ler artigo →
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
