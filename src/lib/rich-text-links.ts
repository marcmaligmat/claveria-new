type LinkDoc = {
  relationTo: string
  value: unknown
} | null | undefined

function str(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

/** Maps a Lexical internal-link target to its public route. Unpopulated or unknown targets fall back to `/`. */
export function internalDocToHref(doc: LinkDoc): string {
  if (!doc || !doc.value || typeof doc.value !== 'object') return '/'
  const value = doc.value as Record<string, unknown>
  const slug = str(value.slug)
  if (!slug) return '/'
  switch (doc.relationTo) {
    case 'news':
      return `/news/${slug}`
    case 'departments':
      return `/departments/${slug}`
    case 'officials':
      return `/officials/${slug}`
    case 'destinations': {
      const type = str(value.type)
      return type ? `/destinations/${type}/${slug}` : '/'
    }
    default:
      return '/'
  }
}
