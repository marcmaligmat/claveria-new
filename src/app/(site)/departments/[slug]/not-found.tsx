import Link from 'next/link'
import { Container } from '@/components/container'
import { PageHeader } from '@/components/page-header'

export default function DepartmentNotFound() {
  return (
    <main>
      <PageHeader title="Department not found" crumbs={[{ label: 'Departments', href: '/departments' }]} />
      <Container className="py-12">
        <p>We could not find that department.</p>
        <Link href="/departments" className="mt-4 inline-block font-semibold text-navy underline underline-offset-4">See all departments</Link>
      </Container>
    </main>
  )
}
