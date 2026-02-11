export interface PortfolioMediaVendor {
  id: string
  slug: string
  businessName: string
  categoryId: string
  categoryName?: string | null
}

export interface PortfolioMediaItem {
  id: string
  portfolioId: string
  type: 'IMAGE' | 'VIDEO'
  url: string
  thumbnailUrl?: string | null
  cdnUrl?: string | null
  altText?: string | null
  caption?: string | null
  width?: number | null
  height?: number | null
  createdAt: string
  vendor: PortfolioMediaVendor
  tags?: { id: string; tag: string }[]
}

export interface PortfolioMediaSearchParams {
  query?: string
  categoryId?: string
  cityId?: string
  page?: number
  limit?: number
}
