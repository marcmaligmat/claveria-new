# Claveria Web

Official website of the Municipality of Claveria, Misamis Oriental. A single Next.js 16 app with Payload 3 CMS embedded, backed by Postgres.

## Getting started

```bash
cp .env.example .env
npm install
npm run db          # embedded Postgres on port 5433 (claveria_dev, claveria_test); keep running
npm run dev         # http://localhost:3000, admin at /admin
```

## Scripts

- `npm run dev` / `build` / `start`: Next.js
- `npm run db`: embedded Postgres dev database
- `npm run generate:types`: regenerate `src/payload-types.ts`
- `npm run test:unit` / `test:int`: Vitest (integration tests use `claveria_test`)
- `npm run typecheck` / `lint`
