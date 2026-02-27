import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { VendorAgreementService } from '../../../domain/operations/services/vendor-agreement.service';
import {
  CreateVendorAgreementDto,
  UpdateVendorAgreementDto,
} from '../../../domain/operations/dto/vendor-agreement.dto';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  AuditCreate,
  AuditDelete,
  AuditSensitive,
  AuditUpdate,
} from '../../../core/audit/audit.decorators';

@Controller('vendor-agreements')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class VendorAgreementsController {
  constructor(
    private readonly vendorAgreementService: VendorAgreementService,
  ) {}

  @Post()
  @AuditCreate('VendorAgreement')
  create(@Body() dto: CreateVendorAgreementDto) {
    return this.vendorAgreementService.create(dto);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.vendorAgreementService.findById(id);
  }

  @Get()
  findByActiveEvent(@Query('activeEventId', new ParseUUIDPipe()) activeEventId: string) {
    return this.vendorAgreementService.findByActiveEvent(activeEventId);
  }

  @Put(':id')
  @AuditUpdate('VendorAgreement')
  update(@Param('id') id: string, @Body() dto: UpdateVendorAgreementDto) {
    return this.vendorAgreementService.update(id, dto);
  }

  @Put(':id/send')
  @AuditSensitive('SEND', 'VendorAgreement')
  send(@Param('id') id: string) {
    return this.vendorAgreementService.markAsSent(id);
  }

  @Put(':id/accept')
  @AuditSensitive('ACCEPT', 'VendorAgreement')
  accept(@Param('id') id: string) {
    return this.vendorAgreementService.markAsAccepted(id);
  }

  @Put(':id/decline')
  @AuditSensitive('DECLINE', 'VendorAgreement')
  decline(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.vendorAgreementService.markAsDeclined(id, reason);
  }

  @Delete(':id')
  @AuditDelete('VendorAgreement')
  async remove(@Param('id') id: string) {
    await this.vendorAgreementService.delete(id);
    return { success: true };
  }
}
