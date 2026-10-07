import Image from 'next/image'
import Link from 'next/link'
import { DESTINATION_LINKS, NAV_LINKS } from '@/lib/nav'
import { Container } from './container'
import { MobileNav } from './mobile-nav'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-navy/10 bg-white/95 backdrop-blur">
      <Container className="relative flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3" aria-label="Claveria, Misamis Oriental home">
          <Image src="/logo.png" alt="" width={44} height={44} priority />
          <span className="hidden text-sm font-bold leading-tight text-navy sm:block">
            Municipality of Claveria
            <br />
            <span className="font-normal text-ink/70">Misamis Oriental</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-6 text-sm font-semibold text-navy">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="hover:text-gold">{l.label}</Link>
              </li>
            ))}
            <li className="group relative">
              <button type="button" className="hover:text-gold" aria-haspopup="true">
                Destinations ▾
              </button>
              <ul className="invisible absolute right-0 top-full min-w-48 rounded-md border border-navy/10 bg-white p-2 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                {DESTINATION_LINKS.map((d) => (
                  <li key={d.href}>
                    <Link href={d.href} className="block rounded px-3 py-2 font-normal hover:bg-mist">{d.label}</Link>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </nav>
        <MobileNav links={NAV_LINKS} destinations={DESTINATION_LINKS} />
      </Container>
    </header>
  )
}
