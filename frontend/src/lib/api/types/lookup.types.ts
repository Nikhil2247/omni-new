export interface EventTypeLookup {
  id: string
  name: string
  slug: string
  description?: string
  iconUrl?: string
  displayOrder: number
}

export interface CityLookup {
  id: string
  name: string
  stateId: string
}
