import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { UserAccess } from '../../../core/auth/decorators/roles.decorator'
import { CurrentUser, CurrentUserData } from '../../../core/auth/decorators/current-user.decorator'
import { NotificationService } from '../../../infrastructure/notifications/notification.service'
import { NotificationType } from '@prisma/client'

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async list(
    @CurrentUser() user: CurrentUserData,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('includeDismissed') includeDismissed?: string,
    @Query('types') types?: string,
  ) {
    const parsedTypes = types
      ? types.split(',').map((type) => type.trim()).filter(Boolean) as NotificationType[]
      : undefined

    return this.notificationService.getNotifications(user.id, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      unreadOnly: unreadOnly === 'true',
      includeDismissed: includeDismissed === 'true',
      types: parsedTypes,
    })
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: CurrentUserData) {
    const count = await this.notificationService.getUnreadCount(user.id)
    return { count }
  }

  @Post('read')
  async markRead(
    @CurrentUser() user: CurrentUserData,
    @Body('notificationIds') notificationIds: string[],
  ) {
    const updated = await this.notificationService.markRead(user.id, notificationIds || [])
    return { updated }
  }

  @Post('read-all')
  async markAllRead(@CurrentUser() user: CurrentUserData) {
    const updated = await this.notificationService.markAllRead(user.id)
    return { updated }
  }

  @Post(':id/dismiss')
  async dismiss(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
  ) {
    await this.notificationService.dismiss(user.id, id)
    return { success: true }
  }
}
