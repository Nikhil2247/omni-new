import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import { UserId } from '../../../core/auth/decorators/current-user.decorator';
import { PlannerInsightsService } from '../../../domain/planning/services/planner-insights.service';

@Controller('planner-insights')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class PlannerInsightsController {
  constructor(private readonly plannerInsightsService: PlannerInsightsService) {}

  @Get()
  getEventInsights(@Query('eventId') eventId: string, @UserId() userId: string) {
    return this.plannerInsightsService.getEventInsights(eventId, userId);
  }
}
