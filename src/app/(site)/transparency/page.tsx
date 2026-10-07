import type { Metadata } from 'next'
import { Container } from '@/components/container'
import { DocumentList } from '@/components/document-list'
import { PageHeader } from '@/components/page-header'
import { SectionHeading } from '@/components/section-heading'
import { getDocuments } from '@/lib/data'

export const revalidate = 300
export const metadata: Metadata = { title: 'Transparency', description: 'Full disclosure documents of the Municipality of Claveria.' }

export default async function TransparencyPage() {
  const documents = await getDocuments('transparency')
  return (
    <main>
      <PageHeader title="Transparency" crumbs={[{ label: 'Transparency' }]} />
      <Container className="py-12">
        <section className="rounded-xl bg-mist p-6">
          <h2 className="text-lg font-bold text-navy">Full Disclosure Policy Portal</h2>
          <p className="mt-2 text-sm text-ink/80">Budget, procurement, and financial reports are also published on the DILG portal.</p>
          <a href="https://fdpp.dilg.gov.ph/documents" target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-dark">
            Open the DILG FDP Portal ↗
          </a>
        </section>
        <section className="mt-12">
          <SectionHeading eyebrow="Downloads" title="Transparency documents" />
          <DocumentList documents={documents} emptyText="No transparency documents have been uploaded yet." />
        </section>
      </Container>
    </main>
  )
}
