'use client'

import { useState } from 'react'

export type GalleryPhoto = { id: string; src: string; thumb: string; alt: string }

export function Gallery({ photos }: { photos: GalleryPhoto[] }) {
  const [active, setActive] = useState(0)
  if (photos.length === 0) return null
  const current = photos[active] ?? photos[0]
  return (
    <div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-mist">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.src} alt={current.alt} className="h-full w-full object-cover" />
      </div>
      {photos.length > 1 ? (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1" aria-label="Photo thumbnails">
          {photos.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-pressed={i === active}
                aria-label={`Show photo ${i + 1}`}
                className={`block h-16 w-24 shrink-0 overflow-hidden rounded border-2 ${i === active ? 'border-gold' : 'border-transparent'}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumb} alt="" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
