// ============================================================================
// VIBE QUIZ SERVICE - Planning Domain
// ============================================================================

import { Injectable, NotFoundException, ConflictException, Logger, BadRequestException } from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { VibeQuizRepository } from '../repositories/vibe-quiz.repository'
import { SubmitVibeQuizDto } from '../dto/onboarding.dto'
import { PrismaService } from '../../../core/database/prisma.service'

@Injectable()
export class VibeQuizService {
  private readonly logger = new Logger(VibeQuizService.name)

  constructor(
    private readonly vibeQuizRepository: VibeQuizRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get all available quiz images
   */
  async getImages() {
    return this.vibeQuizRepository.findAllImages()
  }

  /**
   * Get user's quiz status and result
   */
  async getStatus(userId: string) {
    const result = await this.vibeQuizRepository.findResultByUserId(userId)

    return {
      completed: !!result,
      result: result
        ? {
            id: result.id,
            userId: result.userId,
            topStyles: result.topStyles,
            topColors: result.topColors,
            topCategories: result.topCategories,
            completedAt: result.completedAt,
          }
        : undefined,
    }
  }

  /**
   * Submit quiz selections and calculate preferences
   */
  async submitQuiz(userId: string, dto: SubmitVibeQuizDto) {
    // Check if user already has a result
    const existing = await this.vibeQuizRepository.findResultByUserId(userId)
    if (existing) {
      throw new ConflictException('Quiz has already been completed')
    }

    // Validate image IDs exist
    const images = await this.vibeQuizRepository.findImagesByIds(dto.selectedImageIds)
    if (images.length !== dto.selectedImageIds.length) {
      throw new BadRequestException('One or more invalid image IDs')
    }

    // Calculate preferences from selected images
    const preferences = this.calculatePreferences(images)

    // Create result
    const result = await this.vibeQuizRepository.createResult(userId, dto.selectedImageIds, preferences)

    // Mark onboarding as complete
    await this.prisma.user.update({
      where: { id: userId },
      data: { hasCompletedOnboarding: true },
    })

    this.logger.log(`User ${userId} completed vibe quiz with ${dto.selectedImageIds.length} selections`)
    this.eventEmitter.emit('vibe-quiz.completed', { userId, resultId: result.id })

    return {
      id: result.id,
      userId: result.userId,
      topStyles: result.topStyles,
      topColors: result.topColors,
      topCategories: result.topCategories,
      completedAt: result.completedAt,
    }
  }

  /**
   * Calculate top preferences from selected images
   */
  private calculatePreferences(images: { style: string; category: string; tags: string[] }[]) {
    // Count occurrences
    const styleCounts = new Map<string, number>()
    const categoryCounts = new Map<string, number>()
    const tagCounts = new Map<string, number>()

    for (const image of images) {
      styleCounts.set(image.style, (styleCounts.get(image.style) || 0) + 1)
      categoryCounts.set(image.category, (categoryCounts.get(image.category) || 0) + 1)

      for (const tag of image.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      }
    }

    // Get top 3 of each
    const getTopN = (map: Map<string, number>, n: number) =>
      [...map.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([key]) => key)

    return {
      topStyles: getTopN(styleCounts, 3),
      topCategories: getTopN(categoryCounts, 3),
      topColors: getTopN(tagCounts, 5).filter((tag) =>
        ['pink', 'gold', 'white', 'red', 'blue', 'green', 'pastel', 'bold', 'neutral'].includes(tag.toLowerCase()),
      ),
    }
  }

  /**
   * Reset quiz (for testing or user request)
   */
  async resetQuiz(userId: string) {
    await this.vibeQuizRepository.deleteResultByUserId(userId)
    this.logger.log(`User ${userId} reset their vibe quiz`)
  }
}
