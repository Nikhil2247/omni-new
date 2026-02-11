// ============================================================================
// VENDOR AGREEMENT REPOSITORY
// ============================================================================

import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma.service'
import { BaseRepository } from '../../../core/database/repositories/base.repository'
import { VendorAgreement, Prisma, AgreementStatus } from '@prisma/client'

@Injectable()
export class VendorAgreementRepository extends BaseRepository<
	VendorAgreement,
	Prisma.VendorAgreementCreateInput,
	Prisma.VendorAgreementUpdateInput,
	Prisma.VendorAgreementWhereInput,
	Prisma.VendorAgreementWhereUniqueInput,
	Prisma.VendorAgreementOrderByWithRelationInput
> {
	protected readonly modelName = 'VendorAgreement'

	constructor(prisma: PrismaService) {
		super(prisma)
	}

	protected get model() {
		return this.prisma.vendorAgreement
	}

	async findByActiveEvent(activeEventId: string) {
		return this.model.findMany({
			where: { activeEventId },
			include: { invoice: true, requirementItem: true },
			orderBy: { createdAt: 'desc' },
		})
	}

	async findByVendor(vendorProfileId: string) {
		return this.model.findMany({
			where: { vendorProfileId },
			include: {
				invoice: true,
				activeEvent: {
					select: {
						id: true,
						clientName: true,
						eventType: true,
						eventDate: true,
						venueName: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		})
	}

	async findByStatus(status: AgreementStatus) {
		return this.model.findMany({
			where: { status },
			include: { invoice: true },
			orderBy: { createdAt: 'desc' },
		})
	}
}
