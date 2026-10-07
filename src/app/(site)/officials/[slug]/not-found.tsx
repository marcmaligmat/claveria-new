import Link from 'next/link'
import { Container } from '@/components/container'
import { PageHeader } from '@/components/page-header'

export default function OfficialNotFound() {
  return (
    <main>
      <PageHeader title="Official not found" crumbs={[{ label: 'Officials', href: '/sangguniang-bayan' }]} />
      <Container className="py-12">
        <p>We could not find that official.</p>
        <Link href="/sangguniang-bayan" className="mt-4 inline-block font-semibold text-navy underline underline-offset-4">See the Sangguniang Bayan</Link>
      </Container>
    </main>
  )
}
