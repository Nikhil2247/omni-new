// ============================================================================
// OPS GATEWAY - OPS TEAM CONTROLLER
// ============================================================================
// Ops team member management for OPERATIONAL_ADMIN
// View managers, assistants, and team member details
// Routes: GET /api/ops/team/managers, GET /api/ops/team/assistants
// Authorized Roles: OPERATIONAL_ADMIN
// ============================================================================

import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { OpsAdminOnly } from '../../../core/auth/decorators/roles.decorator';
import { OpsTeamService } from '../../../domain/operations/services/ops-team.service';

@Controller('team')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAdminOnly()
export class OpsTeamController {
  constructor(private readonly opsTeamService: OpsTeamService) {}

  /**
   * Get all operational managers
   * For ops admin to view and assign managers to events
   */
  @Get('managers')
  async getManagers() {
    return this.opsTeamService.getManagers();
  }

  /**
   * Get all operational assistants
   * For ops admin to view team and task assignments
   */
  @Get('assistants')
  async getAssistants() {
    return this.opsTeamService.getAssistants();
  }

  /**
   * Get team overview statistics
   * For ops admin dashboard
   */
  @Get('overview')
  async getTeamOverview() {
    return this.opsTeamService.getTeamOverview();
  }
}
