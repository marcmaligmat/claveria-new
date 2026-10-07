import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { revalidatePaths } from '@/lib/revalidate'
import type { LocalBoard } from '@/payload-types'

const afterChange: CollectionAfterChangeHook<LocalBoard> = ({ doc, req: { payload, context } }) => {
  revalidatePaths(['/'], context, payload.logger)
  return doc
}
const afterDelete: CollectionAfterDeleteHook<LocalBoard> = ({ doc, req: { payload, context } }) => {
  revalidatePaths(['/'], context, payload.logger)
  return doc
}

export const LocalBoards: CollectionConfig = {
  slug: 'local-boards',
  labels: { singular: 'Local Board', plural: 'Local Boards & Services' },
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'order'], group: 'Content' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  defaultSort: 'order',
  hooks: { afterChange: [afterChange], afterDelete: [afterDelete] },
  fields: [
    { name: 'title', type: 'text', required: true },
    { name: 'image', type: 'upload', relationTo: 'media', required: true },
    { name: 'order', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
  ],
}
