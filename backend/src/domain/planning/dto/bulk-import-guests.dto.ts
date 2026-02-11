// ============================================================================
// BULK IMPORT GUESTS DTO - Planning Domain
// ============================================================================

import { ApiProperty } from '@nestjs/swagger'
import { IsUUID, IsArray, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { CreateGuestDto } from './guestlist.dto'

export class BulkImportGuestsDto {
	@ApiProperty({ description: 'Guestlist ID' })
	@IsUUID()
	guestlistId: string

	@ApiProperty({ description: 'Guests to import', type: [CreateGuestDto] })
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => CreateGuestDto)
	guests: CreateGuestDto[]
}
