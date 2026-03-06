// ============================================================================
// QUOTATION DTOs - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsString,
  IsArray,
  ValidateNested,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum QuotationStatus {
  DRAFT = 'DRAFT',
  SENT = 'SENT',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
  CONVERTED = 'CONVERTED',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export class QuotationLineItemDto {
  @ApiProperty({ description: 'Item description' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({ description: 'Quantity', example: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Rate per unit', example: 5000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  rate: number;

  @ApiProperty({ description: 'Line item amount (quantity * rate)', example: 5000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount: number;
}

export class CreateQuotationDto {
  @ApiProperty({ description: 'Vendor agreement ID' })
  @IsUUID()
  vendorAgreementId: string;

  @ApiPropertyOptional({ description: 'Currency code', default: 'INR' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiProperty({ description: 'Line items', type: [QuotationLineItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationLineItemDto)
  items: QuotationLineItemDto[];

  @ApiProperty({ description: 'Subtotal before tax/discount', example: 10000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal: number;

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 18.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Tax amount', example: 1800.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Discount amount', example: 500.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ description: 'Discount type', enum: DiscountType })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiProperty({ description: 'Total amount after tax and discount', example: 11300.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  termsAndConditions?: string;

  @ApiPropertyOptional({ description: 'Valid until date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}

export class UpdateQuotationDto {
  @ApiPropertyOptional({ description: 'Currency code' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ description: 'Line items', type: [QuotationLineItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationLineItemDto)
  items?: QuotationLineItemDto[];

  @ApiPropertyOptional({ description: 'Subtotal before tax/discount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  subtotal?: number;

  @ApiPropertyOptional({ description: 'Tax rate percentage' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Tax amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  taxAmount?: number;

  @ApiPropertyOptional({ description: 'Discount amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ description: 'Discount type', enum: DiscountType })
  @IsOptional()
  @IsEnum(DiscountType)
  discountType?: DiscountType;

  @ApiPropertyOptional({ description: 'Total amount after tax and discount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  termsAndConditions?: string;

  @ApiPropertyOptional({ description: 'Valid until date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @ApiPropertyOptional({ description: 'Status', enum: QuotationStatus })
  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;
}

export class SendQuotationDto {
  @ApiPropertyOptional({ description: 'Optional message to include with quotation' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  message?: string;
}

export class RejectQuotationDto {
  @ApiPropertyOptional({ description: 'Reason for rejection' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;
}

export class QuotationResponseDto {
  @ApiProperty({ description: 'Quotation ID' })
  id: string;

  @ApiProperty({ description: 'Vendor agreement ID' })
  vendorAgreementId: string;

  @ApiProperty({ description: 'Quotation number' })
  quotationNumber: string;

  @ApiProperty({ description: 'Currency code' })
  currency: string;

  @ApiProperty({ description: 'Line items' })
  items: QuotationLineItemDto[];

  @ApiProperty({ description: 'Subtotal' })
  subtotal: number;

  @ApiPropertyOptional({ description: 'Tax rate' })
  taxRate: number | null;

  @ApiPropertyOptional({ description: 'Tax amount' })
  taxAmount: number | null;

  @ApiPropertyOptional({ description: 'Discount amount' })
  discount: number | null;

  @ApiPropertyOptional({ description: 'Discount type' })
  discountType: string | null;

  @ApiProperty({ description: 'Total amount' })
  totalAmount: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  notes: string | null;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  termsAndConditions: string | null;

  @ApiPropertyOptional({ description: 'Valid until' })
  validUntil: Date | null;

  @ApiProperty({ description: 'Status', enum: QuotationStatus })
  status: QuotationStatus;

  @ApiPropertyOptional({ description: 'Sent at' })
  sentAt: Date | null;

  @ApiPropertyOptional({ description: 'Accepted at' })
  acceptedAt: Date | null;

  @ApiPropertyOptional({ description: 'Rejected at' })
  rejectedAt: Date | null;

  @ApiPropertyOptional({ description: 'Rejection reason' })
  rejectionReason: string | null;

  @ApiProperty({ description: 'Created at' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at' })
  updatedAt: Date;
}

export class QuotationSearchDto {
  @ApiPropertyOptional({ description: 'Vendor agreement ID' })
  @IsOptional()
  @IsUUID('all')
  vendorAgreementId?: string;

  @ApiPropertyOptional({ description: 'Active event ID - filter quotations by event' })
  @IsOptional()
  @IsUUID('all')
  activeEventId?: string;

  @ApiPropertyOptional({ description: 'Status filter', enum: QuotationStatus })
  @IsOptional()
  @IsEnum(QuotationStatus)
  status?: QuotationStatus;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;
}
