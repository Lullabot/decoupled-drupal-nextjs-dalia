import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticle, resolveFileUrl } from "@/lib/drupal";

interface ArticlePageProps {
  params: Promise<{ slug: string[] }>;
}

async function fetchArticle(slugParts: string[]) {
  const alias = slugParts.join("/");
  return getArticle(alias);
}

export async function generateMetadata(
  { params }: ArticlePageProps
): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) return { title: "Article Not Found" };
  return {
    title: article.title,
    description:
      article.body?.summary ||
      article.body?.processed?.replace(/<[^>]+>/g, " ").slice(0, 160) ||
      undefined,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await fetchArticle(slug);
  if (!article) notFound();

  const imageUrl = article.field_image
    ? resolveFileUrl(article.field_image.uri)
    : null;

  const formattedDate = new Date(article.created).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Back to articles
        </Link>
      </div>

      <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
        {article.title}
      </h1>

      <div className="flex flex-wrap items-center gap-3 mb-6 text-sm text-gray-500">
        <time dateTime={article.created}>{formattedDate}</time>
        {article.field_tags.length > 0 && (
          <>
            <span>·</span>
            <div className="flex flex-wrap gap-1">
              {article.field_tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tags/${encodeURIComponent(tag.name)}`}
                  className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {imageUrl && (
        <div className="relative w-full h-64 md:h-96 mb-8 rounded-lg overflow-hidden">
          <Image
            src={imageUrl}
            alt={article.field_image?.uri.value ?? article.title}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 1200px) 100vw, 960px"
          />
        </div>
      )}

      {article.body && (
        <div
          className="prose prose-blue max-w-none text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: article.body.processed || article.body.value,
          }}
        />
      )}
    </article>
  );
}
