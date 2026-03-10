import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { AdminOnly } from '../../../core/auth/decorators/roles.decorator';
import { ChatbotAdminService } from '../services/chatbot-admin.service';

@Controller('chatbot')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
export class ChatbotAdminController {
  constructor(private readonly chatbotAdminService: ChatbotAdminService) {}

  @Get('metrics')
  getDailyMetrics(@Query('date') date?: string) {
    return this.chatbotAdminService.getDailyMetrics(date);
  }

  @Get('metrics/session/:sessionId')
  getSessionMetrics(@Param('sessionId') sessionId: string) {
    return this.chatbotAdminService.getSessionMetrics(sessionId);
  }
}
