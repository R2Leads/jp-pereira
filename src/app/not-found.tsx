import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <p className="text-6xl" aria-hidden>🕊️</p>
      <h1 className="mt-6 font-display text-3xl font-extrabold text-jp-blue-900">
        Página não encontrada
      </h1>
      <p className="mt-3 text-slate-600">
        O conteúdo que você procura não existe ou foi movido.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-jp-blue-600 px-7 py-3 text-sm font-bold text-white transition hover:bg-jp-blue-700"
        >
          Voltar ao início
        </Link>
        <Link
          href="/produtos"
          className="rounded-full border-2 border-jp-blue-200 px-7 py-3 text-sm font-bold text-jp-blue-800 transition hover:border-jp-blue-400"
        >
          Ver produtos
        </Link>
      </div>
    </div>
  );
}
