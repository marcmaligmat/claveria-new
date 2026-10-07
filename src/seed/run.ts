import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'
import { seed } from './index'

// The seed wipes content. Only run it against the local dev database (127.0.0.1/localhost:5433)
// unless explicitly forced — NODE_ENV alone is not a reliable production signal.
function isLocalDevDatabase(uri: string | undefined): boolean {
  if (!uri) return false
  try {
    const u = new URL(uri)
    return (u.hostname === '127.0.0.1' || u.hostname === 'localhost') && u.port === '5433'
  } catch {
    return false
  }
}

const force = process.argv.includes('--force')
if (process.env.NODE_ENV === 'production' && !force) {
  console.error('Refusing to seed: NODE_ENV=production. Pass --force to override.')
  process.exit(1)
}
if (!isLocalDevDatabase(process.env.DATABASE_URI) && !force) {
  console.error(
    'Refusing to seed: DATABASE_URI is not the local dev database (127.0.0.1 or localhost, port 5433). ' +
      'Seeding deletes existing content. Re-run with `npm run seed -- --force` if you really mean it.',
  )
  process.exit(1)
}

const payload = await getPayload({ config: await config })
await seed(payload)
console.log('Seeded. Admin login: admin@claveria.local / ChangeMe123!')
process.exit(0)
