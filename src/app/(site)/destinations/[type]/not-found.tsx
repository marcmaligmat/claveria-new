import Link from 'next/link'
import { Container } from '@/components/container'
import { PageHeader } from '@/components/page-header'
import { DESTINATION_LINKS } from '@/lib/nav'

export default function DestinationNotFound() {
  return (
    <main>
      <PageHeader title="Destination not found" crumbs={[{ label: 'Destinations' }]} />
      <Container className="py-12">
        <p>That destination does not exist. Browse by type:</p>
        <ul className="mt-4 flex flex-wrap gap-3">
          {DESTINATION_LINKS.map((d) => (
            <li key={d.href}><Link href={d.href} className="rounded border border-navy/20 px-3 py-1.5 text-sm font-semibold text-navy hover:bg-mist">{d.label}</Link></li>
          ))}
        </ul>
      </Container>
    </main>
  )
}
