import Link from 'next/link'
import { Container } from './container'

export type Crumb = { label: string; href?: string }

export function PageHeader({ title, crumbs }: { title: string; crumbs: Crumb[] }) {
  return (
    <section className="bg-navy text-white">
      <Container className="py-10 md:py-14">
        <nav aria-label="Breadcrumb" className="mb-3 text-sm text-white/70">
          <ol className="flex flex-wrap gap-1">
            <li>
              <Link href="/" className="hover:text-white">Home</Link>
            </li>
            {crumbs.map((c) => (
              <li key={c.label} className="flex gap-1">
                <span aria-hidden="true">/</span>
                {c.href ? <Link href={c.href} className="hover:text-white">{c.label}</Link> : <span>{c.label}</span>}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
      </Container>
    </section>
  )
}
