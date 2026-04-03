"use client";

import { useState } from "react";

interface ResourceLink {
  name: string;
  href: string;
}

interface ResourceExplorerProps {
  resources: ResourceLink[];
}

export default function ResourceExplorer({ resources }: ResourceExplorerProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [samples, setSamples] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggle = async (name: string, href: string) => {
    if (expanded === name) {
      setExpanded(null);
      return;
    }
    setExpanded(name);
    if (samples[name] !== undefined || errors[name]) return;

    setLoading(name);
    try {
      // Proxy through Next.js API route to avoid CORS issues
      const targetUrl = new URL(href);
      targetUrl.searchParams.set("page[limit]", "1");
      const proxyUrl = `/api/jsonapi-proxy?url=${encodeURIComponent(targetUrl.toString())}`;

      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setSamples((prev) => ({ ...prev, [name]: json }));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [name]: err instanceof Error ? err.message : "Failed to fetch",
      }));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-2">
      {resources.map(({ name, href }) => (
        <div
          key={name}
          className="border border-gray-200 rounded-lg overflow-hidden bg-white"
        >
          <button
            onClick={() => toggle(name, href)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left"
            aria-expanded={expanded === name}
          >
            <div>
              <span className="font-mono text-sm font-medium text-blue-700">
                {name}
              </span>
              <span className="ml-3 text-xs text-gray-400 truncate max-w-xs hidden md:inline">
                {href}
              </span>
            </div>
            <span
              className={`text-gray-400 text-lg transition-transform ${
                expanded === name ? "rotate-90" : ""
              }`}
            >
              ›
            </span>
          </button>

          {expanded === name && (
            <div className="border-t border-gray-100 bg-gray-50 p-4">
              <p className="text-xs text-gray-500 mb-3 font-mono break-all">
                GET {href}?page[limit]=1
              </p>
              {loading === name ? (
                <div className="flex items-center gap-2 text-sm text-gray-500 py-4">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                  Fetching sample response…
                </div>
              ) : errors[name] ? (
                <div className="text-sm text-red-600 py-2">
                  ⚠ {errors[name]}
                </div>
              ) : samples[name] !== undefined ? (
                <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto max-h-64">
                  {JSON.stringify(samples[name], null, 2)}
                </pre>
              ) : null}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
