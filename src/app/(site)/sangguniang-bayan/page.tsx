import type { Metadata } from 'next'
import Link from 'next/link'
import { Container } from '@/components/container'
import { DocumentList } from '@/components/document-list'
import { MediaImage } from '@/components/media-image'
import { OfficialCard } from '@/components/official-card'
import { PageHeader } from '@/components/page-header'
import { RichText } from '@/components/rich-text'
import { SectionHeading } from '@/components/section-heading'
import { getDocuments, getOfficialsByPosition, getSiteSettings } from '@/lib/data'

export const revalidate = 300
export const metadata: Metadata = { title: 'Sangguniang Bayan', description: 'The municipal council of Claveria, Misamis Oriental.' }

export default async function SangguniangBayanPage() {
  const [viceMayors, councilors, documents, settings] = await Promise.all([
    getOfficialsByPosition('vicemayor'),
    getOfficialsByPosition('councilor'),
    getDocuments('sb'),
    getSiteSettings(),
  ])
  const viceMayor = viceMayors[0]
  const vm = settings.visionMission
  return (
    <main>
      <PageHeader title="Sangguniang Bayan" crumbs={[{ label: 'Sangguniang Bayan' }]} />
      <Container className="py-12">
        {viceMayor ? (
          <section className="grid items-center gap-8 md:grid-cols-[260px_1fr]">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-[260px] overflow-hidden rounded-2xl bg-mist">
              <MediaImage media={viceMayor.photo} size="card" fill sizes="260px" priority />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Presiding Officer</p>
              <h2 className="mt-2 text-2xl font-bold text-navy">
                <Link href={`/officials/${viceMayor.slug}`} className="hover:text-gold">{viceMayor.name}</Link>
              </h2>
              <p className="text-ink/70">Vice Mayor</p>
              {viceMayor.shortDescription ? <p className="mt-3">{viceMayor.shortDescription}</p> : null}
            </div>
          </section>
        ) : null}

        {vm?.vision || vm?.mission ? (
          <section className="mt-14 grid gap-8 rounded-2xl bg-mist p-8 md:grid-cols-2">
            {vm.vision ? <div><h2 className="text-xl font-bold text-navy">Vision</h2><RichText data={vm.vision} className="mt-3" /></div> : null}
            {vm.mission ? <div><h2 className="text-xl font-bold text-navy">Mission</h2><RichText data={vm.mission} className="mt-3" /></div> : null}
          </section>
        ) : null}

        <section className="mt-14">
          <SectionHeading eyebrow="Members" title="Municipal Councilors" />
          {councilors.length === 0 ? <p className="text-ink/60">No councilors listed yet.</p> : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
              {councilors.map((c) => <OfficialCard key={c.id} official={c} />)}
            </div>
          )}
        </section>

        <section className="mt-14">
          <SectionHeading eyebrow="Downloads" title="Sangguniang Bayan documents" />
          <DocumentList documents={documents} />
        </section>
      </Container>
    </main>
  )
}
