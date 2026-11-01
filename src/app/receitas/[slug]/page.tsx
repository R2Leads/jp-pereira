import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PostArticle from "@/components/PostArticle";
import { getPost, recipes } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return recipes.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post || post.type !== "receita") return {};
  return { title: post.title, description: post.excerpt.slice(0, 160) };
}

export default async function ReceitaPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post || post.type !== "receita") notFound();
  return <PostArticle post={post} />;
}
