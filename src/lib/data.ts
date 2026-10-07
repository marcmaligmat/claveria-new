import type { Department, Destination, Document, LocalBoard, Media, News, Official, SiteSetting } from '@/payload-types'
import { DESTINATION_TYPES, type DestinationType } from './constants'
import { getPayloadClient } from './payload'

const PUBLISHED = { _status: { equals: 'published' } } as const

export async function getSiteSettings(): Promise<SiteSetting> {
  const payload = await getPayloadClient()
  return payload.findGlobal({ slug: 'site-settings', depth: 1 })
}

export async function getLatestNews(limit = 6): Promise<News[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'news', where: PUBLISHED, sort: '-publishedAt', limit, depth: 1 })
  return res.docs
}

export async function getNewsPage(page: number, perPage = 12): Promise<{ docs: News[]; totalPages: number; page: number }> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'news', where: PUBLISHED, sort: '-publishedAt', limit: perPage, page, depth: 1 })
  return { docs: res.docs, totalPages: res.totalPages, page: res.page ?? page }
}

export async function getNewsBySlug(slug: string): Promise<News | null> {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'news',
    where: { and: [PUBLISHED, { slug: { equals: slug } }] },
    limit: 1,
    depth: 2,
  })
  return res.docs[0] ?? null
}

export async function getOfficials(): Promise<Official[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'officials', sort: 'order', limit: 100, depth: 1 })
  return res.docs
}

export async function getOfficialsByPosition(position: Official['position']): Promise<Official[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'officials', where: { position: { equals: position } }, sort: 'order', limit: 100, depth: 1 })
  return res.docs
}

export async function getOfficialBySlug(slug: string): Promise<Official | null> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'officials', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return res.docs[0] ?? null
}

export async function getDepartments(): Promise<Department[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'departments', sort: 'order', limit: 100, depth: 1 })
  return res.docs
}

export async function getDepartmentBySlug(slug: string): Promise<Department | null> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'departments', where: { slug: { equals: slug } }, limit: 1, depth: 1 })
  return res.docs[0] ?? null
}

export async function getDestinationsByType(type: DestinationType): Promise<Destination[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'destinations', where: { type: { equals: type } }, sort: 'title', limit: 100, depth: 1 })
  return res.docs
}

export async function getDestination(type: DestinationType, slug: string): Promise<Destination | null> {
  const payload = await getPayloadClient()
  const res = await payload.find({
    collection: 'destinations',
    where: { and: [{ type: { equals: type } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 1,
  })
  return res.docs[0] ?? null
}

export async function getDestinationHighlights(): Promise<{ type: DestinationType; label: string; cover: Media | null; count: number }[]> {
  const payload = await getPayloadClient()
  const out = []
  for (const t of DESTINATION_TYPES) {
    const res = await payload.find({ collection: 'destinations', where: { type: { equals: t.value } }, limit: 1, depth: 1 })
    const first = res.docs[0]?.photos?.[0]?.image
    out.push({ type: t.value, label: t.label, cover: first && typeof first === 'object' ? first : null, count: res.totalDocs })
  }
  return out
}

export async function getLocalBoards(): Promise<LocalBoard[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'local-boards', sort: 'order', limit: 12, depth: 1 })
  return res.docs
}

export async function getDocuments(category: Document['category']): Promise<Document[]> {
  const payload = await getPayloadClient()
  const res = await payload.find({ collection: 'documents', where: { category: { equals: category } }, sort: 'title', limit: 100, depth: 1 })
  return res.docs
}

export async function getSitemapEntries(): Promise<{ path: string; updatedAt: string }[]> {
  const payload = await getPayloadClient()
  const entries: { path: string; updatedAt: string }[] = []
  const news = await payload.find({ collection: 'news', where: PUBLISHED, limit: 1000, depth: 0, select: { slug: true, updatedAt: true } })
  for (const n of news.docs) entries.push({ path: `/news/${n.slug}`, updatedAt: n.updatedAt })
  const departments = await payload.find({ collection: 'departments', limit: 1000, depth: 0, select: { slug: true, updatedAt: true } })
  for (const d of departments.docs) entries.push({ path: `/departments/${d.slug}`, updatedAt: d.updatedAt })
  const officials = await payload.find({ collection: 'officials', limit: 1000, depth: 0, select: { slug: true, updatedAt: true } })
  for (const o of officials.docs) entries.push({ path: `/officials/${o.slug}`, updatedAt: o.updatedAt })
  const destinations = await payload.find({ collection: 'destinations', limit: 1000, depth: 0, select: { slug: true, type: true, updatedAt: true } })
  for (const d of destinations.docs) entries.push({ path: `/destinations/${d.type}/${d.slug}`, updatedAt: d.updatedAt })
  return entries
}
