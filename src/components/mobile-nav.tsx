'use client'

import Link from 'next/link'
import { useState } from 'react'

type NavLink = { label: string; href: string }

export function MobileNav({ links, destinations }: { links: NavLink[]; destinations: NavLink[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
        className="rounded-md border border-navy/20 px-3 py-2 text-sm font-semibold text-navy"
      >
        {open ? 'Close' : 'Menu'}
      </button>
      {open ? (
        <div id="mobile-menu" className="absolute inset-x-0 top-full border-t border-navy/10 bg-white shadow-lg">
          <ul className="flex flex-col px-4 py-2">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} onClick={() => setOpen(false)} className="block py-3 font-medium text-navy">
                  {l.label}
                </Link>
              </li>
            ))}
            <li className="border-t border-navy/10 pt-2">
              <p className="py-2 text-xs font-semibold uppercase tracking-wider text-gold">Destinations</p>
              <ul>
                {destinations.map((d) => (
                  <li key={d.href}>
                    <Link href={d.href} onClick={() => setOpen(false)} className="block py-2 pl-3 text-navy">
                      {d.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  )
}
