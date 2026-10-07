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
