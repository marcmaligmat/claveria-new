import { DESTINATION_TYPES } from './constants'

export const NAV_LINKS = [
  { label: 'Sangguniang Bayan', href: '/sangguniang-bayan' },
  { label: 'Departments', href: '/departments' },
  { label: 'News', href: '/news' },
  { label: 'Transparency', href: '/transparency' },
]

export const DESTINATION_LINKS = DESTINATION_TYPES.map((t) => ({ label: t.label, href: `/destinations/${t.value}` }))
