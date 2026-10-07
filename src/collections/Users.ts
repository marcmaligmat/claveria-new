import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: { useAsTitle: 'name', group: 'Admin' },
  // Staff log in with a username; email stays optional and still works for login.
  auth: { loginWithUsername: { allowEmailLogin: true, requireEmail: false, requireUsername: false } },
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
    admin: ({ req: { user } }) => Boolean(user),
  },
  fields: [{ name: 'name', type: 'text', required: true }],
}
