import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, CollectionConfig } from 'payload'
import { authenticated, authenticatedOrPublished } from '@/access'
import { slugField } from '@/fields/slug'
import { NEWS_CATEGORIES } from '@/lib/constants'
import { revalidatePaths } from '@/lib/revalidate'
import type { News as NewsDoc } from '@/payload-types'

const afterChange: CollectionAfterChangeHook<NewsDoc> = ({ doc, previousDoc, req: { payload, context } }) => {
  const paths = ['/', '/news', '/sitemap.xml', `/news/${doc.slug}`]
  if (previousDoc?.slug && previousDoc.slug !== doc.slug) paths.push(`/news/${previousDoc.slug}`)
  revalidatePaths(paths, context, payload.logger)
  return doc
}

const afterDelete: CollectionAfterDeleteHook<NewsDoc> = ({ doc, req: { payload, context } }) => {
  revalidatePaths(['/', '/news', '/sitemap.xml', `/news/${doc.slug}`], context, payload.logger)
  return doc
}

export const News: CollectionConfig = {
  slug: 'news',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', '_status'],
    group: 'Content',
  },
  access: {
    read: authenticatedOrPublished,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  versions: { drafts: true },
  hooks: { afterChange: [afterChange], afterDelete: [afterDelete] },
  fields: [
    { name: 'title', type: 'text', required: true, maxLength: 160 },
    slugField('title'),
    {
      name: 'category',
      type: 'select',
      required: true,
      defaultValue: 'government',
      options: NEWS_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
      admin: { position: 'sidebar' },
    },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
      hooks: {
        beforeChange: [({ value, siblingData }) => (siblingData._status === 'published' && !value ? new Date() : value)],
      },
    },
    { name: 'coverImage', type: 'upload', relationTo: 'media', required: true },
    { name: 'excerpt', type: 'textarea', maxLength: 200, admin: { description: 'Optional. Falls back to the first 160 characters of the body.' } },
    { name: 'body', type: 'richText', required: true },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      admin: { position: 'sidebar' },
      hooks: { beforeChange: [({ value, req }) => value ?? req.user?.id ?? null] },
    },
  ],
}
