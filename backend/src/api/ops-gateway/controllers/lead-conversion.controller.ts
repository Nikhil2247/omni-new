import { Controller, Post, Body, UseGuards } from '@nestjs/common'
import { LeadConversionService } from '../../../domain/operations/services/lead-conversion.service'
import { ConvertLeadToEventDto } from '../../../domain/operations/dto/convert-lead-to-event.dto'
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../../core/auth/guards/roles.guard'
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator'
import { Audited } from '../../../core/audit/audit.decorators'
import { AuditSeverity } from '../../../core/audit/audit.types'

@Controller('lead-conversion')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class LeadConversionController {
	constructor(private readonly leadConversionService: LeadConversionService) {}

	@Post()
	@Audited({
		action: 'CONVERT',
		entityType: 'Lead',
		getEntityId: (req) => req.body?.leadId,
		includeRequestBody: true,
		includeResponseBody: true,
		severity: AuditSeverity.CRITICAL,
	})
	convert(@Body() dto: ConvertLeadToEventDto) {
		return this.leadConversionService.convertLead(dto)
	}
}
