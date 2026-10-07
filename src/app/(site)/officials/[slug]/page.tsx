import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Container } from '@/components/container'
import { MediaImage } from '@/components/media-image'
import { PageHeader } from '@/components/page-header'
import { RichText } from '@/components/rich-text'
import { positionLabel } from '@/lib/constants'
import { getOfficialBySlug } from '@/lib/data'
import { mediaUrl } from '@/lib/media'

export const revalidate = 300
type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const o = await getOfficialBySlug(slug)
  if (!o) return { title: 'Not found' }
  const og = mediaUrl(o.photo, 'og')
  return { title: o.name, description: o.shortDescription ?? `${o.name}, ${positionLabel(o.position)}`, openGraph: { images: og ? [og] : undefined } }
}

export default async function OfficialPage({ params }: Props) {
  const { slug } = await params
  const o = await getOfficialBySlug(slug)
  if (!o) notFound()
  const dept = o.department && typeof o.department === 'object' ? o.department.name : null
  return (
    <main>
      <PageHeader title={o.name} crumbs={[{ label: 'Officials', href: '/sangguniang-bayan' }, { label: o.name }]} />
      <Container className="grid gap-10 py-12 md:grid-cols-[320px_1fr]">
        <div className="relative mx-auto aspect-[4/5] w-full max-w-[320px] overflow-hidden rounded-2xl bg-mist">
          <MediaImage media={o.photo} size="card" fill sizes="320px" priority />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-gold">{dept ? `${dept} · ` : ''}{positionLabel(o.position)}</p>
          {o.shortDescription ? <p className="mt-2 text-lg text-ink/80">{o.shortDescription}</p> : null}
          <RichText data={o.bio} className="mt-6" />
          {o.politicalExperience ? <><h2 className="mt-10 text-xl font-bold text-navy">Political Experience</h2><RichText data={o.politicalExperience} className="mt-3" /></> : null}
          {o.responsibilities ? <><h2 className="mt-10 text-xl font-bold text-navy">Key Responsibilities</h2><RichText data={o.responsibilities} className="mt-3" /></> : null}
        </div>
      </Container>
    </main>
  )
}
