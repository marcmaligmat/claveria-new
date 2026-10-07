export const SITE_NAME = 'Claveria, Misamis Oriental'

export const DESTINATION_TYPES = [
  { value: 'waterfalls', label: 'Waterfalls' },
  { value: 'restaurants', label: 'Restaurants' },
  { value: 'resorts', label: 'Spring Resorts' },
  { value: 'hotels', label: 'Hotels & Inns' },
  { value: 'entertainments', label: 'Nightlife & Entertainment' },
] as const

export type DestinationType = (typeof DESTINATION_TYPES)[number]['value']

export function isDestinationType(value: string): value is DestinationType {
  return DESTINATION_TYPES.some((t) => t.value === value)
}

export function destinationLabel(value: string): string {
  return DESTINATION_TYPES.find((t) => t.value === value)?.label ?? value
}

export const NEWS_CATEGORIES = [
  { value: 'government', label: 'Government' },
  { value: 'policies', label: 'Policies' },
  { value: 'medical', label: 'Medical Event' },
  { value: 'economy', label: 'Economy' },
  { value: 'education', label: 'Education' },
  { value: 'business', label: 'Business' },
] as const

export function newsCategoryLabel(value: string): string {
  return NEWS_CATEGORIES.find((c) => c.value === value)?.label ?? value
}

export const OFFICIAL_POSITIONS = [
  { value: 'mayor', label: 'Mayor' },
  { value: 'vicemayor', label: 'Vice Mayor' },
  { value: 'councilor', label: 'Councilor' },
  { value: 'head', label: 'Head' },
  { value: 'assthead', label: 'Assistant Head' },
  { value: 'officer', label: 'Officer' },
  { value: 'member', label: 'Member' },
] as const

export function positionLabel(value: string): string {
  return OFFICIAL_POSITIONS.find((p) => p.value === value)?.label ?? value
}

export const DOCUMENT_CATEGORIES = [
  { value: 'sb', label: 'Sangguniang Bayan' },
  { value: 'transparency', label: 'Transparency' },
  { value: 'other', label: 'Other' },
] as const
