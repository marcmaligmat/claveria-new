import Link from 'next/link'
import { Container } from '@/components/container'
import { MediaImage } from '@/components/media-image'
import { SectionHeading } from '@/components/section-heading'
import type { Media } from '@/payload-types'

type Highlight = { type: string; label: string; cover: Media | null; count: number }

export function DestinationHighlights({ highlights }: { highlights: Highlight[] }) {
  const items = highlights.filter((h) => h.count > 0)
  if (items.length === 0) return null
  return (
    <section className="py-16">
      <Container>
        <SectionHeading eyebrow="Explore" title="Highlights & Municipal Scapes" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((h) => (
            <li key={h.type}>
              <Link href={`/destinations/${h.type}`} className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-navy">
                <MediaImage media={h.cover} size="card" fill sizes="(min-width: 1024px) 33vw, 100vw" className="transition group-hover:scale-105" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy to-transparent p-4 pt-10 text-white">
                  <h3 className="text-lg font-bold">{h.label}</h3>
                  <p className="text-sm text-white/80">{h.count} {h.count === 1 ? 'place' : 'places'}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
