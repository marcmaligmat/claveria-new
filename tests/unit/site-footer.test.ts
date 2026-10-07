import { describe, expect, it, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'

vi.mock('@/lib/data', () => ({
  getSiteSettings: vi.fn(() => Promise.reject(new Error('ECONNREFUSED'))),
  getDepartments: vi.fn(() => Promise.reject(new Error('ECONNREFUSED'))),
}))

import { SiteFooter } from '@/components/site-footer'

describe('SiteFooter', () => {
  it('renders a static footer instead of throwing when the database is down', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const element = await SiteFooter()
    const html = renderToStaticMarkup(element)
    expect(html).toContain('Municipality of Claveria')
    expect(html).toContain('href="/departments"')
    expect(html).toContain('href="/news"')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
})
