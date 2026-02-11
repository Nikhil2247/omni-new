import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator'

export class CreateRoleDto {
  @ApiPropertyOptional({ description: 'Role name (unique)' })
  @IsString()
  name: string

  @ApiPropertyOptional({ description: 'Display name' })
  @IsString()
  displayName: string

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional({ description: 'Hierarchy level', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  level?: number

  @ApiPropertyOptional({ description: 'Parent role ID' })
  @IsOptional()
  @IsUUID()
  parentRoleId?: string

  @ApiPropertyOptional({ description: 'System role (protected)' })
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean
}

export class UpdateRoleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  displayName?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  level?: number

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  parentRoleId?: string

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSystem?: boolean
}
