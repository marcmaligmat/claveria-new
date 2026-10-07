import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container } from '@/components/container'
import { MediaImage } from '@/components/media-image'
import { PageHeader } from '@/components/page-header'
import { RecentNewsSidebar } from '@/components/recent-news-sidebar'
import { RichText } from '@/components/rich-text'
import { newsCategoryLabel } from '@/lib/constants'
import { getNewsBySlug } from '@/lib/data'
import { excerpt, formatDate, plainText } from '@/lib/format'
import { mediaUrl } from '@/lib/media'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const news = await getNewsBySlug(slug)
  if (!news) return { title: 'Not found' }
  const og = mediaUrl(news.coverImage, 'og')
  return {
    title: news.title,
    description: news.excerpt || excerpt(plainText(news.body), 160),
    openGraph: { title: news.title, type: 'article', images: og ? [og] : undefined, publishedTime: news.publishedAt ?? undefined },
  }
}

export default async function NewsDetailPage({ params }: Props) {
  const { slug } = await params
  const news = await getNewsBySlug(slug)
  if (!news) notFound()
  const author = news.author && typeof news.author === 'object' ? news.author.name : null
  return (
    <main>
      <PageHeader title={news.title} crumbs={[{ label: 'News', href: '/news' }, { label: excerpt(news.title, 50) }]} />
      <Container className="grid gap-10 py-12 lg:grid-cols-[1fr_320px]">
        <article>
          <div className="relative aspect-[2/1] overflow-hidden rounded-xl bg-mist">
            <MediaImage media={news.coverImage} size="hero" fill priority sizes="(min-width: 1024px) 800px, 100vw" />
          </div>
          <p className="mt-6 flex flex-wrap gap-3 text-sm text-ink/60">
            <span className="rounded bg-gold px-2 py-0.5 font-semibold text-ink">{newsCategoryLabel(news.category)}</span>
            {news.publishedAt ? <time dateTime={news.publishedAt}>{formatDate(news.publishedAt)}</time> : null}
            {author ? <span>By {author}</span> : null}
          </p>
          <RichText data={news.body} className="mt-6 text-lg" />
        </article>
        <RecentNewsSidebar excludeSlug={news.slug ?? undefined} />
      </Container>
    </main>
  )
}
