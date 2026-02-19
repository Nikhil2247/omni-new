import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { OpsAccess } from '../../../core/auth/decorators/roles.decorator';

@Controller('support')
@UseGuards(JwtAuthGuard, RolesGuard)
@OpsAccess()
export class SupportController {
  @Get()
  list() {
    return [];
  }
}
