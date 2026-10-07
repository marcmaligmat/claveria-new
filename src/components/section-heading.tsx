import Link from 'next/link'

export function SectionHeading({ title, eyebrow, action }: { title: string; eyebrow?: string; action?: { label: string; href: string } }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold">{eyebrow}</p> : null}
        <h2 className="text-2xl font-bold text-navy md:text-3xl">{title}</h2>
      </div>
      {action ? (
        <Link href={action.href} className="text-sm font-semibold text-navy underline-offset-4 hover:underline">
          {action.label} →
        </Link>
      ) : null}
    </div>
  )
}
