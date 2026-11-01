import type { NextConfig } from "next";

const BLOG_POSTS = [
  "alimentos-integrais-o-que-sao-e-quais-os-seus-beneficios",
  "granola-e-seus-beneficios-para-a-saude",
  "oleo-de-coco-como-usar-e-quais-os-seus-beneficios",
  "tipos-de-acucar-saiba-escolher-o-mais-saudavel",
];

const RECIPES = [
  "pao-integral-saboroso",
  "receita-de-bolo-de-chocolate-light-e-morango",
  "salada-colorida-com-quinoa-e-sementes-da-jppereira",
  "smoothie-energizante-de-frutas-com-granola-da-jppereira",
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return [
      // URLs do WordPress que mudaram de endereço no site novo.
      { source: "/produto/:slug", destination: "/produtos/:slug", permanent: true },
      { source: "/nossos-produtos", destination: "/produtos", permanent: true },
      { source: "/quem-somos", destination: "/empresa", permanent: true },
      { source: "/nossas-receitas", destination: "/receitas", permanent: true },
      { source: "/categoria-produto/:slug", destination: "/produtos", permanent: true },
      { source: "/produto-etiqueta/:slug", destination: "/marcas", permanent: true },
      { source: "/category/:slug", destination: "/blog", permanent: true },
      { source: "/author/:slug", destination: "/blog", permanent: true },
      { source: "/produtos-dlaiz", destination: "/marcas/dlaiz", permanent: true },
      { source: "/produtos-naturabem", destination: "/marcas/naturabem", permanent: true },
      { source: "/loja", destination: "/onde-comprar", permanent: true },
      { source: "/carrinho", destination: "/onde-comprar", permanent: true },
      { source: "/finalizar-compra", destination: "/onde-comprar", permanent: true },
      { source: "/minha-conta", destination: "/onde-comprar", permanent: true },
      { source: "/cadastro_confirma", destination: "/", permanent: true },
      { source: "/contact-list", destination: "/contato", permanent: true },
      { source: "/redirect", destination: "/", permanent: true },
      ...BLOG_POSTS.map((slug) => ({
        source: `/${slug}`,
        destination: `/blog/${slug}`,
        permanent: true,
      })),
      ...RECIPES.map((slug) => ({
        source: `/${slug}`,
        destination: `/receitas/${slug}`,
        permanent: true,
      })),
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Permissions-Policy",
            value: "geolocation=(self), camera=(), microphone=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
