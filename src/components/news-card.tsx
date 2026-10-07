import Link from 'next/link'
import { newsCategoryLabel } from '@/lib/constants'
import { excerpt, formatDate, plainText } from '@/lib/format'
import type { News } from '@/payload-types'
import { MediaImage } from './media-image'

export function NewsCard({ news }: { news: News }) {
  const summary = news.excerpt || excerpt(plainText(news.body), 140)
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/news/${news.slug}`} className="relative block aspect-[3/2]">
        <MediaImage media={news.coverImage} size="card" fill sizes="(min-width: 768px) 33vw, 100vw" />
        <span className="absolute left-3 top-3 rounded bg-gold px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">
          {newsCategoryLabel(news.category)}
        </span>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {news.publishedAt ? <time dateTime={news.publishedAt} className="text-xs text-ink/60">{formatDate(news.publishedAt)}</time> : null}
        <h3 className="mt-2 text-lg font-bold leading-snug text-navy">
          <Link href={`/news/${news.slug}`} className="hover:text-gold">{news.title}</Link>
        </h3>
        <p className="mt-2 text-sm text-ink/80">{summary}</p>
      </div>
    </article>
  )
}
