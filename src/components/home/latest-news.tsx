import { Container } from '@/components/container'
import { NewsCard } from '@/components/news-card'
import { SectionHeading } from '@/components/section-heading'
import type { News } from '@/payload-types'

export function LatestNews({ news }: { news: News[] }) {
  if (news.length === 0) return null
  return (
    <section className="bg-mist py-16">
      <Container>
        <SectionHeading eyebrow="Updates" title="News & Events" action={{ label: 'All news', href: '/news' }} />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {news.map((n) => <NewsCard key={n.id} news={n} />)}
        </div>
      </Container>
    </section>
  )
}
