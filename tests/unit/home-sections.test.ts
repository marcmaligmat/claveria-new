import { describe, expect, it } from 'vitest'
import { homeSections } from '@/components/home/sections'
import type { SiteSetting } from '@/payload-types'

const empty = { id: 1 } as unknown as SiteSetting

describe('homeSections', () => {
  it('hides every optional section when settings are empty', () => {
    expect(homeSections(empty)).toEqual({ hero: false, mayor: false, helplines: false, emergency: false, facts: false })
  })
  it('shows sections that have content', () => {
    const s = {
      id: 1,
      heroSlides: [{ heading: 'x', image: 1 }],
      mayor: { name: 'M', message: { root: { children: [] } } },
      hotlines: { pnp: '1', helplineGroups: [] },
      facts: { population: '5' },
    } as unknown as SiteSetting
    expect(homeSections(s)).toEqual({ hero: true, mayor: true, helplines: false, emergency: true, facts: true })
  })
})
