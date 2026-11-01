"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Início" },
  { href: "/empresa", label: "A Empresa" },
  { href: "/marcas", label: "Marcas" },
  { href: "/produtos", label: "Produtos" },
  { href: "/onde-comprar", label: "Onde Comprar" },
  { href: "/receitas", label: "Receitas" },
  { href: "/blog", label: "Blog" },
  { href: "/revenda", label: "Revenda" },
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-jp-blue-100/60 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex shrink-0 items-center gap-2"
          aria-label="JPPereira – página inicial"
        >
          <Image
            src="/images/brands/logo-jppereira.png"
            alt="JPPereira – Distribuindo Saúde"
            width={150}
            height={64}
            priority
            className="h-10 w-auto lg:h-12"
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3.5 py-2 text-sm font-semibold transition-colors ${
                isActive(item.href)
                  ? "bg-jp-blue-600 text-white"
                  : "text-jp-blue-800 hover:bg-jp-blue-50"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/contato"
            className="ml-2 rounded-full bg-jp-red-500 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-jp-red-600"
          >
            Contato
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-jp-blue-100 text-jp-blue-800 lg:hidden"
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 top-0 h-0.5 w-5 rounded bg-current transition-transform ${open ? "top-1/2 -translate-y-1/2 rotate-45" : ""}`}
            />
            <span
              className={`absolute left-0 top-1/2 h-0.5 w-5 -translate-y-1/2 rounded bg-current transition-opacity ${open ? "opacity-0" : ""}`}
            />
            <span
              className={`absolute bottom-0 left-0 h-0.5 w-5 rounded bg-current transition-transform ${open ? "bottom-1/2 translate-y-1/2 -rotate-45" : ""}`}
            />
          </span>
        </button>
      </div>

      {/* Menu mobile */}
      {open && (
        <nav
          className="border-t border-jp-blue-100/60 bg-white px-4 pb-6 pt-3 lg:hidden"
          aria-label="Navegação principal (móvel)"
        >
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-xl px-4 py-3 text-base font-semibold ${
                    isActive(item.href)
                      ? "bg-jp-blue-600 text-white"
                      : "text-jp-blue-800 hover:bg-jp-blue-50"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/contato"
                onClick={() => setOpen(false)}
                className="mt-2 block rounded-xl bg-jp-red-500 px-4 py-3 text-center text-base font-bold text-white"
              >
                Contato
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
