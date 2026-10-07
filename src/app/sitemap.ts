import type { MetadataRoute } from 'next'
import { getSitemapEntries } from '@/lib/data'
import { buildSitemap } from '@/lib/sitemap'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getSitemapEntries()
  return buildSitemap(entries, process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
}
