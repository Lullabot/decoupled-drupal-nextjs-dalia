# Next.js Front-End for Drupal CMS

This is the decoupled Next.js front-end application. It consumes Drupal's JSON:API to render all public-facing pages with server-side rendering.

## Tech Stack

- **Next.js 16.2.2** — App Router, React Server Components
- **TypeScript** — Full type safety
- **Tailwind CSS v4** — Utility-first styling with typography plugin
- **No state management library** — All data fetched server-side per request

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout (nav, footer)
│   ├── page.tsx            # Homepage — article listing
│   ├── article/[...slug]/  # Article detail pages
│   ├── page/[...slug]/     # Basic page detail pages
│   ├── tags/[term]/        # Taxonomy term listing
│   └── api-explorer/       # Interactive JSON:API browser
├── components/
│   ├── NavBar.tsx          # Responsive navigation (client component)
│   ├── ArticleCard.tsx     # Article card for listings
│   ├── Pagination.tsx      # Prev/Next pagination
│   └── BodyField.tsx       # HTML body content renderer
└── lib/
    └── drupal.ts           # JSON:API data access layer + types
```

## Available Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage with paginated article listing |
| `/article/[slug]` | Full article with body, image, and tags |
| `/page/[slug]` | Basic page (e.g., About, Contact) |
| `/tags/[term-name]` | Articles filtered by taxonomy tag |
| `/api-explorer` | Browse all JSON:API endpoints |

## Environment Variables

| Variable | Value | Purpose |
|----------|-------|---------|
| `DRUPAL_BASE_URL` | `http://localhost` | Server-side SSR fetches (internal) |
| `NEXT_PUBLIC_DRUPAL_BASE_URL` | `https://dalia-drupal.ddev.site` | Client-side fetches (browser) |

These are set in `.env.local`. The dual-URL pattern avoids CORS for server-side fetches while keeping client-side fetches accessible through the public DDEV domain.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The dev server runs on port 3000 and is automatically started by DDEV via `web_extra_daemons`.

## Data Access Layer (`lib/drupal.ts`)

All Drupal API calls go through `lib/drupal.ts`. Available functions:

| Function | Description |
|----------|-------------|
| `getArticles(page, limit)` | Paginated article list with images and tags |
| `getArticle(slug)` | Single article by path alias or UUID |
| `getPage(slug)` | Single basic page by path alias or UUID |
| `getTaxonomyTerm(name)` | Taxonomy term by name |
| `getArticlesByTag(termName, page, limit)` | Articles filtered by taxonomy term |
| `getMenuLinks()` | Main navigation menu links |
| `getJsonApiIndex()` | Full JSON:API resource directory |

Helper utilities:
- `resolveFileUrl(uri)` — Converts Drupal `public://` URIs to absolute URLs
- `makeExcerpt(html, maxLen)` — Strips HTML and truncates to a text excerpt

## Self-Validation Commands

```bash
# Verify homepage returns article content
curl -s https://dalia-drupal.ddev.site:3000 | grep -c 'article'

# Verify an article detail page loads
curl -s https://dalia-drupal.ddev.site:3000/article/getting-started-with-headless-drupal | grep -o '<h1[^>]*>.*</h1>'

# Verify taxonomy page
curl -s https://dalia-drupal.ddev.site:3000/tags/Drupal | grep -o 'Articles tagged'

# Verify API Explorer
curl -s https://dalia-drupal.ddev.site:3000/api-explorer | grep -o 'API Explorer'
```
