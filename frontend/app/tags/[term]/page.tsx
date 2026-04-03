import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticlesByTag, getTaxonomyTerm } from "@/lib/drupal";
import ArticleCard from "@/components/ArticleCard";
import Pagination from "@/components/Pagination";

interface TagPageProps {
  params: Promise<{ term: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { term } = await params;
  const termName = decodeURIComponent(term);
  return {
    title: `Articles tagged: ${termName}`,
    description: `Browse all articles tagged with "${termName}"`,
  };
}

const ARTICLES_PER_PAGE = 6;

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { term } = await params;
  const sp = await searchParams;
  const termName = decodeURIComponent(term);
  const currentPage = Math.max(0, parseInt(sp.page ?? "0", 10));

  const taxonomyTerm = await getTaxonomyTerm(termName);
  if (!taxonomyTerm) notFound();

  const { articles, links } = await getArticlesByTag(termName, currentPage, ARTICLES_PER_PAGE);

  return (
    <div>
      <div className="mb-2">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← All articles
        </Link>
      </div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Articles tagged:{" "}
          <span className="text-blue-700">{taxonomyTerm.name}</span>
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          {articles.length === 0
            ? "No articles found for this tag."
            : `Showing articles tagged with "${taxonomyTerm.name}"`}
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No articles found for this tag.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        hasNext={!!links.next}
        hasPrev={currentPage > 0}
        basePath={`/tags/${term}`}
      />
    </div>
  );
}
