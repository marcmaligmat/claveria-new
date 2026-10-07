import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { slugField } from '@/fields/slug'
import { OFFICIAL_POSITIONS } from '@/lib/constants'
import { revalidatePaths } from '@/lib/revalidate'
import type { Official } from '@/payload-types'

const paths = (slug?: string | null) => ['/', '/sangguniang-bayan', '/sitemap.xml', ...(slug ? [`/officials/${slug}`] : [])]

const afterChange: CollectionAfterChangeHook<Official> = ({ doc, previousDoc, req: { payload, context } }) => {
  const list = paths(doc.slug)
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) list.push(`/officials/${previousDoc.slug}`)
  revalidatePaths(list, context, payload.logger)
  return doc
}
const afterDelete: CollectionAfterDeleteHook<Official> = ({ doc, req: { payload, context } }) => {
  revalidatePaths(paths(doc.slug), context, payload.logger)
  return doc
}

export const Officials: CollectionConfig = {
  slug: 'officials',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'position', 'department', 'order'], group: 'Content' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  defaultSort: 'order',
  hooks: { afterChange: [afterChange], afterDelete: [afterDelete] },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    {
      name: 'position',
      type: 'select',
      required: true,
      defaultValue: 'member',
      options: OFFICIAL_POSITIONS.map((p) => ({ value: p.value, label: p.label })),
      admin: { position: 'sidebar' },
    },
    { name: 'department', type: 'relationship', relationTo: 'departments', admin: { position: 'sidebar' } },
    { name: 'order', type: 'number', defaultValue: 100, admin: { position: 'sidebar', description: 'Lower numbers show first.' } },
    { name: 'shortDescription', type: 'text', maxLength: 120 },
    { name: 'photo', type: 'upload', relationTo: 'media', required: true },
    { name: 'bio', type: 'richText', required: true },
    { name: 'politicalExperience', type: 'richText' },
    { name: 'responsibilities', type: 'richText' },
  ],
}
