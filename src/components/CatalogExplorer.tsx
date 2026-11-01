"use client";

import { useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard";
import type { Brand, CategorySummary, Product } from "@/lib/content";

type Props = {
  products: Product[];
  categories: CategorySummary[];
  brands: Brand[];
  initialCategory?: string;
  initialBrand?: string;
  initialQuery?: string;
};

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

/**
 * Exploração do catálogo sem botão "Filtrar": busca instantânea e
 * categorias/marcas como atalhos de navegação de um toque.
 */
export default function CatalogExplorer({
  products,
  categories,
  brands,
  initialCategory = "",
  initialBrand = "",
  initialQuery = "",
}: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState(initialBrand);

  const syncUrl = (next: { q?: string; categoria?: string; marca?: string }) => {
    const params = new URLSearchParams();
    const q = next.q ?? query;
    const c = next.categoria ?? category;
    const b = next.marca ?? brand;
    if (q) params.set("q", q);
    if (c) params.set("categoria", c);
    if (b) params.set("marca", b);
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `/produtos?${qs}` : "/produtos");
  };

  const filtered = useMemo(() => {
    const q = normalize(query.trim());
    return products.filter((p) => {
      if (category && !p.categories.some((c) => c.slug === category)) return false;
      if (brand && p.brand?.slug !== brand) return false;
      if (q) {
        const haystack = normalize(
          `${p.name} ${p.categories.map((c) => c.name).join(" ")} ${p.brand?.name ?? ""}`
        );
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [products, query, category, brand]);

  const activeCategory = categories.find((c) => c.slug === category);
  const hasFilters = Boolean(query || category || brand);

  return (
    <div>
      {/* Busca */}
      <div className="relative mx-auto max-w-2xl">
        <svg
          className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-jp-blue-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            syncUrl({ q: e.target.value });
          }}
          placeholder="Buscar por nome, categoria ou marca… ex.: granola, chia, mel"
          aria-label="Buscar produtos"
          className="w-full rounded-full border border-jp-blue-100 bg-white py-4 pl-13 pr-5 text-sm shadow-sm outline-none transition placeholder:text-jp-blue-300 focus:border-jp-blue-400 focus:ring-4 focus:ring-jp-blue-100"
          style={{ paddingLeft: "3.25rem" }}
        />
      </div>

      {/* Categorias: um toque aplica, outro remove */}
      <div className="jp-scroll-x mt-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-2 sm:flex-wrap sm:justify-center">
          <button
            type="button"
            onClick={() => {
              setCategory("");
              syncUrl({ categoria: "" });
            }}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              !category
                ? "bg-jp-blue-600 text-white shadow"
                : "border border-jp-blue-100 bg-white text-jp-blue-800 hover:border-jp-blue-300"
            }`}
          >
            Todos <span className="opacity-60">({products.length})</span>
          </button>
          {categories.map((c) => {
            const active = category === c.slug;
            return (
              <button
                key={c.slug}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  const next = active ? "" : c.slug;
                  setCategory(next);
                  syncUrl({ categoria: next });
                }}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-jp-blue-600 text-white shadow"
                    : "border border-jp-blue-100 bg-white text-jp-blue-800 hover:border-jp-blue-300"
                }`}
              >
                <span aria-hidden className="mr-1">{c.icon}</span>
                {c.name} <span className="opacity-60">({c.count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Marcas */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-jp-blue-400">
          Marca:
        </span>
        {brands.map((b) => {
          const active = brand === b.slug;
          return (
            <button
              key={b.slug}
              type="button"
              aria-pressed={active}
              onClick={() => {
                const next = active ? "" : b.slug;
                setBrand(next);
                syncUrl({ marca: next });
              }}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                active
                  ? "bg-jp-red-500 text-white shadow"
                  : "border border-jp-blue-100 bg-white text-jp-blue-700 hover:border-jp-red-500 hover:text-jp-red-500"
              }`}
            >
              {b.name}
            </button>
          );
        })}
      </div>

      {/* Resumo + limpar */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-jp-blue-700" role="status" aria-live="polite">
          <strong className="font-bold">{filtered.length}</strong>{" "}
          {filtered.length === 1 ? "produto" : "produtos"}
          {activeCategory ? (
            <> em <strong className="font-bold">{activeCategory.name}</strong></>
          ) : null}
          {query ? <> para “{query}”</> : null}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("");
              setBrand("");
              window.history.replaceState(null, "", "/produtos");
            }}
            className="text-sm font-semibold text-jp-red-500 underline-offset-4 hover:underline"
          >
            Limpar tudo
          </button>
        )}
      </div>

      {/* Grade */}
      {filtered.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-3xl border border-dashed border-jp-blue-200 bg-white p-12 text-center">
          <p className="text-4xl" aria-hidden>🔍</p>
          <h3 className="mt-3 text-lg font-bold text-jp-blue-900">
            Nenhum produto encontrado
          </h3>
          <p className="mt-1 text-sm text-jp-blue-700">
            Tente outra palavra ou remova os filtros ativos.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("");
              setBrand("");
              window.history.replaceState(null, "", "/produtos");
            }}
            className="mt-5 rounded-full bg-jp-blue-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-jp-blue-700"
          >
            Ver catálogo completo
          </button>
        </div>
      )}
    </div>
  );
}
