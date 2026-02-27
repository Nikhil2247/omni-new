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

export interface CategoryLookup {
  id: string
  slug: string
  name: string
  isActive?: boolean
  displayOrder?: number
  description?: string
  iconUrl?: string
  parentId?: string | null
}
