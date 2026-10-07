import { describe, expect, it } from 'vitest'
import { internalDocToHref } from '@/lib/rich-text-links'

describe('internalDocToHref', () => {
  it('maps news', () => {
    expect(internalDocToHref({ relationTo: 'news', value: { id: 1, slug: 'hello' } })).toBe('/news/hello')
  })
  it('maps departments', () => {
    expect(internalDocToHref({ relationTo: 'departments', value: { id: 2, slug: 'mswdo' } })).toBe('/departments/mswdo')
  })
  it('maps officials', () => {
    expect(internalDocToHref({ relationTo: 'officials', value: { id: 3, slug: 'juan' } })).toBe('/officials/juan')
  })
  it('maps destinations with their type', () => {
    expect(internalDocToHref({ relationTo: 'destinations', value: { id: 4, slug: 'falls', type: 'nature' } })).toBe(
      '/destinations/nature/falls',
    )
  })
  it('falls back to / for an unknown collection', () => {
    expect(internalDocToHref({ relationTo: 'media', value: { id: 5, slug: 'x' } })).toBe('/')
  })
  it('falls back to / for an unpopulated (numeric) value without throwing', () => {
    expect(internalDocToHref({ relationTo: 'news', value: 7 })).toBe('/')
  })
  it('falls back to / for a missing doc', () => {
    expect(internalDocToHref(null)).toBe('/')
    expect(internalDocToHref(undefined)).toBe('/')
  })
})
