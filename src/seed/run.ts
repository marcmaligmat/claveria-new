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
