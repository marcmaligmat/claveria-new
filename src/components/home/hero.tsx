'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export type HeroSlide = { id: string; src: string; alt: string; heading: string; subheading?: string | null; ctaLabel?: string | null; ctaHref?: string | null }

export function Hero({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)
  const track = useRef<HTMLDivElement>(null)
  const raf = useRef(0)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Autoplay: re-armed whenever the index changes (so dot clicks and swipes reset the timer).
  useEffect(() => {
    if (slides.length < 2 || paused || reduced) return
    const id = setTimeout(() => setIndex((i) => (i + 1) % slides.length), 7000)
    return () => clearTimeout(id)
  }, [index, paused, reduced, slides.length])

  // Move the track when index changes programmatically (autoplay, dots).
  useEffect(() => {
    const el = track.current
    if (!el || el.clientWidth === 0) return
    if (Math.round(el.scrollLeft / el.clientWidth) === index) return
    el.scrollTo({ left: el.clientWidth * index, behavior: reduced ? 'auto' : 'smooth' })
  }, [index, reduced])

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  // Keep index in sync with user swipes/trackpad scrolls.
  function onScroll() {
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      const el = track.current
      if (!el || el.clientWidth === 0) return
      setIndex(Math.min(slides.length - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))))
    })
  }

  return (
    <section aria-roledescription="carousel" aria-label="Highlights" className="relative bg-navy text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div ref={track} onScroll={onScroll} className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slides.map((s, i) => (
          <div key={s.id} className="relative h-[60vh] min-h-[380px] w-full shrink-0 snap-start" aria-hidden={i !== index} inert={i !== index}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.src} alt={s.alt} className="absolute inset-0 h-full w-full object-cover" loading={i === 0 ? 'eager' : 'lazy'} />
            <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/40 to-transparent" />
            <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-14">
              <p className="max-w-2xl text-3xl font-bold md:text-5xl">{s.heading}</p>
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
