// ============================================================================
// MEDIA TAG SERVICE - Catalog Domain
// ============================================================================

import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service'

@Injectable()
export class MediaTagService {
  constructor(private readonly prisma: PrismaService) {}

  async addTags(vendorUserId: string, mediaItemId: string, tags: string[]) {
    const mediaItem = await this.prisma.mediaItem.findUnique({
      where: { id: mediaItemId },
      select: { id: true, portfolio: { select: { vendorProfile: { select: { userId: true } } } } },
    })

    if (!mediaItem) throw new NotFoundException('Media item not found')
    if (mediaItem.portfolio.vendorProfile.userId !== vendorUserId) {
      throw new ForbiddenException('Not allowed')
    }

    const normalizedTags = tags
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => tag.replace(/^#/, ''))

    const results = [] as any[]

    for (const tag of normalizedTags) {
      const normalized = tag.toLowerCase()
      const hashtag = await this.prisma.hashtag.upsert({
        where: { normalized },
        update: {},
        create: { tag, normalized },
      })

      const link = await this.prisma.mediaItemTag.upsert({
        where: { mediaItemId_hashtagId: { mediaItemId, hashtagId: hashtag.id } },
        update: {},
        create: { mediaItemId, hashtagId: hashtag.id },
      })

      results.push({ hashtag, link })
    }

    return results
  }

  async removeTag(vendorUserId: string, mediaItemId: string, tag: string) {
    const mediaItem = await this.prisma.mediaItem.findUnique({
      where: { id: mediaItemId },
      select: { id: true, portfolio: { select: { vendorProfile: { select: { userId: true } } } } },
    })

    if (!mediaItem) throw new NotFoundException('Media item not found')
    if (mediaItem.portfolio.vendorProfile.userId !== vendorUserId) {
      throw new ForbiddenException('Not allowed')
    }

    const normalized = tag.trim().replace(/^#/, '').toLowerCase()
    const hashtag = await this.prisma.hashtag.findUnique({ where: { normalized } })
    if (!hashtag) return { removed: false }

    await this.prisma.mediaItemTag.delete({
      where: { mediaItemId_hashtagId: { mediaItemId, hashtagId: hashtag.id } },
    })

    return { removed: true }
  }

  async listTags(query?: string) {
    if (!query) {
      return this.prisma.hashtag.findMany({ orderBy: { tag: 'asc' }, take: 50 })
    }

    return this.prisma.hashtag.findMany({
      where: { normalized: { contains: query.toLowerCase() } },
      orderBy: { tag: 'asc' },
      take: 50,
    })
  }

  async listMediaTags(mediaItemId: string) {
    return this.prisma.mediaItemTag.findMany({
      where: { mediaItemId },
      include: { hashtag: true },
    })
  }
}
