// ============================================================================
// PUBLIC QUOTE APPROVAL CONTROLLER - Public Gateway
// ============================================================================
// Handles public quote/requirement sheet approvals via token-based links
// ============================================================================

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RequirementSheetService } from '../../../domain/operations/services/requirement-sheet.service';
import { ClientRejectDto } from '../../../domain/operations/dto/requirement-sheet.dto';
import { Public } from '../../../core/auth/decorators/public.decorator';

@Controller('quote-approval')
@ApiTags('Public Quote Approval')
@Public()
export class QuoteApprovalController {
  constructor(
    private readonly requirementSheetService: RequirementSheetService,
  ) {}

  /**
   * Get quote/requirement sheet details for client approval via unique token
   * Returns event info, requirement items, and total amount
   */
  @Get(':token')
  @ApiOperation({ summary: 'Get quote details by approval token' })
  @ApiResponse({
    status: 200,
    description: 'Returns quote details for client approval page',
  })
  @ApiResponse({ status: 404, description: 'Invalid or expired approval link' })
  async getQuoteDetails(@Param('token') token: string) {
    const sheet = await this.requirementSheetService.findByApprovalToken(token);

    if (!sheet) {
      throw new NotFoundException('Invalid approval link');
    }

    const sheetWithRelations = sheet as any;
    const activeEvent = sheetWithRelations.activeEvent;

    // Calculate total amount from items
    const totalAmount = sheet.items?.reduce(
      (sum, item) => sum + (Number(item.estimatedBudget) || 0),
      0,
    ) || 0;

    return {
      id: sheet.id,
      clientName: activeEvent?.clientName || 'Valued Client',
      eventType: activeEvent?.eventType || 'Event',
      eventDate: activeEvent?.eventDate || null,
      notes: sheet.notes,
      approvalStatus: sheet.approvalStatus,
      createdAt: sheet.createdAt,
      items: sheet.items?.map((item) => ({
        id: item.id,
        category: item.category,
        description: item.description,
        quantity: item.quantity,
        estimatedBudget: Number(item.estimatedBudget) || 0,
        notes: item.notes,
      })) || [],
      totalAmount,
    };
  }

  /**
   * Approve quote/requirement sheet via public token link
   */
  @Post(':token/approve')
  @ApiOperation({ summary: 'Approve quote' })
  @ApiResponse({ status: 200, description: 'Quote approved successfully' })
  @ApiResponse({ status: 404, description: 'Invalid or expired approval link' })
  @ApiResponse({ status: 400, description: 'Quote already approved or not pending' })
  async approveQuote(@Param('token') token: string) {
    const sheet = await this.requirementSheetService.approveByToken(token);

    return {
      success: true,
      message: 'Thank you! Your approval has been recorded.',
      approvalStatus: sheet.approvalStatus,
      approvedAt: sheet.clientApprovedAt,
    };
  }

  /**
   * Reject quote/requirement sheet via public token link
   */
  @Post(':token/reject')
  @ApiOperation({ summary: 'Reject quote' })
  @ApiResponse({ status: 200, description: 'Quote rejected successfully' })
  @ApiResponse({ status: 404, description: 'Invalid or expired approval link' })
  @ApiResponse({ status: 400, description: 'Quote already approved or not pending' })
  async rejectQuote(
    @Param('token') token: string,
    @Body() dto: ClientRejectDto,
  ) {
    const sheet = await this.requirementSheetService.rejectByToken(token, dto);

    return {
      success: true,
      message: 'Your feedback has been recorded. We will contact you shortly.',
      approvalStatus: sheet.approvalStatus,
      rejectedAt: sheet.clientRejectedAt,
    };
  }
}
