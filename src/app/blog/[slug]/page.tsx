import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PostArticle from "@/components/PostArticle";
import { articles, getPost } from "@/lib/content";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return articles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post || post.type !== "artigo") return {};
  return { title: post.title, description: post.excerpt.slice(0, 160) };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post || post.type !== "artigo") notFound();
  return <PostArticle post={post} />;
}
