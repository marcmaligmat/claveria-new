import Link from 'next/link'
import { getLatestNews } from '@/lib/data'
import { formatDate } from '@/lib/format'
import { MediaImage } from './media-image'

export async function RecentNewsSidebar({ excludeSlug }: { excludeSlug?: string }) {
  const news = (await getLatestNews(5)).filter((n) => n.slug !== excludeSlug).slice(0, 4)
  if (news.length === 0) return null
  return (
    <aside className="rounded-xl border border-navy/10 bg-white p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-gold">Recent posts</h2>
      <ul className="mt-4 space-y-4">
        {news.map((n) => (
          <li key={n.id} className="flex gap-3">
            <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded bg-mist">
              <MediaImage media={n.coverImage} size="thumbnail" fill sizes="80px" />
            </div>
            <div>
              {n.publishedAt ? <time dateTime={n.publishedAt} className="text-xs text-ink/60">{formatDate(n.publishedAt)}</time> : null}
              <h3 className="text-sm font-semibold leading-snug text-navy">
                <Link href={`/news/${n.slug}`} className="hover:text-gold">{n.title}</Link>
              </h3>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}
