import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/content";

export default function ProductCard({ product }: { product: Product }) {
  const category = product.categories[0];
  return (
    <Link
      href={`/produtos/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-jp-blue-100/70 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-jp-blue-200 hover:shadow-lg"
    >
      <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-white p-5">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            width={400}
            height={400}
            className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-4xl" aria-hidden>🥣</span>
        )}
        {product.brand && (
          <span className="absolute left-3 top-3 rounded-full bg-jp-blue-50 px-2.5 py-1 text-[11px] font-bold text-jp-blue-700">
            {product.brand.name}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 border-t border-jp-blue-50 px-4 py-4">
        {category && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-jp-honey">
            {category.name}
          </span>
        )}
        <h3 className="text-sm font-bold leading-snug text-jp-blue-900 group-hover:text-jp-blue-600">
          {product.name}
        </h3>
        <span className="mt-auto pt-2 text-xs font-semibold text-jp-red-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          Ver detalhes →
        </span>
      </div>
    </Link>
  );
}
