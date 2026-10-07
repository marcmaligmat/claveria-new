import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Payload } from 'payload'
import * as content from './content'

const dirname = path.dirname(fileURLToPath(import.meta.url))
const ctx = { disableRevalidate: true }

const CONTENT_COLLECTIONS = ['news', 'officials', 'departments', 'destinations', 'local-boards', 'documents', 'media'] as const

export async function seed(payload: Payload): Promise<void> {
  payload.logger.info('seed: wiping content collections')
  // Site settings reference media; release them first so media rows can be deleted.
  await payload.updateGlobal({
    slug: 'site-settings',
    context: ctx,
    overrideAccess: true,
    data: { heroSlides: [], mayor: { photo: null }, links: { agencyLinks: [] } },
  })
  for (const collection of CONTENT_COLLECTIONS) {
    await payload.delete({ collection, where: { id: { exists: true } }, context: ctx, overrideAccess: true })
  }

  const mediaCache = new Map<string, number>()
  const upload = async (file: string, alt: string, dir: 'images' | 'files' = 'images'): Promise<number> => {
    const cached = mediaCache.get(file)
    if (cached) return cached
    const doc = await payload.create({
      collection: 'media',
      data: { alt },
      filePath: path.resolve(dirname, dir, file),
      context: ctx,
      overrideAccess: true,
    })
    mediaCache.set(file, doc.id)
    return doc.id
  }

  payload.logger.info('seed: departments')
  const departmentIds = new Map<string, number>()
  for (const d of content.departments) {
    const doc = await payload.create({
      collection: 'departments',
      context: ctx,
      overrideAccess: true,
      data: { name: d.name, order: d.order, summary: d.summary, body: d.body, icon: await upload(d.icon, d.name) },
    })
    departmentIds.set(d.name, doc.id)
  }

  payload.logger.info('seed: officials')
  for (const o of content.officials) {
    await payload.create({
      collection: 'officials',
      context: ctx,
      overrideAccess: true,
      data: {
        name: o.name,
        position: o.position as 'mayor',
        order: o.order,
        shortDescription: o.short,
        department: o.department ? departmentIds.get(o.department) : undefined,
        photo: await upload(o.photo, o.name),
        bio: o.bio,
        politicalExperience: o.politicalExperience,
        responsibilities: o.responsibilities,
      },
    })
  }

  payload.logger.info('seed: admin user')
  const existing = await payload.find({ collection: 'users', limit: 1, overrideAccess: true })
  const admin =
    existing.docs[0] ??
    (await payload.create({
      collection: 'users',
      overrideAccess: true,
      data: { name: 'Site Admin', email: 'admin@claveria.local', password: 'ChangeMe123!' },
    }))

  payload.logger.info('seed: news')
  for (const n of content.news) {
    await payload.create({
      collection: 'news',
      context: ctx,
      overrideAccess: true,
      data: {
        title: n.title,
        category: n.category as 'government',
        publishedAt: n.publishedAt,
        body: n.body,
        coverImage: await upload(n.image, n.title),
        author: admin.id,
        _status: 'published',
      },
    })
  }

  payload.logger.info('seed: destinations')
  for (const d of content.destinations) {
    const photos = []
    for (const img of d.images) photos.push({ image: await upload(img, d.title) })
    await payload.create({
      collection: 'destinations',
      context: ctx,
      overrideAccess: true,
      data: { title: d.title, type: d.type as 'waterfalls', location: d.location, description: d.description, photos },
    })
  }

  payload.logger.info('seed: local boards')
  for (const b of content.localBoards) {
    await payload.create({
      collection: 'local-boards',
      context: ctx,
      overrideAccess: true,
      data: { title: b.title, order: b.order, image: await upload(b.image, b.title) },
    })
  }

  payload.logger.info('seed: documents')
  for (const doc of content.documents) {
    await payload.create({
      collection: 'documents',
      context: ctx,
      overrideAccess: true,
      data: { title: doc.title, category: doc.category as 'sb', file: await upload('sample.pdf', doc.title, 'files') },
    })
  }

  payload.logger.info('seed: site settings')
  const agencyLinks = []
  for (const a of content.settings.links.agencyLinks) {
    agencyLinks.push({ name: a.name, url: a.url, logo: await upload(a.logo, a.name) })
  }
  const heroSlides = []
  for (const s of content.heroSlides) {
    heroSlides.push({ ...s, image: await upload(s.image, s.heading) })
  }
  await payload.updateGlobal({
    slug: 'site-settings',
    context: ctx,
    overrideAccess: true,
    data: {
      heroSlides,
      mayor: { ...content.settings.mayor, photo: await upload(content.settings.mayor.photo, content.settings.mayor.name) },
      visionMission: content.settings.visionMission,
      hotlines: content.settings.hotlines,
      facts: content.settings.facts,
      links: { ...content.settings.links, agencyLinks },
    },
  })

  payload.logger.info('seed: done')
}
