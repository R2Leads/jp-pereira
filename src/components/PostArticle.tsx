import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/lib/content";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export default function PostArticle({ post }: { post: Post }) {
  const isRecipe = post.type === "receita";
  const backHref = isRecipe ? "/receitas" : "/blog";
  const backLabel = isRecipe ? "Receitas" : "Blog";

  return (
    <article className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <nav aria-label="Localização" className="text-sm text-slate-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/" className="hover:text-jp-blue-600">Início</Link></li>
          <li aria-hidden>›</li>
          <li><Link href={backHref} className="hover:text-jp-blue-600">{backLabel}</Link></li>
          <li aria-hidden>›</li>
          <li className="font-semibold text-jp-blue-900">{post.title}</li>
        </ol>
      </nav>

      <header className="mt-8">
        <p className="text-xs font-bold uppercase tracking-widest text-jp-honey">
          {isRecipe ? "Receita" : "Artigo"} · {formatDate(post.date)}
        </p>
        <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight text-jp-blue-900 sm:text-4xl">
          {post.title}
        </h1>
      </header>

      {post.cover && (
        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-3xl shadow-md">
          <Image
            src={post.cover}
            alt={post.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-cover"
          />
        </div>
      )}

      <div
        className="jp-prose mt-10"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <footer className="mt-12 rounded-3xl bg-jp-sand/70 p-8 text-center">
        <h2 className="font-display text-xl font-extrabold text-jp-blue-900">
          Gostou? Conheça os produtos que inspiram este conteúdo.
        </h2>
        <Link
          href="/produtos"
          className="mt-5 inline-block rounded-full bg-jp-blue-600 px-7 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-jp-blue-700"
        >
          Explorar o catálogo
        </Link>
      </footer>
    </article>
  );
}
