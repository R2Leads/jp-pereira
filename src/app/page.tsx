import Link from "next/link";
import Image from "next/image";
import Reveal from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import AcquaScrollExperience from "@/components/AcquaScrollExperience";
import {
  brands,
  categories,
  company,
  products,
  recipes,
  articles,
} from "@/lib/content";

const HIGHLIGHT_SLUGS = [
  "granola-tradicional-500g",
  "granola-graos-nobres-500g",
  "granola-banana-e-mel-250g",
  "mel-silvestre-500g",
  "semente-de-chia",
  "acucar-mascavo-500g",
  "granola-zero-adcao-de-acucar-350g",
  "farinha-de-linhaca-dourada",
];

export default function HomePage() {
  const highlights = HIGHLIGHT_SLUGS.map((slug) =>
    products.find((p) => p.slug === slug)
  ).filter((p): p is NonNullable<typeof p> => Boolean(p));

  return (
    <>
      {/* ================ EXPERIÊNCIA ACQUA NATURABEM ================ */}
      <AcquaScrollExperience />

      {/* ================= APRESENTAÇÃO INSTITUCIONAL ================= */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-24">
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full bg-jp-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-jp-blue-700">
              <span aria-hidden>🕊️</span> Distribuindo Saúde
            </p>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-tight text-jp-blue-900 sm:text-5xl lg:text-6xl">
              Alimentos naturais para o seu{" "}
              <span className="text-jp-red-500">dia a dia</span>
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              Granolas, sementes, farinhas, mel e muito mais: são mais de 70
              produtos em marca própria, pensados para uma alimentação com mais
              nutrição e equilíbrio.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/produtos"
                className="rounded-full bg-jp-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-jp-blue-700 hover:shadow-lg"
              >
                Explorar o catálogo
              </Link>
              <Link
                href="/empresa"
                className="rounded-full border-2 border-jp-blue-200 bg-white px-7 py-3.5 text-sm font-bold text-jp-blue-800 transition hover:-translate-y-0.5 hover:border-jp-blue-400"
              >
                Conhecer a empresa
              </Link>
            </div>
          </Reveal>
          <Reveal delay={150} className="relative">
            <div className="jp-float relative mx-auto aspect-[4/3] w-full max-w-xl overflow-hidden rounded-[2.5rem] shadow-2xl shadow-jp-blue-900/10">
              <Image
                src="/images/hero-granola.jpg"
                alt="Tigela de granola com mel, aveia e sementes"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="absolute -bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-lg lg:-left-6 lg:bottom-10 lg:translate-x-0">
              <span className="text-2xl" aria-hidden>🌾</span>
              <div>
                <p className="text-sm font-extrabold text-jp-blue-900">+70 produtos</p>
                <p className="text-xs text-slate-500">em marca própria</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= CATEGORIAS ================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-jp-honey">
              Navegue por categoria
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-jp-blue-900">
              O que você procura hoje?
            </h2>
          </div>
          <Link
            href="/produtos"
            className="text-sm font-bold text-jp-red-500 underline-offset-4 hover:underline"
          >
            Ver catálogo completo →
          </Link>
        </Reveal>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((c, i) => (
            <Reveal key={c.slug} delay={i * 40}>
              <Link
                href={`/produtos?categoria=${c.slug}`}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-jp-blue-100/70 bg-white px-4 py-6 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-jp-blue-300 hover:shadow-md"
              >
                <span className="text-3xl transition-transform duration-300 group-hover:scale-110" aria-hidden>
                  {c.icon}
                </span>
                <span className="text-sm font-bold text-jp-blue-900">{c.name}</span>
                <span className="text-xs text-slate-400">
                  {c.count} {c.count === 1 ? "produto" : "produtos"}
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= DESTAQUES ================= */}
      <section className="bg-jp-sand/60 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-jp-honey">
              Direto da nossa linha
            </p>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-jp-blue-900">
              Destaques do catálogo
            </h2>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {highlights.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
          <Reveal className="mt-10 text-center">
            <Link
              href="/produtos"
              className="inline-block rounded-full bg-jp-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-jp-blue-700"
            >
              Ver todos os {products.length} produtos
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ================= MARCAS ================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <Reveal className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-jp-honey">
            Nossas marcas
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold text-jp-blue-900">
            Uma família de marcas, um só propósito
          </h2>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {brands.map((b, i) => (
            <Reveal key={b.slug} delay={i * 80}>
              <Link
                href={`/marcas/${b.slug}`}
                className="group flex h-52 items-center justify-center rounded-3xl border border-jp-blue-100/70 bg-white p-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-jp-blue-600"
              >
                <Image
                  src={b.logo}
                  alt={`Logotipo ${b.name}`}
                  width={240}
                  height={240}
                  className={`${b.slug === "dlaiz" ? "h-36 w-36" : "h-44 w-44"} object-contain transition-transform duration-300 group-hover:scale-105`}
                />
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ================= CONTEÚDOS ================= */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            {/* Receitas */}
            <Reveal>
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-extrabold text-jp-blue-900">
                  Receitas deliciosas
                </h2>
                <Link href="/receitas" className="text-sm font-bold text-jp-red-500 underline-offset-4 hover:underline">
                  Ver todas →
                </Link>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {recipes.slice(0, 2).map((r) => (
                  <Link
                    key={r.id}
                    href={`/receitas/${r.slug}`}
                    className="group overflow-hidden rounded-2xl border border-jp-blue-100/70 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                  >
                    {r.cover && (
                      <div className="relative aspect-[16/10] overflow-hidden">
                        <Image
                          src={r.cover}
                          alt={r.title}
                          fill
                          sizes="(max-width: 640px) 100vw, 300px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="text-sm font-bold leading-snug text-jp-blue-900 group-hover:text-jp-blue-600">
                        {r.title}
                      </h3>
                    </div>
                  </Link>
                ))}
              </div>
            </Reveal>

            {/* Blog */}
            <Reveal delay={100}>
              <div className="flex items-end justify-between gap-4">
                <h2 className="font-display text-2xl font-extrabold text-jp-blue-900">
                  Nosso blog
                </h2>
                <Link href="/blog" className="text-sm font-bold text-jp-red-500 underline-offset-4 hover:underline">
                  Ver todos →
                </Link>
              </div>
              <div className="mt-6 space-y-4">
                {articles.slice(0, 3).map((a) => (
                  <Link
                    key={a.id}
                    href={`/blog/${a.slug}`}
                    className="group flex gap-4 rounded-2xl border border-jp-blue-100/70 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {a.cover && (
                      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-xl">
                        <Image
                          src={a.cover}
                          alt={a.title}
                          fill
                          sizes="112px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex flex-col justify-center">
                      <h3 className="text-sm font-bold leading-snug text-jp-blue-900 group-hover:text-jp-blue-600">
                        {a.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">{a.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ================= REVENDA CTA ================= */}
      <section className="bg-jp-blue-800 py-16 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-widest text-jp-honey">
              Para o seu negócio
            </p>
            <h2 className="mt-3 font-display text-3xl font-extrabold sm:text-4xl">
              {company.resale.headline}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-jp-blue-100">
              {company.resale.lines[0]} {company.resale.lines[1]}
            </p>
            <Link
              href="/revenda"
              className="mt-8 inline-block rounded-full bg-jp-red-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-jp-red-600"
            >
              Quero revender
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
