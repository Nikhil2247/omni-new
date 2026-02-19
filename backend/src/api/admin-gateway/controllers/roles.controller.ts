import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { AdminOnly } from '../../../core/auth/decorators/roles.decorator';
import { PrismaService } from '../../../core/database/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from '../dto/role.dto';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
export class RolesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  list() {
    return this.prisma.role.findMany({
      include: { parentRole: true },
      orderBy: [{ level: 'desc' }, { name: 'asc' }],
    });
  }

  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.prisma.role.create({
      data: {
        name: dto.name,
        displayName: dto.displayName,
        description: dto.description,
        level: dto.level ?? 0,
        isSystem: dto.isSystem ?? false,
        parentRole: dto.parentRoleId
          ? { connect: { id: dto.parentRoleId } }
          : undefined,
      },
    });
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.prisma.role.update({
      where: { id },
      data: {
        displayName: dto.displayName,
        description: dto.description,
        level: dto.level,
        isSystem: dto.isSystem,
        parentRole: dto.parentRoleId
          ? { connect: { id: dto.parentRoleId } }
          : dto.parentRoleId === null
            ? { disconnect: true }
            : undefined,
      },
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) {
      return { success: false, message: 'Role not found' };
    }
    if (role.isSystem) {
      return { success: false, message: 'System roles cannot be deleted' };
    }
    await this.prisma.role.delete({ where: { id } });
    return { success: true };
  }
}
