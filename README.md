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
