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
