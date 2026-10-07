import Link from 'next/link'

export function Pagination({ page, totalPages, basePath }: { page: number; totalPages: number; basePath: string }) {
  if (totalPages <= 1) return null
  const href = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`)
  return (
    <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-4 text-sm font-semibold text-navy">
      {page > 1 ? <Link href={href(page - 1)} className="rounded border border-navy/20 px-4 py-2 hover:bg-mist">← Newer</Link> : null}
      <span className="text-ink/60">Page {page} of {totalPages}</span>
      {page < totalPages ? <Link href={href(page + 1)} className="rounded border border-navy/20 px-4 py-2 hover:bg-mist">Older →</Link> : null}
    </nav>
  )
}
