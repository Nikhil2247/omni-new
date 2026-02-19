// ============================================================================
// PAYOUT DTOs - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
  MaxLength,
} from 'class-validator';

export enum PayoutStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export enum PayoutMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  UPI = 'UPI',
  PAYPAL = 'PAYPAL',
  CHECK = 'CHECK',
}

// ============================================================================
// CREATE DTOs
// ============================================================================

export class CreatePayoutDto {
  @ApiProperty({ description: 'Vendor profile ID' })
  @IsUUID()
  vendorProfileId: string;

  @ApiProperty({ description: 'Payout amount', example: 1500.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Currency code', example: 'USD' })
  @IsString()
  @MaxLength(3)
  currency: string;

  @ApiProperty({ description: 'Payout method', enum: PayoutMethod })
  @IsEnum(PayoutMethod)
  method: PayoutMethod;

  @ApiPropertyOptional({
    description: 'Payout reference/description',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reference?: string;

  @ApiPropertyOptional({
    description: 'Associated vendor agreement ID',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  vendorAgreementId?: string;
}

export class RequestPayoutDto {
  @ApiProperty({ description: 'Payout amount', example: 1500.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Payout method', enum: PayoutMethod })
  @IsEnum(PayoutMethod)
  method: PayoutMethod;

  @ApiPropertyOptional({ description: 'Notes/description', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

// ============================================================================
// UPDATE DTOs
// ============================================================================

export class ProcessPayoutDto {
  @ApiProperty({ description: 'Payout ID' })
  @IsUUID()
  payoutId: string;

  @ApiProperty({ description: 'Transaction reference/ID from payment gateway' })
  @IsString()
  @MaxLength(255)
  transactionReference: string;

  @ApiPropertyOptional({ description: 'Processing notes', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdatePayoutStatusDto {
  @ApiProperty({ description: 'New payout status', enum: PayoutStatus })
  @IsEnum(PayoutStatus)
  status: PayoutStatus;

  @ApiPropertyOptional({ description: 'Transaction reference', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  transactionReference?: string;

  @ApiPropertyOptional({
    description: 'Failure reason (if failed)',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  failureReason?: string;
}

export class CancelPayoutDto {
  @ApiProperty({ description: 'Payout ID' })
  @IsUUID()
  payoutId: string;

  @ApiProperty({ description: 'Cancellation reason' })
  @IsString()
  @MaxLength(500)
  reason: string;
}

// ============================================================================
// SEARCH DTOs
// ============================================================================

export class SearchPayoutsDto {
  @ApiPropertyOptional({ description: 'Filter by status', enum: PayoutStatus })
  @IsOptional()
  @IsEnum(PayoutStatus)
  status?: PayoutStatus;

  @ApiPropertyOptional({ description: 'Filter by vendor profile ID' })
  @IsOptional()
  @IsUUID()
  vendorProfileId?: string;

  @ApiPropertyOptional({ description: 'Filter by method', enum: PayoutMethod })
  @IsOptional()
  @IsEnum(PayoutMethod)
  method?: PayoutMethod;

  @ApiPropertyOptional({ description: 'Filter by start date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: 'Filter by end date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class PayoutResponseDto {
  @ApiProperty({ description: 'Payout ID' })
  id: string;

  @ApiProperty({ description: 'Vendor profile ID' })
  vendorProfileId: string;

  @ApiProperty({ description: 'Payout amount' })
  amount: number;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Payout method', enum: PayoutMethod })
  method: PayoutMethod;

  @ApiProperty({ description: 'Payout status', enum: PayoutStatus })
  status: PayoutStatus;

  @ApiPropertyOptional({ description: 'Reference/description', nullable: true })
  reference: string | null;

  @ApiPropertyOptional({ description: 'Transaction reference', nullable: true })
  transactionReference: string | null;

  @ApiPropertyOptional({ description: 'Vendor agreement ID', nullable: true })
  vendorAgreementId: string | null;

  @ApiPropertyOptional({ description: 'Failure reason', nullable: true })
  failureReason: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Processed at', nullable: true })
  processedAt: Date | null;
}

export class PayoutSummaryDto {
  @ApiProperty({ description: 'Total pending payouts' })
  totalPending: number;

  @ApiProperty({ description: 'Total completed payouts' })
  totalCompleted: number;

  @ApiProperty({ description: 'Pending payout amount' })
  pendingAmount: number;

  @ApiProperty({ description: 'Completed payout amount (this month)' })
  completedAmountThisMonth: number;
}
