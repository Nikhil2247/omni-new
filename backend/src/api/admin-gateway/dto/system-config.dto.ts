import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsEmail, IsOptional } from 'class-validator'

export class UpdateSystemConfigDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  maintenanceMode?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  registrationEnabled?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  allowVendorOnboarding?: boolean

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  supportEmail?: string
}
