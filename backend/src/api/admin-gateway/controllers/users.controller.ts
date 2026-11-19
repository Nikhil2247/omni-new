import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { AdminOnly } from '../../../core/auth/decorators/roles.decorator';
import { PrismaService } from '../../../core/database/prisma.service';
import { TokenService } from '../../../core/auth/token.service';
import {
  AssignRoleDto,
  SearchUsersDto,
  UpdateUserStatusDto,
} from '../dto/user.dto';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { AuditSensitive } from '../../../core/audit/audit.decorators';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@AdminOnly()
export class UsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

  @Get()
  async list(@Query() query: SearchUsersDto) {
    const { page = 1, limit = 20, query: term, status, role } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(status && { status }),
      ...(term && {
        OR: [
          { email: { contains: term, mode: 'insensitive' } },
          { firstName: { contains: term, mode: 'insensitive' } },
          { lastName: { contains: term, mode: 'insensitive' } },
        ],
      }),
      ...(role && {
        userRoles: { some: { role: { name: role } } },
      }),
    };

    const [total, users] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          userRoles: { include: { role: true } },
          vendorProfile: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  @Get(':id')
  async getById(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        userRoles: { include: { role: true } },
        vendorProfile: { select: { id: true } },
        sessions: {
          orderBy: { lastActiveAt: 'desc' },
          take: 5,
        },
      },
    });
  }

  @Patch(':id/status')
  @AuditSensitive('STATUS_CHANGE', 'User')
  async updateStatus(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    const updated = await this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
    });

    if (dto.status !== 'ACTIVE') {
      await this.tokenService.invalidateAllUserSessions(id);
    }

    return updated;
  }

  @Post(':id/roles')
  @AuditSensitive('ROLE_ASSIGNED', 'User')
  async assignRole(
    @Param('id', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Body() dto: AssignRoleDto,
    @CurrentUser() admin: CurrentUserData,
  ) {
    // Enforce single role: remove all existing assignments then create the new one atomically
    await this.prisma.$transaction([
      this.prisma.userRoleAssignment.deleteMany({ where: { userId } }),
      this.prisma.userRoleAssignment.create({
        data: {
          userId,
          roleId: dto.roleId,
          assignedBy: admin?.id,
        },
      }),
    ]);

    return this.prisma.userRoleAssignment.findMany({
      where: { userId },
      include: { role: true },
    });
  }

  @Delete(':id/roles/:roleId')
  @AuditSensitive('ROLE_REMOVED', 'User')
  async removeRole(
    @Param('id', new ParseUUIDPipe({ version: '4' })) userId: string,
    @Param('roleId', new ParseUUIDPipe({ version: '4' })) roleId: string,
  ) {
    await this.prisma.userRoleAssignment.delete({
      where: { userId_roleId: { userId, roleId } },
    });
    return { success: true };
  }

  /**
   * Soft-delete a user: the account is disabled, signed out everywhere and flagged DELETED (data is retained for
   * compliance, as the schema intends). Admins cannot delete themselves or a system administrator.
   */
  @Delete(':id')
  @AuditSensitive('DELETE', 'User')
  async remove(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    if (currentUser?.id === id) {
      throw new ForbiddenException('You cannot delete your own account.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } } },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.userRoles.some((entry) => entry.role.name === 'ADMIN_SYSTEM')) {
      throw new ForbiddenException(
        'A system administrator cannot be deleted. Remove the role first.',
      );
    }

    await this.prisma.user.update({
      where: { id },
      data: { status: 'DELETED', deletedAt: new Date() },
    });
    await this.tokenService.invalidateAllUserSessions(id);

    return { success: true };
  }

  @Get(':id/sessions')
  async getSessions(
    @Param('id', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    return this.tokenService.getActiveSessions(userId);
  }

  @Delete(':id/sessions/:sessionId')
  @AuditSensitive('SESSION_REVOKED', 'UserSession')
  async revokeSession(
    @Param('sessionId', new ParseUUIDPipe({ version: '4' })) sessionId: string,
  ) {
    await this.tokenService.invalidateSession(sessionId);
    return { success: true };
  }

  @Post(':id/sessions/revoke-all')
  @AuditSensitive('SESSIONS_REVOKE_ALL', 'UserSession')
  async revokeAll(
    @Param('id', new ParseUUIDPipe({ version: '4' })) userId: string,
  ) {
    await this.tokenService.invalidateAllUserSessions(userId);
    return { success: true };
  }
}
