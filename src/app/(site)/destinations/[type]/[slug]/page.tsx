import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container } from '@/components/container'
import { Gallery, type GalleryPhoto } from '@/components/gallery'
import { PageHeader } from '@/components/page-header'
import { RecentNewsSidebar } from '@/components/recent-news-sidebar'
import { RichText } from '@/components/rich-text'
import { destinationLabel, isDestinationType } from '@/lib/constants'
import { getDestination } from '@/lib/data'
import { excerpt, plainText } from '@/lib/format'
import { mediaAlt, mediaUrl } from '@/lib/media'

export const revalidate = 300
type Props = { params: Promise<{ type: string; slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type, slug } = await params
  if (!isDestinationType(type)) return { title: 'Not found' }
  const d = await getDestination(type, slug)
  if (!d) return { title: 'Not found' }
  const og = mediaUrl(d.photos?.[0]?.image, 'og')
  return { title: d.title, description: excerpt(plainText(d.description), 160), openGraph: { images: og ? [og] : undefined } }
}

export default async function DestinationPage({ params }: Props) {
  const { type, slug } = await params
  if (!isDestinationType(type)) notFound()
  const d = await getDestination(type, slug)
  if (!d) notFound()
  const photos: GalleryPhoto[] = (d.photos ?? [])
    .map((p, i) => ({ id: p.id ?? String(i), src: mediaUrl(p.image, 'hero') ?? '', thumb: mediaUrl(p.image, 'thumbnail') ?? '', alt: mediaAlt(p.image) }))
    .filter((p) => p.src)
  const label = destinationLabel(type)
  return (
    <main>
      <PageHeader title={d.title} crumbs={[{ label: 'Destinations' }, { label, href: `/destinations/${type}` }, { label: d.title }]} />
      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
        <article>
          <Gallery photos={photos} />
          <p className="mt-6 text-sm text-ink/60">📍 {d.location} · {photos.length} {photos.length === 1 ? 'photo' : 'photos'}</p>
          <RichText data={d.description} className="mt-4 text-lg" />
        </article>
        <RecentNewsSidebar />
      </Container>
    </main>
  )
}
