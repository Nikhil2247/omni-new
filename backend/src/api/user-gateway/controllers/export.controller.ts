// ============================================================================
// EXPORT CONTROLLER - User Gateway
// ============================================================================

import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Res,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import { ExportService } from '../../../infrastructure/export/export.service';
import { ChecklistService } from '../../../domain/planning/services/checklist.service';
import { GuestlistService } from '../../../domain/planning/services/guestlist.service';
import { BudgetService } from '../../../domain/planning/services/budget.service';
import { EventService } from '../../../domain/planning/services/event.service';
import { IsEmail, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class EmailExportDto {
  @ApiProperty({ description: 'Email address to send export to' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Export format', enum: ['pdf', 'csv'] })
  @IsIn(['pdf', 'csv'])
  format: 'pdf' | 'csv';
}

@Controller('export')
@ApiTags('Export')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class ExportController {
  constructor(
    private readonly exportService: ExportService,
    private readonly checklistService: ChecklistService,
    private readonly guestlistService: GuestlistService,
    private readonly budgetService: BudgetService,
    private readonly eventService: EventService,
  ) {}

  // ==================== CHECKLIST EXPORTS ====================

  @Get('checklist/:checklistId/pdf')
  @ApiOperation({ summary: 'Download checklist as PDF' })
  @ApiParam({ name: 'checklistId', description: 'Checklist ID' })
  async exportChecklistPdf(
    @Param('checklistId') id: string,
    @Res() res: Response,
  ) {
    const checklist = await this.checklistService.findById(id);
    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    const event = await this.eventService.findById(checklist.eventId);
    const eventName = event?.name || 'Event';

    const pdfBuffer = await this.exportService.generateChecklistPdf(
      checklist,
      eventName,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="checklist-${checklist.name.replace(/\s+/g, '-')}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Get('checklist/:checklistId/csv')
  @ApiOperation({ summary: 'Download checklist as CSV' })
  @ApiParam({ name: 'checklistId', description: 'Checklist ID' })
  async exportChecklistCsv(
    @Param('checklistId') id: string,
    @Res() res: Response,
  ) {
    const checklist = await this.checklistService.findById(id);
    if (!checklist) {
      throw new NotFoundException('Checklist not found');
    }

    const csvContent = this.exportService.generateChecklistCsv(checklist);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="checklist-${checklist.name.replace(/\s+/g, '-')}.csv"`,
    });

    res.send(csvContent);
  }

  // ==================== GUESTLIST EXPORTS ====================

  @Get('guestlist/:guestlistId/pdf')
  @ApiOperation({ summary: 'Download guestlist as PDF' })
  @ApiParam({ name: 'guestlistId', description: 'Guestlist ID' })
  async exportGuestlistPdf(
    @Param('guestlistId') id: string,
    @Res() res: Response,
  ) {
    const guestlist = await this.guestlistService.findById(id);
    if (!guestlist) {
      throw new NotFoundException('Guestlist not found');
    }

    const event = await this.eventService.findById(guestlist.eventId);
    const eventName = event?.name || 'Event';

    const pdfBuffer = await this.exportService.generateGuestlistPdf(
      guestlist,
      eventName,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="guestlist-${eventName.replace(/\s+/g, '-')}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Get('guestlist/:guestlistId/csv')
  @ApiOperation({ summary: 'Download guestlist as CSV' })
  @ApiParam({ name: 'guestlistId', description: 'Guestlist ID' })
  async exportGuestlistCsv(
    @Param('guestlistId') id: string,
    @Res() res: Response,
  ) {
    const guestlist = await this.guestlistService.findById(id);
    if (!guestlist) {
      throw new NotFoundException('Guestlist not found');
    }

    const event = await this.eventService.findById(guestlist.eventId);
    const eventName = event?.name || 'Event';
    const csvContent = this.exportService.generateGuestlistCsv(guestlist);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="guestlist-${eventName.replace(/\s+/g, '-')}.csv"`,
    });

    res.send(csvContent);
  }

  // ==================== BUDGET EXPORTS ====================

  @Get('budget/:budgetId/pdf')
  @ApiOperation({ summary: 'Download budget as PDF' })
  @ApiParam({ name: 'budgetId', description: 'Budget ID' })
  async exportBudgetPdf(@Param('budgetId') id: string, @Res() res: Response) {
    const budgetData = await this.budgetService.findById(id);
    if (!budgetData) {
      throw new NotFoundException('Budget not found');
    }

    const event = await this.eventService.findById(budgetData.eventId);
    const eventName = event?.name || 'Event';

    // Compute totalSpent and remaining for export service
    const items = (budgetData as any).items || [];
    const totalBudget = Number(budgetData.totalBudget || 0);
    const totalSpent = items.reduce(
      (sum: number, item: any) => sum + Number(item.actualCost || 0),
      0,
    );
    const remaining = totalBudget - totalSpent;

    const budget = {
      id: budgetData.id,
      totalBudget,
      totalSpent,
      remaining,
      items: items.map((item: any) => ({
        ...item,
        estimatedCost: item.estimatedCost ? Number(item.estimatedCost) : null,
        actualCost: item.actualCost ? Number(item.actualCost) : null,
      })),
    };

    const pdfBuffer = await this.exportService.generateBudgetPdf(
      budget,
      eventName,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="budget-${eventName.replace(/\s+/g, '-')}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Get('budget/:budgetId/csv')
  @ApiOperation({ summary: 'Download budget as CSV' })
  @ApiParam({ name: 'budgetId', description: 'Budget ID' })
  async exportBudgetCsv(@Param('budgetId') id: string, @Res() res: Response) {
    const budgetData = await this.budgetService.findById(id);
    if (!budgetData) {
      throw new NotFoundException('Budget not found');
    }

    const event = await this.eventService.findById(budgetData.eventId);
    const eventName = event?.name || 'Event';

    // Compute totalSpent and remaining for export service
    const items = (budgetData as any).items || [];
    const totalBudget = Number(budgetData.totalBudget || 0);
    const totalSpent = items.reduce(
      (sum: number, item: any) => sum + Number(item.actualCost || 0),
      0,
    );
    const remaining = totalBudget - totalSpent;

    const budget = {
      id: budgetData.id,
      totalBudget,
      totalSpent,
      remaining,
      items: items.map((item: any) => ({
        ...item,
        estimatedCost: item.estimatedCost ? Number(item.estimatedCost) : null,
        actualCost: item.actualCost ? Number(item.actualCost) : null,
      })),
    };

    const csvContent = this.exportService.generateBudgetCsv(budget);

    res.set({
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="budget-${eventName.replace(/\s+/g, '-')}.csv"`,
    });

    res.send(csvContent);
  }
}
