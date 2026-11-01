import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import { getProduct, products } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription.replace(/<[^>]+>/g, "").slice(0, 160),
  };
}

export default async function ProdutoPage({ params }: Props) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  const mainCategory = product.categories[0];
  const related = products
    .filter(
      (p) =>
        p.id !== product.id &&
        mainCategory &&
        p.categories.some((c) => c.slug === mainCategory.slug)
    )
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      {/* Breadcrumb */}
      <nav aria-label="Localização" className="text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-jp-blue-600">Início</Link></li>
          <li aria-hidden>›</li>
          <li><Link href="/produtos" className="hover:text-jp-blue-600">Produtos</Link></li>
          {mainCategory && (
            <>
              <li aria-hidden>›</li>
              <li>
                <Link
                  href={`/produtos?categoria=${mainCategory.slug}`}
                  className="hover:text-jp-blue-600"
                >
                  {mainCategory.name}
                </Link>
              </li>
            </>
          )}
          <li aria-hidden>›</li>
          <li className="font-semibold text-jp-blue-900">{product.name}</li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* Imagens */}
        <Reveal>
          <div className="rounded-3xl border border-jp-blue-100/70 bg-white p-8 shadow-sm">
            {product.images[0] ? (
              <Image
                src={product.images[0]}
                alt={product.name}
                width={700}
                height={700}
                priority
                className="mx-auto aspect-square w-full max-w-md object-contain"
              />
            ) : (
              <div className="flex aspect-square items-center justify-center text-6xl">🥣</div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {product.images.slice(1).map((img) => (
                <div
                  key={img}
                  className="rounded-2xl border border-jp-blue-100/70 bg-white p-2"
                >
                  <Image
                    src={img}
                    alt={`${product.name} – imagem adicional`}
                    width={160}
                    height={160}
                    className="aspect-square w-full object-contain"
                  />
                </div>
              ))}
            </div>
          )}
        </Reveal>

        {/* Informações */}
        <Reveal delay={100}>
          <div className="flex flex-wrap items-center gap-2">
            {product.brand && (
              <Link
                href={`/marcas/${product.brand.slug}`}
                className="rounded-full bg-jp-blue-50 px-3 py-1 text-xs font-bold text-jp-blue-700 hover:bg-jp-blue-100"
              >
                {product.brand.name}
              </Link>
            )}
            {product.categories.map((c) => (
              <Link
                key={c.slug}
                href={`/produtos?categoria=${c.slug}`}
                className="rounded-full bg-jp-sand px-3 py-1 text-xs font-bold text-jp-blue-800 hover:bg-jp-honey/30"
              >
                {c.name}
              </Link>
            ))}
          </div>

          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-jp-blue-900 sm:text-4xl">
            {product.name}
          </h1>

          {product.shortDescription && (
            <div
              className="jp-prose mt-4 text-lg"
              dangerouslySetInnerHTML={{ __html: product.shortDescription }}
            />
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/contato"
              className="rounded-full bg-jp-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-jp-blue-700"
            >
              Fale com a gente sobre este produto
            </Link>
            <Link
              href="/revenda"
              className="rounded-full border-2 border-jp-blue-200 px-7 py-3.5 text-sm font-bold text-jp-blue-800 transition hover:-translate-y-0.5 hover:border-jp-blue-400"
            >
              Quero revender
            </Link>
          </div>
        </Reveal>
      </div>

      {/* Descrição completa */}
      {product.description && (
        <Reveal className="mt-14">
          <div className="rounded-3xl border border-jp-blue-100/70 bg-white p-6 shadow-sm sm:p-10">
            <h2 className="font-display text-xl font-extrabold text-jp-blue-900">
              Sobre o produto
            </h2>
            <div
              className="jp-prose mt-4"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        </Reveal>
      )}

      {/* Relacionados */}
      {related.length > 0 && (
        <section className="mt-16">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-extrabold text-jp-blue-900">
              Você também pode gostar
            </h2>
            {mainCategory && (
              <Link
                href={`/produtos?categoria=${mainCategory.slug}`}
                className="text-sm font-bold text-jp-red-500 underline-offset-4 hover:underline"
              >
                Ver mais {mainCategory.name.toLowerCase()} →
              </Link>
            )}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
