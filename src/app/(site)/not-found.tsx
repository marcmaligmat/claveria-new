import Link from 'next/link'
import { Container } from '@/components/container'
import { PageHeader } from '@/components/page-header'

export default function NotFound() {
  return (
    <main>
      <PageHeader title="Page not found" crumbs={[{ label: '404' }]} />
      <Container className="py-12">
        <p>The page you requested does not exist.</p>
        <Link href="/" className="mt-4 inline-block font-semibold text-navy underline underline-offset-4">Back to the home page</Link>
      </Container>
    </main>
  )
}
