# Claveria Municipal Website: Next.js Rebuild

**Date:** 2026-10-07
**Status:** Approved design, pending implementation plan
**Replaces:** Django 3.1 site at github.com/marcmaligmat/claveria (local copy at `~/projects/claveria`)

## 1. Goal

Rebuild the official website of the Municipality of Claveria, Misamis Oriental
(claveriamisor.gov.ph) as a Next.js application with a built-in CMS, hosted on
the same DigitalOcean droplet and with the same deployment pattern as
paddledraw. LGU staff must be able to edit all content through a web admin
without a code change, as they could with the Django admin.

Success looks like:

- Every public page of the old site has an equivalent in the new one, except
  the features explicitly dropped in section 8.
- Content is editable at `/admin` by a non-technical staff member.
- A push to `main` deploys to the droplet with no manual steps.
- The site scores well on mobile: no layout shift, readable without zoom,
  keyboard navigable.

## 2. Context and constraints

- **Content is not recoverable from the repo.** The old data lived in MySQL on
  an EC2 instance that now returns 404; the domain's TLS certificate has
  expired. The repo holds only templates and static theme images. The new site
  ships with a seed script of placeholder content; real content is re-entered
  by staff, or imported later if a database dump turns up.
- **Hosting is self-managed.** One DigitalOcean droplet already runs
  paddledraw: Caddy reverse proxy, Next.js standalone under systemd, Postgres
  on the box, GitHub Actions deploying over SSH to `/opt/<app>`. The new site
  follows that shape and must not collide with paddledraw's ports or paths.
- **The old repo contains committed secrets** (`guide.txt`, `claveria_latest.pem`).
  Out of scope for this project, but they should be rotated and purged.

## 3. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, `output: 'standalone'`) |
| CMS | Payload 3.90 embedded in the same app, admin at `/admin` |
| Database | PostgreSQL on the droplet via `@payloadcms/db-postgres` |
| Styling | Tailwind CSS v4 |
| Rich text | Payload Lexical editor, rendered server-side with `@payloadcms/richtext-lexical` |
| Images | Payload Media collection, files on local disk, `next/image` for rendering |
| Tests | Vitest (unit), Playwright (route smoke tests) |
| Package manager | npm (matches paddledraw) |
| Node | 22 |

## 4. Repository layout

The app lives at the root of `claveria-new` (no `frontend/` subfolder; there is
no separate backend).

```
claveria-new/
  src/
    app/
      (site)/                 public pages, shared layout
      (payload)/              Payload admin and API routes (generated)
    collections/              Payload collection configs
    globals/                  Payload global configs (SiteSettings)
    components/               React components
    lib/                      data access helpers, formatting, redirects map
    seed/                     seed script and placeholder content
  public/                     logo, favicon, static theme images worth keeping
  deploy/
    Caddyfile.snippet         site block to merge into /etc/caddy/Caddyfile
    claveria-web.service      systemd unit
    deploy.sh                 pull, install, migrate, build, restart
    start.sh                  runs .next/standalone/server.js
  .github/workflows/deploy.yml
  payload.config.ts
  next.config.ts
  docs/superpowers/specs/     this file
```

## 5. Content model

All rich text fields use Lexical. All slugs are generated from the title on
create and remain editable.

### Collections

**Media** (upload)
Images and PDFs. Payload generates image sizes: `thumbnail` (400x300),
`card` (600x400), `hero` (1600x900). Stored under `media/` inside the app
directory in development and `/var/www/claveria/media` in production
(configurable via `MEDIA_DIR`).

**News**
`title`, `slug`, `category` (select: Government, Policies, Medical Event,
Economy, Education, Business), `excerpt` (text, optional; falls back to the
first 160 characters of body), `body` (rich text), `coverImage` (Media),
`publishedAt` (date, defaults to now), `author` (relationship to Users,
auto-set to the editor). Draft and publish via Payload versions.

**Officials**
`name`, `slug`, `position` (select: Mayor, Vice Mayor, Councilor, Head,
Assistant Head, Officer, Member), `department` (relationship to Departments,
optional), `shortDescription` (text, max 120), `bio` (rich text),
`politicalExperience` (rich text, optional), `responsibilities` (rich text,
optional), `photo` (Media), `order` (number, for display sorting).

**Departments**
`name`, `slug`, `summary` (rich text, shown on the list card), `body` (rich
text), `icon` (Media, optional), `order` (number).

**Destinations**
`title`, `slug`, `type` (select: Waterfalls, Restaurants, Spring Resorts,
Hotels & Inns, Nightlife & Entertainment), `location` (text), `description`
(rich text), `photos` (array of Media, first photo is the cover).

**LocalBoards**
`title`, `image` (Media), `order` (number). Shown as a grid on the
home page.

**Documents**
`title`, `file` (Media, PDF), `category` (select: Sangguniang Bayan,
Transparency, Other). Listed on the Sangguniang Bayan page and a Transparency
page.

**Users**
Payload's auth collection for admin logins. `name`, `email`, `password`.
Single `admin` role for now.

### Globals

**SiteSettings** replaces the old `CustomData` index bag with named fields,
grouped in admin tabs:

- *Hero*: array of slides, each `image` (Media), `heading`, `subheading`
  (optional), `ctaLabel` and `ctaHref` (optional).
- *Mayor*: `name`, `photo` (Media), `message` (rich text).
- *Vision and Mission*: `vision` (rich text), `mission` (rich text).
- *Hotlines*: `pnp`, `responder`, `bfp` (text), and `helplineGroups` (array of
  `title` + `body` rich text) for the accordion.
- *Facts*: `population`, `areaKm2`, `schools`, `hospitals`, `touristVisits`
  (text, displayed verbatim).
- *Links*: `facebookUrl`, `email`, `phone`, `address`, and `agencyLinks`
  (array of `name`, `url`, `logo` for the footer seal row).

## 6. Routes and pages

| Route | Content |
|---|---|
| `/` | Hero slider, mayor's message, latest 6 news, local boards grid, helplines accordion, emergency numbers strip, destination highlights (one card per type that has entries), facts strip, officials carousel |
| `/news` | All published news, newest first, paginated (12 per page) |
| `/news/[slug]` | Full article, cover image, category, date, author name, "recent posts" sidebar |
| `/sangguniang-bayan` | Vice mayor card, vision and mission, councilors grid, Sangguniang Bayan documents |
| `/departments` | Department cards with summary |
| `/departments/[slug]` | Department body, "other departments" list |
| `/destinations/[type]` | Cards for every destination of that type |
| `/destinations/[type]/[slug]` | Photo gallery with thumbnails, description, location |
| `/officials/[slug]` | Photo, name, position, bio, political experience, responsibilities |
| `/transparency` | Transparency documents and the DILG Full Disclosure Policy Portal link |
| `/admin` | Payload admin |

Shared layout: header with logo, primary nav (Sangguniang Bayan, Departments,
News, Transparency, Destinations dropdown), mobile drawer; footer with
contact info, department links, destination links, Facebook link, agency
seals.

### Redirects (permanent, in `next.config.ts`)

| Old | New |
|---|---|
| `/sangguniang_bayan/` | `/sangguniang-bayan` |
| `/deparments/` and `/deparments/:slug` | `/departments` and `/departments/:slug` |
| `/destination/:type/` (one per known type) | `/destinations/:type` |
| `/person/:slug` | `/officials/:slug` |

Old destination and person slugs were computed differently and cannot be
mapped individually; those 404 with a link to the index.

## 7. Rendering and data flow

- Pages are React Server Components reading through Payload's Local API
  (`getPayload()`), so no HTTP round trip to the CMS.
- Every public page is statically rendered with ISR (`revalidate = 300`).
  Collections and the global have `afterChange` and `afterDelete` hooks that
  call `revalidatePath` / `revalidateTag` so admin edits appear within seconds.
- Only published documents are returned to public pages; Payload's draft mode
  is not wired into the public site in this iteration.
- Lexical rich text is rendered with `RichText` from
  `@payloadcms/richtext-lexical/react`, with a small converter map for
  headings, lists, links, and uploaded images.
- Per-page `generateMetadata` sets title (`<page> | Claveria, Misamis Oriental`),
  description, and Open Graph image. `sitemap.ts` and `robots.ts` are
  generated from the collections.
- Images are served by `next/image` with `remotePatterns` allowing the
  production host and localhost in development.

## 8. Dropped from the old site

- Threaded comments (django-comments-xtd).
- `/resume/` page embedding a personal PDF.
- COVID-19 vaccine registration iframe.
- The non-functional search overlay.
- Facebook JS SDK and timeline embed. The Facebook page is linked instead.
- Newsletter signup form on the departments page (it was never wired up).

## 9. Visual direction

Modern redesign, not a port. Brand colors from the old theme are kept:
gold `#d99c41` as the accent, navy `#40407e` for headings, nav, and footer.
Mobile-first layout with a 16px gutter, large tap targets, and a single
column below 768px. No carousel library; the hero is a CSS scroll-snap slider
with a tiny client component for dots and autoplay. Fonts: a single
variable sans-serif via `next/font` (Inter or similar). Visual decisions are
made at implementation time under the frontend-design skill.

## 10. Deployment

Mirrors paddledraw:

- Code at `/opt/claveria` on the droplet, pulled by `deploy/deploy.sh`.
- `deploy/claveria-web.service` runs `start.sh` on port **3001**, host
  `127.0.0.1`, `EnvironmentFile=/opt/claveria/.env`, same hardening block as
  paddledraw with `ReadWritePaths` covering `/opt/claveria` and
  `/var/www/claveria/media`.
- `deploy.sh`: `npm ci`, `npx payload migrate`, `npm run build`, copy
  `public` and `.next/static` into the standalone folder, restart the service,
  check `systemctl is-active`.
- Caddy site block for `claveriamisor.gov.ph` and `www`: `/media/*` served by
  `file_server` from `/var/www/claveria/media`, everything else proxied to
  `127.0.0.1:3001`. Caddy handles TLS automatically, replacing the expired
  certbot setup.
- Postgres: a `claveria` database and role on the existing server.
- `.github/workflows/deploy.yml`: on push to `main`, SSH in and run
  `deploy.sh`. Secrets `SERVER_HOST` and `SERVER_SSH_KEY` as in paddledraw.
- Environment variables: `DATABASE_URI`, `PAYLOAD_SECRET`, `MEDIA_DIR`,
  `NEXT_PUBLIC_SITE_URL`, `PORT`.

Database schema changes use Payload migrations committed to the repo
(`npx payload migrate:create`), not push-on-boot.

## 11. Seed data

`npm run seed` wipes and fills the development database with placeholder
content covering every collection and the global: 8 news items, 1 mayor,
1 vice mayor, 8 councilors, 2 department heads, 10 departments, 2
destinations per type, 6 local boards, 3 documents, and complete site
settings. Placeholder images come from the old theme's `static/images`
where usable. The seed never runs in production.

## 12. Testing

- **Unit (Vitest):** slug generation, excerpt fallback, redirect map, date
  formatting, rich text converter edge cases.
- **Integration (Vitest + Payload Local API against a test Postgres):**
  collection access rules return only published docs; afterChange hooks call
  revalidation.
- **End-to-end (Playwright):** against the seeded dev server, each public
  route returns 200 and renders its key heading; the mobile nav opens; an
  old URL redirects to its new path.
- **Build check:** `npm run build` and `tsc --noEmit` in CI before deploy.

## 13. Error handling

- Missing slug on any detail route renders the App Router `not-found` page
  with links back to the relevant index.
- A missing or empty global field renders nothing for that section rather
  than a placeholder, so a half-filled site still looks intentional.
- Payload or database failures during rendering surface the route `error`
  boundary with a short message and a retry.

## 14. Out of scope

- Importing content from a MySQL dump (no dump is available today). If one
  appears, a one-off import script is a separate task.
- Multiple admin roles or editorial workflow beyond draft/publish.
- Site search.
- Rotating and purging the secrets committed to the old repo.
