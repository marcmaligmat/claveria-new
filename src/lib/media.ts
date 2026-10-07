import type { Media } from '@/payload-types'

export type MediaRef = Media | number | null | undefined
export type MediaSize = 'thumbnail' | 'card' | 'hero' | 'og'

function resolve(media: MediaRef): Media | null {
  return media && typeof media === 'object' ? media : null
}

export function mediaUrl(media: MediaRef, size?: MediaSize): string | null {
  const doc = resolve(media)
  if (!doc) return null
  const sized = size ? doc.sizes?.[size]?.url : null
  return sized || doc.url || null
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
