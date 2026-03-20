// ============================================================================
// OPS GATEWAY - Contracts Controller
// ============================================================================
// Admin management of vendor contracts

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VendorContractService } from '../../../domain/operations/services/vendor-contract.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator';
import { PayoutFrequency, ContractStatus } from '@prisma/client';

class CreateContractDto {
  vendorProfileId: string;
  commissionRate: number;
  payoutFrequency: PayoutFrequency;
  payoutHoldDays?: number;
  minPayoutAmount?: number;
  effectiveDate?: string;
  expiryDate?: string;
}

class UpdateContractDto {
  commissionRate?: number;
  payoutFrequency?: PayoutFrequency;
  payoutHoldDays?: number;
  minPayoutAmount?: number;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankName?: string;
  upiId?: string;
}

class AmendContractDto {
  amendmentType: string;
  description: string;
  previousValue: string;
  newValue: string;
}

@ApiTags('Ops - Contract Management')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class ContractsController {
  constructor(private readonly contractService: VendorContractService) {}

  /**
   * Get all contracts
   */
  @Get()
  @ApiOperation({ summary: 'Get all vendor contracts' })
  @ApiResponse({ status: 200, description: 'Contracts retrieved' })
  async getAllContracts(@Query('status') status?: ContractStatus) {
    const contracts = await this.contractService.findAll(status);
    return { contracts };
  }

  /**
   * Get contract by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get contract details' })
  @ApiResponse({ status: 200, description: 'Contract retrieved' })
  async getContractById(@Param('id') id: string) {
    const contract = await this.contractService.findById(id);
    return { contract };
  }

  /**
   * Get contract for a vendor
   */
  @Get('vendor/:vendorProfileId')
  @ApiOperation({ summary: 'Get contract for a vendor' })
  @ApiResponse({ status: 200, description: 'Contract retrieved' })
  async getVendorContract(@Param('vendorProfileId') vendorProfileId: string) {
    const contract =
      await this.contractService.findByVendorProfile(vendorProfileId);
    if (!contract) {
      return { hasContract: false, contract: null };
    }
    return { hasContract: true, contract };
  }

  /**
   * Create a new contract for a vendor
   */
  @Post()
  @ApiOperation({ summary: 'Create a vendor contract' })
  @ApiResponse({ status: 201, description: 'Contract created' })
  async createContract(@Body() dto: CreateContractDto) {
    const contract = await this.contractService.create({
      vendorProfileId: dto.vendorProfileId,
      commissionRate: dto.commissionRate,
      payoutFrequency: dto.payoutFrequency,
      payoutHoldDays: dto.payoutHoldDays,
      minPayoutAmount: dto.minPayoutAmount,
      effectiveDate: dto.effectiveDate ? new Date(dto.effectiveDate) : undefined,
      expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
    });
    return { success: true, contract };
  }

  /**
   * Update contract details
   */
  @Put(':id')
  @ApiOperation({ summary: 'Update contract details' })
  @ApiResponse({ status: 200, description: 'Contract updated' })
  async updateContract(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    const contract = await this.contractService.update(id, dto);
    return { success: true, contract };
  }

  /**
   * Activate a contract (admin sign-off)
   */
  @Put(':id/activate')
  @ApiOperation({ summary: 'Activate a pending contract' })
  @ApiResponse({ status: 200, description: 'Contract activated' })
  async activateContract(@Param('id') id: string) {
    const contract = await this.contractService.activate(id);
    return { success: true, contract };
  }

  /**
   * Suspend a contract
   */
  @Put(':id/suspend')
  @ApiOperation({ summary: 'Suspend a contract' })
  @ApiResponse({ status: 200, description: 'Contract suspended' })
  async suspendContract(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    const contract = await this.contractService.suspend(id, reason);
    return { success: true, contract };
  }

  /**
   * Terminate a contract
   */
  @Put(':id/terminate')
  @ApiOperation({ summary: 'Terminate a contract' })
  @ApiResponse({ status: 200, description: 'Contract terminated' })
  async terminateContract(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    const contract = await this.contractService.terminate(id, reason);
    return { success: true, contract };
  }

  /**
   * Reactivate a suspended contract
   */
  @Put(':id/reactivate')
  @ApiOperation({ summary: 'Reactivate a suspended contract' })
  @ApiResponse({ status: 200, description: 'Contract reactivated' })
  async reactivateContract(@Param('id') id: string) {
    const contract = await this.contractService.reactivate(id);
    return { success: true, contract };
  }

  /**
   * Add an amendment to a contract
   */
  @Post(':id/amendments')
  @ApiOperation({ summary: 'Add amendment to contract' })
  @ApiResponse({ status: 201, description: 'Amendment added' })
  async addAmendment(@Param('id') id: string, @Body() dto: AmendContractDto) {
    const amendment = await this.contractService.addAmendment(id, dto);
    return { success: true, amendment };
  }

  /**
   * Get contract amendments
   */
  @Get(':id/amendments')
  @ApiOperation({ summary: 'Get contract amendments' })
  @ApiResponse({ status: 200, description: 'Amendments retrieved' })
  async getAmendments(@Param('id') id: string) {
    const amendments = await this.contractService.getAmendments(id);
    return { amendments };
  }
}
