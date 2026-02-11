// ============================================================================
// VENDOR FOLLOW DTOs - Catalog Domain
// ============================================================================

import { ApiProperty } from '@nestjs/swagger'
import { IsUUID } from 'class-validator'

export class ToggleVendorFollowDto {
  @ApiProperty({ description: 'Vendor profile ID' })
  @IsUUID()
  vendorProfileId: string
}
