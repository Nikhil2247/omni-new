import { NextResponse } from 'next/server'
import {
  buildImageSitemapIndexXml,
  fetchImageSitemapPage,
  IMAGE_SITEMAP_PAGE_SIZE,
  IMAGE_SITEMAP_REVALIDATE_SECONDS,
} from '../image-sitemap/shared'

export const revalidate = 3600

export async function GET(): Promise<NextResponse> {
  const firstPage = await fetchImageSitemapPage(1, IMAGE_SITEMAP_PAGE_SIZE)
  const pageCount = firstPage.total > 0 ? Math.max(1, firstPage.totalPages) : 0

  const xml = buildImageSitemapIndexXml(pageCount)

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=${IMAGE_SITEMAP_REVALIDATE_SECONDS}, s-maxage=${IMAGE_SITEMAP_REVALIDATE_SECONDS}`,
    },
  })
}
