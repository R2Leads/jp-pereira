import type { Metadata } from "next";
import CatalogExplorer from "@/components/CatalogExplorer";
import { brands, categories, products } from "@/lib/content";

export const metadata: Metadata = {
  title: "Produtos",
  description:
    "Explore o catálogo completo da JPPereira: granolas, sementes, farinhas, aveias, mel, ervas e muito mais.",
};

type Props = {
  searchParams: Promise<{ categoria?: string; marca?: string; q?: string }>;
};

export default async function ProdutosPage({ searchParams }: Props) {
  const { categoria = "", marca = "", q = "" } = await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-jp-honey">
          Catálogo
        </p>
        <h1 className="mt-2 font-display text-4xl font-extrabold text-jp-blue-900">
          Nossos Produtos
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-600">
          Busque pelo nome ou toque em uma categoria — os resultados aparecem
          na hora, sem precisar aplicar filtros.
        </p>
      </div>

      <div className="mt-10">
        <CatalogExplorer
          key={`${categoria}|${marca}|${q}`}
          products={products}
          categories={categories}
          brands={brands}
          initialCategory={categoria}
          initialBrand={marca}
          initialQuery={q}
        />
      </div>
    </div>
  );
}
