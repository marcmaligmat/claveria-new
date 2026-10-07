import { describe, expect, it } from 'vitest'
import { mediaAlt, mediaSize, mediaUrl } from '@/lib/media'
import type { Media } from '@/payload-types'

const media = {
  id: 1,
  alt: 'Town hall',
  url: '/api/media/file/hall.jpg',
  width: 2000,
  height: 1200,
  sizes: {
    thumbnail: { url: '/api/media/file/hall-400x300.jpg', width: 400, height: 300 },
    card: { url: null, width: null, height: null },
  },
  updatedAt: '',
  createdAt: '',
} as unknown as Media

describe('media helpers', () => {
  it('returns the sized url when present', () => {
    expect(mediaUrl(media, 'thumbnail')).toBe('/api/media/file/hall-400x300.jpg')
  })
  it('falls back to the original when the size is missing', () => {
    expect(mediaUrl(media, 'card')).toBe('/api/media/file/hall.jpg')
    expect(mediaUrl(media, 'hero')).toBe('/api/media/file/hall.jpg')
  })
  it('returns null for unresolved ids or nothing', () => {
    expect(mediaUrl(42)).toBeNull()
    expect(mediaUrl(null)).toBeNull()
  })
  it('gives alt text and dimensions', () => {
    expect(mediaAlt(media)).toBe('Town hall')
    expect(mediaAlt(null)).toBe('')
    expect(mediaSize(media, 'thumbnail')).toEqual({ width: 400, height: 300 })
    expect(mediaSize(media)).toEqual({ width: 2000, height: 1200 })
  })
})
