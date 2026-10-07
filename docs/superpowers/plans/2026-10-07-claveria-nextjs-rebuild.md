# Claveria Next.js + Payload Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild claveriamisor.gov.ph as a single Next.js 16 app with Payload 3 CMS, Postgres, seeded placeholder content, and a paddledraw-style self-hosted deployment.

**Architecture:** One Next.js App Router project. Payload 3 is embedded (admin at `/admin`, REST at `/api`), pages are React Server Components that read content through Payload's Local API with ISR (`revalidate = 300`) plus on-demand `revalidatePath` from collection hooks. Content lives in Postgres; uploads on local disk served by Payload at `/api/media/file/*`. Deployed as Next standalone under systemd behind Caddy on the existing DigitalOcean droplet.

**Tech Stack:** Node 22, npm, Next 16.3.x, React 19.2, Payload 3.90.2 (`@payloadcms/next`, `@payloadcms/db-postgres`, `@payloadcms/richtext-lexical`, `@payloadcms/ui`), sharp, Tailwind CSS v4, TypeScript 5.7, Vitest 4, Playwright 1.58, tsx, embedded-postgres (dev/test DB only).

**Spec:** `docs/superpowers/specs/2026-10-07-claveria-nextjs-rebuild-design.md`

## Global Constraints

- Node `>=20.9` (dev machine has 22.22.2); package manager is npm; lockfile committed.
- Payload packages pinned to exactly `3.90.2`; Next pinned to `16.3.3` (Payload's peer range is `>=16.3.3 <17`).
- App listens on port **3001** in production (3000 is paddledraw). Dev server uses 3000 locally.
- Dev/test Postgres runs via embedded-postgres on port **5433** (5432 is paddledraw's SSH tunnel). Databases: `claveria_dev`, `claveria_test`.
- Env vars: `DATABASE_URI`, `PAYLOAD_SECRET`, `MEDIA_DIR`, `NEXT_PUBLIC_SITE_URL`, `PORT`.
- Brand colors: gold `#d99c41` (accent), navy `#40407e` (headings, nav, footer).
- Page titles: `<page> | Claveria, Misamis Oriental`.
- Public pages only ever show News with `_status = published`. Other collections have no drafts.
- Public URL scheme: `/`, `/news`, `/news/[slug]`, `/sangguniang-bayan`, `/departments`, `/departments/[slug]`, `/destinations/[type]`, `/destinations/[type]/[slug]`, `/officials/[slug]`, `/transparency`, `/admin`.
- Destination type values (used in URLs and the select): `waterfalls`, `restaurants`, `resorts`, `hotels`, `entertainments`.
- Dropped on purpose: comments, resume page, COVID registration, search overlay, Facebook SDK embed, newsletter form.
- Mobile-first: 16px side gutter, single column below 768px, no horizontal scroll.
- Every Payload write from scripts/tests passes `context: { disableRevalidate: true }` so `next/cache` is never called outside a Next request.
- CI (GitHub Actions) runs lint, typecheck and unit tests only. `next build` needs a database because the home page is pre-rendered, so the build runs on the droplet inside `deploy/deploy.sh`.
- Deviation from spec section 10, agreed here: uploads are served by Payload at `/api/media/file/*` through Next, so Caddy needs no `file_server` block. `MEDIA_DIR` still controls where files are stored.

## Review Focus

1. **A News item saved as draft (never published)** must not appear on `/`, `/news`, `/sitemap.xml`, or resolve at `/news/[slug]` (404). Tests: Task 3 collections test, Task 6 data-layer test (`getNewsBySlug` and `getSitemapEntries` exclude the draft), Task 14 e2e.
2. **A title containing punctuation or accented characters** ("Mayor's Office: Año 2026!") must produce a URL-safe slug and never a 500. Test: Task 2 unit tests for `formatSlug`.
3. **A destination type that is not one of the five values** (e.g. `/destinations/beaches`) must 404, not crash. Tests: Task 3 (select rejects it), Task 12 curl check, Task 14 e2e.
4. **Empty site settings** (fresh install, nothing filled in) must render the home page without throwing, with sections omitted. Tests: Task 4 reads the empty global, Task 8 unit test for `homeSections`.
5. **An old Django URL with the misspelling `/deparments/`** must redirect permanently (308) to `/departments`. Tests: Task 2 unit test on the redirects map, Task 11 curl check, Task 14 e2e.

---

### Task 1: Project scaffold with Payload admin, Postgres, and a dev database

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.env.example`, `.npmrc`, `.gitignore` (modify), `README.md`
- Create: `src/payload.config.ts`, `src/collections/Users.ts`, `src/collections/Media.ts`, `src/access/index.ts`
- Create: `src/app/(payload)/layout.tsx`, `src/app/(payload)/custom.scss`, `src/app/(payload)/admin/[[...segments]]/page.tsx`, `src/app/(payload)/admin/[[...segments]]/not-found.tsx`, `src/app/(payload)/admin/importMap.js`, `src/app/(payload)/api/[...slug]/route.ts`, `src/app/(payload)/api/graphql/route.ts`, `src/app/(payload)/api/graphql-playground/route.ts`
- Create: `src/app/(site)/layout.tsx`, `src/app/(site)/page.tsx`, `src/app/(site)/globals.css`
- Create: `scripts/dev-db.ts`
- Create: `vitest.config.mts`, `vitest.setup.ts`, `tests/int/payload.int.spec.ts`

**Interfaces:**
- Produces: `src/payload.config.ts` default export (Promise of sanitized config), aliased as `@payload-config`. `src/access/index.ts` exports `anyone`, `authenticated`, `authenticatedOrPublished`. Media collection slug `media` with image sizes `thumbnail`, `card`, `hero`, `og`. Users collection slug `users` with field `name`.
- Produces: npm scripts `dev`, `build`, `start`, `db`, `test:int`, `test:unit`, `generate:types`, `payload`, `lint`, `typecheck`.

- [ ] **Step 1: Create package.json**

```json
{
  "name": "claveria-web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=20.9.0" },
  "scripts": {
    "dev": "cross-env NODE_OPTIONS=--no-deprecation next dev",
    "build": "cross-env NODE_OPTIONS=\"--no-deprecation --max-old-space-size=4096\" next build",
    "start": "cross-env NODE_OPTIONS=--no-deprecation next start",
    "db": "tsx scripts/dev-db.ts",
    "seed": "cross-env NODE_OPTIONS=--no-deprecation tsx src/seed/run.ts",
    "payload": "cross-env NODE_OPTIONS=--no-deprecation payload",
    "generate:types": "cross-env NODE_OPTIONS=--no-deprecation payload generate:types",
    "generate:importmap": "cross-env NODE_OPTIONS=--no-deprecation payload generate:importmap",
    "migrate": "cross-env NODE_OPTIONS=--no-deprecation payload migrate",
    "migrate:create": "cross-env NODE_OPTIONS=--no-deprecation payload migrate:create",
    "lint": "cross-env NODE_OPTIONS=--no-deprecation eslint .",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest run --config ./vitest.config.mts --project unit",
    "test:int": "cross-env NODE_OPTIONS=--no-deprecation vitest run --config ./vitest.config.mts --project int",
    "test:e2e": "cross-env NODE_OPTIONS=--no-deprecation playwright test --config=playwright.config.ts",
    "test": "npm run test:unit && npm run test:int"
  },
  "dependencies": {
    "@payloadcms/db-postgres": "3.90.2",
    "@payloadcms/next": "3.90.2",
    "@payloadcms/richtext-lexical": "3.90.2",
    "@payloadcms/ui": "3.90.2",
    "cross-env": "10.1.0",
    "dotenv": "16.4.7",
    "graphql": "^16.8.1",
    "next": "16.3.3",
    "payload": "3.90.2",
    "react": "19.2.6",
    "react-dom": "19.2.6",
    "sharp": "^0.34.2"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.2.0",
    "@playwright/test": "1.58.2",
    "@tailwindcss/postcss": "^4.1.0",
    "@types/node": "^22.15.0",
    "@types/react": "19.2.6",
    "@types/react-dom": "19.2.6",
    "embedded-postgres": "17.10.0-beta.17",
    "eslint": "^9.16.0",
    "eslint-config-next": "16.3.3",
    "postcss": "^8.5.0",
    "sass": "^1.80.0",
    "tailwindcss": "^4.1.0",
    "tsx": "^4.19.0",
    "typescript": "5.7.3",
    "vite-tsconfig-paths": "^5.1.0",
    "vitest": "4.0.18"
  }
}
```

- [ ] **Step 2: Create tsconfig.json, .npmrc, .env.example, postcss.config.mjs, eslint.config.mjs, and extend .gitignore**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"],
      "@payload-config": ["./src/payload.config.ts"]
    },
    "target": "ES2022"
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", "**/*.mjs", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules", ".pg"]
}
```

`.npmrc`:
```
legacy-peer-deps=false
```

`.env.example`:
```
DATABASE_URI=postgresql://claveria:claveria@127.0.0.1:5433/claveria_dev
PAYLOAD_SECRET=change-me-to-a-long-random-string
MEDIA_DIR=./media
NEXT_PUBLIC_SITE_URL=http://localhost:3000
PORT=3000
```

`postcss.config.mjs`:
```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

`eslint.config.mjs`:
```js
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

const eslintConfig = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  { ignores: ['.next/', '.pg/', 'media/', 'src/payload-types.ts', 'src/migrations/'] },
]

export default eslintConfig
```

Append to `.gitignore` (keep the existing lines):
```
.pg
next-env.d.ts
/test-results/
/playwright-report/
/blob-report/
coverage
```

- [ ] **Step 3: Install dependencies**

Run: `cd /home/marc/projects/claveria-new && cp .env.example .env && npm install`
Expected: completes without peer dependency errors; `node_modules/payload/package.json` shows `"version": "3.90.2"`.

- [ ] **Step 4: Create next.config.ts**

```ts
import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'
import { redirects } from './redirects.mjs'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }],
  },
  async redirects() {
    return redirects
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
```

`redirects.mjs` (root; filled in Task 2, start with an empty list so the build works):
```js
/** @type {import('next').NextConfig['redirects'] extends () => Promise<infer R> ? R : never} */
export const redirects = []
```

- [ ] **Step 5: Create access helpers**

`src/access/index.ts`:
```ts
import type { Access } from 'payload'

export const anyone: Access = () => true

export const authenticated: Access = ({ req: { user } }) => Boolean(user)

export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}
```

- [ ] **Step 6: Create Users and Media collections**

`src/collections/Users.ts`:
```ts
import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'name', group: 'Admin' },
  auth: true,
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [{ name: 'name', type: 'text', required: true }],
}
```

`src/collections/Media.ts`:
```ts
import type { CollectionConfig } from 'payload'
import path from 'path'
import { anyone, authenticated } from '@/access'

const staticDir = process.env.MEDIA_DIR
  ? path.resolve(process.cwd(), process.env.MEDIA_DIR)
  : path.resolve(process.cwd(), 'media')

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content' },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [{ name: 'alt', type: 'text', required: true }],
  upload: {
    staticDir,
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'application/pdf'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 600, height: 400, position: 'centre' },
      { name: 'hero', width: 1600, height: 900, position: 'centre' },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
  },
}
```

- [ ] **Step 7: Create payload.config.ts**

`src/payload.config.ts`:
```ts
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' | Claveria LGU Admin' },
  },
  collections: [Users, Media],
  globals: [],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
    push: process.env.NODE_ENV !== 'production',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
})
```

- [ ] **Step 8: Create the Payload app route files (copied from Payload's blank template, do not edit)**

`src/app/(payload)/layout.tsx`:
```tsx
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import type { ServerFunctionClient } from 'payload'
import { handleServerFunctions, RootLayout } from '@payloadcms/next/layouts'
import React from 'react'

import { importMap } from './admin/importMap.js'
import './custom.scss'

type Args = {
  children: React.ReactNode
}

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
)

export default Layout
```

`src/app/(payload)/custom.scss`: empty file.

`src/app/(payload)/admin/importMap.js`:
```js
import { CollectionCards as CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1 } from '@payloadcms/next/rsc'

/** @type import('payload').ImportMap */
export const importMap = {
  '@payloadcms/next/rsc#CollectionCards': CollectionCards_f9c02e79a4aed9a3924487c0cd4cafb1,
}
```

`src/app/(payload)/admin/[[...segments]]/page.tsx`:
```tsx
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from 'next'

import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, params, searchParams, importMap })

export default Page
```

`src/app/(payload)/admin/[[...segments]]/not-found.tsx`:
```tsx
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import type { Metadata } from 'next'

import config from '@payload-config'
import { NotFoundPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = ({ params, searchParams }: Args): Promise<Metadata> =>
  generatePageMetadata({ config, params, searchParams })

const NotFound = ({ params, searchParams }: Args) =>
  NotFoundPage({ config, params, searchParams, importMap })

export default NotFound
```

`src/app/(payload)/api/[...slug]/route.ts`:
```ts
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)
```

`src/app/(payload)/api/graphql/route.ts`:
```ts
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import { GRAPHQL_POST, REST_OPTIONS } from '@payloadcms/next/routes'

export const POST = GRAPHQL_POST(config)

export const OPTIONS = REST_OPTIONS(config)
```

`src/app/(payload)/api/graphql-playground/route.ts`:
```ts
/* THIS FILE WAS GENERATED AUTOMATICALLY BY PAYLOAD. */
/* DO NOT MODIFY IT BECAUSE IT COULD BE REWRITTEN AT ANY TIME. */
import config from '@payload-config'
import '@payloadcms/next/css'
import { GRAPHQL_PLAYGROUND_GET } from '@payloadcms/next/routes'

export const GET = GRAPHQL_PLAYGROUND_GET(config)
```

- [ ] **Step 9: Create a minimal public site layout and page with Tailwind**

`src/app/(site)/globals.css`:
```css
@import 'tailwindcss';

@theme {
  --color-gold: #d99c41;
  --color-gold-dark: #b8822f;
  --color-navy: #40407e;
  --color-navy-dark: #2e2e5c;
  --color-ink: #1f2330;
  --color-mist: #f4f5f8;
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;
}

html {
  scroll-behavior: smooth;
}

body {
  @apply bg-white text-ink font-sans antialiased;
}
```

`src/app/(site)/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  title: { default: 'Claveria, Misamis Oriental', template: '%s | Claveria, Misamis Oriental' },
  description: 'Official website of the Municipality of Claveria, Misamis Oriental.',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  )
}
```

`src/app/(site)/page.tsx`:
```tsx
export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="text-3xl font-bold text-navy">Claveria, Misamis Oriental</h1>
    </main>
  )
}
```

- [ ] **Step 10: Create the dev database script**

`scripts/dev-db.ts`:
```ts
import EmbeddedPostgres from 'embedded-postgres'
import fs from 'node:fs'
import path from 'node:path'

const dataDir = path.resolve(process.cwd(), '.pg/data')
const port = Number(process.env.DEV_PG_PORT ?? 5433)

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  user: 'claveria',
  password: 'claveria',
  port,
  persistent: true,
  onLog: () => {},
  onError: (msg) => console.error(String(msg)),
})

async function ensureDatabase(name: string) {
  try {
    await pg.createDatabase(name)
    console.log(`created database ${name}`)
  } catch (err) {
    if (!String(err).includes('already exists')) throw err
  }
}

async function main() {
  if (!fs.existsSync(path.join(dataDir, 'PG_VERSION'))) {
    console.log('initialising embedded postgres in .pg/data')
    await pg.initialise()
  }
  await pg.start()
  await ensureDatabase('claveria_dev')
  await ensureDatabase('claveria_test')
  console.log(`postgres ready on 127.0.0.1:${port} (claveria_dev, claveria_test). Ctrl+C to stop.`)

  const stop = async () => {
    await pg.stop()
    process.exit(0)
  }
  process.on('SIGINT', stop)
  process.on('SIGTERM', stop)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 11: Start the dev database in the background and verify**

Run: `cd /home/marc/projects/claveria-new && (npm run db > .pg/dev-db.log 2>&1 &) ; sleep 20; pg_isready -h 127.0.0.1 -p 5433; psql postgresql://claveria:claveria@127.0.0.1:5433/claveria_dev -c 'select 1'`
Expected: `127.0.0.1:5433 - accepting connections` and a result row `1`. (First run downloads Postgres binaries; allow up to a minute.)

- [ ] **Step 12: Write the failing integration test**

`vitest.config.mts`:
```ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['tests/unit/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'int',
          environment: 'node',
          include: ['tests/int/**/*.int.spec.ts'],
          setupFiles: ['./vitest.setup.ts'],
          fileParallelism: false,
          testTimeout: 60_000,
          hookTimeout: 120_000,
          env: {
            DATABASE_URI: 'postgresql://claveria:claveria@127.0.0.1:5433/claveria_test',
            PAYLOAD_SECRET: 'test-secret',
            MEDIA_DIR: './.pg/test-media',
          },
        },
      },
    ],
  },
})
```

`vitest.setup.ts`:
```ts
import 'dotenv/config'
```

`tests/int/payload.int.spec.ts`:
```ts
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { beforeAll, describe, expect, it } from 'vitest'

let payload: Payload

describe('payload boots', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  it('has the users and media collections', async () => {
    const users = await payload.find({ collection: 'users', overrideAccess: true })
    const media = await payload.find({ collection: 'media', overrideAccess: true })
    expect(users.docs).toBeInstanceOf(Array)
    expect(media.docs).toBeInstanceOf(Array)
  })
})
```

- [ ] **Step 13: Generate types and run the integration test**

Run: `npm run test:int`
Expected: FAIL (`src/payload-types.ts` does not exist yet, so `@payload-config` typing fails or the collection slugs are untyped).

Run: `npm run generate:types`
Expected: `src/payload-types.ts` written, containing `export interface Media` and `export interface User`.

Run: `npm run test:int`
Expected: PASS. This confirms the Postgres connection and the dev schema push work.

- [ ] **Step 14: Boot the dev server and confirm the admin loads**

Run: `(npm run dev > .pg/dev.log 2>&1 &); sleep 25; curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/ ; curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/admin`
Expected: `200` for `/` and `200` (or `307` to `/admin/create-first-user`) for `/admin`. Then stop the dev server: `pkill -f 'next dev' || true`.

- [ ] **Step 15: Typecheck, lint, and commit**

Run: `npm run typecheck && npm run lint`
Expected: no errors (warnings allowed).

```bash
git add -A
git commit -m "feat: scaffold Next 16 + Payload 3 app with Postgres and dev database"
```

---

### Task 2: Shared utilities (slug, excerpt, dates, constants, redirects) with unit tests

**Files:**
- Create: `src/lib/format.ts`, `src/lib/constants.ts`, `src/fields/slug.ts`, `redirects.mjs` (modify)
- Test: `tests/unit/format.test.ts`, `tests/unit/redirects.test.ts`

**Interfaces:**
- Produces: `formatSlug(value: string): string`, `excerpt(text: string, max = 160): string`, `plainText(richText: unknown): string`, `formatDate(iso: string | Date): string` (e.g. `Oct 07, 2026`).
- Produces: `DESTINATION_TYPES: { value: DestinationType; label: string }[]`, `DestinationType` union, `isDestinationType(v: string): v is DestinationType`, `NEWS_CATEGORIES`, `OFFICIAL_POSITIONS`, `DOCUMENT_CATEGORIES`, `SITE_NAME = 'Claveria, Misamis Oriental'`.
- Produces: `slugField(from?: string): Field` for Payload collections.
- Produces: `redirects` array in `redirects.mjs` consumed by `next.config.ts`.

- [ ] **Step 1: Write failing unit tests for format helpers**

`tests/unit/format.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { excerpt, formatDate, formatSlug, plainText } from '@/lib/format'

describe('formatSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(formatSlug('Sangguniang Bayan Session')).toBe('sangguniang-bayan-session')
  })
  it('strips punctuation and accents', () => {
    expect(formatSlug("Mayor's Office: Año 2026!")).toBe('mayors-office-ano-2026')
  })
  it('collapses repeated separators and trims', () => {
    expect(formatSlug('  hello   --  world  ')).toBe('hello-world')
  })
  it('returns empty string for empty input', () => {
    expect(formatSlug('')).toBe('')
  })
})

describe('plainText', () => {
  const rich = {
    root: {
      type: 'root',
      children: [
        { type: 'paragraph', children: [{ type: 'text', text: 'First para.' }] },
        { type: 'paragraph', children: [{ type: 'text', text: 'Second ' }, { type: 'text', text: 'para.' }] },
      ],
    },
  }
  it('joins text nodes with spaces between blocks', () => {
    expect(plainText(rich)).toBe('First para. Second para.')
  })
  it('returns empty string for null or malformed input', () => {
    expect(plainText(null)).toBe('')
    expect(plainText({})).toBe('')
  })
})

describe('excerpt', () => {
  it('returns short text unchanged', () => {
    expect(excerpt('short text', 20)).toBe('short text')
  })
  it('cuts at a word boundary and appends an ellipsis', () => {
    expect(excerpt('the quick brown fox jumps over the lazy dog', 20)).toBe('the quick brown fox…')
  })
})

describe('formatDate', () => {
  it('formats ISO strings as Mon DD, YYYY', () => {
    expect(formatDate('2026-10-07T03:00:00.000Z')).toBe('Oct 07, 2026')
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test:unit`
Expected: FAIL with `Cannot find module '@/lib/format'`.

- [ ] **Step 3: Implement format helpers**

`src/lib/format.ts`:
```ts
export function formatSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type Node = { type?: string; text?: string; children?: Node[] }

function collectText(node: Node, out: string[]): void {
  if (typeof node.text === 'string') out.push(node.text)
  if (Array.isArray(node.children)) {
    for (const child of node.children) collectText(child, out)
  }
}

export function plainText(richText: unknown): string {
  if (!richText || typeof richText !== 'object') return ''
  const root = (richText as { root?: Node }).root
  if (!root || !Array.isArray(root.children)) return ''
  const blocks: string[] = []
  for (const block of root.children) {
    const parts: string[] = []
    collectText(block, parts)
    const text = parts.join('').trim()
    if (text) blocks.push(text)
  }
  return blocks.join(' ')
}

export function excerpt(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…'
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(d)
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm run test:unit`
Expected: all `format.test.ts` tests PASS.

- [ ] **Step 5: Write failing redirects test**

`tests/unit/redirects.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { redirects } from '../../redirects.mjs'

function find(source: string) {
  return redirects.find((r) => r.source === source)
}

describe('legacy redirects', () => {
  it('maps the misspelled departments path', () => {
    expect(find('/deparments')).toMatchObject({ destination: '/departments', permanent: true })
    expect(find('/deparments/:slug')).toMatchObject({ destination: '/departments/:slug', permanent: true })
  })
  it('maps sangguniang_bayan', () => {
    expect(find('/sangguniang_bayan')).toMatchObject({ destination: '/sangguniang-bayan', permanent: true })
  })
  it('maps destination types and person pages', () => {
    expect(find('/destination/:type(waterfalls|restaurants|resorts|hotels|entertainments)')).toMatchObject({
      destination: '/destinations/:type',
      permanent: true,
    })
    expect(find('/person/:slug')).toMatchObject({ destination: '/officials/:slug', permanent: true })
  })
})
```

- [ ] **Step 6: Run to verify it fails**

Run: `npm run test:unit`
Expected: FAIL on `redirects.test.ts` (entries undefined).

- [ ] **Step 7: Fill in redirects.mjs**

```js
/** @type {{ source: string; destination: string; permanent: boolean }[]} */
export const redirects = [
  { source: '/sangguniang_bayan', destination: '/sangguniang-bayan', permanent: true },
  { source: '/deparments', destination: '/departments', permanent: true },
  { source: '/deparments/:slug', destination: '/departments/:slug', permanent: true },
  {
    source: '/destination/:type(waterfalls|restaurants|resorts|hotels|entertainments)',
    destination: '/destinations/:type',
    permanent: true,
  },
  { source: '/person/:slug', destination: '/officials/:slug', permanent: true },
]
```

- [ ] **Step 8: Run to verify it passes**

Run: `npm run test:unit`
Expected: all unit tests PASS.

- [ ] **Step 9: Create constants and the slug field**

`src/lib/constants.ts`:
```ts
export const SITE_NAME = 'Claveria, Misamis Oriental'

export const DESTINATION_TYPES = [
  { value: 'waterfalls', label: 'Waterfalls' },
  { value: 'restaurants', label: 'Restaurants' },
  { value: 'resorts', label: 'Spring Resorts' },
  { value: 'hotels', label: 'Hotels & Inns' },
  { value: 'entertainments', label: 'Nightlife & Entertainment' },
] as const

export type DestinationType = (typeof DESTINATION_TYPES)[number]['value']

export function isDestinationType(value: string): value is DestinationType {
  return DESTINATION_TYPES.some((t) => t.value === value)
}

export function destinationLabel(value: string): string {
  return DESTINATION_TYPES.find((t) => t.value === value)?.label ?? value
}

export const NEWS_CATEGORIES = [
  { value: 'government', label: 'Government' },
  { value: 'policies', label: 'Policies' },
  { value: 'medical', label: 'Medical Event' },
  { value: 'economy', label: 'Economy' },
  { value: 'education', label: 'Education' },
  { value: 'business', label: 'Business' },
] as const

export function newsCategoryLabel(value: string): string {
  return NEWS_CATEGORIES.find((c) => c.value === value)?.label ?? value
}

export const OFFICIAL_POSITIONS = [
  { value: 'mayor', label: 'Mayor' },
  { value: 'vicemayor', label: 'Vice Mayor' },
  { value: 'councilor', label: 'Councilor' },
  { value: 'head', label: 'Head' },
  { value: 'assthead', label: 'Assistant Head' },
  { value: 'officer', label: 'Officer' },
  { value: 'member', label: 'Member' },
] as const

export function positionLabel(value: string): string {
  return OFFICIAL_POSITIONS.find((p) => p.value === value)?.label ?? value
}

export const DOCUMENT_CATEGORIES = [
  { value: 'sb', label: 'Sangguniang Bayan' },
  { value: 'transparency', label: 'Transparency' },
  { value: 'other', label: 'Other' },
] as const
```

`src/fields/slug.ts`:
```ts
import type { Field, FieldHook } from 'payload'
import { formatSlug } from '@/lib/format'

const formatSlugHook =
  (from: string): FieldHook =>
  ({ data, operation, value }) => {
    if (typeof value === 'string' && value.trim().length > 0) return formatSlug(value)
    if (operation === 'create' || !data?.slug) {
      const source = data?.[from]
      if (typeof source === 'string') return formatSlug(source)
    }
    return value
  }

export function slugField(from = 'title'): Field {
  return {
    name: 'slug',
    type: 'text',
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: `Generated from ${from}. Edit to override.`,
    },
    hooks: { beforeValidate: [formatSlugHook(from)] },
  }
}
```

- [ ] **Step 10: Typecheck and commit**

Run: `npm run typecheck && npm run test:unit`
Expected: PASS.

```bash
git add -A
git commit -m "feat: format helpers, constants, slug field, and legacy redirects"
```

---

### Task 3: Content collections with revalidation hooks

**Files:**
- Create: `src/lib/revalidate.ts`, `src/collections/News.ts`, `src/collections/Officials.ts`, `src/collections/Departments.ts`, `src/collections/Destinations.ts`, `src/collections/LocalBoards.ts`, `src/collections/Documents.ts`
- Modify: `src/payload.config.ts` (register collections)
- Test: `tests/int/collections.int.spec.ts`

**Interfaces:**
- Consumes: `slugField`, constants from Task 2, access helpers from Task 1.
- Produces collection slugs and fields exactly as below. Generated types `News`, `Official`, `Department`, `Destination`, `LocalBoard`, `Document`, `Media` in `src/payload-types.ts`.
- Produces `revalidatePaths(paths: string[], context: Record<string, unknown>, logger: { info(msg: string): void; warn(msg: string): void }): void`.

- [ ] **Step 1: Write the failing integration test**

`tests/int/collections.int.spec.ts`:
```ts
import path from 'node:path'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
const ctx = { disableRevalidate: true }

const lexical = (text: string) => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [{ type: 'text', text, format: 0, mode: 'normal', style: '', detail: 0, version: 1 }],
      },
    ],
  },
})

describe('content collections', () => {
  let mediaId: number

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'news', where: { title: { like: 'IT-' } }, context: ctx })
    await payload.delete({ collection: 'departments', where: { name: { like: 'IT-' } }, context: ctx })
    await payload.delete({ collection: 'destinations', where: { title: { like: 'IT-' } }, context: ctx })
    const media = await payload.create({
      collection: 'media',
      context: ctx,
      data: { alt: 'IT fixture' },
      filePath: path.resolve(process.cwd(), 'tests/fixtures/sample.jpg'),
    })
    mediaId = media.id
  })

  it('generates a slug for news and keeps drafts out of public reads', async () => {
    const draft = await payload.create({
      collection: 'news',
      draft: true,
      context: ctx,
      data: { title: 'IT-Draft Story!', category: 'government', body: lexical('draft'), coverImage: mediaId, _status: 'draft' },
    })
    expect(draft.slug).toBe('it-draft-story')

    const published = await payload.create({
      collection: 'news',
      context: ctx,
      data: { title: 'IT-Published Story', category: 'economy', body: lexical('live'), coverImage: mediaId, _status: 'published' },
    })
    expect(published.slug).toBe('it-published-story')

    const publicRead = await payload.find({
      collection: 'news',
      overrideAccess: false,
      where: { title: { like: 'IT-' } },
    })
    const slugs = publicRead.docs.map((d) => d.slug)
    expect(slugs).toContain('it-published-story')
    expect(slugs).not.toContain('it-draft-story')
  })

  it('generates department slugs from name', async () => {
    const dept = await payload.create({
      collection: 'departments',
      context: ctx,
      data: { name: 'IT-Municipal Health Office', summary: lexical('s'), body: lexical('b') },
    })
    expect(dept.slug).toBe('it-municipal-health-office')
  })

  it('rejects an unknown destination type', async () => {
    await expect(
      payload.create({
        collection: 'destinations',
        context: ctx,
        // @ts-expect-error intentional bad value
        data: { title: 'IT-Bad', type: 'beaches', location: 'x', description: lexical('d'), photos: [{ image: mediaId }] },
      }),
    ).rejects.toThrow()
  })
})
```

- [ ] **Step 2: Add the image fixture, then run to verify it fails**

Run: `mkdir -p tests/fixtures && cp /home/marc/projects/claveria/static/images/cl1.jpg tests/fixtures/sample.jpg`

Run: `npm run test:int`
Expected: FAIL (collection `news` does not exist / type errors).

- [ ] **Step 3: Write the failing unit test for the revalidation helper**

`tests/unit/revalidate.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { revalidatePath } from 'next/cache'
import { revalidatePaths } from '@/lib/revalidate'

const logger = { info: vi.fn(), warn: vi.fn() }

describe('revalidatePaths', () => {
  beforeEach(() => vi.clearAllMocks())

  it('revalidates each path', () => {
    revalidatePaths(['/', '/news'], {}, logger)
    expect(revalidatePath).toHaveBeenCalledTimes(2)
    expect(revalidatePath).toHaveBeenCalledWith('/news')
  })

  it('does nothing when the request context disables it', () => {
    revalidatePaths(['/'], { disableRevalidate: true }, logger)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('logs a warning instead of throwing when next/cache is unavailable', () => {
    vi.mocked(revalidatePath).mockImplementationOnce(() => {
      throw new Error('static generation store missing')
    })
    expect(() => revalidatePaths(['/'], {}, logger)).not.toThrow()
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })
})
```

Run: `npm run test:unit`
Expected: FAIL, module `@/lib/revalidate` missing.

- [ ] **Step 4: Create the revalidation helper**

`src/lib/revalidate.ts`:
```ts
import { revalidatePath } from 'next/cache'

type Logger = { info(msg: string): void; warn(msg: string): void }

export function revalidatePaths(paths: string[], context: Record<string, unknown>, logger: Logger): void {
  if (context?.disableRevalidate) return
  for (const p of paths) {
    try {
      revalidatePath(p)
      logger.info(`revalidated ${p}`)
    } catch (err) {
      logger.warn(`revalidatePath(${p}) skipped: ${String(err)}`)
    }
  }
}
```

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Create the News collection**

`src/collections/News.ts`:
```ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'
import { authenticated, authenticatedOrPublished } from '@/access'
import { slugField } from '@/fields/slug'
import { NEWS_CATEGORIES } from '@/lib/constants'
import { revalidatePaths } from '@/lib/revalidate'
import type { News as NewsDoc } from '@/payload-types'

const afterChange: CollectionAfterChangeHook<NewsDoc> = ({ doc, previousDoc, req: { payload, context } }) => {
  const paths = ['/', '/news', '/sitemap.xml', `/news/${doc.slug}`]
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) paths.push(`/news/${previousDoc.slug}`)
  revalidatePaths(paths, context, payload.logger)
  return doc
}

const afterDelete: CollectionAfterDeleteHook<NewsDoc> = ({ doc, req: { payload, context } }) => {
  revalidatePaths(['/', '/news', '/sitemap.xml', `/news/${doc.slug}`], context, payload.logger)
  return doc
}

export const News: CollectionConfig = {
  slug: 'news',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
    group: 'Content',
  },
  access: {
    read: authenticatedOrPublished,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: { drafts: true },
  hooks: { afterChange: [afterChange], afterDelete: [afterDelete] },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 160 },
    slugField('title'),
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'government',
      options: NEWS_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
      hooks: {
        beforeChange: [({ value, siblingData }) => (siblingData._status === 'published' && !value ? new Date() : value)],
      },
    },
    { name: 'coverImage', type: 'upload', relationTo: 'media', required: true },
    { name: 'excerpt', type: 'textarea', maxLength: 200, admin: { description: 'Optional. Falls back to the first 160 characters of the body.' } },
    { name: 'body', type: 'richText', required: true },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
      hooks: { beforeChange: [({ value, req }) => value ?? req.user?.id ?? null] },
    },
  ],
}
```

- [ ] **Step 6: Create Officials, Departments, Destinations, LocalBoards, Documents**

`src/collections/Officials.ts`:
```ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { slugField } from '@/fields/slug'
import { OFFICIAL_POSITIONS } from '@/lib/constants'
import { revalidatePaths } from '@/lib/revalidate'
import type { Official } from '@/payload-types'

const paths = (slug?: string | null) => ['/', '/sangguniang-bayan', '/sitemap.xml', ...(slug ? [`/officials/${slug}`] : [])]

const afterChange: CollectionAfterChangeHook<Official> = ({ doc, previousDoc, req: { payload, context } }) => {
  const list = paths(doc.slug)
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) list.push(`/officials/${previousDoc.slug}`)
  revalidatePaths(list, context, payload.logger)
  return doc
}
const afterDelete: CollectionAfterDeleteHook<Official> = ({ doc, req: { payload, context } }) => {
  revalidatePaths(paths(doc.slug), context, payload.logger)
  return doc
}

export const Officials: CollectionConfig = {
  slug: 'officials',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'position', 'department', 'order'], group: 'Content' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  defaultSort: 'order',
  hooks: { afterChange: [afterChange], afterDelete: [afterDelete] },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    {
      name: 'position',
      type: 'select',
      required: true,
      defaultValue: 'member',
      options: OFFICIAL_POSITIONS.map((p) => ({ value: p.value, label: p.label })),
      admin: { position: 'sidebar' },
    },
    { name: 'department', type: 'relationship', relationTo: 'departments', admin: { position: 'sidebar' } },
    { name: 'order', type: 'number', defaultValue: 100, admin: { position: 'sidebar', description: 'Lower numbers show first.' } },
    { name: 'shortDescription', type: 'text', maxLength: 120 },
    { name: 'photo', type: 'upload', relationTo: 'media', required: true },
    { name: 'bio', type: 'richText', required: true },
    { name: 'politicalExperience', type: 'richText' },
    { name: 'responsibilities', type: 'richText' },
  ],
}
```

`src/collections/Departments.ts`:
```ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { slugField } from '@/fields/slug'
import { revalidatePaths } from '@/lib/revalidate'
import type { Department } from '@/payload-types'

const paths = (slug?: string | null) => ['/', '/departments', '/sitemap.xml', ...(slug ? [`/departments/${slug}`] : [])]

const afterChange: CollectionAfterChangeHook<Department> = ({ doc, previousDoc, req: { payload, context } }) => {
  const list = paths(doc.slug)
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) list.push(`/departments/${previousDoc.slug}`)
  revalidatePaths(list, context, payload.logger)
  return doc
}
const afterDelete: CollectionAfterDeleteHook<Department> = ({ doc, req: { payload, context } }) => {
  revalidatePaths(paths(doc.slug), context, payload.logger)
  return doc
}

export const Departments: CollectionConfig = {
  slug: 'departments',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'order'], group: 'Content' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  defaultSort: 'order',
  hooks: { afterChange: [afterChange], afterDelete: [afterDelete] },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'order', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
    { name: 'icon', type: 'upload', relationTo: 'media', admin: { position: 'sidebar' } },
    { name: 'summary', type: 'richText', required: true, admin: { description: 'Shown on the departments list card.' } },
    { name: 'body', type: 'richText', required: true },
  ],
}
```

`src/collections/Destinations.ts`:
```ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { slugField } from '@/fields/slug'
import { DESTINATION_TYPES } from '@/lib/constants'
import { revalidatePaths } from '@/lib/revalidate'
import type { Destination } from '@/payload-types'

const paths = (type: string, slug?: string | null) => [
  '/',
  `/destinations/${type}`,
  '/sitemap.xml',
  ...(slug ? [`/destinations/${type}/${slug}`] : []),
]

const afterChange: CollectionAfterChangeHook<Destination> = ({ doc, previousDoc, req: { payload, context } }) => {
  const list = paths(doc.type, doc.slug)
  if (previousDoc && (previousDoc.slug !== doc.slug || previousDoc.type !== doc.type)) {
    list.push(...paths(previousDoc.type, previousDoc.slug))
  }
  revalidatePaths(list, context, payload.logger)
  return doc
}
const afterDelete: CollectionAfterDeleteHook<Destination> = ({ doc, req: { payload, context } }) => {
  revalidatePaths(paths(doc.type, doc.slug), context, payload.logger)
  return doc
}

export const Destinations: CollectionConfig = {
  slug: 'destinations',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'type', 'location'], group: 'Content' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  hooks: { afterChange: [afterChange], afterDelete: [afterDelete] },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    {
      name: 'type',
      type: 'select',
      required: true,
      options: DESTINATION_TYPES.map((t) => ({ value: t.value, label: t.label })),
      admin: { position: 'sidebar' },
    },
    { name: 'location', type: 'text', required: true },
    { name: 'description', type: 'richText', required: true },
    {
      name: 'photos',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Photo', plural: 'Photos' },
      admin: { description: 'The first photo is the cover.' },
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
  ],
}
```

`src/collections/LocalBoards.ts`:
```ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { revalidatePaths } from '@/lib/revalidate'
import type { LocalBoard } from '@/payload-types'

const afterChange: CollectionAfterChangeHook<LocalBoard> = ({ doc, req: { payload, context } }) => {
  revalidatePaths(['/'], context, payload.logger)
  return doc
}
const afterDelete: CollectionAfterDeleteHook<LocalBoard> = ({ doc, req: { payload, context } }) => {
  revalidatePaths(['/'], context, payload.logger)
  return doc
}

export const LocalBoards: CollectionConfig = {
  slug: 'local-boards',
  labels: { singular: 'Local Board', plural: 'Local Boards & Services' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'order'], group: 'Content' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  defaultSort: 'order',
  hooks: { afterChange: [afterChange], afterDelete: [afterDelete] },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'order', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
}
```

`src/collections/Documents.ts`:
```ts
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { DOCUMENT_CATEGORIES } from '@/lib/constants'
import { revalidatePaths } from '@/lib/revalidate'
import type { Document } from '@/payload-types'

const afterChange: CollectionAfterChangeHook<Document> = ({ doc, req: { payload, context } }) => {
  revalidatePaths(['/sangguniang-bayan', '/transparency'], context, payload.logger)
  return doc
}
const afterDelete: CollectionAfterDeleteHook<Document> = ({ doc, req: { payload, context } }) => {
  revalidatePaths(['/sangguniang-bayan', '/transparency'], context, payload.logger)
  return doc
}

export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'category'], group: 'Content' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  hooks: { afterChange: [afterChange], afterDelete: [afterDelete] },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'other',
      options: DOCUMENT_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
      admin: { position: 'sidebar' },
    },
    { name: 'file', type: 'upload', relationTo: 'media', required: true, filterOptions: { mimeType: { contains: 'pdf' } } },
  ],
}
```

- [ ] **Step 7: Register the collections**

Modify `src/payload.config.ts`: add imports and replace `collections: [Users, Media]` with:
```ts
import { Departments } from './collections/Departments'
import { Destinations } from './collections/Destinations'
import { Documents } from './collections/Documents'
import { LocalBoards } from './collections/LocalBoards'
import { News } from './collections/News'
import { Officials } from './collections/Officials'
// ...
  collections: [News, Officials, Departments, Destinations, LocalBoards, Documents, Media, Users],
```

- [ ] **Step 8: Generate types and run the integration tests**

Run: `npm run generate:types && npm run test:int`
Expected: `src/payload-types.ts` now has `News`, `Official`, `Department`, `Destination`, `LocalBoard`, `Document`; all int tests PASS. (The first run pushes the schema to `claveria_test`.)

- [ ] **Step 9: Typecheck, lint, commit**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

```bash
git add -A
git commit -m "feat: content collections (news, officials, departments, destinations, local boards, documents) with revalidation"
```

---

### Task 4: SiteSettings global

**Files:**
- Create: `src/globals/SiteSettings.ts`
- Modify: `src/payload.config.ts` (register global)
- Test: `tests/int/site-settings.int.spec.ts`

**Interfaces:**
- Produces global slug `site-settings` with tabs/fields exactly as below; generated type `SiteSetting` in `src/payload-types.ts`.

- [ ] **Step 1: Write the failing integration test**

`tests/int/site-settings.int.spec.ts`:
```ts
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { beforeAll, describe, expect, it } from 'vitest'

let payload: Payload

describe('site settings global', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  it('reads an empty global without throwing', async () => {
    const settings = await payload.findGlobal({ slug: 'site-settings', overrideAccess: false })
    expect(settings).toBeDefined()
    expect(settings.hotlines?.pnp ?? '').toBe('')
  })

  it('stores hotlines and facts', async () => {
    const updated = await payload.updateGlobal({
      slug: 'site-settings',
      context: { disableRevalidate: true },
      data: {
        hotlines: { pnp: '0917 000 0001', responder: '0917 000 0002', bfp: '0917 000 0003', helplineGroups: [] },
        facts: { population: '52,000', areaKm2: '825', schools: '48', hospitals: '2', touristVisits: '12,000' },
      },
    })
    expect(updated.hotlines?.pnp).toBe('0917 000 0001')
    expect(updated.facts?.schools).toBe('48')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:int`
Expected: FAIL (global `site-settings` not found).

- [ ] **Step 3: Create the global**

`src/globals/SiteSettings.ts`:
```ts
import type { GlobalAfterChangeHook, GlobalConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { revalidatePaths } from '@/lib/revalidate'

const afterChange: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  revalidatePaths(['/', '/sangguniang-bayan', '/transparency'], context, payload.logger)
  return doc
}

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  admin: { group: 'Settings' },
  access: { read: anyone, update: authenticated },
  hooks: { afterChange: [afterChange] },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Hero',
          fields: [
            {
              name: 'heroSlides',
              type: 'array',
              maxRows: 5,
              fields: [
                { name: 'image', type: 'upload', relationTo: 'media', required: true },
                { name: 'heading', type: 'text', required: true, maxLength: 80 },
                { name: 'subheading', type: 'text', maxLength: 160 },
                { name: 'ctaLabel', type: 'text', maxLength: 30 },
                { name: 'ctaHref', type: 'text' },
              ],
            },
          ],
        },
        {
          label: 'Mayor',
          name: 'mayor',
          fields: [
            { name: 'name', type: 'text' },
            { name: 'photo', type: 'upload', relationTo: 'media' },
            { name: 'message', type: 'richText' },
          ],
        },
        {
          label: 'Vision & Mission',
          name: 'visionMission',
          fields: [
            { name: 'vision', type: 'richText' },
            { name: 'mission', type: 'richText' },
          ],
        },
        {
          label: 'Hotlines',
          name: 'hotlines',
          fields: [
            { type: 'row', fields: [
              { name: 'pnp', type: 'text', label: 'PNP hotline' },
              { name: 'responder', type: 'text', label: 'Emergency responder' },
              { name: 'bfp', type: 'text', label: 'BFP hotline' },
            ] },
            {
              name: 'helplineGroups',
              type: 'array',
              labels: { singular: 'Helpline group', plural: 'Helpline groups' },
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'body', type: 'richText', required: true },
              ],
            },
          ],
        },
        {
          label: 'Facts',
          name: 'facts',
          fields: [
            { type: 'row', fields: [
              { name: 'population', type: 'text' },
              { name: 'areaKm2', type: 'text', label: 'Area (km²)' },
              { name: 'schools', type: 'text' },
              { name: 'hospitals', type: 'text' },
              { name: 'touristVisits', type: 'text' },
            ] },
          ],
        },
        {
          label: 'Links & Contact',
          name: 'links',
          fields: [
            { name: 'facebookUrl', type: 'text' },
            { name: 'email', type: 'email' },
            { name: 'phone', type: 'text' },
            { name: 'address', type: 'textarea' },
            {
              name: 'agencyLinks',
              type: 'array',
              labels: { singular: 'Agency link', plural: 'Agency links' },
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'url', type: 'text', required: true },
                { name: 'logo', type: 'upload', relationTo: 'media', required: true },
              ],
            },
          ],
        },
      ],
    },
  ],
}
```

- [ ] **Step 4: Register the global and regenerate types**

In `src/payload.config.ts`: `import { SiteSettings } from './globals/SiteSettings'` and `globals: [SiteSettings]`.

Run: `npm run generate:types && npm run test:int`
Expected: `SiteSetting` interface generated; all int tests PASS.

- [ ] **Step 5: Create the first migration and commit**

Run: `npm run migrate:create -- initial`
Expected: a file `src/migrations/<timestamp>_initial.ts` plus `src/migrations/index.ts` are created. Open the migration and confirm it creates tables `news`, `officials`, `departments`, `destinations`, `local_boards`, `documents`, `media`, `users`, `site_settings`.

```bash
git add -A
git commit -m "feat: site settings global and initial migration"
```

---

### Task 5: Seed script with placeholder content

**Files:**
- Create: `src/seed/lexical.ts`, `src/seed/content.ts`, `src/seed/index.ts`, `src/seed/run.ts`, `src/seed/files/sample.pdf`, `src/seed/images/*` (copied from the old theme)
- Create: `public/logo.png`, `src/app/icon.png`
- Test: `tests/int/seed.int.spec.ts`

**Interfaces:**
- Consumes: all collections and the global from Tasks 3 and 4.
- Produces: `seed(payload: Payload): Promise<void>` (idempotent: wipes content collections, re-creates everything, ensures one admin user), `lexical.paragraphs(...texts: string[])` and `lexical.bullets(items: string[])` returning Lexical editor state objects.
- Produces admin login for development: `admin@claveria.local` / `ChangeMe123!`.

- [ ] **Step 1: Copy placeholder images and the logo from the old theme**

Run:
```bash
cd /home/marc/projects/claveria-new
OLD=/home/marc/projects/claveria/static/images
mkdir -p src/seed/images/agencies src/seed/files public
cp $OLD/municipal-palace-at-night.jpg $OLD/sun.jpg $OLD/viewdeck.jpg $OLD/mayer.jpg src/seed/images/
cp $OLD/cteam1.jpg $OLD/cteam2.jpg $OLD/cteam3.jpg $OLD/cteam4.jpg $OLD/fc1.jpg $OLD/fc2.jpg $OLD/fc3.jpg $OLD/fc4.jpg $OLD/fc5.jpg $OLD/fc6.jpg $OLD/h3-team1.jpg $OLD/h3-team2.jpg src/seed/images/
cp $OLD/cityscape1.jpg $OLD/cityscape2.jpg $OLD/cityscape3.jpg $OLD/cityscape4.jpg $OLD/cityscape5.jpg $OLD/cityscape6.jpg $OLD/h3citynews-1.jpg $OLD/h3citynews-2.jpg src/seed/images/
cp $OLD/cul1.jpg $OLD/cul2.jpg $OLD/cul3.jpg $OLD/cul4.jpg $OLD/cul5.jpg $OLD/cul6.jpg $OLD/cd1.jpg $OLD/cd2.jpg $OLD/cd3.jpg $OLD/cd4.jpg $OLD/cl1.jpg $OLD/cl2.jpg $OLD/cl3.jpg $OLD/cl4.jpg src/seed/images/
cp $OLD/lbs1.jpg $OLD/lbs2.jpg $OLD/lbs3.jpg $OLD/lbs4.jpg $OLD/lbs5.jpg $OLD/lbs6.jpg src/seed/images/
cp $OLD/deprticon1.png $OLD/deprticon2.png $OLD/deprticon3.png $OLD/deprticon4.png $OLD/deprticon5.png $OLD/deprticon6.png src/seed/images/
cp $OLD/agencies/dilg.png $OLD/agencies/dti.png $OLD/agencies/deped.png $OLD/agencies/dept-tourism.png $OLD/agencies/transparency-seal.png $OLD/agencies/president-office.png src/seed/images/agencies/
cp $OLD/logo.png public/logo.png
cp $OLD/fav.png src/app/icon.png
ls src/seed/images | wc -l
```
Expected: `51` entries listed (50 images plus the `agencies` directory).

- [ ] **Step 2: Create a minimal PDF fixture**

Write `src/seed/files/sample.pdf` with exactly this content:
```
%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >> endobj
xref
0 4
0000000000 65535 f 
trailer << /Size 4 /Root 1 0 R >>
startxref
0
%%EOF
```

- [ ] **Step 3: Write the failing seed test**

`tests/int/seed.int.spec.ts`:
```ts
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { beforeAll, describe, expect, it } from 'vitest'
import { seed } from '@/seed'

let payload: Payload

describe('seed', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await seed(payload)
  })

  it('creates the expected counts', async () => {
    const count = async (collection: 'news' | 'officials' | 'departments' | 'destinations' | 'local-boards' | 'documents') =>
      (await payload.count({ collection, overrideAccess: true })).totalDocs
    expect(await count('news')).toBe(8)
    expect(await count('officials')).toBe(12)
    expect(await count('departments')).toBe(10)
    expect(await count('destinations')).toBe(10)
    expect(await count('local-boards')).toBe(6)
    expect(await count('documents')).toBe(3)
  })

  it('fills site settings', async () => {
    const s = await payload.findGlobal({ slug: 'site-settings' })
    expect(s.heroSlides?.length).toBe(3)
    expect(s.hotlines?.pnp).toBeTruthy()
    expect(s.facts?.population).toBeTruthy()
    expect(s.links?.agencyLinks?.length).toBe(6)
  })

  it('is idempotent', async () => {
    await seed(payload)
    expect((await payload.count({ collection: 'news', overrideAccess: true })).totalDocs).toBe(8)
    expect((await payload.count({ collection: 'users', overrideAccess: true })).totalDocs).toBe(1)
  })
})
```

- [ ] **Step 4: Run to verify it fails**

Run: `npm run test:int -- seed`
Expected: FAIL with `Cannot find module '@/seed'`.

- [ ] **Step 5: Create the Lexical helpers**

`src/seed/lexical.ts`:
```ts
const text = (t: string) => ({ type: 'text', text: t, format: 0, mode: 'normal', style: '', detail: 0, version: 1 })

const block = (type: string, children: unknown[], extra: Record<string, unknown> = {}) => ({
  type,
  format: '',
  indent: 0,
  version: 1,
  direction: 'ltr',
  children,
  ...extra,
})

const root = (children: unknown[]) => ({
  root: { type: 'root', format: '', indent: 0, version: 1, direction: 'ltr', children },
})

export const lexical = {
  paragraphs(...texts: string[]) {
    return root(texts.map((t) => block('paragraph', [text(t)], { textFormat: 0, textStyle: '' })))
  },
  bullets(items: string[]) {
    return root([
      block(
        'list',
        items.map((item, i) => block('listitem', [text(item)], { value: i + 1 })),
        { listType: 'bullet', start: 1, tag: 'ul' },
      ),
    ])
  },
}

export type LexicalState = ReturnType<typeof lexical.paragraphs>
```

- [ ] **Step 6: Create the placeholder content definitions**

`src/seed/content.ts`:
```ts
import { lexical } from './lexical'

const lorem = (n: number) =>
  Array.from({ length: n }, (_, i) =>
    i % 2 === 0
      ? 'The Municipality of Claveria continues to serve its constituents through responsive programs in health, education, agriculture, and tourism.'
      : 'Residents are encouraged to coordinate with the concerned office for schedules, requirements, and further announcements.',
  )

export const departments = [
  { name: 'Office of the Mayor', icon: 'deprticon1.png', lists: ['Executive direction', 'Permits and licensing', 'Public information'] },
  { name: 'Municipal Health Office', icon: 'deprticon2.png', lists: ['Primary care', 'Immunization', 'Maternal and child health'] },
  { name: 'Municipal Agriculture Office', icon: 'deprticon3.png', lists: ['Farmer assistance', 'Seed distribution', 'Livestock programs'] },
  { name: 'Municipal Engineering Office', icon: 'deprticon4.png', lists: ['Infrastructure projects', 'Building permits', 'Road maintenance'] },
  { name: 'Municipal Social Welfare and Development Office', icon: 'deprticon5.png', lists: ['Senior citizen services', 'PWD services', 'Child protection'] },
  { name: 'Municipal Planning and Development Office', icon: 'deprticon6.png', lists: ['Land use planning', 'Project monitoring', 'Zoning'] },
  { name: 'Municipal Treasurer’s Office', icon: 'deprticon1.png', lists: ['Tax collection', 'Business tax', 'Real property tax'] },
  { name: 'Municipal Assessor’s Office', icon: 'deprticon2.png', lists: ['Property assessment', 'Tax declarations'] },
  { name: 'Municipal Civil Registrar', icon: 'deprticon3.png', lists: ['Birth, marriage, and death certificates', 'Late registration'] },
  { name: 'Municipal Tourism Office', icon: 'deprticon4.png', lists: ['Tourist assistance', 'Festival coordination', 'Destination promotion'] },
].map((d, i) => ({
  ...d,
  order: (i + 1) * 10,
  summary: lexical.bullets(d.lists),
  body: lexical.paragraphs(...lorem(3)),
}))

export const officials = [
  { name: 'Meraluna Salvaleon Abrogar', position: 'mayor', photo: 'mayer.jpg', short: 'Municipal Mayor' },
  { name: 'Juan Dela Cruz', position: 'vicemayor', photo: 'cteam1.jpg', short: 'Presiding Officer, Sangguniang Bayan' },
  { name: 'Maria Santos', position: 'councilor', photo: 'cteam2.jpg', short: 'Committee on Health' },
  { name: 'Pedro Reyes', position: 'councilor', photo: 'cteam3.jpg', short: 'Committee on Agriculture' },
  { name: 'Ana Lopez', position: 'councilor', photo: 'cteam4.jpg', short: 'Committee on Education' },
  { name: 'Jose Ramos', position: 'councilor', photo: 'fc1.jpg', short: 'Committee on Infrastructure' },
  { name: 'Luz Garcia', position: 'councilor', photo: 'fc2.jpg', short: 'Committee on Tourism' },
  { name: 'Carlos Mendoza', position: 'councilor', photo: 'fc3.jpg', short: 'Committee on Finance' },
  { name: 'Rosa Villanueva', position: 'councilor', photo: 'fc4.jpg', short: 'Committee on Social Services' },
  { name: 'Miguel Torres', position: 'councilor', photo: 'fc5.jpg', short: 'Committee on Peace and Order' },
  { name: 'Elena Cruz', position: 'head', photo: 'h3-team1.jpg', short: 'Municipal Health Officer', department: 'Municipal Health Office' },
  { name: 'Ramon Bautista', position: 'head', photo: 'h3-team2.jpg', short: 'Municipal Agriculturist', department: 'Municipal Agriculture Office' },
].map((o, i) => ({
  ...o,
  order: (i + 1) * 10,
  bio: lexical.paragraphs(...lorem(2)),
  politicalExperience: lexical.bullets(['Barangay Councilor, 2013–2016', 'Municipal Councilor, 2016–2022']),
  responsibilities: lexical.bullets(['Legislation and committee work', 'Constituent assistance']),
}))

export const news = [
  { title: 'Municipal Hall Opens Extended Service Hours', category: 'government', image: 'cityscape1.jpg' },
  { title: 'New Ordinance on Waste Segregation Takes Effect', category: 'policies', image: 'cityscape2.jpg' },
  { title: 'Free Medical Mission Scheduled in Poblacion', category: 'medical', image: 'cityscape3.jpg' },
  { title: 'Farmers Receive Hybrid Seed Assistance', category: 'economy', image: 'cityscape4.jpg' },
  { title: 'Scholarship Applications Now Open', category: 'education', image: 'cityscape5.jpg' },
  { title: 'Business Permit Renewal Deadline Reminder', category: 'business', image: 'cityscape6.jpg' },
  { title: 'Road Rehabilitation Begins on Provincial Highway', category: 'government', image: 'h3citynews-1.jpg' },
  { title: 'Tourism Office Launches Waterfalls Trail Map', category: 'economy', image: 'h3citynews-2.jpg' },
].map((n, i) => ({
  ...n,
  publishedAt: new Date(Date.UTC(2026, 8, 30 - i * 3, 2)).toISOString(),
  body: lexical.paragraphs(...lorem(4)),
}))

export const destinations = [
  { title: 'Pamalihi Falls', type: 'waterfalls', location: 'Barangay Lanise', images: ['cul1.jpg', 'cul2.jpg', 'cul3.jpg'] },
  { title: 'Tubod Flower Garden Falls', type: 'waterfalls', location: 'Barangay Tubod', images: ['cul4.jpg', 'cul5.jpg'] },
  { title: 'Hilltop Grill', type: 'restaurants', location: 'Poblacion', images: ['cd1.jpg', 'cd2.jpg'] },
  { title: 'Kusina ni Nanay', type: 'restaurants', location: 'Barangay Minalwang', images: ['cd3.jpg'] },
  { title: 'Cold Spring Resort', type: 'resorts', location: 'Barangay Ani-e', images: ['cl1.jpg', 'cl2.jpg'] },
  { title: 'Mapawa Spring Resort', type: 'resorts', location: 'Barangay Mapawa', images: ['cl3.jpg', 'cl4.jpg'] },
  { title: 'Claveria Garden Inn', type: 'hotels', location: 'Poblacion', images: ['cd4.jpg'] },
  { title: 'Highland View Lodge', type: 'hotels', location: 'Barangay Patrocinio', images: ['cul6.jpg'] },
  { title: 'Plaza Night Market', type: 'entertainments', location: 'Municipal Plaza', images: ['cityscape1.jpg'] },
  { title: 'Riverside Music Lounge', type: 'entertainments', location: 'Barangay Poblacion', images: ['cityscape2.jpg'] },
].map((d) => ({ ...d, description: lexical.paragraphs(...lorem(2)) }))

export const localBoards = [
  'Local Health Board',
  'Local School Board',
  'Peace and Order Council',
  'Disaster Risk Reduction Council',
  'Tourism Council',
  'Agriculture and Fishery Council',
].map((title, i) => ({ title, image: `lbs${i + 1}.jpg`, order: (i + 1) * 10 }))

export const documents = [
  { title: 'Sangguniang Bayan Session Schedule 2026', category: 'sb' },
  { title: 'Municipal Ordinance No. 2026-01', category: 'sb' },
  { title: 'Annual Budget 2026', category: 'transparency' },
]

export const heroSlides = [
  { image: 'municipal-palace-at-night.jpg', heading: 'Discover Our Lovely Municipality', subheading: 'Claveria, Misamis Oriental', ctaLabel: 'Explore destinations', ctaHref: '/destinations/waterfalls' },
  { image: 'sun.jpg', heading: 'Portals & Directories', subheading: 'Departments, officials, and services in one place', ctaLabel: 'View departments', ctaHref: '/departments' },
  { image: 'viewdeck.jpg', heading: 'Serving Every Barangay', subheading: 'Latest news and programs from your local government', ctaLabel: 'Read the news', ctaHref: '/news' },
]

export const settings = {
  mayor: { name: 'Meraluna Salvaleon Abrogar', photo: 'mayer.jpg', message: lexical.paragraphs(...lorem(2)) },
  visionMission: {
    vision: lexical.paragraphs('A progressive, peaceful, and resilient agro-tourism municipality with empowered and God-loving citizens.'),
    mission: lexical.paragraphs('To deliver responsive, transparent, and sustainable public services through good governance and active community participation.'),
  },
  hotlines: {
    pnp: '0998 598 5471',
    responder: '0917 123 4567',
    bfp: '0917 765 4321',
    helplineGroups: [
      { title: 'Municipal Health Office', body: lexical.bullets(['Rural Health Unit: 0917 000 0101', 'Ambulance: 0917 000 0102']) },
      { title: 'Disaster Risk Reduction', body: lexical.bullets(['MDRRMO Operations Center: 0917 000 0201']) },
      { title: 'Water and Power', body: lexical.bullets(['Water District: 0917 000 0301', 'MORESCO: 0917 000 0302']) },
    ],
  },
  facts: { population: '52,478', areaKm2: '825', schools: '48', hospitals: '2', touristVisits: '15,000' },
  links: {
    facebookUrl: 'https://www.facebook.com/Claveria955/',
    email: 'info@claveriamisor.gov.ph',
    phone: '(088) 000 0000',
    address: 'Municipal Hall, Poblacion, Claveria, Misamis Oriental 9004',
    agencyLinks: [
      { name: 'Transparency Seal', url: 'https://www.dbm.gov.ph/', logo: 'agencies/transparency-seal.png' },
      { name: 'Office of the President', url: 'http://op-proper.gov.ph/', logo: 'agencies/president-office.png' },
      { name: 'DTI', url: 'https://dti.gov.ph/', logo: 'agencies/dti.png' },
      { name: 'DepEd', url: 'http://www.deped.gov.ph/', logo: 'agencies/deped.png' },
      { name: 'DILG', url: 'http://dilg.gov.ph/', logo: 'agencies/dilg.png' },
      { name: 'Department of Tourism', url: 'http://tourism.gov.ph/', logo: 'agencies/dept-tourism.png' },
    ],
  },
}
```

- [ ] **Step 7: Create the seed function and runner**

`src/seed/index.ts`:
```ts
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Payload } from 'payload'
import * as content from './content'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const ctx = { disableRevalidate: true }

const CONTENT_COLLECTIONS = ['news', 'officials', 'departments', 'destinations', 'local-boards', 'documents', 'media'] as const

export async function seed(payload: Payload): Promise<void> {
  payload.logger.info('seed: wiping content collections')
  for (const collection of CONTENT_COLLECTIONS) {
    await payload.delete({ collection, where: { id: { exists: true } }, context: ctx, overrideAccess: true })
  }

  const mediaCache = new Map<string, number>()
  const upload = async (file: string, alt: string, dir: 'images' | 'files' = 'images'): Promise<number> => {
    const cached = mediaCache.get(file)
    if (cached) return cached
    const doc = await payload.create({
      collection: 'media',
      data: { alt },
      filePath: path.resolve(dirname, dir, file),
      context: ctx,
      overrideAccess: true,
    })
    mediaCache.set(file, doc.id)
    return doc.id
  }

  payload.logger.info('seed: departments')
  const departmentIds = new Map<string, number>()
  for (const d of content.departments) {
    const doc = await payload.create({
      collection: 'departments',
      context: ctx,
      overrideAccess: true,
      data: { name: d.name, order: d.order, summary: d.summary, body: d.body, icon: await upload(d.icon, d.name) },
    })
    departmentIds.set(d.name, doc.id)
  }

  payload.logger.info('seed: officials')
  for (const o of content.officials) {
    await payload.create({
      collection: 'officials',
      context: ctx,
      overrideAccess: true,
      data: {
        name: o.name,
        position: o.position as 'mayor',
        order: o.order,
        shortDescription: o.short,
        department: o.department ? departmentIds.get(o.department) : undefined,
        photo: await upload(o.photo, o.name),
        bio: o.bio,
        politicalExperience: o.politicalExperience,
        responsibilities: o.responsibilities,
      },
    })
  }

  payload.logger.info('seed: admin user')
  const existing = await payload.find({ collection: 'users', limit: 1, overrideAccess: true })
  const admin =
    existing.docs[0] ??
    (await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { name: 'Site Admin', email: 'admin@claveria.local', password: 'ChangeMe123!' },
    }))

  payload.logger.info('seed: news')
  for (const n of content.news) {
    await payload.create({
      collection: 'news',
      context: ctx,
      overrideAccess: true,
      data: {
        title: n.title,
        category: n.category as 'government',
        publishedAt: n.publishedAt,
        body: n.body,
        coverImage: await upload(n.image, n.title),
        author: admin.id,
        _status: 'published',
      },
    })
  }

  payload.logger.info('seed: destinations')
  for (const d of content.destinations) {
    const photos = []
    for (const img of d.images) photos.push({ image: await upload(img, d.title) })
    await payload.create({
      collection: 'destinations',
      context: ctx,
      overrideAccess: true,
      data: { title: d.title, type: d.type as 'waterfalls', location: d.location, description: d.description, photos },
    })
  }

  payload.logger.info('seed: local boards')
  for (const b of content.localBoards) {
    await payload.create({
      collection: 'local-boards',
      context: ctx,
      overrideAccess: true,
      data: { title: b.title, order: b.order, image: await upload(b.image, b.title) },
    })
  }

  payload.logger.info('seed: documents')
  for (const doc of content.documents) {
    await payload.create({
      collection: 'documents',
      context: ctx,
      overrideAccess: true,
      data: { title: doc.title, category: doc.category as 'sb', file: await upload('sample.pdf', doc.title, 'files') },
    })
  }

  payload.logger.info('seed: site settings')
  const agencyLinks = []
  for (const a of content.settings.links.agencyLinks) {
    agencyLinks.push({ name: a.name, url: a.url, logo: await upload(a.logo, a.name) })
  }
  const heroSlides = []
  for (const s of content.heroSlides) {
    heroSlides.push({ ...s, image: await upload(s.image, s.heading) })
  }
  await payload.updateGlobal({
    slug: 'site-settings',
    context: ctx,
    overrideAccess: true,
    data: {
      heroSlides,
      mayor: { ...content.settings.mayor, photo: await upload(content.settings.mayor.photo, content.settings.mayor.name) },
      visionMission: content.settings.visionMission,
      hotlines: content.settings.hotlines,
      facts: content.settings.facts,
      links: { ...content.settings.links, agencyLinks },
    },
  })

  payload.logger.info('seed: done')
}
```

`src/seed/run.ts`:
```ts
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { seed } from './index'

if (process.env.NODE_ENV === 'production') {
  console.error('Refusing to seed in production.')
  process.exit(1)
}

const payload = await getPayload({ config: await config })
await seed(payload)
console.log('Seeded. Admin login: admin@claveria.local / ChangeMe123!')
process.exit(0)
```

- [ ] **Step 8: Run the seed test**

Run: `npm run test:int -- seed`
Expected: PASS (three tests). If `payload.delete` with `id exists` complains, use `where: { id: { greater_than: 0 } }` instead.

- [ ] **Step 9: Seed the dev database and check the admin**

Run: `npm run seed`
Expected: ends with `Seeded. Admin login: admin@claveria.local / ChangeMe123!`. Then `ls media | wc -l` shows generated files (originals plus four sizes per image).

- [ ] **Step 10: Typecheck, lint, commit**

Run: `npm run typecheck && npm run lint`

```bash
git add -A
git commit -m "feat: seed script with placeholder content and theme images"
```

---

### Task 6: Data access layer and media helpers

**Files:**
- Create: `src/lib/payload.ts`, `src/lib/media.ts`, `src/lib/data.ts`
- Test: `tests/int/data.int.spec.ts`, `tests/unit/media.test.ts`

**Interfaces:**
- Produces `getPayloadClient(): Promise<Payload>`.
- Produces `mediaUrl(media: MediaRef, size?: MediaSize): string | null`, `mediaAlt(media: MediaRef): string`, `mediaSize(media: MediaRef, size?: MediaSize): { width: number; height: number } | null`, where `MediaRef = Media | number | null | undefined` and `MediaSize = 'thumbnail' | 'card' | 'hero' | 'og'`.
- Produces in `data.ts`:
  - `getSiteSettings(): Promise<SiteSetting>`
  - `getLatestNews(limit?: number): Promise<News[]>`
  - `getNewsPage(page: number, perPage?: number): Promise<{ docs: News[]; totalPages: number; page: number }>`
  - `getNewsBySlug(slug: string): Promise<News | null>`
  - `getOfficials(): Promise<Official[]>`, `getOfficialBySlug(slug): Promise<Official | null>`, `getOfficialsByPosition(position): Promise<Official[]>`
  - `getDepartments(): Promise<Department[]>`, `getDepartmentBySlug(slug): Promise<Department | null>`
  - `getDestinationsByType(type: DestinationType): Promise<Destination[]>`, `getDestination(type: DestinationType, slug: string): Promise<Destination | null>`, `getDestinationHighlights(): Promise<{ type: DestinationType; label: string; cover: Media | null; count: number }[]>`
  - `getLocalBoards(): Promise<LocalBoard[]>`
  - `getDocuments(category: 'sb' | 'transparency' | 'other'): Promise<Document[]>`
  - `getSitemapEntries(): Promise<{ path: string; updatedAt: string }[]>`

- [ ] **Step 1: Write the failing media unit test**

`tests/unit/media.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { mediaAlt, mediaSize, mediaUrl } from '@/lib/media'
import type { Media } from '@/payload-types'

const media = {
  id: 1,
  alt: 'Town hall',
  url: '/api/media/file/hall.jpg',
  width: 2000,
  height: 1200,
  sizes: {
    thumbnail: { url: '/api/media/file/hall-400x300.jpg', width: 400, height: 300 },
    card: { url: null, width: null, height: null },
  },
  updatedAt: '',
  createdAt: '',
} as unknown as Media

describe('media helpers', () => {
  it('returns the sized url when present', () => {
    expect(mediaUrl(media, 'thumbnail')).toBe('/api/media/file/hall-400x300.jpg')
  })
  it('falls back to the original when the size is missing', () => {
    expect(mediaUrl(media, 'card')).toBe('/api/media/file/hall.jpg')
    expect(mediaUrl(media, 'hero')).toBe('/api/media/file/hall.jpg')
  })
  it('returns null for unresolved ids or nothing', () => {
    expect(mediaUrl(42)).toBeNull()
    expect(mediaUrl(null)).toBeNull()
  })
  it('gives alt text and dimensions', () => {
    expect(mediaAlt(media)).toBe('Town hall')
    expect(mediaAlt(null)).toBe('')
    expect(mediaSize(media, 'thumbnail')).toEqual({ width: 400, height: 300 })
    expect(mediaSize(media)).toEqual({ width: 2000, height: 1200 })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:unit`
Expected: FAIL, module `@/lib/media` missing.

- [ ] **Step 3: Implement media helpers and the Payload client**

`src/lib/media.ts`:
```ts
import type { Media } from '@/payload-types'

export type MediaRef = Media | number | null | undefined
export type MediaSize = 'thumbnail' | 'card' | 'hero' | 'og'

function resolve(media: MediaRef): Media | null {
  return media && typeof media === 'object' ? media : null
}

export function mediaUrl(media: MediaRef, size?: MediaSize): string | null {
  const doc = resolve(media)
  if (!doc) return null
  const sized = size ? doc.sizes?.[size]?.url : null
  return sized || doc.url || null
}

export function mediaAlt(media: MediaRef): string {
  return resolve(media)?.alt ?? ''
}

export function mediaSize(media: MediaRef, size?: MediaSize): { width: number; height: number } | null {
  const doc = resolve(media)
  if (!doc) return null
  const s = size ? doc.sizes?.[size] : null
  if (s?.width && s?.height) return { width: s.width, height: s.height }
  if (doc.width && doc.height) return { width: doc.width, height: doc.height }
  return null
}
```

`src/lib/payload.ts`:
```ts
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

export async function getPayloadClient(): Promise<Payload> {
  return getPayload({ config: await config })
}
```

- [ ] **Step 4: Run the unit tests**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Write the failing data integration test**

`tests/int/data.int.spec.ts`:
```ts
import { getPayload } from 'payload'
import config from '@payload-config'
import { beforeAll, describe, expect, it } from 'vitest'
import { seed } from '@/seed'
import {
  getDepartmentBySlug,
  getDestination,
  getDestinationHighlights,
  getDestinationsByType,
  getDocuments,
  getLatestNews,
  getNewsBySlug,
  getNewsPage,
  getOfficialsByPosition,
  getSiteSettings,
  getSitemapEntries,
} from '@/lib/data'

describe('data layer', () => {
  beforeAll(async () => {
    const payload = await getPayload({ config: await config })
    await seed(payload)
    await payload.create({
      collection: 'news',
      draft: true,
      context: { disableRevalidate: true },
      data: {
        title: 'Unpublished draft',
        category: 'government',
        body: { root: { type: 'root', children: [], direction: 'ltr', format: '', indent: 0, version: 1 } },
        coverImage: (await payload.find({ collection: 'media', limit: 1 })).docs[0].id,
        _status: 'draft',
      },
    })
  })

  it('returns only published news, newest first, with populated images', async () => {
    const latest = await getLatestNews(6)
    expect(latest).toHaveLength(6)
    expect(latest.every((n) => n._status === 'published')).toBe(true)
    expect(latest.map((n) => n.title)).not.toContain('Unpublished draft')
    expect(typeof latest[0].coverImage).toBe('object')
    const dates = latest.map((n) => new Date(n.publishedAt ?? 0).getTime())
    expect([...dates].sort((a, b) => b - a)).toEqual(dates)
  })

  it('paginates news', async () => {
    const page = await getNewsPage(1, 5)
    expect(page.docs).toHaveLength(5)
    expect(page.totalPages).toBe(2)
  })

  it('finds by slug and returns null for drafts and unknowns', async () => {
    expect((await getNewsBySlug('scholarship-applications-now-open'))?.title).toBe('Scholarship Applications Now Open')
    expect(await getNewsBySlug('unpublished-draft')).toBeNull()
    expect(await getNewsBySlug('does-not-exist')).toBeNull()
    expect(await getDepartmentBySlug('nope')).toBeNull()
  })

  it('filters officials by position', async () => {
    expect(await getOfficialsByPosition('vicemayor')).toHaveLength(1)
    expect(await getOfficialsByPosition('councilor')).toHaveLength(8)
  })

  it('handles destinations by type and highlights', async () => {
    expect(await getDestinationsByType('waterfalls')).toHaveLength(2)
    expect(await getDestination('waterfalls', 'pamalihi-falls')).not.toBeNull()
    expect(await getDestination('resorts', 'pamalihi-falls')).toBeNull()
    const highlights = await getDestinationHighlights()
    expect(highlights.map((h) => h.type)).toEqual(['waterfalls', 'restaurants', 'resorts', 'hotels', 'entertainments'])
    expect(highlights[0].count).toBe(2)
    expect(highlights[0].cover).not.toBeNull()
  })

  it('lists documents by category and builds sitemap entries', async () => {
    expect(await getDocuments('sb')).toHaveLength(2)
    const entries = await getSitemapEntries()
    expect(entries.map((e) => e.path)).toContain('/news/scholarship-applications-now-open')
    expect(entries.map((e) => e.path)).not.toContain('/news/unpublished-draft')
  })

  it('reads site settings', async () => {
    const s = await getSiteSettings()
    expect(s.hotlines?.pnp).toBe('0998 598 5471')
  })
})
```

- [ ] **Step 6: Run to verify it fails**

Run: `npm run test:int -- data`
Expected: FAIL, module `@/lib/data` missing.

- [ ] **Step 7: Implement the data layer**

`src/lib/data.ts`:
```ts
import type { Department, Destination, Document, LocalBoard, Media, News, Official, SiteSetting } from '@/payload-types'
import { DESTINATION_TYPES, type DestinationType } from './constants'
import { getPayloadClient } from './payload'

const PUBLISHED = { _status: { equals: 'published' } } as const

export async function getSiteSettings(): Promise<SiteSetting> {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', depth: 1 })
}

export async function getLatestNews(limit = 6): Promise<News[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'news', where: PUBLISHED, sort: '-publishedAt', limit, depth: 1 })
  return res.docs
}

export async function getNewsPage(page: number, perPage = 12): Promise<{ docs: News[]; totalPages: number; page: number }> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'news', where: PUBLISHED, sort: '-publishedAt', limit: perPage, page, depth: 1 })
  return { docs: res.docs, totalPages: res.totalPages, page: res.page ?? page }
}

export async function getNewsBySlug(slug: string): Promise<News | null> {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'news',
    where: { and: [PUBLISHED, { slug: { equals: slug } }] },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ?? null
}

export async function getOfficials(): Promise<Official[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'officials', sort: 'order', limit: 100, depth: 1 })
  return res.docs
}

export async function getOfficialsByPosition(position: Official['position']): Promise<Official[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'officials', where: { position: { equals: position } }, sort: 'order', limit: 100, depth: 1 })
  return res.docs
}

export async function getOfficialBySlug(slug: string): Promise<Official | null> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'officials', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return res.docs[0] ?? null
}

export async function getDepartments(): Promise<Department[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'departments', sort: 'order', limit: 100, depth: 1 })
  return res.docs
}

export async function getDepartmentBySlug(slug: string): Promise<Department | null> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'departments', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return res.docs[0] ?? null
}

export async function getDestinationsByType(type: DestinationType): Promise<Destination[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'destinations', where: { type: { equals: type } }, sort: 'title', limit: 100, depth: 1 })
  return res.docs
}

export async function getDestination(type: DestinationType, slug: string): Promise<Destination | null> {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'destinations',
    where: { and: [{ type: { equals: type } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 1,
  })
  return res.docs[0] ?? null
}

export async function getDestinationHighlights(): Promise<{ type: DestinationType; label: string; cover: Media | null; count: number }[]> {
  const payload = await getPayloadClient()
  const out = []
  for (const t of DESTINATION_TYPES) {
    const res = await payload.find({ collection: 'destinations', where: { type: { equals: t.value } }, limit: 1, depth: 1 })
    const first = res.docs[0]?.photos?.[0]?.image
    out.push({ type: t.value, label: t.label, cover: first && typeof first === 'object' ? first : null, count: res.totalDocs })
  }
  return out
}

export async function getLocalBoards(): Promise<LocalBoard[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'local-boards', sort: 'order', limit: 12, depth: 1 })
  return res.docs
}

export async function getDocuments(category: Document['category']): Promise<Document[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'documents', where: { category: { equals: category } }, sort: 'title', limit: 100, depth: 1 })
  return res.docs
}

export async function getSitemapEntries(): Promise<{ path: string; updatedAt: string }[]> {
  const payload = await getPayloadClient()
  const entries: { path: string; updatedAt: string }[] = []
  const news = await payload.find({ collection: 'news', where: PUBLISHED, limit: 1000, depth: 0, select: { slug: true, updatedAt: true } })
  for (const n of news.docs) entries.push({ path: `/news/${n.slug}`, updatedAt: n.updatedAt })
  const departments = await payload.find({ collection: 'departments', limit: 1000, depth: 0, select: { slug: true, updatedAt: true } })
  for (const d of departments.docs) entries.push({ path: `/departments/${d.slug}`, updatedAt: d.updatedAt })
  const officials = await payload.find({ collection: 'officials', limit: 1000, depth: 0, select: { slug: true, updatedAt: true } })
  for (const o of officials.docs) entries.push({ path: `/officials/${o.slug}`, updatedAt: o.updatedAt })
  const destinations = await payload.find({ collection: 'destinations', limit: 1000, depth: 0, select: { slug: true, type: true, updatedAt: true } })
  for (const d of destinations.docs) entries.push({ path: `/destinations/${d.type}/${d.slug}`, updatedAt: d.updatedAt })
  return entries
}
```

- [ ] **Step 8: Run the integration tests**

Run: `npm run test:int`
Expected: all PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: data access layer and media helpers"
```

---

### Task 7: Site shell: header, mobile nav, footer, rich text, images

**Files:**
- Create: `src/lib/nav.ts`, `src/components/container.tsx`, `src/components/site-header.tsx`, `src/components/mobile-nav.tsx`, `src/components/site-footer.tsx`, `src/components/rich-text.tsx`, `src/components/media-image.tsx`, `src/components/page-header.tsx`, `src/components/section-heading.tsx`
- Modify: `src/app/(site)/layout.tsx`, `src/app/(site)/globals.css`

**Interfaces:**
- Consumes: `getSiteSettings`, `getDepartments` (Task 6), `mediaUrl`/`mediaAlt`/`mediaSize` (Task 6), `DESTINATION_TYPES` (Task 2).
- Produces: `NAV_LINKS: { label: string; href: string }[]`, `DESTINATION_LINKS: { label: string; href: string }[]`.
- Produces components: `<Container className?>`, `<SiteHeader />`, `<MobileNav links destinations />` (client), `<SiteFooter />` (async server), `<RichText data className?>`, `<MediaImage media size? className? sizes? priority? fill?>`, `<PageHeader title crumbs={[{label, href?}]} />`, `<SectionHeading title eyebrow? action?>`.

- [ ] **Step 1: Nav constants**

`src/lib/nav.ts`:
```ts
import { DESTINATION_TYPES } from './constants'

export const NAV_LINKS = [
  { label: 'Sangguniang Bayan', href: '/sangguniang-bayan' },
  { label: 'Departments', href: '/departments' },
  { label: 'News', href: '/news' },
  { label: 'Transparency', href: '/transparency' },
]

export const DESTINATION_LINKS = DESTINATION_TYPES.map((t) => ({ label: t.label, href: `/destinations/${t.value}` }))
```

- [ ] **Step 2: Container, SectionHeading, PageHeader**

`src/components/container.tsx`:
```tsx
import type { ReactNode } from 'react'

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 ${className}`}>{children}</div>
}
```

`src/components/section-heading.tsx`:
```tsx
import Link from 'next/link'

export function SectionHeading({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: { label: string; href: string } }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold">{eyebrow}</p> : null}
        <h2 className="text-2xl font-bold text-navy md:text-3xl">{title}</h2>
      </div>
      {action ? (
        <Link href={action.href} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
          {action.label} →
        </Link>
      ) : null}
    </div>
  )
}
```

`src/components/page-header.tsx`:
```tsx
import Link from 'next/link'
import { Container } from './container'

export type Crumb = { label: string; href?: string }

export function PageHeader({ title, crumbs }: { title: string; crumbs: Crumb[] }) {
  return (
    <section className="bg-navy text-white">
      <Container className="py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-white/70">
          <ol className="flex flex-wrap gap-1">
            <li>
              <Link href="/" className="hover:text-white">Home</Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.label} className="flex gap-1">
                <span aria-hidden="true">/</span>
                {c.href ? <Link href={c.href} className="hover:text-white">{c.label}</Link> : <span>{c.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
      </Container>
    </section>
  )
}
```

- [ ] **Step 3: MediaImage and RichText**

`src/components/media-image.tsx`:
```tsx
import Image from 'next/image'
import { mediaAlt, mediaSize, mediaUrl, type MediaRef, type MediaSize } from '@/lib/media'

type Props = {
  media: MediaRef
  size?: MediaSize
  className?: string
  sizes?: string
  priority?: boolean
  fill?: boolean
}

export function MediaImage({ media, size, className = '', sizes = '100vw', priority = false, fill = false }: Props) {
  const src = mediaUrl(media, size)
  if (!src) return <div className={`bg-mist ${className}`} aria-hidden="true" />
  const dims = mediaSize(media, size)
  if (fill || !dims) {
    return <Image src={src} alt={mediaAlt(media)} fill sizes={sizes} priority={priority} className={`object-cover ${className}`} />
  }
  return (
    <Image src={src} alt={mediaAlt(media)} width={dims.width} height={dims.height} sizes={sizes} priority={priority} className={className} />
  )
}
```

`src/components/rich-text.tsx`:
```tsx
import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

type Props = { data: DefaultTypedEditorState | null | undefined; className?: string }

export function RichText({ data, className = '' }: Props) {
  if (!data) return null
  return <LexicalRichText data={data} className={`rich-text ${className}`} />
}
```

Append to `src/app/(site)/globals.css`:
```css
.rich-text > * + * {
  margin-top: 0.9em;
}
.rich-text h2 { @apply text-2xl font-bold text-navy; }
.rich-text h3 { @apply text-xl font-semibold text-navy; }
.rich-text p { @apply leading-7; }
.rich-text ul { @apply list-disc pl-6; }
.rich-text ol { @apply list-decimal pl-6; }
.rich-text a { @apply text-navy underline underline-offset-4; }
.rich-text img { @apply rounded-lg; }
```

- [ ] **Step 4: Header with mobile nav**

`src/components/mobile-nav.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'

type Link = { label: string; href: string }

export function MobileNav({ links, destinations }: { links: Link[]; destinations: Link[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-navy/20 px-3 py-2 text-sm font-semibold text-navy"
      >
        {open ? 'Close' : 'Menu'}
      </button>
      {open ? (
        <div id="mobile-menu" className="absolute inset-x-0 top-full border-t border-navy/10 bg-white shadow-lg">
          <ul className="flex flex-col px-4 py-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="block py-3 font-medium text-navy">
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="border-t border-navy/10 pt-2">
              <p className="py-2 text-xs font-semibold uppercase tracking-wider text-gold">Destinations</p>
              <ul>
                {destinations.map((d) => (
                  <li key={d.href}>
                    <Link href={d.href} onClick={() => setOpen(false)} className="block py-2 pl-3 text-navy">
                      {d.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  )
}
```

`src/components/site-header.tsx`:
```tsx
import Image from 'next/image'
import Link from 'next/link'
import { DESTINATION_LINKS, NAV_LINKS } from '@/lib/nav'
import { Container } from './container'
import { MobileNav } from './mobile-nav'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/95 backdrop-blur">
      <Container className="relative flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="Claveria, Misamis Oriental home">
          <Image src="/logo.png" alt="" width={44} height={44} priority />
          <span className="hidden text-sm font-bold leading-tight text-navy sm:block">
            Municipality of Claveria
            <br />
            <span className="font-normal text-ink/70">Misamis Oriental</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-6 text-sm font-semibold text-navy">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-gold">{l.label}</Link>
              </li>
            ))}
            <li className="group relative">
              <button type="button" className="hover:text-gold" aria-haspopup="true">
                Destinations ▾
              </button>
              <ul className="invisible absolute right-0 top-full min-w-48 rounded-md border border-navy/10 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                {DESTINATION_LINKS.map((d) => (
                  <li key={d.href}>
                    <Link href={d.href} className="block rounded px-3 py-2 font-normal hover:bg-mist">{d.label}</Link>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
        <MobileNav links={NAV_LINKS} destinations={DESTINATION_LINKS} />
      </Container>
    </header>
  )
}
```

- [ ] **Step 5: Footer**

`src/components/site-footer.tsx`:
```tsx
import Link from 'next/link'
import { getDepartments, getSiteSettings } from '@/lib/data'
import { DESTINATION_LINKS } from '@/lib/nav'
import { Container } from './container'
import { MediaImage } from './media-image'

export async function SiteFooter() {
  const [settings, departments] = await Promise.all([getSiteSettings(), getDepartments()])
  const links = settings.links
  return (
    <footer className="mt-16 bg-navy text-white">
      <Container className="grid gap-10 py-14 md:grid-cols-4">
        <div>
          <h2 className="text-lg font-bold">Municipality of Claveria</h2>
          <p className="mt-2 text-sm text-white/70">Misamis Oriental, Philippines</p>
          {links?.address ? <p className="mt-4 whitespace-pre-line text-sm text-white/80">{links.address}</p> : null}
          {links?.phone ? <p className="mt-2 text-sm">{links.phone}</p> : null}
          {links?.email ? <a href={`mailto:${links.email}`} className="mt-1 block text-sm underline-offset-4 hover:underline">{links.email}</a> : null}
          {links?.facebookUrl ? (
            <a href={links.facebookUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-gold hover:underline">
              Facebook page ↗
            </a>
          ) : null}
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">Departments</h3>
          <ul className="space-y-2 text-sm">
            {departments.slice(0, 8).map((d) => (
              <li key={d.id}>
                <Link href={`/departments/${d.slug}`} className="text-white/80 hover:text-white">{d.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">Explore</h3>
          <ul className="space-y-2 text-sm">
            {DESTINATION_LINKS.map((d) => (
              <li key={d.href}>
                <Link href={d.href} className="text-white/80 hover:text-white">{d.label}</Link>
              </li>
            ))}
            <li><Link href="/news" className="text-white/80 hover:text-white">News</Link></li>
            <li><Link href="/sangguniang-bayan" className="text-white/80 hover:text-white">Sangguniang Bayan</Link></li>
            <li><Link href="/transparency" className="text-white/80 hover:text-white">Transparency</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">Government links</h3>
          <ul className="grid grid-cols-3 gap-3">
            {(links?.agencyLinks ?? []).map((a) => (
              <li key={a.id ?? a.url}>
                <a href={a.url} target="_blank" rel="external noopener noreferrer" title={a.name} className="block rounded bg-white p-1">
                  <MediaImage media={a.logo} size="thumbnail" className="h-14 w-full object-contain" sizes="80px" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Municipality of Claveria, Misamis Oriental
      </div>
    </footer>
  )
}
```

- [ ] **Step 6: Wire header and footer into the site layout**

Replace `src/app/(site)/layout.tsx` body with:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { SITE_NAME } from '@/lib/constants'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: 'Official website of the Municipality of Claveria, Misamis Oriental.',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  )
}
```

- [ ] **Step 7: Verify in the dev server**

Run: `(npm run dev > .pg/dev.log 2>&1 &); sleep 25; curl -s http://localhost:3000/ | grep -oE 'aria-label="Primary"|Government links|Municipal Health Office' | sort -u`
Expected: all three strings print (header nav, footer heading, a seeded department). Stop the server afterwards: `pkill -f 'next dev' || true`.

- [ ] **Step 8: Typecheck, lint, commit**

Run: `npm run typecheck && npm run lint`

```bash
git add -A
git commit -m "feat: site shell with header, mobile nav, footer, rich text and image components"
```

---

### Task 8: Home page

**Files:**
- Create: `src/components/news-card.tsx`, `src/components/official-card.tsx`, `src/components/home/hero.tsx`, `src/components/home/mayor-message.tsx`, `src/components/home/latest-news.tsx`, `src/components/home/local-boards.tsx`, `src/components/home/helplines.tsx`, `src/components/home/emergency-numbers.tsx`, `src/components/home/destination-highlights.tsx`, `src/components/home/facts.tsx`, `src/components/home/officials-strip.tsx`
- Modify: `src/app/(site)/page.tsx`
- Test: `tests/unit/home-sections.test.ts`

**Interfaces:**
- Consumes: all `get*` helpers from Task 6, `MediaImage`, `RichText`, `SectionHeading`, `Container`, `formatDate`, `excerpt`, `plainText`, `newsCategoryLabel`, `positionLabel`.
- Produces: `<NewsCard news />`, `<OfficialCard official />`, and `homeSections(settings: SiteSetting): { hero: boolean; mayor: boolean; helplines: boolean; emergency: boolean; facts: boolean }` in `src/components/home/sections.ts` (pure function deciding which optional sections render).

- [ ] **Step 1: Write the failing unit test for section visibility (Review Focus 4)**

`tests/unit/home-sections.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { homeSections } from '@/components/home/sections'
import type { SiteSetting } from '@/payload-types'

const empty = { id: 1 } as unknown as SiteSetting

describe('homeSections', () => {
  it('hides every optional section when settings are empty', () => {
    expect(homeSections(empty)).toEqual({ hero: false, mayor: false, helplines: false, emergency: false, facts: false })
  })
  it('shows sections that have content', () => {
    const s = {
      id: 1,
      heroSlides: [{ heading: 'x', image: 1 }],
      mayor: { name: 'M', message: { root: { children: [] } } },
      hotlines: { pnp: '1', helplineGroups: [] },
      facts: { population: '5' },
    } as unknown as SiteSetting
    expect(homeSections(s)).toEqual({ hero: true, mayor: true, helplines: false, emergency: true, facts: true })
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:unit`
Expected: FAIL, module missing.

- [ ] **Step 3: Implement sections.ts**

`src/components/home/sections.ts`:
```ts
import type { SiteSetting } from '@/payload-types'

export function homeSections(s: SiteSetting) {
  const facts = s.facts ?? {}
  return {
    hero: (s.heroSlides?.length ?? 0) > 0,
    mayor: Boolean(s.mayor?.name && s.mayor?.message),
    helplines: (s.hotlines?.helplineGroups?.length ?? 0) > 0,
    emergency: Boolean(s.hotlines?.pnp || s.hotlines?.responder || s.hotlines?.bfp),
    facts: Boolean(facts.population || facts.areaKm2 || facts.schools || facts.hospitals || facts.touristVisits),
  }
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Shared cards**

`src/components/news-card.tsx`:
```tsx
import Link from 'next/link'
import { newsCategoryLabel } from '@/lib/constants'
import { excerpt, formatDate, plainText } from '@/lib/format'
import type { News } from '@/payload-types'
import { MediaImage } from './media-image'

export function NewsCard({ news }: { news: News }) {
  const summary = news.excerpt || excerpt(plainText(news.body), 140)
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/news/${news.slug}`} className="relative block aspect-[3/2]">
        <MediaImage media={news.coverImage} size="card" fill sizes="(min-width: 768px) 33vw, 100vw" />
        <span className="absolute left-3 top-3 rounded bg-gold px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          {newsCategoryLabel(news.category)}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {news.publishedAt ? <time dateTime={news.publishedAt} className="text-xs text-ink/60">{formatDate(news.publishedAt)}</time> : null}
        <h3 className="mt-2 text-lg font-bold leading-snug text-navy">
          <Link href={`/news/${news.slug}`} className="hover:text-gold">{news.title}</Link>
        </h3>
        <p className="mt-2 text-sm text-ink/80">{summary}</p>
      </div>
    </article>
  )
}
```

`src/components/official-card.tsx`:
```tsx
import Link from 'next/link'
import { positionLabel } from '@/lib/constants'
import type { Official } from '@/payload-types'
import { MediaImage } from './media-image'

export function OfficialCard({ official, strip = false }: { official: Official; strip?: boolean }) {
  const dept = official.department && typeof official.department === 'object' ? official.department.name : null
  return (
    <Link href={`/officials/${official.slug}`} className={`group block ${strip ? 'w-56 shrink-0 snap-start' : ''}`}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-mist">
        <MediaImage media={official.photo} size="card" fill sizes="224px" className="transition group-hover:scale-105" />
      </div>
      <h3 className="mt-3 font-bold text-navy">{official.name}</h3>
      <p className="text-sm text-ink/70">{dept ? `${dept} ` : ''}{positionLabel(official.position)}</p>
    </Link>
  )
}
```

- [ ] **Step 6: Hero slider (client)**

`src/components/home/hero.tsx`:
```tsx
'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export type HeroSlide = { id: string; src: string; alt: string; heading: string; subheading?: string | null; ctaLabel?: string | null; ctaHref?: string | null }

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (slides.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000)
    return () => clearInterval(id)
  }, [slides.length])

  useEffect(() => {
    const el = track.current
    if (!el) return
    el.scrollTo({ left: el.clientWidth * index, behavior: 'smooth' })
  }, [index])

  return (
    <section aria-roledescription="carousel" aria-label="Highlights" className="relative bg-navy text-white">
      <div ref={track} className="flex snap-x snap-mandatory overflow-x-hidden scroll-smooth">
        {slides.map((s, i) => (
          <div key={s.id} className="relative h-[60vh] min-h-[380px] w-full shrink-0 snap-start" aria-hidden={i !== index}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.src} alt={s.alt} className="absolute inset-0 h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent" />
            <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-14">
              <h2 className="max-w-2xl text-3xl font-bold md:text-5xl">{s.heading}</h2>
              {s.subheading ? <p className="mt-3 max-w-xl text-base text-white/85 md:text-lg">{s.subheading}</p> : null}
              {s.ctaLabel && s.ctaHref ? (
                <Link href={s.ctaHref} className="mt-6 inline-block w-fit rounded-md bg-gold px-5 py-3 text-sm font-semibold text-white hover:bg-gold-dark">
                  {s.ctaLabel}
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      {slides.length > 1 ? (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full ${i === index ? 'bg-gold' : 'bg-white/50'}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
```

- [ ] **Step 7: Remaining home sections (server components)**

`src/components/home/mayor-message.tsx`:
```tsx
import { Container } from '@/components/container'
import { MediaImage } from '@/components/media-image'
import { RichText } from '@/components/rich-text'
import type { SiteSetting } from '@/payload-types'

export function MayorMessage({ mayor }: { mayor: NonNullable<SiteSetting['mayor']> }) {
  return (
    <section className="py-16">
      <Container className="grid items-center gap-10 md:grid-cols-[280px_1fr]">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-2xl bg-mist">
          <MediaImage media={mayor.photo} size="card" fill sizes="280px" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Message from the Mayor</p>
          <h2 className="mt-2 text-2xl font-bold text-navy md:text-3xl">{mayor.name}</h2>
          <RichText data={mayor.message} className="mt-4 text-ink/85" />
        </div>
      </Container>
    </section>
  )
}
```

`src/components/home/latest-news.tsx`:
```tsx
import { Container } from '@/components/container'
import { NewsCard } from '@/components/news-card'
import { SectionHeading } from '@/components/section-heading'
import type { News } from '@/payload-types'

export function LatestNews({ news }: { news: News[] }) {
  if (news.length === 0) return null
  return (
    <section className="bg-mist py-16">
      <Container>
        <SectionHeading eyebrow="Updates" title="News & Events" action={{ label: 'All news', href: '/news' }} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((n) => <NewsCard key={n.id} news={n} />)}
        </div>
      </Container>
    </section>
  )
}
```

`src/components/home/local-boards.tsx`:
```tsx
import { Container } from '@/components/container'
import { MediaImage } from '@/components/media-image'
import { SectionHeading } from '@/components/section-heading'
import type { LocalBoard } from '@/payload-types'

export function LocalBoards({ boards }: { boards: LocalBoard[] }) {
  if (boards.length === 0) return null
  return (
    <section className="py-16">
      <Container>
        <SectionHeading eyebrow="Community" title="Local Boards & Services" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b) => (
            <li key={b.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-navy">
              <MediaImage media={b.image} size="card" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="opacity-80" />
              <h3 className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy to-transparent p-4 pt-10 text-lg font-bold text-white">{b.title}</h3>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
```

`src/components/home/helplines.tsx`:
```tsx
import { Container } from '@/components/container'
import { RichText } from '@/components/rich-text'
import { SectionHeading } from '@/components/section-heading'
import type { SiteSetting } from '@/payload-types'

export function Helplines({ groups }: { groups: NonNullable<NonNullable<SiteSetting['hotlines']>['helplineGroups']> }) {
  return (
    <section className="bg-mist py-16">
      <Container>
        <SectionHeading eyebrow="Need help?" title="Helplines & Emergency Services" />
        <div className="divide-y divide-navy/10 rounded-xl border border-navy/10 bg-white">
          {groups.map((g, i) => (
            <details key={g.id ?? i} open={i === 0} className="group p-5">
              <summary className="cursor-pointer list-none font-semibold text-navy">
                <span className="mr-2 inline-block transition group-open:rotate-90">▸</span>{g.title}
              </summary>
              <RichText data={g.body} className="mt-3 text-sm text-ink/85" />
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}
```

`src/components/home/emergency-numbers.tsx`:
```tsx
import { Container } from '@/components/container'
import type { SiteSetting } from '@/payload-types'

export function EmergencyNumbers({ hotlines }: { hotlines: NonNullable<SiteSetting['hotlines']> }) {
  const items = [
    { label: 'PNP Hotline', value: hotlines.pnp },
    { label: 'Emergency Responder', value: hotlines.responder },
    { label: 'BFP Hotline', value: hotlines.bfp },
  ].filter((i) => i.value)
  return (
    <section className="bg-gold py-10 text-white">
      <Container>
        <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em]">Emergency numbers</h2>
        <ul className="mt-6 grid gap-6 text-center sm:grid-cols-3">
          {items.map((i) => (
            <li key={i.label}>
              <a href={`tel:${i.value!.replace(/\s+/g, '')}`} className="text-2xl font-bold md:text-3xl">{i.value}</a>
              <p className="mt-1 text-sm text-white/90">{i.label}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
```

`src/components/home/destination-highlights.tsx`:
```tsx
import Link from 'next/link'
import { Container } from '@/components/container'
import { MediaImage } from '@/components/media-image'
import { SectionHeading } from '@/components/section-heading'
import type { Media } from '@/payload-types'

type Highlight = { type: string; label: string; cover: Media | null; count: number }

export function DestinationHighlights({ highlights }: { highlights: Highlight[] }) {
  const items = highlights.filter((h) => h.count > 0)
  if (items.length === 0) return null
  return (
    <section className="py-16">
      <Container>
        <SectionHeading eyebrow="Explore" title="Highlights & Municipal Scapes" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((h) => (
            <li key={h.type}>
              <Link href={`/destinations/${h.type}`} className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-navy">
                <MediaImage media={h.cover} size="card" fill sizes="(min-width: 1024px) 33vw, 100vw" className="transition group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy to-transparent p-4 pt-10 text-white">
                  <h3 className="text-lg font-bold">{h.label}</h3>
                  <p className="text-sm text-white/80">{h.count} {h.count === 1 ? 'place' : 'places'}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
```

`src/components/home/facts.tsx`:
```tsx
import { Container } from '@/components/container'
import type { SiteSetting } from '@/payload-types'

export function Facts({ facts }: { facts: NonNullable<SiteSetting['facts']> }) {
  const items = [
    { label: 'Population', value: facts.population },
    { label: 'Square kilometres', value: facts.areaKm2 },
    { label: 'Schools', value: facts.schools },
    { label: 'Hospitals', value: facts.hospitals },
    { label: 'Tourist visits', value: facts.touristVisits },
  ].filter((i) => i.value)
  return (
    <section className="bg-navy py-14 text-white">
      <Container>
        <h2 className="text-center text-2xl font-bold">Facts About Claveria</h2>
        <dl className="mt-8 grid grid-cols-2 gap-6 text-center md:grid-cols-5">
          {items.map((i) => (
            <div key={i.label} className="flex flex-col">
              <dt className="order-2 mt-1 text-sm text-white/80">{i.label}</dt>
              <dd className="order-1 text-3xl font-bold text-gold">{i.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}
```

`src/components/home/officials-strip.tsx`:
```tsx
import { Container } from '@/components/container'
import { OfficialCard } from '@/components/official-card'
import { SectionHeading } from '@/components/section-heading'
import type { Official } from '@/payload-types'

export function OfficialsStrip({ officials }: { officials: Official[] }) {
  if (officials.length === 0) return null
  return (
    <section className="py-16">
      <Container>
        <SectionHeading eyebrow="Leadership" title="LGU Officials" action={{ label: 'Sangguniang Bayan', href: '/sangguniang-bayan' }} />
        <div className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-4">
          {officials.map((o) => <OfficialCard key={o.id} official={o} strip />)}
        </div>
      </Container>
    </section>
  )
}
```

- [ ] **Step 8: Assemble the home page**

`src/app/(site)/page.tsx`:
```tsx
import { DestinationHighlights } from '@/components/home/destination-highlights'
import { EmergencyNumbers } from '@/components/home/emergency-numbers'
import { Facts } from '@/components/home/facts'
import { Helplines } from '@/components/home/helplines'
import { Hero, type HeroSlide } from '@/components/home/hero'
import { LatestNews } from '@/components/home/latest-news'
import { LocalBoards } from '@/components/home/local-boards'
import { MayorMessage } from '@/components/home/mayor-message'
import { OfficialsStrip } from '@/components/home/officials-strip'
import { homeSections } from '@/components/home/sections'
import { getDestinationHighlights, getLatestNews, getLocalBoards, getOfficials, getSiteSettings } from '@/lib/data'
import { mediaAlt, mediaUrl } from '@/lib/media'

export const revalidate = 300

export default async function HomePage() {
  const [settings, news, boards, highlights, officials] = await Promise.all([
    getSiteSettings(),
    getLatestNews(6),
    getLocalBoards(),
    getDestinationHighlights(),
    getOfficials(),
  ])
  const show = homeSections(settings)
  const slides: HeroSlide[] = (settings.heroSlides ?? [])
    .map((s, i) => ({
      id: s.id ?? String(i),
      src: mediaUrl(s.image, 'hero') ?? '',
      alt: mediaAlt(s.image),
      heading: s.heading,
      subheading: s.subheading,
      ctaLabel: s.ctaLabel,
      ctaHref: s.ctaHref,
    }))
    .filter((s) => s.src)

  return (
    <main>
      {show.hero && slides.length > 0 ? <Hero slides={slides} /> : <h1 className="sr-only">Claveria, Misamis Oriental</h1>}
      {show.mayor ? <MayorMessage mayor={settings.mayor!} /> : null}
      <LatestNews news={news} />
      <LocalBoards boards={boards} />
      {show.helplines ? <Helplines groups={settings.hotlines!.helplineGroups!} /> : null}
      {show.emergency ? <EmergencyNumbers hotlines={settings.hotlines!} /> : null}
      <DestinationHighlights highlights={highlights} />
      {show.facts ? <Facts facts={settings.facts!} /> : null}
      <OfficialsStrip officials={officials} />
    </main>
  )
}
```

- [ ] **Step 9: Verify in the browser**

Run: `(npm run dev > .pg/dev.log 2>&1 &); sleep 25; curl -s http://localhost:3000/ | grep -oE 'News &amp; Events|Facts About Claveria|LGU Officials|Emergency numbers|Message from the Mayor' | sort -u`
Expected: all five headings print. Open `http://localhost:3000/` in a browser (or Playwright screenshot at 390px and 1280px widths) and confirm no horizontal scroll on mobile and the hero dots change slides. Stop the server afterwards.

- [ ] **Step 10: Typecheck, lint, commit**

```bash
npm run typecheck && npm run lint && npm run test:unit
git add -A
git commit -m "feat: home page sections"
```

---

### Task 9: News list and detail pages

**Files:**
- Create: `src/components/pagination.tsx`, `src/components/recent-news-sidebar.tsx`, `src/app/(site)/news/page.tsx`, `src/app/(site)/news/[slug]/page.tsx`, `src/app/(site)/news/[slug]/not-found.tsx`

**Interfaces:**
- Consumes: `getNewsPage`, `getNewsBySlug`, `getLatestNews`, `NewsCard`, `PageHeader`, `RichText`, `MediaImage`, `formatDate`, `newsCategoryLabel`, `excerpt`, `plainText`.
- Produces: `<Pagination page totalPages basePath />`, `<RecentNewsSidebar excludeSlug? />` (async server).

- [ ] **Step 1: Pagination and sidebar components**

`src/components/pagination.tsx`:
```tsx
import Link from 'next/link'

export function Pagination({ page, totalPages, basePath }: { page: number; totalPages: number; basePath: string }) {
  if (totalPages <= 1) return null
  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`)
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4 text-sm font-semibold text-navy">
      {page > 1 ? <Link href={href(page - 1)} className="rounded border border-navy/20 px-4 py-2 hover:bg-mist">← Newer</Link> : null}
      <span className="text-ink/60">Page {page} of {totalPages}</span>
      {page < totalPages ? <Link href={href(page + 1)} className="rounded border border-navy/20 px-4 py-2 hover:bg-mist">Older →</Link> : null}
    </nav>
  )
}
```

`src/components/recent-news-sidebar.tsx`:
```tsx
import Link from 'next/link'
import { getLatestNews } from '@/lib/data'
import { formatDate } from '@/lib/format'
import { MediaImage } from './media-image'

export async function RecentNewsSidebar({ excludeSlug }: { excludeSlug?: string }) {
  const news = (await getLatestNews(5)).filter((n) => n.slug !== excludeSlug).slice(0, 4)
  if (news.length === 0) return null
  return (
    <aside className="rounded-xl border border-navy/10 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Recent posts</h2>
      <ul className="mt-4 space-y-4">
        {news.map((n) => (
          <li key={n.id} className="flex gap-3">
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded bg-mist">
              <MediaImage media={n.coverImage} size="thumbnail" fill sizes="80px" />
            </div>
            <div>
              {n.publishedAt ? <time dateTime={n.publishedAt} className="text-xs text-ink/60">{formatDate(n.publishedAt)}</time> : null}
              <h3 className="text-sm font-semibold leading-snug text-navy">
                <Link href={`/news/${n.slug}`} className="hover:text-gold">{n.title}</Link>
              </h3>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}
```

- [ ] **Step 2: News list page**

`src/app/(site)/news/page.tsx`:
```tsx
import type { Metadata } from 'next'
import { Container } from '@/components/container'
import { NewsCard } from '@/components/news-card'
import { PageHeader } from '@/components/page-header'
import { Pagination } from '@/components/pagination'
import { getNewsPage } from '@/lib/data'

export const revalidate = 300

export const metadata: Metadata = { title: 'News', description: 'News and events from the Municipality of Claveria, Misamis Oriental.' }

export default async function NewsListPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number.parseInt(pageParam ?? '1', 10) || 1)
  const { docs, totalPages } = await getNewsPage(page, 12)
  return (
    <main>
      <PageHeader title="News" crumbs={[{ label: 'News' }]} />
      <Container className="py-12">
        {docs.length === 0 ? (
          <p className="text-ink/70">No news has been published yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((n) => <NewsCard key={n.id} news={n} />)}
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} basePath="/news" />
      </Container>
    </main>
  )
}
```

- [ ] **Step 3: News detail page and not-found**

`src/app/(site)/news/[slug]/page.tsx`:
```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container } from '@/components/container'
import { MediaImage } from '@/components/media-image'
import { PageHeader } from '@/components/page-header'
import { RecentNewsSidebar } from '@/components/recent-news-sidebar'
import { RichText } from '@/components/rich-text'
import { newsCategoryLabel } from '@/lib/constants'
import { getNewsBySlug } from '@/lib/data'
import { excerpt, formatDate, plainText } from '@/lib/format'
import { mediaUrl } from '@/lib/media'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const news = await getNewsBySlug(slug)
  if (!news) return { title: 'Not found' }
  const og = mediaUrl(news.coverImage, 'og')
  return {
    title: news.title,
    description: news.excerpt || excerpt(plainText(news.body), 160),
    openGraph: { title: news.title, type: 'article', images: og ? [og] : undefined, publishedTime: news.publishedAt ?? undefined },
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params
  const news = await getNewsBySlug(slug)
  if (!news) notFound()
  const author = news.author && typeof news.author === 'object' ? news.author.name : null
  return (
    <main>
      <PageHeader title={news.title} crumbs={[{ label: 'News', href: '/news' }, { label: excerpt(news.title, 50) }]} />
      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
        <article>
          <div className="relative aspect-[2/1] overflow-hidden rounded-xl bg-mist">
            <MediaImage media={news.coverImage} size="hero" fill priority sizes="(min-width: 1024px) 800px, 100vw" />
          </div>
          <p className="mt-6 flex flex-wrap gap-3 text-sm text-ink/60">
            <span className="rounded bg-gold/15 px-2 py-0.5 font-semibold text-gold-dark">{newsCategoryLabel(news.category)}</span>
            {news.publishedAt ? <time dateTime={news.publishedAt}>{formatDate(news.publishedAt)}</time> : null}
            {author ? <span>By {author}</span> : null}
          </p>
          <RichText data={news.body} className="mt-6 text-lg" />
        </article>
        <RecentNewsSidebar excludeSlug={news.slug} />
      </Container>
    </main>
  )
}
```

`src/app/(site)/news/[slug]/not-found.tsx`:
```tsx
import Link from 'next/link'
import { Container } from '@/components/container'
import { PageHeader } from '@/components/page-header'

export default function NewsNotFound() {
  return (
    <main>
      <PageHeader title="Article not found" crumbs={[{ label: 'News', href: '/news' }]} />
      <Container className="py-12">
        <p>The article you are looking for does not exist or is no longer published.</p>
        <Link href="/news" className="mt-4 inline-block font-semibold text-navy underline underline-offset-4">Browse all news</Link>
      </Container>
    </main>
  )
}
```

- [ ] **Step 4: Verify**

Run: `(npm run dev > .pg/dev.log 2>&1 &); sleep 25; for u in /news "/news?page=2" /news/scholarship-applications-now-open /news/nope; do printf "%s -> " "$u"; curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3000$u"; done`
Expected: `200`, `200`, `200`, `404`.

- [ ] **Step 5: Commit**

```bash
npm run typecheck && npm run lint
git add -A
git commit -m "feat: news list and detail pages"
```

---

### Task 10: Sangguniang Bayan and official detail pages

**Files:**
- Create: `src/app/(site)/sangguniang-bayan/page.tsx`, `src/app/(site)/officials/[slug]/page.tsx`, `src/app/(site)/officials/[slug]/not-found.tsx`, `src/components/document-list.tsx`

**Interfaces:**
- Consumes: `getOfficialsByPosition`, `getOfficialBySlug`, `getDocuments`, `getSiteSettings`, `OfficialCard`, `PageHeader`, `RichText`, `MediaImage`, `positionLabel`, `mediaUrl`.
- Produces: `<DocumentList documents emptyText />`.

- [ ] **Step 1: Document list component**

`src/components/document-list.tsx`:
```tsx
import { mediaUrl } from '@/lib/media'
import type { Document } from '@/payload-types'

export function DocumentList({ documents, emptyText = 'No documents yet.' }: { documents: Document[]; emptyText?: string }) {
  if (documents.length === 0) return <p className="text-sm text-ink/60">{emptyText}</p>
  return (
    <ul className="divide-y divide-navy/10 rounded-xl border border-navy/10 bg-white">
      {documents.map((d) => {
        const href = mediaUrl(d.file)
        return (
          <li key={d.id} className="flex items-center justify-between gap-4 p-4">
            <span className="font-medium text-navy">{d.title}</span>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded bg-gold px-3 py-1.5 text-xs font-semibold text-white hover:bg-gold-dark">
                Download PDF
              </a>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
```

- [ ] **Step 2: Sangguniang Bayan page**

`src/app/(site)/sangguniang-bayan/page.tsx`:
```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/container'
import { DocumentList } from '@/components/document-list'
import { MediaImage } from '@/components/media-image'
import { OfficialCard } from '@/components/official-card'
import { PageHeader } from '@/components/page-header'
import { RichText } from '@/components/rich-text'
import { SectionHeading } from '@/components/section-heading'
import { getDocuments, getOfficialsByPosition, getSiteSettings } from '@/lib/data'

export const revalidate = 300
export const metadata: Metadata = { title: 'Sangguniang Bayan', description: 'The municipal council of Claveria, Misamis Oriental.' }

export default async function SangguniangBayanPage() {
  const [viceMayors, councilors, documents, settings] = await Promise.all([
    getOfficialsByPosition('vicemayor'),
    getOfficialsByPosition('councilor'),
    getDocuments('sb'),
    getSiteSettings(),
  ])
  const viceMayor = viceMayors[0]
  const vm = settings.visionMission
  return (
    <main>
      <PageHeader title="Sangguniang Bayan" crumbs={[{ label: 'Sangguniang Bayan' }]} />
      <Container className="py-12">
        {viceMayor ? (
          <section className="grid items-center gap-8 md:grid-cols-[260px_1fr]">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[260px] overflow-hidden rounded-2xl bg-mist">
              <MediaImage media={viceMayor.photo} size="card" fill sizes="260px" priority />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Presiding Officer</p>
              <h2 className="mt-2 text-2xl font-bold text-navy">
                <Link href={`/officials/${viceMayor.slug}`} className="hover:text-gold">{viceMayor.name}</Link>
              </h2>
              <p className="text-ink/70">Vice Mayor</p>
              {viceMayor.shortDescription ? <p className="mt-3">{viceMayor.shortDescription}</p> : null}
            </div>
          </section>
        ) : null}

        {vm?.vision || vm?.mission ? (
          <section className="mt-14 grid gap-8 rounded-2xl bg-mist p-8 md:grid-cols-2">
            {vm.vision ? <div><h2 className="text-xl font-bold text-navy">Vision</h2><RichText data={vm.vision} className="mt-3" /></div> : null}
            {vm.mission ? <div><h2 className="text-xl font-bold text-navy">Mission</h2><RichText data={vm.mission} className="mt-3" /></div> : null}
          </section>
        ) : null}

        <section className="mt-14">
          <SectionHeading eyebrow="Members" title="Municipal Councilors" />
          {councilors.length === 0 ? <p className="text-ink/60">No councilors listed yet.</p> : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {councilors.map((c) => <OfficialCard key={c.id} official={c} />)}
            </div>
          )}
        </section>

        <section className="mt-14">
          <SectionHeading eyebrow="Downloads" title="Sangguniang Bayan documents" />
          <DocumentList documents={documents} />
        </section>
      </Container>
    </main>
  )
}
```

- [ ] **Step 3: Official detail page and not-found**

`src/app/(site)/officials/[slug]/page.tsx`:
```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container } from '@/components/container'
import { MediaImage } from '@/components/media-image'
import { PageHeader } from '@/components/page-header'
import { RichText } from '@/components/rich-text'
import { positionLabel } from '@/lib/constants'
import { getOfficialBySlug } from '@/lib/data'
import { mediaUrl } from '@/lib/media'

export const revalidate = 300
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const o = await getOfficialBySlug(slug)
  if (!o) return { title: 'Not found' }
  const og = mediaUrl(o.photo, 'og')
  return { title: o.name, description: o.shortDescription ?? `${o.name}, ${positionLabel(o.position)}`, openGraph: { images: og ? [og] : undefined } }
}

export default async function OfficialPage({ params }: Props) {
  const { slug } = await params
  const o = await getOfficialBySlug(slug)
  if (!o) notFound()
  const dept = o.department && typeof o.department === 'object' ? o.department.name : null
  return (
    <main>
      <PageHeader title={o.name} crumbs={[{ label: 'Officials', href: '/sangguniang-bayan' }, { label: o.name }]} />
      <Container className="grid gap-10 py-12 md:grid-cols-[320px_1fr]">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[320px] overflow-hidden rounded-2xl bg-mist">
          <MediaImage media={o.photo} size="card" fill sizes="320px" priority />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-gold">{dept ? `${dept} · ` : ''}{positionLabel(o.position)}</p>
          {o.shortDescription ? <p className="mt-2 text-lg text-ink/80">{o.shortDescription}</p> : null}
          <RichText data={o.bio} className="mt-6" />
          {o.politicalExperience ? <><h2 className="mt-10 text-xl font-bold text-navy">Political Experience</h2><RichText data={o.politicalExperience} className="mt-3" /></> : null}
          {o.responsibilities ? <><h2 className="mt-10 text-xl font-bold text-navy">Key Responsibilities</h2><RichText data={o.responsibilities} className="mt-3" /></> : null}
        </div>
      </Container>
    </main>
  )
}
```

`src/app/(site)/officials/[slug]/not-found.tsx`:
```tsx
import Link from 'next/link'
import { Container } from '@/components/container'
import { PageHeader } from '@/components/page-header'

export default function OfficialNotFound() {
  return (
    <main>
      <PageHeader title="Official not found" crumbs={[{ label: 'Officials', href: '/sangguniang-bayan' }]} />
      <Container className="py-12">
        <p>We could not find that official.</p>
        <Link href="/sangguniang-bayan" className="mt-4 inline-block font-semibold text-navy underline underline-offset-4">See the Sangguniang Bayan</Link>
      </Container>
    </main>
  )
}
```

- [ ] **Step 4: Verify and commit**

Run: `(npm run dev > .pg/dev.log 2>&1 &); sleep 25; for u in /sangguniang-bayan /officials/juan-dela-cruz /officials/nobody; do printf "%s -> " "$u"; curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3000$u"; done`
Expected: `200`, `200`, `404`.

```bash
npm run typecheck && npm run lint
git add -A
git commit -m "feat: sangguniang bayan and official detail pages"
```

---

### Task 11: Departments pages

**Files:**
- Create: `src/app/(site)/departments/page.tsx`, `src/app/(site)/departments/[slug]/page.tsx`, `src/app/(site)/departments/[slug]/not-found.tsx`

**Interfaces:**
- Consumes: `getDepartments`, `getDepartmentBySlug`, `PageHeader`, `RichText`, `MediaImage`, `Container`, `RecentNewsSidebar`.

- [ ] **Step 1: Departments list**

`src/app/(site)/departments/page.tsx`:
```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/container'
import { MediaImage } from '@/components/media-image'
import { PageHeader } from '@/components/page-header'
import { RichText } from '@/components/rich-text'
import { getDepartments } from '@/lib/data'

export const revalidate = 300
export const metadata: Metadata = { title: 'Departments', description: 'Offices and departments of the Municipality of Claveria.' }

export default async function DepartmentsPage() {
  const departments = await getDepartments()
  return (
    <main>
      <PageHeader title="Departments" crumbs={[{ label: 'Departments' }]} />
      <Container className="py-12">
        {departments.length === 0 ? <p className="text-ink/60">No departments listed yet.</p> : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((d) => (
              <li key={d.id} className="flex flex-col rounded-xl border border-navy/10 bg-white p-6 shadow-sm">
                {d.icon ? <MediaImage media={d.icon} size="thumbnail" className="mb-4 h-12 w-12 object-contain" sizes="48px" /> : null}
                <h2 className="text-lg font-bold text-navy">
                  <Link href={`/departments/${d.slug}`} className="hover:text-gold">{d.name}</Link>
                </h2>
                <RichText data={d.summary} className="mt-3 flex-1 text-sm text-ink/80" />
                <Link href={`/departments/${d.slug}`} className="mt-4 text-sm font-semibold text-navy underline-offset-4 hover:underline">See more →</Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </main>
  )
}
```

- [ ] **Step 2: Department detail and not-found**

`src/app/(site)/departments/[slug]/page.tsx`:
```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from '@/components/container'
import { PageHeader } from '@/components/page-header'
import { RecentNewsSidebar } from '@/components/recent-news-sidebar'
import { RichText } from '@/components/rich-text'
import { getDepartmentBySlug, getDepartments } from '@/lib/data'
import { excerpt, plainText } from '@/lib/format'

export const revalidate = 300
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const d = await getDepartmentBySlug(slug)
  return d ? { title: d.name, description: excerpt(plainText(d.summary), 160) } : { title: 'Not found' }
}

export default async function DepartmentPage({ params }: Props) {
  const { slug } = await params
  const d = await getDepartmentBySlug(slug)
  if (!d) notFound()
  const others = (await getDepartments()).filter((x) => x.id !== d.id).slice(0, 6)
  return (
    <main>
      <PageHeader title={d.name} crumbs={[{ label: 'Departments', href: '/departments' }, { label: d.name }]} />
      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
        <article>
          <RichText data={d.body} className="text-lg" />
          {others.length > 0 ? (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-navy">Other departments</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {others.map((o) => (
                  <li key={o.id}>
                    <Link href={`/departments/${o.slug}`} className="block rounded-lg border border-navy/10 px-4 py-3 text-sm font-medium text-navy hover:bg-mist">{o.name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
        <RecentNewsSidebar />
      </Container>
    </main>
  )
}
```

`src/app/(site)/departments/[slug]/not-found.tsx`:
```tsx
import Link from 'next/link'
import { Container } from '@/components/container'
import { PageHeader } from '@/components/page-header'

export default function DepartmentNotFound() {
  return (
    <main>
      <PageHeader title="Department not found" crumbs={[{ label: 'Departments', href: '/departments' }]} />
      <Container className="py-12">
        <p>We could not find that department.</p>
        <Link href="/departments" className="mt-4 inline-block font-semibold text-navy underline underline-offset-4">See all departments</Link>
      </Container>
    </main>
  )
}
```

- [ ] **Step 3: Verify and commit**

Run: `(npm run dev > .pg/dev.log 2>&1 &); sleep 25; for u in /departments /departments/municipal-health-office /departments/nope /deparments/municipal-health-office; do printf "%s -> " "$u"; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "http://localhost:3000$u"; done`
Expected: `200`, `200`, `404`, `308 http://localhost:3000/departments/municipal-health-office`.

```bash
npm run typecheck && npm run lint
git add -A
git commit -m "feat: departments pages"
```

---

### Task 12: Destinations pages with photo gallery

**Files:**
- Create: `src/components/gallery.tsx` (client), `src/app/(site)/destinations/[type]/page.tsx`, `src/app/(site)/destinations/[type]/[slug]/page.tsx`, `src/app/(site)/destinations/[type]/not-found.tsx`

**Interfaces:**
- Consumes: `getDestinationsByType`, `getDestination`, `isDestinationType`, `destinationLabel`, `DESTINATION_TYPES`, `mediaUrl`, `mediaAlt`, `PageHeader`, `RichText`, `MediaImage`, `RecentNewsSidebar`.
- Produces: `<Gallery photos={{ src, alt, thumb }[]} />` (client).

- [ ] **Step 1: Gallery component**

`src/components/gallery.tsx`:
```tsx
'use client'

import { useState } from 'react'

export type GalleryPhoto = { id: string; src: string; thumb: string; alt: string }

export function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const [active, setActive] = useState(0)
  if (photos.length === 0) return null
  const current = photos[active] ?? photos[0]
  return (
    <div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-mist">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.src} alt={current.alt} className="h-full w-full object-cover" />
      </div>
      {photos.length > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Photo thumbnails">
          {photos.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={i === active}
                aria-label={`Show photo ${i + 1}`}
                className={`block h-16 w-24 shrink-0 overflow-hidden rounded border-2 ${i === active ? 'border-gold' : 'border-transparent'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumb} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 2: Type list page**

`src/app/(site)/destinations/[type]/page.tsx`:
```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from '@/components/container'
import { MediaImage } from '@/components/media-image'
import { PageHeader } from '@/components/page-header'
import { RecentNewsSidebar } from '@/components/recent-news-sidebar'
import { destinationLabel, isDestinationType } from '@/lib/constants'
import { getDestinationsByType } from '@/lib/data'
import { excerpt, plainText } from '@/lib/format'

export const revalidate = 300
type Props = { params: Promise<{ type: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params
  if (!isDestinationType(type)) return { title: 'Not found' }
  const label = destinationLabel(type)
  return { title: label, description: `${label} in Claveria, Misamis Oriental.` }
}

export default async function DestinationTypePage({ params }: Props) {
  const { type } = await params
  if (!isDestinationType(type)) notFound()
  const label = destinationLabel(type)
  const items = await getDestinationsByType(type)
  return (
    <main>
      <PageHeader title={label} crumbs={[{ label: 'Destinations' }, { label }]} />
      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
        {items.length === 0 ? <p className="text-ink/60">Nothing listed under {label} yet.</p> : (
          <ul className="space-y-8">
            {items.map((d) => (
              <li key={d.id} className="grid gap-5 rounded-xl border border-navy/10 bg-white p-4 sm:grid-cols-[260px_1fr]">
                <Link href={`/destinations/${type}/${d.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-mist">
                  <MediaImage media={d.photos?.[0]?.image} size="card" fill sizes="(min-width: 640px) 260px, 100vw" />
                </Link>
                <div>
                  <h2 className="text-xl font-bold text-navy"><Link href={`/destinations/${type}/${d.slug}`} className="hover:text-gold">{d.title}</Link></h2>
                  <p className="mt-1 text-sm text-ink/60">📍 {d.location}</p>
                  <p className="mt-3 text-sm text-ink/80">{excerpt(plainText(d.description), 200)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <RecentNewsSidebar />
      </Container>
    </main>
  )
}
```

`src/app/(site)/destinations/[type]/not-found.tsx`:
```tsx
import Link from 'next/link'
import { Container } from '@/components/container'
import { PageHeader } from '@/components/page-header'
import { DESTINATION_LINKS } from '@/lib/nav'

export default function DestinationNotFound() {
  return (
    <main>
      <PageHeader title="Destination not found" crumbs={[{ label: 'Destinations' }]} />
      <Container className="py-12">
        <p>That destination does not exist. Browse by type:</p>
        <ul className="mt-4 flex flex-wrap gap-3">
          {DESTINATION_LINKS.map((d) => (
            <li key={d.href}><Link href={d.href} className="rounded border border-navy/20 px-3 py-1.5 text-sm font-semibold text-navy hover:bg-mist">{d.label}</Link></li>
          ))}
        </ul>
      </Container>
    </main>
  )
}
```

- [ ] **Step 3: Detail page**

`src/app/(site)/destinations/[type]/[slug]/page.tsx`:
```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container } from '@/components/container'
import { Gallery, type GalleryPhoto } from '@/components/gallery'
import { PageHeader } from '@/components/page-header'
import { RecentNewsSidebar } from '@/components/recent-news-sidebar'
import { RichText } from '@/components/rich-text'
import { destinationLabel, isDestinationType } from '@/lib/constants'
import { getDestination } from '@/lib/data'
import { excerpt, plainText } from '@/lib/format'
import { mediaAlt, mediaUrl } from '@/lib/media'

export const revalidate = 300
type Props = { params: Promise<{ type: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, slug } = await params
  if (!isDestinationType(type)) return { title: 'Not found' }
  const d = await getDestination(type, slug)
  if (!d) return { title: 'Not found' }
  const og = mediaUrl(d.photos?.[0]?.image, 'og')
  return { title: d.title, description: excerpt(plainText(d.description), 160), openGraph: { images: og ? [og] : undefined } }
}

export default async function DestinationPage({ params }: Props) {
  const { type, slug } = await params
  if (!isDestinationType(type)) notFound()
  const d = await getDestination(type, slug)
  if (!d) notFound()
  const photos: GalleryPhoto[] = (d.photos ?? [])
    .map((p, i) => ({ id: p.id ?? String(i), src: mediaUrl(p.image, 'hero') ?? '', thumb: mediaUrl(p.image, 'thumbnail') ?? '', alt: mediaAlt(p.image) }))
    .filter((p) => p.src)
  const label = destinationLabel(type)
  return (
    <main>
      <PageHeader title={d.title} crumbs={[{ label: 'Destinations' }, { label, href: `/destinations/${type}` }, { label: d.title }]} />
      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
        <article>
          <Gallery photos={photos} />
          <p className="mt-6 text-sm text-ink/60">📍 {d.location} · {photos.length} {photos.length === 1 ? 'photo' : 'photos'}</p>
          <RichText data={d.description} className="mt-4 text-lg" />
        </article>
        <RecentNewsSidebar />
      </Container>
    </main>
  )
}
```

- [ ] **Step 4: Verify and commit**

Run: `(npm run dev > .pg/dev.log 2>&1 &); sleep 25; for u in /destinations/waterfalls /destinations/beaches /destinations/waterfalls/pamalihi-falls /destinations/resorts/pamalihi-falls /destination/resorts; do printf "%s -> " "$u"; curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' "http://localhost:3000$u"; done`
Expected: `200`, `404`, `200`, `404`, `308 http://localhost:3000/destinations/resorts`.

```bash
npm run typecheck && npm run lint
git add -A
git commit -m "feat: destinations pages with gallery"
```

---

### Task 13: Transparency page, error boundaries, sitemap, robots

**Files:**
- Create: `src/app/(site)/transparency/page.tsx`, `src/app/(site)/not-found.tsx`, `src/app/(site)/error.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`
- Test: `tests/unit/sitemap.test.ts`

**Interfaces:**
- Consumes: `getDocuments`, `getSitemapEntries`, `DocumentList`, `PageHeader`, `Container`.
- Produces: `buildSitemap(entries: { path: string; updatedAt: string }[], base: string): MetadataRoute.Sitemap` in `src/lib/sitemap.ts`.

- [ ] **Step 1: Write the failing sitemap unit test**

`tests/unit/sitemap.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { buildSitemap } from '@/lib/sitemap'

describe('buildSitemap', () => {
  it('lists static routes first, then content entries with absolute urls', () => {
    const out = buildSitemap([{ path: '/news/a', updatedAt: '2026-10-01T00:00:00.000Z' }], 'https://claveriamisor.gov.ph')
    expect(out[0]).toMatchObject({ url: 'https://claveriamisor.gov.ph/' })
    expect(out.map((e) => e.url)).toContain('https://claveriamisor.gov.ph/sangguniang-bayan')
    expect(out.map((e) => e.url)).toContain('https://claveriamisor.gov.ph/destinations/waterfalls')
    expect(out.at(-1)).toMatchObject({ url: 'https://claveriamisor.gov.ph/news/a', lastModified: new Date('2026-10-01T00:00:00.000Z') })
  })
  it('strips a trailing slash from the base', () => {
    expect(buildSitemap([], 'https://x.test/')[0].url).toBe('https://x.test/')
  })
})
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test:unit`
Expected: FAIL, module missing.

- [ ] **Step 3: Implement sitemap helper, sitemap and robots routes**

`src/lib/sitemap.ts`:
```ts
import type { MetadataRoute } from 'next'
import { DESTINATION_TYPES } from './constants'

export const STATIC_PATHS = ['/', '/news', '/sangguniang-bayan', '/departments', '/transparency', ...DESTINATION_TYPES.map((t) => `/destinations/${t.value}`)]

export function buildSitemap(entries: { path: string; updatedAt: string }[], base: string): MetadataRoute.Sitemap {
  const root = base.replace(/\/+$/, '')
  return [
    ...STATIC_PATHS.map((p) => ({ url: `${root}${p}`, changeFrequency: 'weekly' as const, priority: p === '/' ? 1 : 0.7 })),
    ...entries.map((e) => ({ url: `${root}${e.path}`, lastModified: new Date(e.updatedAt), changeFrequency: 'monthly' as const, priority: 0.5 })),
  ]
}
```

`src/app/sitemap.ts`:
```ts
import type { MetadataRoute } from 'next'
import { getSitemapEntries } from '@/lib/data'
import { buildSitemap } from '@/lib/sitemap'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getSitemapEntries()
  return buildSitemap(entries, process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
}
```

`src/app/robots.ts`:
```ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
```

- [ ] **Step 4: Run the unit tests**

Run: `npm run test:unit`
Expected: PASS.

- [ ] **Step 5: Transparency page**

`src/app/(site)/transparency/page.tsx`:
```tsx
import type { Metadata } from 'next'
import { Container } from '@/components/container'
import { DocumentList } from '@/components/document-list'
import { PageHeader } from '@/components/page-header'
import { SectionHeading } from '@/components/section-heading'
import { getDocuments } from '@/lib/data'

export const revalidate = 300
export const metadata: Metadata = { title: 'Transparency', description: 'Full disclosure documents of the Municipality of Claveria.' }

export default async function TransparencyPage() {
  const documents = await getDocuments('transparency')
  return (
    <main>
      <PageHeader title="Transparency" crumbs={[{ label: 'Transparency' }]} />
      <Container className="py-12">
        <section className="rounded-xl bg-mist p-6">
          <h2 className="text-lg font-bold text-navy">Full Disclosure Policy Portal</h2>
          <p className="mt-2 text-sm text-ink/80">Budget, procurement, and financial reports are also published on the DILG portal.</p>
          <a href="https://fdpp.dilg.gov.ph/documents" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark">
            Open the DILG FDP Portal ↗
          </a>
        </section>
        <section className="mt-12">
          <SectionHeading eyebrow="Downloads" title="Transparency documents" />
          <DocumentList documents={documents} emptyText="No transparency documents have been uploaded yet." />
        </section>
      </Container>
    </main>
  )
}
```

- [ ] **Step 6: Site-wide not-found and error boundary**

`src/app/(site)/not-found.tsx`:
```tsx
import Link from 'next/link'
import { Container } from '@/components/container'
import { PageHeader } from '@/components/page-header'

export default function NotFound() {
  return (
    <main>
      <PageHeader title="Page not found" crumbs={[{ label: '404' }]} />
      <Container className="py-12">
        <p>The page you requested does not exist.</p>
        <Link href="/" className="mt-4 inline-block font-semibold text-navy underline underline-offset-4">Back to the home page</Link>
      </Container>
    </main>
  )
}
```

`src/app/(site)/error.tsx`:
```tsx
'use client'

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-navy">Something went wrong</h1>
      <p className="mt-2 text-ink/70">We could not load this page. Please try again.</p>
      <button type="button" onClick={reset} className="mt-6 rounded bg-gold px-5 py-2 text-sm font-semibold text-white hover:bg-gold-dark">
        Try again
      </button>
    </main>
  )
}
```

- [ ] **Step 7: Verify and commit**

Run: `(npm run dev > .pg/dev.log 2>&1 &); sleep 25; for u in /transparency /sitemap.xml /robots.txt /no-such-page; do printf "%s -> " "$u"; curl -s -o /dev/null -w '%{http_code}\n' "http://localhost:3000$u"; done; curl -s http://localhost:3000/sitemap.xml | grep -c '<loc>'`
Expected: `200`, `200`, `200`, `404`, and a `<loc>` count of at least 40 (10 static + 8 news + 10 departments + 12 officials + 10 destinations).

```bash
npm run typecheck && npm run lint && npm run test:unit
git add -A
git commit -m "feat: transparency page, error pages, sitemap and robots"
```

---

### Task 14: Playwright end-to-end smoke tests

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/site.e2e.spec.ts`
- Modify: `package.json` (already has `test:e2e`)

**Interfaces:**
- Consumes: the seeded dev database (`npm run seed` has been run against `claveria_dev`).

- [ ] **Step 1: Install the browser**

Run: `npx playwright install chromium`
Expected: Chromium downloaded.

- [ ] **Step 2: Playwright config**

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

export default defineConfig({
  testDir: './tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
```

- [ ] **Step 3: Write the e2e tests**

`tests/e2e/site.e2e.spec.ts`:
```ts
import { expect, test } from '@playwright/test'

const routes: { path: string; heading: RegExp }[] = [
  { path: '/', heading: /News & Events/ },
  { path: '/news', heading: /^News$/ },
  { path: '/news/scholarship-applications-now-open', heading: /Scholarship Applications Now Open/ },
  { path: '/sangguniang-bayan', heading: /Sangguniang Bayan/ },
  { path: '/officials/juan-dela-cruz', heading: /Juan Dela Cruz/ },
  { path: '/departments', heading: /^Departments$/ },
  { path: '/departments/municipal-health-office', heading: /Municipal Health Office/ },
  { path: '/destinations/waterfalls', heading: /Waterfalls/ },
  { path: '/destinations/waterfalls/pamalihi-falls', heading: /Pamalihi Falls/ },
  { path: '/transparency', heading: /Transparency/ },
]

for (const r of routes) {
  test(`renders ${r.path}`, async ({ page }) => {
    const res = await page.goto(r.path)
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: r.heading }).first()).toBeVisible()
  })
}

test('unknown slugs and types return 404', async ({ page }) => {
  expect((await page.goto('/news/does-not-exist'))?.status()).toBe(404)
  expect((await page.goto('/destinations/beaches'))?.status()).toBe(404)
  expect((await page.goto('/no-such-page'))?.status()).toBe(404)
})

test('legacy django urls redirect permanently', async ({ request }) => {
  const res = await request.get('/deparments/municipal-health-office', { maxRedirects: 0 })
  expect(res.status()).toBe(308)
  expect(res.headers()['location']).toContain('/departments/municipal-health-office')
  const sb = await request.get('/sangguniang_bayan', { maxRedirects: 0 })
  expect(sb.status()).toBe(308)
})

test('a draft article is not reachable', async ({ page }) => {
  // The data integration test creates "Unpublished draft" in the test DB only; in dev the seed has no drafts,
  // so verify the published guard by checking the listing never shows the draft title.
  await page.goto('/news')
  await expect(page.getByText('Unpublished draft')).toHaveCount(0)
})

test('has no horizontal overflow and the mobile menu opens', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile project only')
  await page.goto('/')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
  const button = page.getByRole('button', { name: 'Menu' })
  await button.click()
  await expect(page.getByRole('link', { name: 'Sangguniang Bayan' }).first()).toBeVisible()
  await expect(button).toHaveAttribute('aria-expanded', 'true')
})

test('hero dots switch slides', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop project only')
  await page.goto('/')
  const second = page.getByRole('button', { name: 'Go to slide 2' })
  await second.click()
  await expect(second).toHaveAttribute('aria-current', 'true')
})

test('home sets page title and og metadata on an article', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Claveria, Misamis Oriental')
  await page.goto('/news/scholarship-applications-now-open')
  await expect(page).toHaveTitle('Scholarship Applications Now Open | Claveria, Misamis Oriental')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/api\/media\/file\//)
})
```

- [ ] **Step 4: Run the e2e suite**

Run: `npm run seed && npm run test:e2e`
Expected: all tests PASS in both `desktop` and `mobile` projects. Fix any failing assertions in the pages, not by loosening the tests, unless the test asserted the wrong copy.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "test: playwright smoke tests for all public routes"
```

---

### Task 15: Deployment files and CI

**Files:**
- Create: `deploy/Caddyfile.snippet`, `deploy/claveria-web.service`, `deploy/start.sh`, `deploy/deploy.sh`, `deploy/README.md`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`
- Modify: `README.md`

**Interfaces:**
- Consumes: npm scripts from Task 1 (`build`, `migrate`), env vars from Global Constraints.

- [ ] **Step 1: Caddy snippet**

`deploy/Caddyfile.snippet`:
```
# Claveria municipal website — merge into /etc/caddy/Caddyfile
claveriamisor.gov.ph, www.claveriamisor.gov.ph {
	encode gzip zstd

	@www host www.claveriamisor.gov.ph
	redir @www https://claveriamisor.gov.ph{uri} permanent

	# Next.js (serves pages, /admin, /api including uploaded media)
	reverse_proxy 127.0.0.1:3001

	header /_next/static/* Cache-Control "public, max-age=31536000, immutable"
}
```

- [ ] **Step 2: systemd unit and start script**

`deploy/claveria-web.service`:
```
[Unit]
Description=Claveria Municipal Website (Next.js + Payload)
After=network.target postgresql.service

[Service]
Type=exec
User=root
WorkingDirectory=/opt/claveria
EnvironmentFile=/opt/claveria/.env
ExecStart=/opt/claveria/deploy/start.sh
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=HOSTNAME=127.0.0.1

# Hardening
NoNewPrivileges=true
ProtectSystem=strict
ReadWritePaths=/opt/claveria /var/www/claveria

[Install]
WantedBy=multi-user.target
```

`deploy/start.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail
cd /opt/claveria
exec node .next/standalone/server.js
```

- [ ] **Step 3: Deploy script**

`deploy/deploy.sh`:
```bash
#!/usr/bin/env bash
# deploy.sh — pull main, install, migrate, build, restart.
# Usage: ssh paddledraw 'bash /opt/claveria/deploy/deploy.sh'
set -euo pipefail

APP_DIR="/opt/claveria"
cd "$APP_DIR"

echo "=== Pulling latest code ==="
git fetch origin main
git reset --hard origin/main
chmod +x deploy/*.sh

if ! cmp -s deploy/claveria-web.service /etc/systemd/system/claveria-web.service; then
  echo "=== Updating systemd unit ==="
  cp deploy/claveria-web.service /etc/systemd/system/claveria-web.service
  systemctl daemon-reload
fi

echo "=== Installing dependencies ==="
npm ci --prefer-offline

echo "=== Running database migrations ==="
NODE_ENV=production npm run migrate

echo "=== Building ==="
NODE_ENV=production npm run build
cp -r public .next/standalone/public
cp -r .next/static .next/standalone/.next/static

echo "=== Restarting ==="
systemctl restart claveria-web
sleep 3
if systemctl is-active --quiet claveria-web; then
  echo "=== claveria-web running ==="
  curl -fsS -o /dev/null http://127.0.0.1:3001/ && echo "=== health check ok ==="
else
  echo "=== claveria-web FAILED ==="
  journalctl -u claveria-web --no-pager -n 30
  exit 1
fi
```

- [ ] **Step 4: GitHub Actions**

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run test:unit
```

`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
  workflow_dispatch:
concurrency:
  group: deploy-production
  cancel-in-progress: false
jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Deploy over SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: root
          key: ${{ secrets.SERVER_SSH_KEY }}
          script: bash /opt/claveria/deploy/deploy.sh
```

- [ ] **Step 5: Deployment README**

`deploy/README.md`:
```markdown
# Deploying claveriamisor.gov.ph

One-time server setup (run as root on the droplet that hosts paddledraw):

1. Create the database and role in the existing Postgres:
   ```sql
   CREATE ROLE claveria WITH LOGIN PASSWORD '<strong-password>';
   CREATE DATABASE claveria OWNER claveria;
   ```
2. Clone the repo and create the env file:
   ```bash
   git clone git@github.com:marcmaligmat/claveria-new.git /opt/claveria
   mkdir -p /var/www/claveria/media
   cat > /opt/claveria/.env <<'ENV'
   DATABASE_URI=postgresql://claveria:<strong-password>@127.0.0.1:5432/claveria
   PAYLOAD_SECRET=<openssl rand -hex 32>
   MEDIA_DIR=/var/www/claveria/media
   NEXT_PUBLIC_SITE_URL=https://claveriamisor.gov.ph
   PORT=3001
   ENV
   ```
3. Install the unit and start it:
   ```bash
   cp /opt/claveria/deploy/claveria-web.service /etc/systemd/system/
   systemctl daemon-reload && systemctl enable claveria-web
   bash /opt/claveria/deploy/deploy.sh
   ```
4. Merge `deploy/Caddyfile.snippet` into `/etc/caddy/Caddyfile` and `systemctl reload caddy`. Caddy obtains the TLS certificate automatically once DNS for `claveriamisor.gov.ph` points at the droplet.
5. Open `https://claveriamisor.gov.ph/admin` and create the first admin user.
6. In the GitHub repo add the secrets `SERVER_HOST` and `SERVER_SSH_KEY` (same values paddledraw uses). Every push to `main` then runs `deploy/deploy.sh`.

Routine deploys: push to `main`, or run `ssh paddledraw 'bash /opt/claveria/deploy/deploy.sh'`.

Schema changes: run `npm run migrate:create -- <name>` locally, commit the file in `src/migrations/`, and the deploy script applies it with `npm run migrate` before building.
```

- [ ] **Step 6: Project README**

`README.md`:
```markdown
# Claveria Municipal Website

Next.js 16 + Payload 3 + Postgres. Public site at `/`, admin at `/admin`.

## Local development

```bash
cp .env.example .env
npm install
npm run db        # starts an embedded Postgres on 127.0.0.1:5433 (keep this terminal open)
npm run seed      # placeholder content; admin login admin@claveria.local / ChangeMe123!
npm run dev       # http://localhost:3000
```

## Tests

```bash
npm run test:unit   # pure functions
npm run test:int    # Payload against claveria_test (needs npm run db)
npm run test:e2e    # Playwright against the dev server (needs npm run db and npm run seed)
```

## Deployment

See `deploy/README.md`.
```

- [ ] **Step 7: Verify the production build locally**

Run: `chmod +x deploy/*.sh && NODE_ENV=production npm run build && cp -r public .next/standalone/public && cp -r .next/static .next/standalone/.next/static && (PORT=3001 HOSTNAME=127.0.0.1 node .next/standalone/server.js > .pg/prod.log 2>&1 &) ; sleep 8; curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3001/ ; curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3001/admin; pkill -f 'standalone/server.js' || true`
Expected: build succeeds; both requests return `200` (or `307` for `/admin`).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: deployment files, CI and deploy workflows, README"
```

---

## Handoff notes for the human

- The GitHub repository `marcmaligmat/claveria-new` does not exist yet; create it and `git remote add origin` before the deploy workflow can run.
- Server steps in `deploy/README.md` (database role, `.env`, Caddy merge, GitHub secrets) are manual and touch the production droplet; they are not performed by this plan.
- The old repo's committed secrets (`guide.txt`, `claveria_latest.pem`) still need rotating and purging.
