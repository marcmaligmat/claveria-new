import Link from 'next/link'
import { positionLabel } from '@/lib/constants'
import type { Official } from '@/payload-types'
import { MediaImage } from './media-image'

export function OfficialCard({ official, strip = false }: { official: Official; strip?: boolean }) {
  const dept = official.department && typeof official.department === 'object' ? official.department.name : null
  return (
    <Link href={`/officials/${official.slug}`} className={`group block ${strip ? 'w-56 shrink-0 snap-start' : ''}`}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-mist">
        <MediaImage media={official.photo} size="card" fill sizes="224px" className="transition group-hover:scale-105" />
      </div>
      <h3 className="mt-3 font-bold text-navy">{official.name}</h3>
      <p className="text-sm text-ink/70">{dept ? `${dept} ` : ''}{positionLabel(official.position)}</p>
    </Link>
  )
}
