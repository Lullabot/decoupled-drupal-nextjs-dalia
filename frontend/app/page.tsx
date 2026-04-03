import type { Metadata } from "next";
import { getArticles } from "@/lib/drupal";
import ArticleCard from "@/components/ArticleCard";
import Pagination from "@/components/Pagination";

export const metadata: Metadata = {
  title: "Home",
  description: "Browse the latest articles from our Drupal-powered content repository.",
};

const ARTICLES_PER_PAGE = 6;

interface HomePageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  const currentPage = Math.max(0, parseInt(params.page ?? "0", 10));

  const { articles, links } = await getArticles(currentPage, ARTICLES_PER_PAGE);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Latest Articles</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Content served live from Drupal via JSON:API
        </p>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg">No articles found.</p>
          <p className="text-gray-400 text-sm mt-2">
            Add content in Drupal to see it here.
          </p>
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
      />
    </div>
  );
}
