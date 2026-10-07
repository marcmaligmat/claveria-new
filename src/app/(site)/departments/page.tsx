import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/container'
import { MediaImage } from '@/components/media-image'
import { PageHeader } from '@/components/page-header'
import { RichText } from '@/components/rich-text'
import { getDepartments } from '@/lib/data'

export const revalidate = 300
export const metadata: Metadata = { title: 'Departments', description: 'Offices and departments of the Municipality of Claveria.' }

export default async function DepartmentsPage() {
  const departments = await getDepartments()
  return (
    <main>
      <PageHeader title="Departments" crumbs={[{ label: 'Departments' }]} />
      <Container className="py-12">
        {departments.length === 0 ? <p className="text-ink/60">No departments listed yet.</p> : (
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((d) => (
              <li key={d.id} className="flex flex-col rounded-xl border border-navy/10 bg-white p-6 shadow-sm">
                {d.icon ? <MediaImage media={d.icon} size="thumbnail" className="mb-4 h-12 w-12 object-contain" sizes="48px" /> : null}
                <h2 className="text-lg font-bold text-navy">
                  <Link href={`/departments/${d.slug}`} className="hover:text-gold">{d.name}</Link>
                </h2>
                <RichText data={d.summary} className="mt-3 flex-1 text-sm text-ink/80" />
                <Link href={`/departments/${d.slug}`} className="mt-4 text-sm font-semibold text-navy underline-offset-4 hover:underline">See more →</Link>
              </li>
            ))}
          </ul>
        )}
      </Container>
    </main>
  )
}
