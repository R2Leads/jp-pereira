import Link from "next/link";
import Image from "next/image";
import { company, categories } from "@/lib/content";

export default function SiteFooter() {
  return (
    <footer className="bg-jp-blue-900 text-jp-blue-100">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="inline-block rounded-2xl bg-white p-3">
            <Image
              src="/images/brands/logo-jppereira.png"
              alt="JPPereira – Distribuindo Saúde"
              width={140}
              height={60}
              className="h-12 w-auto"
            />
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-jp-blue-200">
            {company.slogan}. Mais de 70 produtos em marca própria para uma
            alimentação natural e equilibrada.
          </p>
        </div>

        <nav aria-label="Institucional">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Institucional
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/empresa" className="hover:text-white">Quem somos</Link></li>
            <li><Link href="/marcas" className="hover:text-white">Nossas marcas</Link></li>
            <li><Link href="/onde-comprar" className="hover:text-white">Onde comprar</Link></li>
            <li><Link href="/revenda" className="hover:text-white">Seja um revendedor</Link></li>
            <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link href="/receitas" className="hover:text-white">Receitas</Link></li>
            <li><Link href="/contato" className="hover:text-white">Contato</Link></li>
          </ul>
        </nav>

        <nav aria-label="Categorias de produtos">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Produtos
          </h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link href="/produtos" className="font-semibold hover:text-white">
                Catálogo completo
              </Link>
            </li>
            {categories.slice(0, 6).map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/produtos?categoria=${c.slug}`}
                  className="hover:text-white"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">
            Atendimento
          </h3>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed">
            <li>{company.address}</li>
            <li>
              <a href={`tel:+551532171785`} className="hover:text-white">
                {company.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${company.email}`} className="hover:text-white">
                {company.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-jp-blue-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 text-xs text-jp-blue-300 sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} JPPereira. Todos os direitos reservados.</p>
          <p>Distribuindo Saúde</p>
        </div>
      </div>
    </footer>
  );
}
