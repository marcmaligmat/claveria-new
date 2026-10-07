import type { SiteSetting } from '@/payload-types'

export function homeSections(s: SiteSetting) {
  const facts = s.facts ?? {}
  return {
    hero: (s.heroSlides?.length ?? 0) > 0,
    mayor: Boolean(s.mayor?.name && s.mayor?.message),
    helplines: (s.hotlines?.helplineGroups?.length ?? 0) > 0,
    emergency: Boolean(s.hotlines?.pnp || s.hotlines?.responder || s.hotlines?.bfp),
    facts: Boolean(facts.population || facts.areaKm2 || facts.schools || facts.hospitals || facts.touristVisits),
  }
}
