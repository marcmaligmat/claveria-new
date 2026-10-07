'use client'

export default function SiteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-24 text-center">
      <h1 className="text-2xl font-bold text-navy">Something went wrong</h1>
      <p className="mt-2 text-ink/70">We could not load this page. Please try again.</p>
      <button type="button" onClick={reset} className="mt-6 rounded bg-gold px-5 py-2 text-sm font-semibold text-white hover:bg-gold-dark">
        Try again
      </button>
    </main>
  )
}
