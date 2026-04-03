// Data access layer for Drupal JSON:API.
// SSR fetches use DRUPAL_BASE_URL (internal); client-side uses
// NEXT_PUBLIC_DRUPAL_BASE_URL (public DDEV domain).

const DRUPAL_BASE_URL =
  process.env.DRUPAL_BASE_URL || "http://localhost";

const JSONAPI_BASE = `${DRUPAL_BASE_URL}/jsonapi`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DrupalFile {
  id: string;
  uri: { value: string; url: string };
  filename: string;
}

export interface DrupalTaxonomyTerm {
  id: string;
  name: string;
  path: { alias: string | null };
}

export interface DrupalArticle {
  id: string;
  title: string;
  body: { value: string; processed: string; summary: string } | null;
  path: { alias: string | null };
  created: string;
  field_image: DrupalFile | null;
  field_tags: DrupalTaxonomyTerm[];
}

export interface DrupalPage {
  id: string;
  title: string;
  body: { value: string; processed: string; summary: string } | null;
  path: { alias: string | null };
  created: string;
}

export interface DrupalMenuLink {
  id: string;
  title: string;
  url: string;
  weight: number;
  enabled: boolean;
}

export interface DrupalJsonApiIndex {
  [resourceType: string]: { href: string };
}

export interface PaginatedArticles {
  articles: DrupalArticle[];
  links: {
    next: string | null;
    prev: string | null;
  };
  meta: { count: number };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve a Drupal file URI to an absolute public URL.
 * File URIs are in the form "public://path/to/file.jpg".
 */
export function resolveFileUrl(file: { value: string; url: string }): string {
  if (!file) return "";
  const publicBase =
    process.env.NEXT_PUBLIC_DRUPAL_BASE_URL || "https://dalia-drupal.ddev.site";
  // Prefer the pre-resolved url field from JSON:API (e.g. "/sites/default/files/foo.png")
  if (file.url) {
    if (file.url.startsWith("http")) return file.url;
    return `${publicBase}${file.url}`;
  }
  // Fallback to value field
  if (file.value?.startsWith("public://")) {
    return `${publicBase}/sites/default/files/${file.value.slice("public://".length)}`;
  }
  if (file.value?.startsWith("http")) return file.value;
  return file.value ? `${publicBase}${file.value}` : "";
}

/** Strip HTML tags and truncate to a plain-text excerpt. */
export function makeExcerpt(html: string, maxLen = 150): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLen ? text.slice(0, maxLen).trimEnd() + "…" : text;
}

/** Normalise a JSON:API file relationship into a DrupalFile. */
function normaliseFile(included: Record<string, unknown>[] | undefined, fileId: string | null): DrupalFile | null {
  if (!fileId || !included) return null;
  const raw = included.find(
    (i) => (i as {type: string; id: string}).type === "file--file" && (i as {type: string; id: string}).id === fileId
  ) as {id: string; attributes: {uri: {value: string; url: string}; filename: string}} | undefined;
  if (!raw) return null;
  return {
    id: raw.id,
    uri: raw.attributes.uri,
    filename: raw.attributes.filename,
  };
}

/** Normalise a JSON:API term relationship into a DrupalTaxonomyTerm. */
function normaliseTerm(included: Record<string, unknown>[] | undefined, termId: string): DrupalTaxonomyTerm | null {
  if (!included) return null;
  const raw = included.find(
    (i) => (i as {type: string; id: string}).type === "taxonomy_term--tags" && (i as {type: string; id: string}).id === termId
  ) as {id: string; attributes: {name: string; path: {alias: string | null}}} | undefined;
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.attributes.name,
    path: raw.attributes.path ?? { alias: null },
  };
}

/** Normalise a raw JSON:API article resource object. */
function normaliseArticle(
  raw: Record<string, unknown>,
  included?: Record<string, unknown>[]
): DrupalArticle {
  const attrs = raw.attributes as Record<string, unknown>;
  const rels = raw.relationships as Record<string, {data: {id: string} | null | {id: string}[]}>;

  const imageId =
    rels?.field_image?.data && !Array.isArray(rels.field_image.data)
      ? (rels.field_image.data as {id: string}).id
      : null;

  const tagIds: string[] = Array.isArray(rels?.field_tags?.data)
    ? (rels.field_tags.data as {id: string}[]).map((t) => t.id)
    : [];

  return {
    id: raw.id as string,
    title: attrs.title as string,
    body: (attrs.body as DrupalArticle["body"]) ?? null,
    path: (attrs.path as { alias: string | null }) ?? { alias: null },
    created: attrs.created as string,
    field_image: normaliseFile(included, imageId),
    field_tags: tagIds
      .map((id) => normaliseTerm(included, id))
      .filter(Boolean) as DrupalTaxonomyTerm[],
  };
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/** Fetch a paginated list of articles. */
export async function getArticles(
  page = 0,
  limit = 10
): Promise<PaginatedArticles> {
  const url = new URL(`${JSONAPI_BASE}/node/article`);
  url.searchParams.set("include", "field_image,field_tags");
  url.searchParams.set("sort", "-created");
  url.searchParams.set("page[offset]", String(page * limit));
  url.searchParams.set("page[limit]", String(limit));
  url.searchParams.set("filter[status]", "1");

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Failed to fetch articles: ${res.status}`);

  const json = await res.json();
  const included = json.included ?? [];

  return {
    articles: (json.data ?? []).map((r: Record<string, unknown>) =>
      normaliseArticle(r, included)
    ),
    links: {
      next: json.links?.next?.href ?? null,
      prev: json.links?.prev?.href ?? null,
    },
    meta: { count: json.meta?.count ?? 0 },
  };
}

/** Fetch a single article by UUID or path alias slug. */
export async function getArticle(slug: string): Promise<DrupalArticle | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // UUID lookup (fast path)
  if (uuidRegex.test(slug)) {
    const uuidUrl = new URL(`${JSONAPI_BASE}/node/article/${slug}`);
    uuidUrl.searchParams.set("include", "field_image,field_tags");
    const uuidRes = await fetch(uuidUrl.toString(), { next: { revalidate: 60 } });
    if (uuidRes.ok) {
      const uuidJson = await uuidRes.json();
      if (uuidJson.data) return normaliseArticle(uuidJson.data, uuidJson.included ?? []);
    }
  }

  // Fallback: fetch all articles and match by alias
  const aliasPath = slug.startsWith("/") ? slug : `/article/${slug}`;
  const url = new URL(`${JSONAPI_BASE}/node/article`);
  url.searchParams.set("include", "field_image,field_tags");
  url.searchParams.set("filter[status]", "1");
  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) return null;
  const json = await res.json();
  const match = (json.data ?? []).find(
    (r: Record<string, unknown>) =>
      (r.attributes as Record<string, unknown> & { path: { alias: string | null } })?.path?.alias === aliasPath
  );
  if (!match) return null;
  return normaliseArticle(match, json.included ?? []);
}

/** Fetch a single basic page by UUID or path alias slug. */
export async function getPage(slug: string): Promise<DrupalPage | null> {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  // UUID lookup (fast path)
  if (uuidRegex.test(slug)) {
    const uuidRes = await fetch(`${JSONAPI_BASE}/node/page/${slug}`, {
      next: { revalidate: 60 },
    });
    if (uuidRes.ok) {
      const uuidJson = await uuidRes.json();
      if (uuidJson.data) {
        const attrs = uuidJson.data.attributes;
        return { id: uuidJson.data.id, title: attrs.title, body: attrs.body ?? null, path: attrs.path ?? { alias: null }, created: attrs.created };
      }
    }
  }

  // Fallback: fetch all pages and match by alias
  const aliasPath = slug.startsWith("/") ? slug : `/page/${slug}`;
  const res = await fetch(`${JSONAPI_BASE}/node/page`, { next: { revalidate: 60 } });
  if (!res.ok) return null;
  const json = await res.json();
  const match = (json.data ?? []).find(
    (r: Record<string, unknown>) =>
      (r.attributes as Record<string, unknown> & { path: { alias: string | null } })?.path?.alias === aliasPath
  );
  if (!match) return null;
  const attrs = match.attributes as Record<string, unknown>;
  return { id: match.id as string, title: attrs.title as string, body: (attrs.body as DrupalPage["body"]) ?? null, path: (attrs.path as { alias: string | null }) ?? { alias: null }, created: attrs.created as string };
}

/** Fetch a taxonomy term by name. */
export async function getTaxonomyTerm(
  name: string
): Promise<DrupalTaxonomyTerm | null> {
  const url = new URL(`${JSONAPI_BASE}/taxonomy_term/tags`);
  url.searchParams.set("filter[name]", name);

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.data?.length) return null;

  const raw = json.data[0];
  return {
    id: raw.id,
    name: raw.attributes.name,
    path: raw.attributes.path ?? { alias: null },
  };
}

/** Fetch paginated articles filtered by taxonomy term name. */
export async function getArticlesByTag(
  termName: string,
  page = 0,
  limit = 10
): Promise<PaginatedArticles> {
  // First, resolve the term to get its ID
  const term = await getTaxonomyTerm(termName);
  if (!term) return { articles: [], links: { next: null, prev: null }, meta: { count: 0 } };

  const url = new URL(`${JSONAPI_BASE}/node/article`);
  url.searchParams.set("include", "field_image,field_tags");
  url.searchParams.set("sort", "-created");
  url.searchParams.set("filter[status]", "1");
  url.searchParams.set("filter[field_tags.id]", term.id);
  url.searchParams.set("page[offset]", String(page * limit));
  url.searchParams.set("page[limit]", String(limit));

  const res = await fetch(url.toString(), { next: { revalidate: 60 } });
  if (!res.ok) return { articles: [], links: { next: null, prev: null }, meta: { count: 0 } };

  const json = await res.json();
  const included = json.included ?? [];

  return {
    articles: (json.data ?? []).map((r: Record<string, unknown>) =>
      normaliseArticle(r, included)
    ),
    links: {
      next: json.links?.next?.href ?? null,
      prev: json.links?.prev?.href ?? null,
    },
    meta: { count: json.meta?.count ?? 0 },
  };
}

/** Fetch main navigation menu links. */
export async function getMenuLinks(): Promise<DrupalMenuLink[]> {
  // Uses jsonapi_menu_items module endpoint which is publicly accessible.
  const url = `${DRUPAL_BASE_URL}/jsonapi/menu_items/main`;
  const res = await fetch(url, { next: { revalidate: 300 } });
  if (!res.ok) {
    // Fallback: return empty array gracefully
    console.warn(`Failed to fetch menu links: ${res.status}`);
    return [];
  }
  const json = await res.json();
  return (json.data ?? []).map((item: Record<string, unknown>) => {
    const attrs = item.attributes as Record<string, unknown>;
    return {
      id: item.id as string,
      title: attrs.title as string,
      url: attrs.url as string,
      weight: (attrs.weight as number) ?? 0,
      enabled: (attrs.enabled as boolean) ?? true,
    };
  });
}

/** Resolve a taxonomy term ID to its name. */
export async function getTaxonomyTermById(tid: number): Promise<string | null> {
  const url = new URL(`${JSONAPI_BASE}/taxonomy_term/tags`);
  url.searchParams.set("filter[drupal_internal__tid]", String(tid));
  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json.data?.length) return null;
  return (json.data[0].attributes as { name: string }).name;
}

/** Rewrite Drupal menu URLs to Next.js routes. */
export async function rewriteMenuLinks(links: DrupalMenuLink[]): Promise<DrupalMenuLink[]> {
  const result: DrupalMenuLink[] = [];
  for (const link of links) {
    const taxonomyMatch = link.url.match(/^\/taxonomy\/term\/(\d+)$/);
    if (taxonomyMatch) {
      const name = await getTaxonomyTermById(parseInt(taxonomyMatch[1], 10));
      if (name) {
        result.push({ ...link, url: `/tags/${encodeURIComponent(name)}` });
        continue;
      }
    }
    result.push(link);
  }
  return result;
}

/** Fetch the JSON:API entrypoint (index of all resource types). */
export async function getJsonApiIndex(): Promise<DrupalJsonApiIndex> {
  const res = await fetch(`${JSONAPI_BASE}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Failed to fetch JSON:API index: ${res.status}`);
  const json = await res.json();
  return json.links ?? {};
}
