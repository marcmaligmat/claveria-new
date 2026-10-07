import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Departments } from './collections/Departments'
import { Destinations } from './collections/Destinations'
import { Documents } from './collections/Documents'
import { LocalBoards } from './collections/LocalBoards'
import { Media } from './collections/Media'
import { News } from './collections/News'
import { Officials } from './collections/Officials'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: { titleSuffix: ' | Claveria LGU Admin' },
  },
  collections: [News, Officials, Departments, Destinations, LocalBoards, Documents, Media, Users],
  globals: [SiteSettings],
  // RelationshipFeature removed: the public site has no converter for relationship nodes.
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => defaultFeatures.filter((f) => f.key !== 'relationship'),
  }),
  secret: process.env.PAYLOAD_SECRET || '',
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,
  typescript: { outputFile: path.resolve(dirname, 'payload-types.ts') },
  db: postgresAdapter({
    pool: { connectionString: process.env.DATABASE_URI || '' },
    // Schema push only in explicit dev/test runs; an unset NODE_ENV (e.g. a production .env
    // missing it) must never push. Production applies migrations instead.
    push: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test',
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
})
