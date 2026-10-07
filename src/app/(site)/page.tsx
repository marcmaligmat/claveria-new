import { DestinationHighlights } from '@/components/home/destination-highlights'
import { EmergencyNumbers } from '@/components/home/emergency-numbers'
import { Facts } from '@/components/home/facts'
import { Helplines } from '@/components/home/helplines'
import { Hero, type HeroSlide } from '@/components/home/hero'
import { LatestNews } from '@/components/home/latest-news'
import { LocalBoards } from '@/components/home/local-boards'
import { MayorMessage } from '@/components/home/mayor-message'
import { OfficialsStrip } from '@/components/home/officials-strip'
import { homeSections } from '@/components/home/sections'
import { getDestinationHighlights, getLatestNews, getLocalBoards, getOfficials, getSiteSettings } from '@/lib/data'
import { mediaAlt, mediaUrl } from '@/lib/media'

export const revalidate = 300

export default async function HomePage() {
  const [settings, news, boards, highlights, officials] = await Promise.all([
    getSiteSettings(),
    getLatestNews(6),
    getLocalBoards(),
    getDestinationHighlights(),
    getOfficials(),
  ])
  const show = homeSections(settings)
  const slides: HeroSlide[] = (settings.heroSlides ?? [])
    .map((s, i) => ({
      id: s.id ?? String(i),
      src: mediaUrl(s.image, 'hero') ?? '',
      alt: mediaAlt(s.image),
      heading: s.heading,
      subheading: s.subheading,
      ctaLabel: s.ctaLabel,
      ctaHref: s.ctaHref,
    }))
    .filter((s) => s.src)

  return (
    <main>
      <h1 className="sr-only">Claveria, Misamis Oriental</h1>
      {show.hero && slides.length > 0 ? <Hero slides={slides} /> : null}
      {show.mayor ? <MayorMessage mayor={settings.mayor!} /> : null}
      <LatestNews news={news} />
      <LocalBoards boards={boards} />
      {show.helplines ? <Helplines groups={settings.hotlines!.helplineGroups!} /> : null}
      {show.emergency ? <EmergencyNumbers hotlines={settings.hotlines!} /> : null}
      <DestinationHighlights highlights={highlights} />
      {show.facts ? <Facts facts={settings.facts!} /> : null}
      <OfficialsStrip officials={officials} />
    </main>
  )
}
