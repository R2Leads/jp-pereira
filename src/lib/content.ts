import productsData from "@/data/products.json";
import postsData from "@/data/posts.json";

export type Category = { slug: string; name: string };

export type Product = {
  id: number;
  slug: string;
  name: string;
  categories: Category[];
  brand: { slug: string; name: string } | null;
  shortDescription: string;
  description: string;
  images: string[];
};

export type Post = {
  id: number;
  slug: string;
  type: "receita" | "artigo";
  title: string;
  date: string;
  excerpt: string;
  content: string;
  cover: string | null;
};

export const products = productsData as Product[];
export const posts = postsData as Post[];

export const articles = posts.filter((p) => p.type === "artigo");
export const recipes = posts.filter((p) => p.type === "receita");

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}

// ---------------------------------------------------------------------------
// Categorias (derivadas do catálogo legado)
// ---------------------------------------------------------------------------
const CATEGORY_ICONS: Record<string, string> = {
  granolas: "🥣",
  "adocantes-naturais": "🍯",
  sementes: "🌱",
  graos: "🌾",
  oleos: "🫒",
  molhos: "🥫",
  aveias: "🌾",
  acucar: "🟤",
  ervas: "🧉",
  acessorios: "🪵",
  suplementos: "💊",
  farinha: "🥖",
};

export type CategorySummary = Category & { count: number; icon: string };

export const categories: CategorySummary[] = (() => {
  const map = new Map<string, CategorySummary>();
  for (const p of products) {
    for (const c of p.categories) {
      const cur = map.get(c.slug);
      if (cur) cur.count += 1;
      else map.set(c.slug, { ...c, count: 1, icon: CATEGORY_ICONS[c.slug] ?? "🛒" });
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
})();

export function getCategory(slug: string): CategorySummary | undefined {
  return categories.find((c) => c.slug === slug);
}

export function productsByCategory(slug: string): Product[] {
  return products.filter((p) => p.categories.some((c) => c.slug === slug));
}

// ---------------------------------------------------------------------------
// Marcas (conteúdo reaproveitado do site legado — nada inventado)
// ---------------------------------------------------------------------------
export type Brand = {
  slug: string;
  name: string;
  logo: string;
  tagline: string | null;
  description: string | null;
  pendingNote?: string;
};

export const brands: Brand[] = [
  {
    slug: "jppereira",
    name: "JPPereira",
    logo: "/images/brands/jppereira-redondo.png",
    tagline: "Distribuindo Saúde",
    // Texto institucional da home do site legado (seção "Produtos Integrais").
    description:
      "Temos uma linha completa de produtos 100% integrais que foi pensada para seu bem-estar! Fabricados com processos que preservam todas as partes do grão, mantendo seus nutrientes naturais. Ideal para quem busca mais nutrição e equilíbrio em sua alimentação.",
  },
  {
    slug: "naturabem",
    name: "Naturabem",
    logo: "/images/brands/naturabem-redondo.png",
    tagline: null,
    description:
      "Granolas que combinam cereais e sabores de frutas, com qualidade e praticidade para o café da manhã e os lanches.",
  },
  {
    slug: "dlaiz",
    name: "D'Laiz",
    logo: "/images/brands/dlaiz-redondo.png",
    tagline: null,
    description:
      "Parte da família JP Pereira, a D'Laiz oferece granolas com diferentes combinações de grãos e sabores, trazendo crocância e variedade para o dia a dia.",
  },
];

export function getBrand(slug: string): Brand | undefined {
  return brands.find((b) => b.slug === slug);
}

export function productsByBrand(slug: string): Product[] {
  return products.filter((p) => p.brand?.slug === slug);
}

// ---------------------------------------------------------------------------
// Dados institucionais (reaproveitados do site legado)
// ---------------------------------------------------------------------------
export const company = {
  name: "JPPereira",
  slogan: "Distribuindo Saúde",
  address: "Rua Ofélia Santuci Romanó, 23 – Chácaras Reunidas São Jorge, Sorocaba/SP",
  phone: "(15) 3217-1785",
  email: "sac@jppereira.com.br",
  // Página "Quem Somos" do site legado, na íntegra.
  historyQuote:
    "No começo era apenas um sonho, depois aos passos, dedicando trabalho e seriedade dia após dia o sonho se tornou realidade.",
  history: [
    "Nossa história começa a surgir quando o Sr. José Pereira ingressou no ramo de vendas de produtos “macrobióticos” em 1958. Após um longo tempo de dedicação na venda desses produtos, o Sr. Pereira resolveu montar em 1995 sua própria distribuidora, juntamente com seu filho Paulo César Pereira começaram um pequeno negócio onde vendiam produtos de outras empresas para alguns estados como Rio Grande do Sul, Paraná, Santa Catarina e São Paulo. Algum tempo mais tarde uma nova ideia surgiu com a entrada de Luiz Claudio Pereira (o outro filho do Sr. Pereira) em 1999.",
    "Esta ideia desafiava as condições atuais da empresa, pois eram apenas representantes de outras marcas de grande porte no mercado, mas o sonho de crescer ainda estava lá, então dois produtos lançam no mercado com a marca JP Pereira, a bala de banana e a banana passa. Logo depois a sociedade rompe com o triste falecimento do Sr. Pereira, deixando uma grande marca nessa história, e a saída de Paulo, mas ainda havia um sonho a ser conquistado, então a história continuou.",
    "Com grande trabalho e dedicação, Luiz continuou juntamente com sua família escrevendo essa história e novos desafios foram surgindo, e foram sendo ultrapassados.",
    "Hoje há mais 5 anos no mercado, a JP Pereira conta com mais de 70 produtos em marca própria, e dedica-se em conquistar seu lugar no mercado, desenvolvendo um trabalho de alta qualidade e dedicação, pensando sempre em atender as necessidades do consumidor e proporcioná-lo confiança e segurança na hora de comprar.",
  ],
  // Página "Revenda" do site legado.
  resale: {
    headline: "Aumente suas vendas com os produtos JPPereira",
    lines: [
      "Os nossos produtos já estão em milhares de gôndolas, só está faltando a sua.",
      "Estamos há mais de 15 anos no mercado.",
      "Preencha os dados da sua empresa no formulário abaixo que entraremos em contato com você.",
    ],
  },
};
