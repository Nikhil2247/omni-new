import { NextRequest, NextResponse } from 'next/server'
import {
  buildImageSitemapXml,
  fetchImageSitemapPage,
  IMAGE_SITEMAP_PAGE_SIZE,
  IMAGE_SITEMAP_REVALIDATE_SECONDS,
} from '../shared'

export const revalidate = 3600

type RouteContext = {
  params?: Promise<Record<string, string | string[] | undefined>>
}

export async function GET(_: NextRequest, context: RouteContext = {}): Promise<NextResponse> {
  const resolvedParams = context.params ? await context.params : {}
  const rawPage = resolvedParams.page
  const page = Array.isArray(rawPage) ? rawPage[0] : rawPage
  const parsedPage = Number.parseInt(page || '', 10)

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
