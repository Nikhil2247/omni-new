import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { SalesAccess } from '../../../core/auth/decorators/roles.decorator';

@Controller('partnerships')
@UseGuards(JwtAuthGuard, RolesGuard)
@SalesAccess()
export class PartnershipsController {
  @Get()
  list() {
    return [];
  }
}
