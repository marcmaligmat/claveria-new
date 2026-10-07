'use client'

import './(site)/globals.css'

// Catches errors thrown by the root (site) layout itself (e.g. header/footer), which
// (site)/error.tsx cannot. Must render its own <html> and <body>.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <main className="mx-auto max-w-6xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold text-navy">Something went wrong</h1>
          <p className="mt-2 text-ink/70">We could not load this page. Please try again.</p>
          <button type="button" onClick={reset} className="mt-6 rounded bg-gold px-5 py-2 text-sm font-semibold text-ink hover:bg-gold-dark">
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
