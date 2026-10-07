import { notFound } from 'next/navigation'

// Unmatched URLs (including old /destination/<slug> detail URLs) render the styled
// (site)/not-found.tsx with site chrome instead of Next's bare 404.
export default function MissingPage(): never {
  notFound()
}
