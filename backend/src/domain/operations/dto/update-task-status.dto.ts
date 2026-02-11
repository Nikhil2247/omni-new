// ============================================================================
// UPDATE TASK STATUS DTO - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator'
import { OperationalTaskStatus } from './operational-task.dto'

export class UpdateTaskStatusDto {
	@ApiProperty({ description: 'Task status', enum: OperationalTaskStatus })
	@IsEnum(OperationalTaskStatus)
	status: OperationalTaskStatus

	@ApiPropertyOptional({ description: 'Review notes', nullable: true })
	@IsOptional()
	@IsString()
	reviewNotes?: string

	@ApiPropertyOptional({ description: 'Reviewed by user ID', nullable: true })
	@IsOptional()
	@IsUUID()
	reviewedBy?: string
}
