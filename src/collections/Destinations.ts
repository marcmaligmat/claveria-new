import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { slugField } from '@/fields/slug'
import { DESTINATION_TYPES } from '@/lib/constants'
import { revalidatePaths } from '@/lib/revalidate'
import type { Destination } from '@/payload-types'

const paths = (type: string, slug?: string | null) => [
  '/',
  `/destinations/${type}`,
  '/sitemap.xml',
  ...(slug ? [`/destinations/${type}/${slug}`] : []),
]

const afterChange: CollectionAfterChangeHook<Destination> = ({ doc, previousDoc, req: { payload, context } }) => {
  const list = paths(doc.type, doc.slug)
  if (previousDoc && (previousDoc.slug !== doc.slug || previousDoc.type !== doc.type)) {
    list.push(...paths(previousDoc.type, previousDoc.slug))
  }
  revalidatePaths(list, context, payload.logger)
  return doc
}
const afterDelete: CollectionAfterDeleteHook<Destination> = ({ doc, req: { payload, context } }) => {
  revalidatePaths(paths(doc.type, doc.slug), context, payload.logger)
  return doc
}

export const Destinations: CollectionConfig = {
  slug: 'destinations',
  admin: { useAsTitle: 'title', defaultColumns: ['title', 'type', 'location'], group: 'Content' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  hooks: { afterChange: [afterChange], afterDelete: [afterDelete] },
  fields: [
    { name: 'title', type: 'text', required: true },
    slugField('title'),
    {
      name: 'type',
      type: 'select',
      required: true,
      options: DESTINATION_TYPES.map((t) => ({ value: t.value, label: t.label })),
      admin: { position: 'sidebar' },
    },
    { name: 'location', type: 'text', required: true },
    { name: 'description', type: 'richText', required: true },
    {
      name: 'photos',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Photo', plural: 'Photos' },
      admin: { description: 'The first photo is the cover.' },
      fields: [{ name: 'image', type: 'upload', relationTo: 'media', required: true }],
    },
  ],
}
