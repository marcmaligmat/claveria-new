'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export type HeroSlide = { id: string; src: string; alt: string; heading: string; subheading?: string | null; ctaLabel?: string | null; ctaHref?: string | null }

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0)
  const track = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (slides.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), 7000)
    return () => clearInterval(id)
  }, [slides.length])

  useEffect(() => {
    const el = track.current
    if (!el) return
    el.scrollTo({ left: el.clientWidth * index, behavior: 'smooth' })
  }, [index])

  return (
    <section aria-roledescription="carousel" aria-label="Highlights" className="relative bg-navy text-white">
      <div ref={track} className="flex snap-x snap-mandatory overflow-x-hidden scroll-smooth">
        {slides.map((s, i) => (
          <div key={s.id} className="relative h-[60vh] min-h-[380px] w-full shrink-0 snap-start" aria-hidden={i !== index}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.src} alt={s.alt} className="absolute inset-0 h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent" />
            <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-14">
              <h2 className="max-w-2xl text-3xl font-bold md:text-5xl">{s.heading}</h2>
              {s.subheading ? <p className="mt-3 max-w-xl text-base text-white/85 md:text-lg">{s.subheading}</p> : null}
              {s.ctaLabel && s.ctaHref ? (
                <Link href={s.ctaHref} className="mt-6 inline-block w-fit rounded-md bg-gold px-5 py-3 text-sm font-semibold text-white hover:bg-gold-dark">
                  {s.ctaLabel}
                </Link>
              ) : null}
            </div>
          </div>
        ))}
      </div>
      {slides.length > 1 ? (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              onClick={() => setIndex(i)}
              className={`h-2.5 w-2.5 rounded-full ${i === index ? 'bg-gold' : 'bg-white/50'}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
