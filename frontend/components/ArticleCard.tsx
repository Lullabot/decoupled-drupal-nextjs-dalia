import Image from "next/image";
import Link from "next/link";
import type { DrupalArticle } from "@/lib/drupal";
import { resolveFileUrl, makeExcerpt } from "@/lib/drupal";

interface ArticleCardProps {
  article: DrupalArticle;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  // Use UUID as slug — Drupal's JSON:API does not expose path.alias
  // as a filterable field, so article detail pages use UUID routing.
  const slug = article.id;

  const imageUrl = article.field_image
    ? resolveFileUrl(article.field_image.uri)
    : null;

  const excerpt = article.body
    ? makeExcerpt(article.body.processed || article.body.value, 160)
    : null;

  const formattedDate = new Date(article.created).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={article.field_image?.uri.value ?? article.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="p-5">
        <h2 className="text-xl font-semibold text-gray-900 mb-2 leading-snug">
          <Link
            href={`/article/${slug}`}
            className="hover:text-blue-700 transition-colors"
          >
            {article.title}
          </Link>
        </h2>
        {excerpt && (
          <p className="text-gray-600 text-sm mb-3 leading-relaxed">{excerpt}</p>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <time className="text-xs text-gray-400">{formattedDate}</time>
          {article.field_tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {article.field_tags.map((tag) => (
                <Link
                  key={tag.id}
                  href={`/tags/${encodeURIComponent(tag.name)}`}
                  className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
