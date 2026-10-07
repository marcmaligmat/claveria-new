import { Container } from '@/components/container'
import type { SiteSetting } from '@/payload-types'

export function Facts({ facts }: { facts: NonNullable<SiteSetting['facts']> }) {
  const items = [
    { label: 'Population', value: facts.population },
    { label: 'Square kilometres', value: facts.areaKm2 },
    { label: 'Schools', value: facts.schools },
    { label: 'Hospitals', value: facts.hospitals },
    { label: 'Tourist visits', value: facts.touristVisits },
  ].filter((i) => i.value)
  return (
    <section className="bg-navy py-14 text-white">
      <Container>
        <h2 className="text-center text-2xl font-bold">Facts About Claveria</h2>
        <dl className="mt-8 grid grid-cols-2 gap-6 text-center md:grid-cols-5">
          {items.map((i) => (
            <div key={i.label} className="flex flex-col">
              <dt className="order-2 mt-1 text-sm text-white/80">{i.label}</dt>
              <dd className="order-1 text-3xl font-bold text-gold">{i.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  )
}
