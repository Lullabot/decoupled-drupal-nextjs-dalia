# Decoupled Drupal + Next.js (Dalia Experiment)

A decoupled Drupal 11 site with a Next.js 16 frontend, bootstrapped entirely by [Dalia](https://github.com/AmazeeLabs/ddev-dalia) — an AI-powered task manager that runs inside DDEV and uses Claude Code to implement changes.

This repo documents the experiment and the manual fixes required after Dalia's initial scaffold.

## What Dalia Built

We gave Dalia a fresh vanilla Drupal 11 install and asked it to create a decoupled frontend. It produced:

- **Drupal backend** with JSON:API, CORS configuration, pathauto, demo content (articles, pages, taxonomy terms), and navigation menus
- **Next.js 16 frontend** with App Router, Tailwind CSS, server-side rendering via JSON:API, and an interactive API Explorer
- **DDEV configuration** including `web_extra_daemons` and `web_extra_exposed_ports` for the Next.js dev server

Dalia completed this across 6 commits in a feature branch, covering JSON:API setup, content seeding, layout, routing, and documentation.

## What We Had to Fix

Dalia got the overall architecture right but produced several bugs that required manual intervention:

### 1. Images not rendering

**Problem:** `resolveFileUrl()` used `uri.value` (e.g., `public://drupal-nextjs-hero.png`) to construct image URLs. Additionally, Next.js Image Optimization couldn't reach `dalia-drupal.ddev.site` from inside the container.

**Fix:** Changed to use `uri.url` (the pre-resolved `/sites/default/files/...` path) and set `images.unoptimized: true` in `next.config.ts` since the Next.js optimizer can't fetch from the external DDEV hostname within the container.

### 2. About page blank (white screen)

**Problem:** Page routes used `[...slug]` with UUID-only lookup. The nav linked to `/page/about` but `getPage()` only accepted UUIDs. It also tried `filter[path.alias]` which Drupal's JSON:API doesn't support as a filterable field.

**Fix:** Rewrote `getPage()` and `getArticle()` to try UUID first, then fall back to fetching all items and matching by `path.alias` client-side.

### 3. "Drupal Articles" nav link 404

**Problem:** The Drupal menu item pointed to `/taxonomy/term/2` (an internal Drupal path) but the Next.js app only has `/tags/[term-name]` routes.

**Fix:** Added `rewriteMenuLinks()` in the data layer that resolves `/taxonomy/term/N` URLs to `/tags/TermName` by looking up the term via JSON:API. This runs server-side in the root layout.

### 4. API Explorer not interactive (clicks do nothing)

**Problem:** The `ResourceExplorer` is a `"use client"` component that needs React hydration. In dev mode, Next.js Turbopack requires a WebSocket connection for HMR. DDEV's Traefik proxy on the custom HTTPS port (3002 to 3001) doesn't support WebSocket upgrade, so hydration never completed and `onClick` handlers were never attached.

**Fix:** Built for production (`npm run build`) and switched the daemon to `npm start`. Production mode doesn't need HMR WebSocket, so hydration works normally. Also added an API proxy route (`/api/jsonapi-proxy`) to avoid CORS issues on client-side fetches.

### 5. Port conflict with Dalia

**Problem:** Dalia's own backend runs on port 3000 inside the container. The Next.js daemon was also configured for port 3000, causing a supervisor spawn error.

**Fix:** Changed Next.js to port 3001 (container) / 3002 (HTTPS via Traefik).

### 6. CORS missing for new port

**Problem:** Drupal's CORS config only allowed origins on port 3000, not the new 3002.

**Fix:** Added `https://dalia-drupal.ddev.site:3002` to `allowedOrigins` in `services.yml`.

## Prerequisites

- [DDEV](https://ddev.readthedocs.io/) v1.25+
- [OrbStack](https://orbstack.dev/) or Docker Desktop

## Setup

```bash
git clone git@github.com:Lullabot/decoupled-drupal-nextjs-dalia.git
cd decoupled-drupal-nextjs-dalia

# Start DDEV
ddev start

# Install Drupal dependencies
ddev composer install

# Install Drupal site
ddev drush site:install --account-name=admin --account-pass=admin -y

# Install frontend dependencies and build
ddev exec bash -c 'cd /var/www/html/frontend && npm ci && npm run build'

# Restart to launch the Next.js production server
ddev restart
```

## URLs

| Service | URL |
|---------|-----|
| Drupal backend | https://decoupled-drupal-nextjs-dalia.ddev.site |
| Next.js frontend | https://decoupled-drupal-nextjs-dalia.ddev.site:3002 |

Drupal admin: `admin` / `admin`

## Adding Dalia

To add the AI task manager (optional):

```bash
ddev add-on get AmazeeLabs/ddev-dalia
ddev restart
ddev ssh
claude  # authenticate Claude Code
```

Then open `https://dalia.<projectname>.ddev.site` to interact with Dalia.

## Project Structure

```
.
├── .ddev/                  # DDEV configuration
│   └── config.yaml         # Includes Next.js daemon and port config
├── frontend/               # Next.js 16 app
│   ├── app/                # App Router pages
│   │   ├── api-explorer/   # Interactive JSON:API browser
│   │   ├── api/            # API proxy route
│   │   ├── article/        # Article detail pages
│   │   ├── page/           # Basic page detail pages
│   │   └── tags/           # Taxonomy term listings
│   ├── components/         # React components
│   ├── lib/drupal.ts       # JSON:API data access layer
│   └── .env.local          # Environment variables
├── web/                    # Drupal docroot
├── composer.json           # Drupal dependencies
└── README.md
```

## Takeaways

Dalia is impressive at scaffolding a full decoupled architecture from scratch — it chose appropriate modules, created content types, seeded demo data, and built a functional Next.js frontend with proper SSR patterns. The issues it produced were all integration-level bugs (port conflicts, CORS, WebSocket proxying, Drupal API quirks) rather than architectural mistakes. These are exactly the kind of issues a developer would catch during testing, suggesting Dalia works best as an accelerator with human review rather than a fully autonomous builder.
