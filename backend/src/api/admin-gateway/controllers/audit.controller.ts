import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { AdminOnly } from '../../../core/auth/decorators/roles.decorator'
import { PrismaService } from '../../../core/database/prisma.service'
import { SearchAuditDto } from '../dto/audit.dto'

@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
export class AuditController {
	constructor(private readonly prisma: PrismaService) {}

	@Get()
	async list(@Query() query: SearchAuditDto) {
		const {
			userId,
			entityType,
			entityId,
			action,
			fromDate,
			toDate,
			page = 1,
			limit = 50,
		} = query

		const where: any = {
			...(userId && { userId }),
			...(entityType && { entityType }),
			...(entityId && { entityId }),
			...(action && { action }),
			...(fromDate || toDate
				? {
					createdAt: {
						...(fromDate && { gte: new Date(fromDate) }),
						...(toDate && { lte: new Date(toDate) }),
					},
				}
				: {}),
		}

		const skip = (page - 1) * limit

		const [total, logs] = await this.prisma.$transaction([
			this.prisma.auditLog.count({ where }),
			this.prisma.auditLog.findMany({
				where,
				orderBy: { createdAt: 'desc' },
				skip,
				take: limit,
			}),
		])

		const totalPages = Math.ceil(total / limit)
		return {
			data: logs,
			meta: {
				total,
				page,
				limit,
				totalPages,
				hasNextPage: page < totalPages,
				hasPreviousPage: page > 1,
			},
		}
	}

	@Get(':id')
	getById(@Param('id') id: string) {
		return this.prisma.auditLog.findUnique({ where: { id } })
	}
}
