import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'
import path from 'path'
import { anyone, authenticated } from '@/access'
import { revalidateLayout } from '@/lib/revalidate'

const staticDir = process.env.MEDIA_DIR
  ? path.resolve(process.cwd(), process.env.MEDIA_DIR)
  : path.resolve(process.cwd(), 'media')

// Media appears in shared chrome (agency seals, hero slides) — refresh every page.
const afterChange: CollectionAfterChangeHook = ({ doc, req: { payload, context } }) => {
  revalidateLayout(context, payload.logger)
  return doc
}
const afterDelete: CollectionAfterDeleteHook = ({ doc, req: { payload, context } }) => {
  revalidateLayout(context, payload.logger)
  return doc
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content' },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: { afterChange: [afterChange], afterDelete: [afterDelete] },
  fields: [{ name: 'alt', type: 'text', required: true }],
  upload: {
    staticDir,
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'application/pdf'],
    focalPoint: true,
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 600, height: 400, position: 'centre' },
      { name: 'hero', width: 1600, height: 900, position: 'centre' },
      { name: 'og', width: 1200, height: 630, position: 'centre' },
    ],
  },
}
