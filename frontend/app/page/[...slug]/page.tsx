import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPage } from "@/lib/drupal";

interface PageDetailProps {
  params: Promise<{ slug: string[] }>;
}

async function fetchPage(slugParts: string[]) {
  const alias = slugParts.join("/");
  return getPage(alias);
}

export async function generateMetadata(
  { params }: PageDetailProps
): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) return { title: "Page Not Found" };
  return { title: page.title };
}

export default async function PageDetail({ params }: PageDetailProps) {
  const { slug } = await params;
  const page = await fetchPage(slug);
  if (!page) notFound();

  return (
    <article className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Home
        </Link>
      </div>

      <h1 className="text-4xl font-bold text-gray-900 mb-8 leading-tight">
        {page.title}
      </h1>

      {page.body && (
        <div
          className="prose prose-blue max-w-none text-gray-800 leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: page.body.processed || page.body.value,
          }}
        />
      )}
    </article>
  );
}
