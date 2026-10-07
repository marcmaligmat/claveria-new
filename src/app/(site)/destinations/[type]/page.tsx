import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Container } from '@/components/container'
import { MediaImage } from '@/components/media-image'
import { PageHeader } from '@/components/page-header'
import { RecentNewsSidebar } from '@/components/recent-news-sidebar'
import { destinationLabel, isDestinationType } from '@/lib/constants'
import { getDestinationsByType } from '@/lib/data'
import { excerpt, plainText } from '@/lib/format'

export const revalidate = 300
type Props = { params: Promise<{ type: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type } = await params
  if (!isDestinationType(type)) return { title: 'Not found' }
  const label = destinationLabel(type)
  return { title: label, description: `${label} in Claveria, Misamis Oriental.` }
}

export default async function DestinationTypePage({ params }: Props) {
  const { type } = await params
  if (!isDestinationType(type)) notFound()
  const label = destinationLabel(type)
  const items = await getDestinationsByType(type)
  return (
    <main>
      <PageHeader title={label} crumbs={[{ label: 'Destinations' }, { label }]} />
      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
        {items.length === 0 ? <p className="text-ink/60">Nothing listed under {label} yet.</p> : (
          <ul className="space-y-8">
            {items.map((d) => (
              <li key={d.id} className="grid gap-5 rounded-xl border border-navy/10 bg-white p-4 sm:grid-cols-[260px_1fr]">
                <Link href={`/destinations/${type}/${d.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-mist">
                  <MediaImage media={d.photos?.[0]?.image} size="card" fill sizes="(min-width: 640px) 260px, 100vw" />
                </Link>
                <div>
                  <h2 className="text-xl font-bold text-navy"><Link href={`/destinations/${type}/${d.slug}`} className="hover:text-gold">{d.title}</Link></h2>
                  <p className="mt-1 text-sm text-ink/60">📍 {d.location}</p>
                  <p className="mt-3 text-sm text-ink/80">{excerpt(plainText(d.description), 200)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
        <RecentNewsSidebar />
      </Container>
    </main>
  )
}
