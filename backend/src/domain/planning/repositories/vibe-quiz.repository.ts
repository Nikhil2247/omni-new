// ============================================================================
// VIBE QUIZ REPOSITORY - Planning Domain
// ============================================================================

import { Injectable } from '@nestjs/common';
import {
  Prisma,
  VibeQuizImage,
  VibeQuizResult,
  VibeQuizSelection,
} from '@prisma/client';
import { PrismaService } from '../../../core/database/prisma.service';

@Injectable()
export class VibeQuizRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ============================================================================
  // IMAGES
  // ============================================================================

  async findAllImages(): Promise<VibeQuizImage[]> {
    return this.prisma.vibeQuizImage.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findImagesByIds(ids: string[]): Promise<VibeQuizImage[]> {
    return this.prisma.vibeQuizImage.findMany({
      where: { id: { in: ids } },
    });
  }

  // ============================================================================
  // RESULTS
  // ============================================================================

  async findResultByUserId(userId: string): Promise<
    | (VibeQuizResult & {
        selections: (VibeQuizSelection & { image: VibeQuizImage })[];
      })
    | null
  > {
    return this.prisma.vibeQuizResult.findUnique({
      where: { userId },
      include: {
        selections: {
          include: { image: true },
        },
      },
    });
  }

  async createResult(
    userId: string,
    imageIds: string[],
    preferences: {
      topStyles: string[];
      topColors: string[];
      topCategories: string[];
    },
  ): Promise<VibeQuizResult> {
    return this.prisma.vibeQuizResult.create({
      data: {
        userId,
        topStyles: preferences.topStyles,
        topColors: preferences.topColors,
        topCategories: preferences.topCategories,
        selections: {
          create: imageIds.map((imageId) => ({
            imageId,
          })),
        },
      },
      include: {
        selections: {
          include: { image: true },
        },
      },
    });
  }

  async deleteResultByUserId(userId: string): Promise<void> {
    await this.prisma.vibeQuizResult.deleteMany({
      where: { userId },
    });
  }

  // ============================================================================
  // ADMIN OPERATIONS
  // ============================================================================

  async createImage(
    data: Prisma.VibeQuizImageCreateInput,
  ): Promise<VibeQuizImage> {
    return this.prisma.vibeQuizImage.create({ data });
  }

  async updateImage(
    id: string,
    data: Prisma.VibeQuizImageUpdateInput,
  ): Promise<VibeQuizImage> {
    return this.prisma.vibeQuizImage.update({ where: { id }, data });
  }

  async deleteImage(id: string): Promise<void> {
    await this.prisma.vibeQuizImage.delete({ where: { id } });
  }
}
