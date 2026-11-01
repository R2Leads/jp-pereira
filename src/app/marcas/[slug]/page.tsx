import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { brands, getBrand, productsByBrand } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return brands.map((b) => ({ slug: b.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) return {};
  return {
    title: `${brand.name} – Marca`,
    description: brand.description ?? `Produtos da marca ${brand.name}.`,
  };
}

export default async function MarcaPage({ params }: Props) {
  const { slug } = await params;
  const brand = getBrand(slug);
  if (!brand) notFound();

  const brandProducts = productsByBrand(brand.slug);

  return (
    <>
      <section className="bg-white py-14">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <Reveal>
            <Image
              src={brand.logo}
              alt={`Logotipo ${brand.name}`}
              width={150}
              height={150}
              priority
              className="mx-auto h-32 w-32 rounded-full object-contain shadow-md"
            />
            <h1 className="mt-6 font-display text-4xl font-extrabold text-jp-blue-900">
              {brand.name}
            </h1>
            {brand.tagline && (
              <p className="mt-2 text-lg font-bold text-jp-red-500">{brand.tagline}</p>
            )}
            {brand.description ? (
              <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-slate-600">
                {brand.description}
              </p>
            ) : (
              <p className="mx-auto mt-4 max-w-2xl text-sm italic text-slate-400">
                {brand.pendingNote}
              </p>
            )}
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-2xl font-extrabold text-jp-blue-900">
            Produtos {brand.name}{" "}
            <span className="text-base font-semibold text-slate-400">
              ({brandProducts.length})
            </span>
          </h2>
          <Link
            href={`/produtos?marca=${brand.slug}`}
            className="text-sm font-bold text-jp-red-500 underline-offset-4 hover:underline"
          >
            Explorar com busca e categorias →
          </Link>
        </div>

        {brandProducts.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {brandProducts.map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 50}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-slate-500">
            Nenhum produto desta marca está publicado no momento.
          </p>
        )}
      </section>
    </>
  );
}
