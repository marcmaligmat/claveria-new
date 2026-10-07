import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { DOCUMENT_CATEGORIES } from '@/lib/constants'
import { revalidatePaths } from '@/lib/revalidate'
import type { Document } from '@/payload-types'

const afterChange: CollectionAfterChangeHook<Document> = ({ doc, req: { payload, context } }) => {
  revalidatePaths(['/sangguniang-bayan', '/transparency'], context, payload.logger)
  return doc
}
const afterDelete: CollectionAfterDeleteHook<Document> = ({ doc, req: { payload, context } }) => {
  revalidatePaths(['/sangguniang-bayan', '/transparency'], context, payload.logger)
  return doc
}

export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'category'], group: 'Content' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  hooks: { afterChange: [afterChange], afterDelete: [afterDelete] },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'other',
      options: DOCUMENT_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
      admin: { position: 'sidebar' },
    },
    { name: 'file', type: 'upload', relationTo: 'media', required: true, filterOptions: { mimeType: { contains: 'pdf' } } },
  ],
}
