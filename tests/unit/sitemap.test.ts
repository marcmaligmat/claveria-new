import { describe, expect, it } from 'vitest'
import { buildSitemap } from '@/lib/sitemap'

describe('buildSitemap', () => {
  it('lists static routes first, then content entries with absolute urls', () => {
    const out = buildSitemap([{ path: '/news/a', updatedAt: '2026-10-01T00:00:00.000Z' }], 'https://claveriamisor.gov.ph')
    expect(out[0]).toMatchObject({ url: 'https://claveriamisor.gov.ph/' })
    expect(out.map((e) => e.url)).toContain('https://claveriamisor.gov.ph/sangguniang-bayan')
    expect(out.map((e) => e.url)).toContain('https://claveriamisor.gov.ph/destinations/waterfalls')
    expect(out.at(-1)).toMatchObject({ url: 'https://claveriamisor.gov.ph/news/a', lastModified: new Date('2026-10-01T00:00:00.000Z') })
  })
  it('strips a trailing slash from the base', () => {
    expect(buildSitemap([], 'https://x.test/')[0].url).toBe('https://x.test/')
  })
})
