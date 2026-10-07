import path from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { revalidatePath } from 'next/cache'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

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

describe('revalidation hooks', () => {
  let mediaId: number

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'news', where: { title: { like: 'RV-' } }, context: ctx })
    await payload.delete({ collection: 'departments', where: { name: { like: 'RV-' } }, context: ctx })
    const media = await payload.create({
      collection: 'media',
      context: ctx,
      data: { alt: 'RV fixture' },
      filePath: path.resolve(process.cwd(), 'tests/fixtures/sample.jpg'),
    })
    mediaId = media.id
  })

  afterAll(async () => {
    await payload.delete({ collection: 'news', where: { title: { like: 'RV-' } }, context: ctx })
    await payload.delete({ collection: 'departments', where: { name: { like: 'RV-' } }, context: ctx })
  })

  beforeEach(() => vi.mocked(revalidatePath).mockClear())

  it('news create and update revalidate the article and the root layout', async () => {
    const created = await payload.create({
      collection: 'news',
      data: { title: 'RV-Story', category: 'government', body: lexical('x'), coverImage: mediaId, _status: 'published' },
    })
    expect(revalidatePath).toHaveBeenCalledWith(`/news/${created.slug}`)
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')

    vi.mocked(revalidatePath).mockClear()
    await payload.update({ collection: 'news', id: created.id, data: { title: 'RV-Story updated' } })
    expect(revalidatePath).toHaveBeenCalledWith(`/news/${created.slug}`)
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('site-settings update revalidates the root layout', async () => {
    await payload.updateGlobal({ slug: 'site-settings', data: {} })
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('department create revalidates its page and the root layout', async () => {
    const dept = await payload.create({ collection: 'departments', data: { name: 'RV-Office', summary: lexical('s'), body: lexical('b') } })
    expect(revalidatePath).toHaveBeenCalledWith(`/departments/${dept.slug}`)
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('media create and delete revalidate the root layout', async () => {
    const media = await payload.create({
      collection: 'media',
      data: { alt: 'RV hook' },
      filePath: path.resolve(process.cwd(), 'tests/fixtures/sample.jpg'),
    })
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
    vi.mocked(revalidatePath).mockClear()
    await payload.delete({ collection: 'media', id: media.id })
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('disableRevalidate suppresses every call', async () => {
    await payload.updateGlobal({ slug: 'site-settings', data: {}, context: ctx })
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
