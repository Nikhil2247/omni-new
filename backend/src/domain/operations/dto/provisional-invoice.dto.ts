// ============================================================================
// PROVISIONAL INVOICE DTOs - Operations Domain
// ============================================================================

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsUUID, IsOptional, IsEnum, IsNumber, Min, IsString } from 'class-validator'

export enum ProvisionalInvoiceStatus {
	PENDING = 'PENDING',
	PARTIALLY_PAID = 'PARTIALLY_PAID',
	PAID = 'PAID',
	OVERDUE = 'OVERDUE',
	CANCELLED = 'CANCELLED',
}

export class CreateProvisionalInvoiceDto {
	@ApiProperty({ description: 'Vendor agreement ID' })
	@IsUUID()
	vendorAgreementId: string

	@ApiProperty({ description: 'Invoice number' })
	@IsString()
	invoiceNumber: string

	@ApiProperty({ description: 'Amount', example: 5000.00 })
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	amount: number
}

export class UpdateProvisionalInvoiceDto {
	@ApiPropertyOptional({ description: 'Status', enum: ProvisionalInvoiceStatus })
	@IsOptional()
	@IsEnum(ProvisionalInvoiceStatus)
	status?: ProvisionalInvoiceStatus

	@ApiPropertyOptional({ description: 'Paid at', nullable: true })
	@IsOptional()
	@IsString()
	paidAt?: string
}

export class ProvisionalInvoiceResponseDto {
	@ApiProperty({ description: 'Invoice ID' })
	id: string

	@ApiProperty({ description: 'Vendor agreement ID' })
	vendorAgreementId: string

	@ApiProperty({ description: 'Invoice number' })
	invoiceNumber: string

	@ApiProperty({ description: 'Amount' })
	amount: number

	@ApiProperty({ description: 'Status', enum: ProvisionalInvoiceStatus })
	status: ProvisionalInvoiceStatus

	@ApiProperty({ description: 'Issued at' })
	issuedAt: Date

	@ApiPropertyOptional({ description: 'Paid at', nullable: true })
	paidAt: Date | null
}
