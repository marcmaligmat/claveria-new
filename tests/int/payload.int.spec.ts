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
