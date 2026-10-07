import type { MetadataRoute } from 'next'
import { DESTINATION_TYPES } from './constants'

export const STATIC_PATHS = ['/', '/news', '/sangguniang-bayan', '/departments', '/transparency', ...DESTINATION_TYPES.map((t) => `/destinations/${t.value}`)]

export function buildSitemap(entries: { path: string; updatedAt: string }[], base: string): MetadataRoute.Sitemap {
  const root = base.replace(/\/+$/, '')
  return [
    ...STATIC_PATHS.map((p) => ({ url: `${root}${p}`, changeFrequency: 'weekly' as const, priority: p === '/' ? 1 : 0.7 })),
    ...entries.map((e) => ({ url: `${root}${e.path}`, lastModified: new Date(e.updatedAt), changeFrequency: 'monthly' as const, priority: 0.5 })),
  ]
}
