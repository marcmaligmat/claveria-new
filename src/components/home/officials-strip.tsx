import { Container } from '@/components/container'
import { OfficialCard } from '@/components/official-card'
import { SectionHeading } from '@/components/section-heading'
import type { Official } from '@/payload-types'

export function OfficialsStrip({ officials }: { officials: Official[] }) {
  if (officials.length === 0) return null
  return (
    <section className="py-16">
      <Container>
        <SectionHeading eyebrow="Leadership" title="LGU Officials" action={{ label: 'Sangguniang Bayan', href: '/sangguniang-bayan' }} />
        <div className="-mx-4 flex snap-x gap-5 overflow-x-auto px-4 pb-4">
          {officials.map((o) => <OfficialCard key={o.id} official={o} strip />)}
        </div>
      </Container>
    </section>
  )
}
