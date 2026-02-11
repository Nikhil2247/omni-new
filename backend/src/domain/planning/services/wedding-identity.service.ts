// ============================================================================
// WEDDING IDENTITY SERVICE - Planning Domain
// ============================================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common'
import { EventEmitter2 } from '@nestjs/event-emitter'
import { randomBytes } from 'crypto'
import { WeddingIdentityRepository } from '../repositories/wedding-identity.repository'
import { CreateWeddingIdentityDto, UpdateWeddingIdentityDto, InvitePartnerDto } from '../dto/onboarding.dto'
import { EmailService } from 'src/infrastructure'


@Injectable()
export class WeddingIdentityService {
  private readonly logger = new Logger(WeddingIdentityService.name)

  constructor(
    private readonly weddingIdentityRepository: WeddingIdentityRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Get wedding identity for a user
   */
  async getByUserId(userId: string) {
    const identity = await this.weddingIdentityRepository.findByUserId(userId)
    return identity ? this.mapToResponse(identity) : null
  }

  /**
   * Create a new wedding identity
   */
  async create(userId: string, userName: string, dto: CreateWeddingIdentityDto) {
    // Check if user already has a wedding identity
    const existing = await this.weddingIdentityRepository.findByUserId(userId)
    if (existing) {
      throw new ConflictException('You already have a wedding identity')
    }

    const displayName = `${dto.partnerOneName} & ${dto.partnerTwoName}`

    const identity = await this.weddingIdentityRepository.create({
      displayName,
      eventDate: this.parseEventDate(dto.eventDate),
      eventType: dto.eventType,
      ownerUserId: userId,
      ownerName: dto.partnerOneName,
      partnerName: dto.partnerTwoName,
    })

    this.logger.log(`User ${userId} created wedding identity: ${displayName}`)
    this.eventEmitter.emit('wedding-identity.created', { userId, identityId: identity.id })

    return this.mapToResponse(identity)
  }

  /**
   * Update wedding identity
   */
  async update(userId: string, userName: string, dto: UpdateWeddingIdentityDto) {
    let identity = await this.weddingIdentityRepository.findByUserId(userId)

    if (!identity) {
      const displayName = dto.displayName || `${userName} & Partner`
      identity = await this.weddingIdentityRepository.create({
        displayName,
        eventDate: this.parseEventDate(dto.eventDate),
        eventType: dto.eventType,
        ownerUserId: userId,
        ownerName: userName,
        partnerName: 'Partner',
      })

      this.logger.log(`Auto-created wedding identity for user ${userId}`)
      this.eventEmitter.emit('wedding-identity.created', { userId, identityId: identity.id })
    }

    // Check if user is owner
    const isOwner = identity.partners.some((p) => p.userId === userId && p.isOwner)
    if (!isOwner) {
      throw new ForbiddenException('Only the owner can update the wedding identity')
    }

    const updated = await this.weddingIdentityRepository.update(identity.id, {
      displayName: dto.displayName,
      eventDate: this.parseEventDate(dto.eventDate),
      eventType: dto.eventType,
    })

    this.logger.log(`User ${userId} updated wedding identity ${identity.id}`)
    return this.mapToResponse(updated)
  }

  /**
   * Invite partner to join the wedding identity
   */
  async invitePartner(userId: string, userName: string, dto: InvitePartnerDto) {
    let identity = await this.weddingIdentityRepository.findByUserId(userId)

    if (!identity) {
      const inferredPartnerName = dto.email?.split('@')[0] || 'Partner'
      const displayName = `${userName} & ${inferredPartnerName}`
      identity = await this.weddingIdentityRepository.create({
        displayName,
        eventType: 'WEDDING',
        ownerUserId: userId,
        ownerName: userName,
        partnerName: inferredPartnerName,
      })

      this.logger.log(`Auto-created wedding identity for user ${userId} to invite partner`)
      this.eventEmitter.emit('wedding-identity.created', { userId, identityId: identity.id })
    }

    // Check if user is owner
    const isOwner = identity.partners.some((p) => p.userId === userId && p.isOwner)
    if (!isOwner) {
      throw new ForbiddenException('Only the owner can invite partners')
    }

    // Check if partner slot is available
    const nonOwnerPartner = identity.partners.find((p) => !p.isOwner)
    if (nonOwnerPartner?.inviteStatus === 'ACCEPTED') {
      throw new ConflictException('Partner has already accepted the invitation')
    }

    // Generate invite token
    const inviteToken = randomBytes(32).toString('hex')

    // Create or update partner invite
    const partner = await this.weddingIdentityRepository.createPartnerInvite(identity.id, {
      name: nonOwnerPartner?.name || 'Partner',
      email: dto.email,
      phone: dto.phone,
      inviteToken,
    })

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const inviteUrl = `${frontendUrl}/invite/${inviteToken}`

    await this.emailService.send({
      to: dto.email,
      subject: `You're invited to join ${identity.displayName}`,
      template: 'wedding-partner-invite',
      context: {
        inviterName: userName,
        displayName: identity.displayName,
        inviteUrl,
      },
    })

    this.logger.log(`User ${userId} invited partner ${dto.email} to wedding identity ${identity.id}`)
    this.eventEmitter.emit('wedding-identity.partner-invited', {
      identityId: identity.id,
      partnerId: partner.id,
      email: dto.email,
      inviteToken,
    })

    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(
        `Wedding identity invite token for ${dto.email}: ${inviteToken}`,
      )
    }

    return {
      success: true,
      message: 'Invitation sent successfully',
    }
  }

  /**
   * Accept partner invitation
   */
  async acceptInvite(userId: string, token: string) {
    const partner = await this.weddingIdentityRepository.findPartnerByInviteToken(token)
    if (!partner) {
      throw new NotFoundException('Invalid or expired invitation')
    }

    if (partner.inviteStatus !== 'PENDING') {
      if (partner.inviteStatus === 'ACCEPTED' && partner.userId === userId) {
        const existingIdentity = await this.weddingIdentityRepository.findById(partner.weddingIdentityId)
        return {
          success: true,
          weddingIdentity: existingIdentity ? this.mapToResponse(existingIdentity) : null,
        }
      }
      throw new BadRequestException('This invitation has already been processed')
    }

    // Check if user already belongs to a wedding identity
    const existingIdentity = await this.weddingIdentityRepository.findByUserId(userId)
    if (existingIdentity && existingIdentity.id !== partner.weddingIdentityId) {
      throw new ConflictException('You already belong to a wedding identity')
    }
    if (existingIdentity && existingIdentity.id === partner.weddingIdentityId) {
      if (partner.userId === userId) {
        return {
          success: true,
          weddingIdentity: this.mapToResponse(existingIdentity),
        }
      }

      throw new ConflictException('This invite is for another account. Please sign in with the invited email.')
    }

    // Accept the invite
    await this.weddingIdentityRepository.acceptInvite(partner.id, userId)

    // Fetch updated identity
    const identity = await this.weddingIdentityRepository.findById(partner.weddingIdentityId)

    this.logger.log(`User ${userId} accepted invitation to wedding identity ${partner.weddingIdentityId}`)
    this.eventEmitter.emit('wedding-identity.partner-accepted', {
      identityId: partner.weddingIdentityId,
      partnerId: partner.id,
      userId,
    })

    return {
      success: true,
      weddingIdentity: identity ? this.mapToResponse(identity) : null,
    }
  }

  /**
   * Map database entity to response DTO
   */
  private mapToResponse(identity: any) {
    return {
      id: identity.id,
      displayName: identity.displayName,
      eventDate: identity.eventDate,
      eventType: identity.eventType,
      partners: identity.partners.map((p: any) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        isOwner: p.isOwner,
        inviteStatus: p.inviteStatus,
        invitedAt: p.invitedAt,
        acceptedAt: p.acceptedAt,
      })),
      createdAt: identity.createdAt,
      updatedAt: identity.updatedAt,
    }
  }

  private parseEventDate(eventDate?: string) {
    if (!eventDate) return undefined
    if (eventDate.trim?.() === '') return undefined
    const date = new Date(eventDate)
    return Number.isNaN(date.getTime()) ? undefined : date
  }
}
