import { getPayload } from 'payload'
import config from '@payload-config'
import { beforeAll, describe, expect, it } from 'vitest'
import { seed } from '@/seed'
import {
  getDepartmentBySlug,
  getDestination,
  getDestinationHighlights,
  getDestinationsByType,
  getDocuments,
  getLatestNews,
  getNewsBySlug,
  getNewsPage,
  getOfficialsByPosition,
  getSiteSettings,
  getSitemapEntries,
} from '@/lib/data'

describe('data layer', () => {
  beforeAll(async () => {
    const payload = await getPayload({ config: await config })
    await seed(payload)
    await payload.create({
      collection: 'news',
      draft: true,
      context: { disableRevalidate: true },
      data: {
        title: 'Unpublished draft',
        category: 'government',
        body: { root: { type: 'root', children: [], direction: 'ltr', format: '', indent: 0, version: 1 } },
        coverImage: (await payload.find({ collection: 'media', limit: 1 })).docs[0].id,
        _status: 'draft',
      },
    })
  })

  it('returns only published news, newest first, with populated images', async () => {
    const latest = await getLatestNews(6)
    expect(latest).toHaveLength(6)
    expect(latest.every((n) => n._status === 'published')).toBe(true)
    expect(latest.map((n) => n.title)).not.toContain('Unpublished draft')
    expect(typeof latest[0].coverImage).toBe('object')
    const dates = latest.map((n) => new Date(n.publishedAt ?? 0).getTime())
    expect([...dates].sort((a, b) => b - a)).toEqual(dates)
  })

  it('paginates news', async () => {
    const page = await getNewsPage(1, 5)
    expect(page.docs).toHaveLength(5)
    expect(page.totalPages).toBe(2)
  })

  it('finds by slug and returns null for drafts and unknowns', async () => {
    expect((await getNewsBySlug('scholarship-applications-now-open'))?.title).toBe('Scholarship Applications Now Open')
    expect(await getNewsBySlug('unpublished-draft')).toBeNull()
    expect(await getNewsBySlug('does-not-exist')).toBeNull()
    expect(await getDepartmentBySlug('nope')).toBeNull()
  })

  it('filters officials by position', async () => {
    expect(await getOfficialsByPosition('vicemayor')).toHaveLength(1)
    expect(await getOfficialsByPosition('councilor')).toHaveLength(8)
  })

  it('handles destinations by type and highlights', async () => {
    expect(await getDestinationsByType('waterfalls')).toHaveLength(2)
    expect(await getDestination('waterfalls', 'pamalihi-falls')).not.toBeNull()
    expect(await getDestination('resorts', 'pamalihi-falls')).toBeNull()
    const highlights = await getDestinationHighlights()
    expect(highlights.map((h) => h.type)).toEqual(['waterfalls', 'restaurants', 'resorts', 'hotels', 'entertainments'])
    expect(highlights[0].count).toBe(2)
    expect(highlights[0].cover).not.toBeNull()
  })

  it('lists documents by category and builds sitemap entries', async () => {
    expect(await getDocuments('sb')).toHaveLength(2)
    const entries = await getSitemapEntries()
    expect(entries.map((e) => e.path)).toContain('/news/scholarship-applications-now-open')
    expect(entries.map((e) => e.path)).not.toContain('/news/unpublished-draft')
  })

  it('reads site settings', async () => {
    const s = await getSiteSettings()
    expect(s.hotlines?.pnp).toBe('0998 598 5471')
  })
})
