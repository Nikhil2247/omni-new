// ============================================================================
// OPS GATEWAY - Payouts Controller
// ============================================================================
// Admin management of vendor payouts

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
import { PayoutService } from '../../../domain/operations/services/payout.service';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator';

class CreatePayoutDto {
  vendorProfileId: string;
  periodStart: string;
  periodEnd: string;
}

class SchedulePayoutDto {
  scheduledFor: string;
}

class CompletePayoutDto {
  transactionRef: string;
  paymentMethod: string;
}

class FailPayoutDto {
  reason: string;
}

@ApiTags('Ops - Payout Management')
@ApiBearerAuth()
@Controller('payouts')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class PayoutsController {
  constructor(private readonly payoutService: PayoutService) {}

  /**
   * Get all pending payouts
   */
  @Get('pending')
  @ApiOperation({ summary: 'Get all pending payouts' })
  @ApiResponse({ status: 200, description: 'Pending payouts retrieved' })
  async getPendingPayouts() {
    const payouts = await this.payoutService.getPendingPayouts();
    return { payouts };
  }

  /**
   * Get payout by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get payout details' })
  @ApiResponse({ status: 200, description: 'Payout retrieved' })
  async getPayoutById(@Param('id') id: string) {
    const payout = await this.payoutService.findById(id);
    return { payout };
  }

  /**
   * Get payouts for a vendor
   */
  @Get('vendor/:vendorProfileId')
  @ApiOperation({ summary: 'Get all payouts for a vendor' })
  @ApiResponse({ status: 200, description: 'Payouts retrieved' })
  async getVendorPayouts(@Param('vendorProfileId') vendorProfileId: string) {
    const payouts = await this.payoutService.getVendorPayouts(vendorProfileId);
    return { payouts };
  }

  /**
   * Calculate payout summary for a vendor
   */
  @Get('vendor/:vendorProfileId/summary')
  @ApiOperation({ summary: 'Calculate payout summary for a vendor' })
  @ApiResponse({ status: 200, description: 'Summary calculated' })
  async calculatePayoutSummary(
    @Param('vendorProfileId') vendorProfileId: string,
    @Query('periodStart') periodStart: string,
    @Query('periodEnd') periodEnd: string,
  ) {
    const summary = await this.payoutService.calculatePayoutSummary(
      vendorProfileId,
      new Date(periodStart),
      new Date(periodEnd),
    );
    return { summary };
  }

  /**
   * Get payout statistics
   */
  @Get('stats')
  @ApiOperation({ summary: 'Get payout statistics for a period' })
  @ApiResponse({ status: 200, description: 'Stats retrieved' })
  async getPayoutStats(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const stats = await this.payoutService.getPayoutStats(
      new Date(startDate),
      new Date(endDate),
    );
    return { stats };
  }

  /**
   * Create a payout for a vendor
   */
  @Post()
  @ApiOperation({ summary: 'Create a payout for a vendor' })
  @ApiResponse({ status: 201, description: 'Payout created' })
  async createPayout(@Body() dto: CreatePayoutDto) {
    const payout = await this.payoutService.createPayout({
      vendorProfileId: dto.vendorProfileId,
      periodStart: new Date(dto.periodStart),
      periodEnd: new Date(dto.periodEnd),
    });
    return { success: true, payout };
  }

  /**
   * Schedule a payout for processing
   */
  @Put(':id/schedule')
  @ApiOperation({ summary: 'Schedule payout for processing' })
  @ApiResponse({ status: 200, description: 'Payout scheduled' })
  async schedulePayout(
    @Param('id') id: string,
    @Body() dto: SchedulePayoutDto,
  ) {
    const payout = await this.payoutService.schedulePayout(
      id,
      new Date(dto.scheduledFor),
    );
    return { success: true, payout };
  }

  /**
   * Start processing a payout
   */
  @Put(':id/process')
  @ApiOperation({ summary: 'Start processing payout' })
  @ApiResponse({ status: 200, description: 'Payout processing started' })
  async processPayout(@Param('id') id: string) {
    const payout = await this.payoutService.processPayout(id);
    return { success: true, payout };
  }

  /**
   * Complete a payout
   */
  @Put(':id/complete')
  @ApiOperation({ summary: 'Mark payout as completed' })
  @ApiResponse({ status: 200, description: 'Payout completed' })
  async completePayout(@Param('id') id: string, @Body() dto: CompletePayoutDto) {
    const payout = await this.payoutService.completePayout(
      id,
      dto.transactionRef,
      dto.paymentMethod,
    );
    return { success: true, payout };
  }

  /**
   * Mark payout as failed
   */
  @Put(':id/fail')
  @ApiOperation({ summary: 'Mark payout as failed' })
  @ApiResponse({ status: 200, description: 'Payout marked as failed' })
  async failPayout(@Param('id') id: string, @Body() dto: FailPayoutDto) {
    const payout = await this.payoutService.failPayout(id, dto.reason);
    return { success: true, payout };
  }
}
