// ============================================================================
// REQUIREMENT SHEET DTOs - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum RequirementStatus {
  PENDING = 'PENDING',
  SOURCING = 'SOURCING',
  VENDOR_SELECTED = 'VENDOR_SELECTED',
  CONTRACTED = 'CONTRACTED',
  FULFILLED = 'FULFILLED',
}

export enum ClientApprovalStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

import { CreateRequirementItemDto } from './requirement-item.dto';

// ============================================================================
// CREATE DTOs
// ============================================================================

export class CreateRequirementSheetDto {
  @ApiProperty({ description: 'Active event ID' })
  @IsUUID()
  activeEventId: string;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Initial requirement items',
    type: [CreateRequirementItemDto],
  })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateRequirementItemDto)
  items?: CreateRequirementItemDto[];
}

// ============================================================================
// UPDATE DTOs
// ============================================================================

export class UpdateRequirementItemDto {
  @ApiPropertyOptional({ description: 'Category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Quantity' })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Estimated budget', nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  estimatedBudget?: number;

  @ApiPropertyOptional({ description: 'Status', enum: RequirementStatus })
  @IsOptional()
  @IsEnum(RequirementStatus)
  status?: RequirementStatus;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRequirementSheetDto {
  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class RequirementItemResponseDto {
  @ApiProperty({ description: 'Item ID' })
  id: string;

  @ApiProperty({ description: 'Requirement sheet ID' })
  requirementSheetId: string;

  @ApiProperty({ description: 'Category' })
  category: string;

  @ApiProperty({ description: 'Description' })
  description: string;

  @ApiProperty({ description: 'Quantity' })
  quantity: number;

  @ApiPropertyOptional({ description: 'Estimated budget', nullable: true })
  estimatedBudget: number | null;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Status', enum: RequirementStatus })
  status: RequirementStatus;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class RequirementSheetResponseDto {
  @ApiProperty({ description: 'Sheet ID' })
  id: string;

  @ApiProperty({ description: 'Active event ID' })
  activeEventId: string;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Created by user ID' })
  createdBy: string;

  @ApiProperty({ description: 'Client approval status', enum: ClientApprovalStatus })
  approvalStatus: ClientApprovalStatus;

  @ApiPropertyOptional({ description: 'Sent to client at', nullable: true })
  sentToClientAt: Date | null;

  @ApiPropertyOptional({ description: 'Client approved at', nullable: true })
  clientApprovedAt: Date | null;

  @ApiPropertyOptional({ description: 'Client rejected at', nullable: true })
  clientRejectedAt: Date | null;

  @ApiPropertyOptional({ description: 'Rejection reason', nullable: true })
  rejectionReason: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Requirement items',
    type: [RequirementItemResponseDto],
  })
  items?: RequirementItemResponseDto[];
}

// ============================================================================
// SEND TO CLIENT DTOs
// ============================================================================

export class SendToClientDto {
  @ApiPropertyOptional({ description: 'Message to include in email' })
  @IsOptional()
  @IsString()
  message?: string;
}

export class ClientApproveDto {
  // No additional fields needed for approval
}

export class ClientRejectDto {
  @ApiPropertyOptional({ description: 'Reason for rejection' })
  @IsOptional()
  @IsString()
  reason?: string;
}

// ============================================================================
// PUBLIC CLIENT VIEW DTO
// ============================================================================

export class PublicRequirementSheetResponseDto {
  @ApiProperty({ description: 'Sheet ID' })
  id: string;

  @ApiProperty({ description: 'Client name' })
  clientName: string;

  @ApiProperty({ description: 'Event type' })
  eventType: string;

  @ApiPropertyOptional({ description: 'Event date', nullable: true })
  eventDate: Date | null;

  @ApiPropertyOptional({ description: 'Notes', nullable: true })
  notes: string | null;

  @ApiProperty({ description: 'Approval status', enum: ClientApprovalStatus })
  approvalStatus: ClientApprovalStatus;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Requirement items',
    type: [RequirementItemResponseDto],
  })
  items?: RequirementItemResponseDto[];

  @ApiProperty({ description: 'Total estimated amount' })
  totalAmount: number;
}
