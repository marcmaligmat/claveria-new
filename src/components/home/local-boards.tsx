import { Container } from '@/components/container'
import { MediaImage } from '@/components/media-image'
import { SectionHeading } from '@/components/section-heading'
import type { LocalBoard } from '@/payload-types'

export function LocalBoards({ boards }: { boards: LocalBoard[] }) {
  if (boards.length === 0) return null
  return (
    <section className="py-16">
      <Container>
        <SectionHeading eyebrow="Community" title="Local Boards & Services" />
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((b) => (
            <li key={b.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-navy">
              <MediaImage media={b.image} size="card" fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="opacity-80" />
              <h3 className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy to-transparent p-4 pt-10 text-lg font-bold text-white">{b.title}</h3>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
