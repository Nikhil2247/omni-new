import { NextResponse } from 'next/server'
import {
  buildImageSitemapXml,
  fetchImageSitemapPage,
  IMAGE_SITEMAP_PAGE_SIZE,
  IMAGE_SITEMAP_REVALIDATE_SECONDS,
} from '../shared'

export const revalidate = IMAGE_SITEMAP_REVALIDATE_SECONDS

type RouteParams = {
  params: Promise<{ page: string }>
}

export async function GET(_: Request, { params }: RouteParams): Promise<NextResponse> {
  const { page } = await params
  const parsedPage = Number.parseInt(page, 10)

  if (!Number.isFinite(parsedPage) || parsedPage < 1) {
    return new NextResponse('Invalid sitemap page', { status: 400 })
  }

  const data = await fetchImageSitemapPage(parsedPage, IMAGE_SITEMAP_PAGE_SIZE)

  if (data.totalPages > 0 && parsedPage > data.totalPages) {
    return new NextResponse('Sitemap page not found', { status: 404 })
  }

  const xml = buildImageSitemapXml(data.entries)

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=${IMAGE_SITEMAP_REVALIDATE_SECONDS}, s-maxage=${IMAGE_SITEMAP_REVALIDATE_SECONDS}`,
    },
  })
}
