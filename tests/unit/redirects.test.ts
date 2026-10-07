import { describe, expect, it } from 'vitest'
import { redirects } from '../../redirects.mjs'

function find(source: string) {
  return redirects.find((r) => r.source === source)
}

describe('legacy redirects', () => {
  it('maps the misspelled departments path', () => {
    expect(find('/deparments')).toMatchObject({ destination: '/departments', permanent: true })
    expect(find('/deparments/:slug')).toMatchObject({ destination: '/departments/:slug', permanent: true })
  })
  it('maps sangguniang_bayan', () => {
    expect(find('/sangguniang_bayan')).toMatchObject({ destination: '/sangguniang-bayan', permanent: true })
  })
  it('maps destination types and person pages', () => {
    expect(find('/destination/:type(waterfalls|restaurants|resorts|hotels|entertainments)')).toMatchObject({
      destination: '/destinations/:type',
      permanent: true,
    })
    expect(find('/person/:slug')).toMatchObject({ destination: '/officials/:slug', permanent: true })
  })
})
