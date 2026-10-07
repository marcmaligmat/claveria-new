import type { Media } from '@/payload-types'

export type MediaRef = Media | number | null | undefined
export type MediaSize = 'thumbnail' | 'card' | 'hero' | 'og'

function resolve(media: MediaRef): Media | null {
  return media && typeof media === 'object' ? media : null
}

// Payload's serverURL makes upload URLs absolute; next/image needs the local path.
function toRelative(url: string): string {
  if (!/^https?:\/\//.test(url)) return url
  try {
    const u = new URL(url)
    return u.pathname + u.search
  } catch {
    return url
  }
}

export function mediaUrl(media: MediaRef, size?: MediaSize): string | null {
  const doc = resolve(media)
  if (!doc) return null
  const sized = size ? doc.sizes?.[size]?.url : null
  const url = sized || doc.url || null
  return url ? toRelative(url) : null
}

export function mediaAlt(media: MediaRef): string {
  return resolve(media)?.alt ?? ''
}

export function mediaSize(media: MediaRef, size?: MediaSize): { width: number; height: number } | null {
  const doc = resolve(media)
  if (!doc) return null
  const s = size ? doc.sizes?.[size] : null
  if (s?.width && s?.height) return { width: s.width, height: s.height }
  if (doc.width && doc.height) return { width: doc.width, height: doc.height }
  return null
}
