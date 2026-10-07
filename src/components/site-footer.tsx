import Link from 'next/link'
import { getDepartments, getSiteSettings } from '@/lib/data'
import { DESTINATION_LINKS } from '@/lib/nav'
import { Container } from './container'
import { MediaImage } from './media-image'

export async function SiteFooter() {
  const [settings, departments] = await Promise.all([getSiteSettings(), getDepartments()])
  const links = settings.links
  return (
    <footer className="mt-16 bg-navy text-white">
      <Container className="grid gap-10 py-14 md:grid-cols-4">
        <div>
          <h2 className="text-lg font-bold">Municipality of Claveria</h2>
          <p className="mt-2 text-sm text-white/70">Misamis Oriental, Philippines</p>
          {links?.address ? <p className="mt-4 whitespace-pre-line text-sm text-white/80">{links.address}</p> : null}
          {links?.phone ? <p className="mt-2 text-sm">{links.phone}</p> : null}
          {links?.email ? <a href={`mailto:${links.email}`} className="mt-1 block text-sm underline-offset-4 hover:underline">{links.email}</a> : null}
          {links?.facebookUrl ? (
            <a href={links.facebookUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-gold hover:underline">
              Facebook page ↗
            </a>
          ) : null}
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">Departments</h3>
          <ul className="space-y-2 text-sm">
            {departments.slice(0, 8).map((d) => (
              <li key={d.id}>
                <Link href={`/departments/${d.slug}`} className="text-white/80 hover:text-white">{d.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">Explore</h3>
          <ul className="space-y-2 text-sm">
            {DESTINATION_LINKS.map((d) => (
              <li key={d.href}>
                <Link href={d.href} className="text-white/80 hover:text-white">{d.label}</Link>
              </li>
            ))}
            <li><Link href="/news" className="text-white/80 hover:text-white">News</Link></li>
            <li><Link href="/sangguniang-bayan" className="text-white/80 hover:text-white">Sangguniang Bayan</Link></li>
            <li><Link href="/transparency" className="text-white/80 hover:text-white">Transparency</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gold">Government links</h3>
          <ul className="grid grid-cols-3 gap-3">
            {(links?.agencyLinks ?? []).map((a) => (
              <li key={a.id ?? a.url}>
                <a href={a.url} target="_blank" rel="external noopener noreferrer" title={a.name} className="block rounded bg-white p-1">
                  <MediaImage media={a.logo} size="thumbnail" className="h-14 w-full object-contain" sizes="80px" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </Container>
      <div className="border-t border-white/10 py-4 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Municipality of Claveria, Misamis Oriental
      </div>
    </footer>
  )
}
