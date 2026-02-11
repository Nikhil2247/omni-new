// ============================================================================
// ONBOARDING CONTROLLER - User Gateway
// ============================================================================

import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { UserAccess } from '../../../core/auth/decorators/roles.decorator'
import { VibeQuizService } from '../../../domain/planning/services/vibe-quiz.service'
import { WeddingIdentityService } from '../../../domain/planning/services/wedding-identity.service'
import { PrismaService } from '../../../core/database/prisma.service'
import {
  SubmitVibeQuizDto,
  VibeQuizImageResponseDto,
  VibeQuizResultResponseDto,
  VibeQuizStatusResponseDto,
  CreateWeddingIdentityDto,
  UpdateWeddingIdentityDto,
  InvitePartnerDto,
  WeddingIdentityResponseDto,
  OnboardingStatusResponseDto,
} from '../../../domain/planning/dto/onboarding.dto'

interface AuthenticatedRequest {
  user: { id: string; email: string; firstName?: string; lastName?: string; hasCompletedOnboarding?: boolean }
}

@ApiTags('User - Onboarding')
@ApiBearerAuth()
@Controller('onboarding')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class OnboardingController {
  constructor(
    private readonly vibeQuizService: VibeQuizService,
    private readonly weddingIdentityService: WeddingIdentityService,
    private readonly prisma: PrismaService,
  ) {}

  // ============================================================================
  // ONBOARDING STATUS
  // ============================================================================

  @Get('status')
  @ApiOperation({ summary: 'Get onboarding status' })
  @ApiResponse({ status: 200, type: OnboardingStatusResponseDto })
  async getOnboardingStatus(@Req() req: AuthenticatedRequest): Promise<OnboardingStatusResponseDto> {
    const userId = req.user.id

    const [user, quizStatus, weddingIdentity] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { hasCompletedOnboarding: true },
      }),
      this.vibeQuizService.getStatus(userId),
      this.weddingIdentityService.getByUserId(userId),
    ])

    return {
      vibeQuizCompleted: quizStatus.completed,
      weddingIdentityCreated: !!weddingIdentity,
      // Onboarding is complete when user has completed the vibe quiz
      isOnboardingComplete: user?.hasCompletedOnboarding ?? quizStatus.completed,
    }
  }

  // ============================================================================
  // VIBE QUIZ
  // ============================================================================

  @Get('vibe-quiz/images')
  @ApiOperation({ summary: 'Get vibe quiz images' })
  @ApiResponse({ status: 200, type: [VibeQuizImageResponseDto] })
  async getVibeQuizImages(): Promise<VibeQuizImageResponseDto[]> {
    return this.vibeQuizService.getImages()
  }

  @Get('vibe-quiz/status')
  @ApiOperation({ summary: 'Get vibe quiz completion status' })
  @ApiResponse({ status: 200, type: VibeQuizStatusResponseDto })
  async getVibeQuizStatus(@Req() req: AuthenticatedRequest): Promise<VibeQuizStatusResponseDto> {
    return this.vibeQuizService.getStatus(req.user.id)
  }

  @Post('vibe-quiz/submit')
  @ApiOperation({ summary: 'Submit vibe quiz selections' })
  @ApiResponse({ status: 201, type: VibeQuizResultResponseDto })
  async submitVibeQuiz(
    @Req() req: AuthenticatedRequest,
    @Body() dto: SubmitVibeQuizDto,
  ): Promise<VibeQuizResultResponseDto> {
    return this.vibeQuizService.submitQuiz(req.user.id, dto)
  }

  // ============================================================================
  // WEDDING IDENTITY
  // ============================================================================

  @Get('wedding-identity')
  @ApiOperation({ summary: 'Get wedding identity' })
  @ApiResponse({ status: 200, type: WeddingIdentityResponseDto })
  async getWeddingIdentity(@Req() req: AuthenticatedRequest): Promise<WeddingIdentityResponseDto | null> {
    return this.weddingIdentityService.getByUserId(req.user.id)
  }

  @Post('wedding-identity')
  @ApiOperation({ summary: 'Create wedding identity' })
  @ApiResponse({ status: 201, type: WeddingIdentityResponseDto })
  async createWeddingIdentity(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateWeddingIdentityDto,
  ): Promise<WeddingIdentityResponseDto> {
    const userName = req.user.firstName || req.user.email.split('@')[0]
    return this.weddingIdentityService.create(req.user.id, userName, dto)
  }

  @Patch('wedding-identity')
  @ApiOperation({ summary: 'Update wedding identity' })
  @ApiResponse({ status: 200, type: WeddingIdentityResponseDto })
  async updateWeddingIdentity(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateWeddingIdentityDto,
  ): Promise<WeddingIdentityResponseDto> {
    const userName = req.user.firstName || req.user.email.split('@')[0]
    return this.weddingIdentityService.update(req.user.id, userName, dto)
  }

  @Post('wedding-identity/invite')
  @ApiOperation({ summary: 'Invite partner to wedding identity' })
  @ApiResponse({ status: 200 })
  async invitePartner(
    @Req() req: AuthenticatedRequest,
    @Body() dto: InvitePartnerDto,
  ): Promise<{ success: boolean; message: string }> {
    const userName = req.user.firstName || req.user.email.split('@')[0]
    return this.weddingIdentityService.invitePartner(req.user.id, userName, dto)
  }

  @Post('wedding-identity/accept/:token')
  @ApiOperation({ summary: 'Accept partner invitation' })
  @ApiResponse({ status: 200 })
  async acceptInvite(
    @Req() req: AuthenticatedRequest,
    @Param('token') token: string,
  ): Promise<{ success: boolean; weddingIdentity: WeddingIdentityResponseDto | null }> {
    return this.weddingIdentityService.acceptInvite(req.user.id, token)
  }
}
