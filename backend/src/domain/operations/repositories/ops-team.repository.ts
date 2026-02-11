// ============================================================================
// OPS TEAM REPOSITORY - Operations Team Management
// ============================================================================

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service'

export interface TeamMemberStats {
  id: string
  firstName: string | null
  lastName: string | null
  email: string
  status: string
  createdAt: Date
  managedEventsCount?: number
  assignedTasksCount?: number
}

@Injectable()
export class OpsTeamRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all operational managers with their event counts
   */
  async getManagers(): Promise<TeamMemberStats[]> {
    const managers = await this.prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              name: 'OPERATIONAL_MANAGER',
            },
          },
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        createdAt: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })

    // Get event counts for each manager
    const managersWithCounts = await Promise.all(
      managers.map(async (manager) => {
        const eventCount = await this.prisma.activeEvent.count({
          where: { opsManagerId: manager.id },
        })

        return {
          ...manager,
          managedEventsCount: eventCount,
        }
      })
    )

    return managersWithCounts
  }

  /**
   * Get all operational assistants with their task counts
   */
  async getAssistants(): Promise<TeamMemberStats[]> {
    const assistants = await this.prisma.user.findMany({
      where: {
        userRoles: {
          some: {
            role: {
              name: 'OPERATIONAL_ASSISTANT',
            },
          },
        },
        status: 'ACTIVE',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        createdAt: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })

    // Get task counts for each assistant
    const assistantsWithCounts = await Promise.all(
      assistants.map(async (assistant) => {
        const taskCount = await this.prisma.operationalTask.count({
          where: { assignedToUserId: assistant.id },
        })

        return {
          ...assistant,
          assignedTasksCount: taskCount,
        }
      })
    )

    return assistantsWithCounts
  }

  /**
   * Get team overview statistics
   */
  async getTeamOverview() {
    const [managerCount, assistantCount, activeEventsCount, pendingTasksCount] = await Promise.all([
      this.prisma.user.count({
        where: {
          userRoles: { some: { role: { name: 'OPERATIONAL_MANAGER' } } },
          status: 'ACTIVE',
        },
      }),
      this.prisma.user.count({
        where: {
          userRoles: { some: { role: { name: 'OPERATIONAL_ASSISTANT' } } },
          status: 'ACTIVE',
        },
      }),
      this.prisma.activeEvent.count({
        where: { 
          status: { 
            in: ['NEW', 'ASSIGNED', 'REQUIREMENTS_SET', 'VENDOR_SOURCING', 'CONTRACTS_LOCKED', 'EXECUTION'] 
          } 
        },
      }),
      this.prisma.operationalTask.count({
        where: { status: { in: ['PENDING', 'ASSIGNED', 'IN_PROGRESS'] } },
      }),
    ])

    return {
      managers: managerCount,
      assistants: assistantCount,
      activeEvents: activeEventsCount,
      pendingTasks: pendingTasksCount,
    }
  }
}
