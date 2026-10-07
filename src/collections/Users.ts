import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'name', group: 'Admin' },
  auth: true,
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [{ name: 'name', type: 'text', required: true }],
}
