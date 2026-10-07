import type { Field, FieldHook } from 'payload'
import { formatSlug } from '@/lib/format'

const formatSlugHook =
  (from: string): FieldHook =>
  ({ data, operation, value }) => {
    if (typeof value === 'string' && value.trim().length > 0) return formatSlug(value)
    if (operation === 'create' || !data?.slug) {
      const source = data?.[from]
      if (typeof source === 'string') return formatSlug(source)
    }
    return value
  }

export function slugField(from = 'title'): Field {
  return {
    name: 'slug',
    type: 'text',
    unique: true,
    index: true,
    admin: {
      position: 'sidebar',
      description: `Generated from ${from}. Edit to override.`,
    },
    hooks: { beforeValidate: [formatSlugHook(from)] },
  }
}
