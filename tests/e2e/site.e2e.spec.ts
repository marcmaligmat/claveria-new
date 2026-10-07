import { expect, test } from '@playwright/test'

const routes: { path: string; heading: RegExp }[] = [
  { path: '/', heading: /News & Events/ },
  { path: '/news', heading: /^News$/ },
  { path: '/news/scholarship-applications-now-open', heading: /Scholarship Applications Now Open/ },
  { path: '/sangguniang-bayan', heading: /Sangguniang Bayan/ },
  { path: '/officials/juan-dela-cruz', heading: /Juan Dela Cruz/ },
  { path: '/departments', heading: /^Departments$/ },
  { path: '/departments/municipal-health-office', heading: /Municipal Health Office/ },
  { path: '/destinations/waterfalls', heading: /Waterfalls/ },
  { path: '/destinations/waterfalls/pamalihi-falls', heading: /Pamalihi Falls/ },
  { path: '/transparency', heading: /Transparency/ },
]

for (const r of routes) {
  test(`renders ${r.path}`, async ({ page }) => {
    const res = await page.goto(r.path)
    expect(res?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: r.heading }).first()).toBeVisible()
  })
}

test('unknown slugs and types return 404', async ({ page }) => {
  expect((await page.goto('/news/does-not-exist'))?.status()).toBe(404)
  expect((await page.goto('/destinations/beaches'))?.status()).toBe(404)
  expect((await page.goto('/no-such-page'))?.status()).toBe(404)
})

test('legacy django urls redirect permanently', async ({ request }) => {
  const res = await request.get('/deparments/municipal-health-office', { maxRedirects: 0 })
  expect(res.status()).toBe(308)
  expect(res.headers()['location']).toContain('/departments/municipal-health-office')
  const sb = await request.get('/sangguniang_bayan', { maxRedirects: 0 })
  expect(sb.status()).toBe(308)
})

test('has no horizontal overflow and the mobile menu opens', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'mobile project only')
  await page.goto('/')
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
  const button = page.getByRole('button', { name: /^(Menu|Close)$/ })
  await button.click()
  await expect(page.getByRole('link', { name: 'Sangguniang Bayan' }).first()).toBeVisible()
  await expect(button).toHaveAttribute('aria-expanded', 'true')
})

test('hero dots switch slides', async ({ page, isMobile }) => {
  test.skip(isMobile, 'desktop project only')
  await page.goto('/')
  const second = page.getByRole('button', { name: 'Go to slide 2' })
  await second.click()
  await expect(second).toHaveAttribute('aria-current', 'true')
})

test('home sets page title and og metadata on an article', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle('Claveria, Misamis Oriental')
  await page.goto('/news/scholarship-applications-now-open')
  await expect(page).toHaveTitle('Scholarship Applications Now Open | Claveria, Misamis Oriental')
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /\/api\/media\/file\//)
})
