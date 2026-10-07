import Link from 'next/link'
import { Container } from '@/components/container'
import { PageHeader } from '@/components/page-header'

export default function NewsNotFound() {
  return (
    <main>
      <PageHeader title="Article not found" crumbs={[{ label: 'News', href: '/news' }]} />
      <Container className="py-12">
        <p>The article you are looking for does not exist or is no longer published.</p>
        <Link href="/news" className="mt-4 inline-block font-semibold text-navy underline underline-offset-4">Browse all news</Link>
      </Container>
    </main>
  )
}
