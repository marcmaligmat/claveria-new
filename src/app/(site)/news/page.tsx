import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Container } from '@/components/container'
import { NewsCard } from '@/components/news-card'
import { PageHeader } from '@/components/page-header'
import { Pagination } from '@/components/pagination'
import { getNewsPage } from '@/lib/data'
import { parsePage } from '@/lib/format'

export const revalidate = 300

export const metadata: Metadata = { title: 'News', description: 'News and events from the Municipality of Claveria, Misamis Oriental.' }

export default async function NewsListPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const { docs, totalPages } = await getNewsPage(page, 12)
  if (page > totalPages && totalPages > 0) redirect('/news')
  return (
    <main>
      <PageHeader title="News" crumbs={[{ label: 'News' }]} />
      <Container className="py-12">
        {docs.length === 0 ? (
          <p className="text-ink/70">No news has been published yet.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((n) => <NewsCard key={n.id} news={n} />)}
          </div>
        )}
        <Pagination page={page} totalPages={totalPages} basePath="/news" />
      </Container>
    </main>
  )
}
