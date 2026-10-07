import { revalidatePath } from 'next/cache'

type Logger = { info(msg: string): void; warn(msg: string): void }

export function revalidatePaths(paths: string[], context: Record<string, unknown>, logger: Logger): void {
  if (context?.disableRevalidate) return
  for (const p of paths) {
    try {
      revalidatePath(p)
      logger.info(`revalidated ${p}`)
    } catch (err) {
      logger.warn(`revalidatePath(${p}) skipped: ${String(err)}`)
    }
  }
}

/** Revalidates the root layout (and so every page) — for data rendered in shared chrome (footer, sidebars). */
export function revalidateLayout(context: Record<string, unknown>, logger: Logger): void {
  if (context?.disableRevalidate) return
  try {
    revalidatePath('/', 'layout')
    logger.info('revalidated / (layout)')
  } catch (err) {
    logger.warn(`revalidatePath(/, layout) skipped: ${String(err)}`)
  }
}
