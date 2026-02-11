// ============================================================================
// OPS TEAM SERVICE - Operations Team Management
// ============================================================================

import { Injectable, Logger } from '@nestjs/common'
import { OpsTeamRepository, TeamMemberStats } from '../repositories/ops-team.repository'

@Injectable()
export class OpsTeamService {
  private readonly logger = new Logger(OpsTeamService.name)

  constructor(private readonly opsTeamRepository: OpsTeamRepository) {}

  /**
   * Get all operational managers
   */
  async getManagers(): Promise<{ data: TeamMemberStats[]; meta: { total: number } }> {
    this.logger.log('Fetching all operational managers')
    const managers = await this.opsTeamRepository.getManagers()

    return {
      data: managers,
      meta: {
        total: managers.length,
      },
    }
  }

  /**
   * Get all operational assistants
   */
  async getAssistants(): Promise<{ data: TeamMemberStats[]; meta: { total: number } }> {
    this.logger.log('Fetching all operational assistants')
    const assistants = await this.opsTeamRepository.getAssistants()

    return {
      data: assistants,
      meta: {
        total: assistants.length,
      },
    }
  }

  /**
   * Get team overview statistics
   */
  async getTeamOverview() {
    this.logger.log('Fetching team overview statistics')
    const overview = await this.opsTeamRepository.getTeamOverview()

    return {
      data: overview,
    }
  }
}
