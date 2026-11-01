// Gera src/data/products.json e src/data/posts.json a partir dos dumps da API
// do site legado (WordPress/WooCommerce) e baixa as imagens para public/images.
// Uso: node scripts/build-data.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = process.cwd();
const dataDir = path.join(ROOT, "src", "data");
const imgRoot = path.join(ROOT, "public", "images");
fs.mkdirSync(dataDir, { recursive: true });
for (const d of ["products", "posts", "brands"]) {
  fs.mkdirSync(path.join(imgRoot, d), { recursive: true });
}

const decode = (s = "") =>
  s
    .replace(/&#8211;/g, "\u2013")
    .replace(/&#8212;/g, "\u2014")
    .replace(/&#8216;/g, "\u2018")
    .replace(/&#8217;/g, "\u2019")
    .replace(/&#8220;/g, "\u201C")
    .replace(/&#8221;/g, "\u201D")
    .replace(/&#8230;/g, "\u2026")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

const cleanHtml = (html = "") =>
  decode(html)
    .replace(/\s*data-[a-z-]+="[^"]*"/g, "")
    .replace(/\s*style="[^"]*"/g, "")
    .replace(/\s*class="[^"]*"/g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();

const stripTags = (html = "") =>
  cleanHtml(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const downloads = [];
const extOf = (url) => {
  const m = url.match(/\.(png|jpe?g|webp)(\?|$)/i);
  return m ? m[1].toLowerCase() : "jpg";
};
const queue = (url, folder, base) => {
  const file = `${base}.${extOf(url)}`;
  downloads.push({ url, dest: path.join(imgRoot, folder, file) });
  return `/images/${folder}/${file}`;
};

// ---------- Produtos ----------
const raw = JSON.parse(fs.readFileSync("/tmp/products.json", "utf8"));
const products = raw
  .map((p) => {
    const images = (p.images || []).map((img, i) =>
      queue(img.src, "products", i === 0 ? p.slug : `${p.slug}-${i + 1}`)
    );
    return {
      id: p.id,
      slug: p.slug,
      name: decode(p.name),
      categories: (p.categories || []).map((c) => ({ slug: c.slug, name: decode(c.name) })),
      brand: p.tags && p.tags[0] ? { slug: p.tags[0].slug, name: decode(p.tags[0].name) } : null,
      shortDescription: cleanHtml(p.short_description),
      description: cleanHtml(p.description),
      images,
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
fs.writeFileSync(path.join(dataDir, "products.json"), JSON.stringify(products, null, 2));

// ---------- Posts (blog + receitas) ----------
const mediaMap = {
  2235: "https://jppereira.com.br/wp-content/uploads/2023/12/c5a85806ade29373c6dcf52919855e7e_XL.jpg",
  2232: "https://jppereira.com.br/wp-content/uploads/2023/12/Smoothie-de-morango-600x338-1.webp",
  2212: "https://jppereira.com.br/wp-content/uploads/2023/12/pao-integral-de-liquidificador-simples-e-saboroso-a-casa-encantada-blog-.png",
  2203: "https://jppereira.com.br/wp-content/uploads/2023/12/BOLO-DE-MORANGOS-E-CHOCOLATE-LIGHT.png",
  857: "https://jppereira.com.br/wp-content/uploads/2021/11/Oleo-de-coco.jpg",
  769: "https://jppereira.com.br/wp-content/uploads/2021/11/1.jpg",
  765: "https://jppereira.com.br/wp-content/uploads/2021/11/Granola3.jpg",
  750: "https://jppereira.com.br/wp-content/uploads/2021/11/Tipos-de-acucar2.jpg",
};
const rawPosts = JSON.parse(fs.readFileSync("/tmp/postsfull.json", "utf8"));
const posts = rawPosts.map((p) => {
  const cover = mediaMap[p.featured_media]
    ? queue(mediaMap[p.featured_media], "posts", decodeURIComponent(p.slug).replace(/%cc%a7/gi, "c").slice(0, 60))
    : null;
  return {
    id: p.id,
    slug: decodeURIComponent(p.slug),
    type: p.categories.includes(9) ? "receita" : "artigo",
    title: decode(p.title.rendered),
    date: p.date,
    excerpt: stripTags(p.excerpt.rendered).replace(/Ler Mais.*$/i, "").trim(),
    content: cleanHtml(p.content.rendered),
    cover,
  };
});
fs.writeFileSync(path.join(dataDir, "posts.json"), JSON.stringify(posts, null, 2));

// ---------- Logos das marcas ----------
queue("https://jppereira.com.br/wp-content/uploads/2021/11/Logo-JPPereira.png", "brands", "logo-jppereira");
queue("https://jppereira.com.br/wp-content/uploads/2021/11/logo-JPPereira-redondo_V1.png", "brands", "jppereira-redondo");
queue("https://jppereira.com.br/wp-content/uploads/2021/11/Logo-Naturabem-redondo-1.png", "brands", "naturabem-redondo");
queue("https://jppereira.com.br/wp-content/uploads/2021/11/Logo-D-Laiz-redondo-1.png", "brands", "dlaiz-redondo");

// ---------- Download ----------
let ok = 0;
let fail = 0;
for (const { url, dest } of downloads) {
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    ok++;
    continue;
  }
  try {
    execFileSync("curl", ["-sfL", "--retry", "2", "-o", dest, url], { timeout: 60000 });
    ok++;
  } catch {
    fail++;
    console.error("FALHOU:", url);
  }
}
console.log(`produtos: ${products.length} | posts: ${posts.length} | imagens ok: ${ok} | falhas: ${fail}`);
