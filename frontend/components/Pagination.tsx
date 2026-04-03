import Link from "next/link";

interface PaginationProps {
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
  basePath?: string;
}

export default function Pagination({
  currentPage,
  hasNext,
  hasPrev,
  basePath = "",
}: PaginationProps) {
  if (!hasNext && !hasPrev) return null;

  return (
    <nav className="flex justify-center items-center gap-4 mt-10" aria-label="Pagination">
      {hasPrev ? (
        <Link
          href={`${basePath}?page=${currentPage - 1}`}
          className="px-4 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          ← Previous
        </Link>
      ) : (
        <span className="px-4 py-2 text-sm text-gray-400">← Previous</span>
      )}
      <span className="text-sm text-gray-500">Page {currentPage + 1}</span>
      {hasNext ? (
        <Link
          href={`${basePath}?page=${currentPage + 1}`}
          className="px-4 py-2 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
        >
          Next →
        </Link>
      ) : (
        <span className="px-4 py-2 text-sm text-gray-400">Next →</span>
      )}
    </nav>
  );
}
