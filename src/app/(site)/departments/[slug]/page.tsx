import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from '@/components/container'
import { PageHeader } from '@/components/page-header'
import { RecentNewsSidebar } from '@/components/recent-news-sidebar'
import { RichText } from '@/components/rich-text'
import { getDepartmentBySlug, getDepartments } from '@/lib/data'
import { excerpt, plainText } from '@/lib/format'

export const revalidate = 300
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const d = await getDepartmentBySlug(slug)
  return d ? { title: d.name, description: excerpt(plainText(d.summary), 160) } : { title: 'Not found' }
}

export default async function DepartmentPage({ params }: Props) {
  const { slug } = await params
  const d = await getDepartmentBySlug(slug)
  if (!d) notFound()
  const others = (await getDepartments()).filter((x) => x.id !== d.id).slice(0, 6)
  return (
    <main>
      <PageHeader title={d.name} crumbs={[{ label: 'Departments', href: '/departments' }, { label: d.name }]} />
      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
        <article>
          <RichText data={d.body} className="text-lg" />
          {others.length > 0 ? (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-navy">Other departments</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {others.map((o) => (
                  <li key={o.id}>
                    <Link href={`/departments/${o.slug}`} className="block rounded-lg border border-navy/10 px-4 py-3 text-sm font-medium text-navy hover:bg-mist">{o.name}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </article>
        <RecentNewsSidebar />
      </Container>
    </main>
  )
}
