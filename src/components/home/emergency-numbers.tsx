import { Container } from '@/components/container'
import type { SiteSetting } from '@/payload-types'

export function EmergencyNumbers({ hotlines }: { hotlines: NonNullable<SiteSetting['hotlines']> }) {
  const items = [
    { label: 'PNP Hotline', value: hotlines.pnp },
    { label: 'Emergency Responder', value: hotlines.responder },
    { label: 'BFP Hotline', value: hotlines.bfp },
  ].filter((i) => i.value)
  return (
    <section className="bg-gold py-10 text-ink">
      <Container>
        <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em]">Emergency numbers</h2>
        <ul className="mt-6 grid gap-6 text-center sm:grid-cols-3">
          {items.map((i) => (
            <li key={i.label}>
              <a href={`tel:${i.value!.replace(/\s+/g, '')}`} className="text-2xl font-bold md:text-3xl">{i.value}</a>
              <p className="mt-1 text-sm font-medium text-ink">{i.label}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
