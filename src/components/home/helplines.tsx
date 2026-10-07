import { Container } from '@/components/container'
import { RichText } from '@/components/rich-text'
import { SectionHeading } from '@/components/section-heading'
import type { SiteSetting } from '@/payload-types'

export function Helplines({ groups }: { groups: NonNullable<NonNullable<SiteSetting['hotlines']>['helplineGroups']> }) {
  return (
    <section className="bg-mist py-16">
      <Container>
        <SectionHeading eyebrow="Need help?" title="Helplines & Emergency Services" />
        <div className="divide-y divide-navy/10 rounded-xl border border-navy/10 bg-white">
          {groups.map((g, i) => (
            <details key={g.id ?? i} open={i === 0} className="group p-5">
              <summary className="cursor-pointer list-none font-semibold text-navy">
                <span className="mr-2 inline-block transition group-open:rotate-90">▸</span>{g.title}
              </summary>
              <RichText data={g.body} className="mt-3 text-sm text-ink/85" />
            </details>
          ))}
        </div>
      </Container>
    </section>
  )
}
