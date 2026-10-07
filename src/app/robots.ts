import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')
  return {
    // Specific allow first: uploaded media under /api must stay crawlable (images in search/OG).
    rules: [{ userAgent: '*', allow: ['/api/media/file/', '/'], disallow: ['/admin', '/api'] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
