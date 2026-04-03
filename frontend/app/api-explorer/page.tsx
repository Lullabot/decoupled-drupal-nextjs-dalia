import type { Metadata } from "next";
import { getJsonApiIndex } from "@/lib/drupal";
import ResourceExplorer from "./ResourceExplorer";

export const metadata: Metadata = {
  title: "API Explorer",
  description:
    "Browse all available Drupal JSON:API endpoints and inspect sample responses.",
};

export default async function ApiExplorerPage() {
  const index = await getJsonApiIndex();

  // Filter out non-resource entries (self, describedby, etc.) and sort
  const resources = Object.entries(index)
    .filter(([name]) => name.includes("--") || name.includes("/"))
    .map(([name, link]) => ({
      name,
      href: (link as { href: string }).href,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">API Explorer</h1>
        <p className="text-gray-500 mt-2 text-sm">
          All available Drupal JSON:API resource types. Click any resource to
          fetch a live sample response.
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-400">
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
            {resources.length} resource types
          </span>
          <span>
            Entrypoint:{" "}
            <code className="font-mono">
              {process.env.NEXT_PUBLIC_DRUPAL_BASE_URL}/jsonapi
            </code>
          </span>
        </div>
      </div>

      <ResourceExplorer resources={resources} />
    </div>
  );
}
