import { Container } from '@/components/container'
import { MediaImage } from '@/components/media-image'
import { RichText } from '@/components/rich-text'
import type { SiteSetting } from '@/payload-types'

export function MayorMessage({ mayor }: { mayor: NonNullable<SiteSetting['mayor']> }) {
  return (
    <section className="py-16">
      <Container className="grid items-center gap-10 md:grid-cols-[280px_1fr]">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[280px] overflow-hidden rounded-2xl bg-mist">
          <MediaImage media={mayor.photo} size="card" fill sizes="280px" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Message from the Mayor</p>
          <h2 className="mt-2 text-2xl font-bold text-navy md:text-3xl">{mayor.name}</h2>
          <RichText data={mayor.message} className="mt-4 text-ink/85" />
        </div>
      </Container>
    </section>
  )
}
