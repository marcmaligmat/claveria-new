import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'
import { anyone, authenticated } from '@/access'
import { slugField } from '@/fields/slug'
import { revalidateLayout, revalidatePaths } from '@/lib/revalidate'
import type { Department } from '@/payload-types'

const paths = (slug?: string | null) => ['/', '/departments', '/sitemap.xml', ...(slug ? [`/departments/${slug}`] : [])]

const afterChange: CollectionAfterChangeHook<Department> = ({ doc, previousDoc, req: { payload, context } }) => {
  const list = paths(doc.slug)
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) list.push(`/departments/${previousDoc.slug}`)
  revalidatePaths(list, context, payload.logger)
  revalidateLayout(context, payload.logger)
  return doc
}
const afterDelete: CollectionAfterDeleteHook<Department> = ({ doc, req: { payload, context } }) => {
  revalidatePaths(paths(doc.slug), context, payload.logger)
  revalidateLayout(context, payload.logger)
  return doc
}

export const Departments: CollectionConfig = {
  slug: 'departments',
  admin: { useAsTitle: 'name', defaultColumns: ['name', 'order'], group: 'Content' },
  access: { read: anyone, create: authenticated, update: authenticated, delete: authenticated },
  defaultSort: 'order',
  hooks: { afterChange: [afterChange], afterDelete: [afterDelete] },
  fields: [
    { name: 'name', type: 'text', required: true },
    slugField('name'),
    { name: 'order', type: 'number', defaultValue: 100, admin: { position: 'sidebar' } },
    { name: 'icon', type: 'upload', relationTo: 'media', admin: { position: 'sidebar' } },
    { name: 'summary', type: 'richText', required: true, admin: { description: 'Shown on the departments list card.' } },
    { name: 'body', type: 'richText', required: true },
  ],
}
