import type { CollectionConfig } from 'payload'
import path from 'path'
import { anyone, authenticated } from '@/access'

const staticDir = process.env.MEDIA_DIR
  ? path.resolve(process.cwd(), process.env.MEDIA_DIR)
  : path.resolve(process.cwd(), 'media')

export const Media: CollectionConfig = {
  slug: 'media',
  admin: { group: 'Content' },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
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
