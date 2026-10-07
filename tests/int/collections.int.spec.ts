import path from 'node:path'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { beforeAll, describe, expect, it } from 'vitest'

let payload: Payload
const ctx = { disableRevalidate: true }

const lexical = (text: string) => ({
  root: {
    type: 'root',
    format: '' as const,
    indent: 0,
    version: 1,
    direction: 'ltr' as const,
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
