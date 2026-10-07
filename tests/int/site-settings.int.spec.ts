import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { beforeAll, describe, expect, it } from 'vitest'

let payload: Payload

describe('site settings global', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    // The test database persists between runs; reset so the suite is re-runnable.
    await payload.updateGlobal({
      slug: 'site-settings',
      context: { disableRevalidate: true },
      data: { hotlines: { pnp: '', responder: '', bfp: '', helplineGroups: [] }, facts: {} },
    })
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
