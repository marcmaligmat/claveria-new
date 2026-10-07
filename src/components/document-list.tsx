import { mediaUrl } from '@/lib/media'
import type { Document } from '@/payload-types'

export function DocumentList({ documents, emptyText = 'No documents yet.' }: { documents: Document[]; emptyText?: string }) {
  if (documents.length === 0) return <p className="text-sm text-ink/60">{emptyText}</p>
  return (
    <ul className="divide-y divide-navy/10 rounded-xl border border-navy/10 bg-white">
      {documents.map((d) => {
        const href = mediaUrl(d.file)
        return (
          <li key={d.id} className="flex items-center justify-between gap-4 p-4">
            <span className="font-medium text-navy">{d.title}</span>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded bg-gold px-3 py-1.5 text-xs font-semibold text-white hover:bg-gold-dark">
                Download PDF
              </a>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
