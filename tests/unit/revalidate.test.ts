import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { revalidatePath } from 'next/cache'
import { revalidateLayout, revalidatePaths } from '@/lib/revalidate'

const logger = { info: vi.fn(), warn: vi.fn() }

describe('revalidatePaths', () => {
  beforeEach(() => vi.clearAllMocks())

  it('revalidates each path', () => {
    revalidatePaths(['/', '/news'], {}, logger)
    expect(revalidatePath).toHaveBeenCalledTimes(2)
    expect(revalidatePath).toHaveBeenCalledWith('/news')
  })

  it('does nothing when the request context disables it', () => {
    revalidatePaths(['/'], { disableRevalidate: true }, logger)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('logs a warning instead of throwing when next/cache is unavailable', () => {
    vi.mocked(revalidatePath).mockImplementationOnce(() => {
      throw new Error('static generation store missing')
    })
    expect(() => revalidatePaths(['/'], {}, logger)).not.toThrow()
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })
})

describe('revalidateLayout', () => {
  beforeEach(() => vi.clearAllMocks())

  it('revalidates the root layout', () => {
    revalidateLayout({}, logger)
    expect(revalidatePath).toHaveBeenCalledWith('/', 'layout')
  })

  it('does nothing when the request context disables it', () => {
    revalidateLayout({ disableRevalidate: true }, logger)
    expect(revalidatePath).not.toHaveBeenCalled()
  })

  it('logs a warning instead of throwing', () => {
    vi.mocked(revalidatePath).mockImplementationOnce(() => {
      throw new Error('no store')
    })
    expect(() => revalidateLayout({}, logger)).not.toThrow()
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })
})
