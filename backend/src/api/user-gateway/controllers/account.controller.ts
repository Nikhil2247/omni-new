import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/auth/guards/roles.guard';
import { UserAccess } from '../../../core/auth/decorators/roles.decorator';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { PrismaService } from '../../../core/database/prisma.service';
import { AuthService } from '../../../core/auth/auth.service';
import { TwoFactorService } from '../../../core/auth/two-factor.service';
import { ChangePasswordDto } from '../../../core/auth/dto/password.dto';
import {
  NotificationPreferencesDto,
  TwoFactorCodeDto,
  TwoFactorDisableDto,
  UpdateAccountProfileDto,
} from '../dto/account.dto';
import { DragonflyService } from '../../../infrastructure/cache/dragonfly.service';

@Controller('account')
@UseGuards(JwtAuthGuard, RolesGuard)
@UserAccess()
export class AccountController {
  private readonly preferencesTtlSeconds = 60 * 60 * 24 * 365;

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
    private readonly cache: DragonflyService,
  ) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: CurrentUserData) {
    return this.getUserProfile(user.id);
  }

  @Get('addresses')
  async getAddresses(@CurrentUser() user: CurrentUserData) {
    const eventsWithAddresses = await this.prisma.event.findMany({
      where: {
        userId: user.id,
        addressId: { not: null },
      },
      distinct: ['addressId'],
      select: {
        address: {
          select: {
            id: true,
            addressLine1: true,
            addressLine2: true,
            postalCode: true,
            city: {
              select: {
                name: true,
                state: {
                  select: {
                    name: true,
                    country: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return eventsWithAddresses
      .map((entry) => entry.address)
      .filter((address): address is NonNullable<typeof address> =>
        Boolean(address),
      )
      .map((address) => ({
        id: address.id,
        label: this.formatAddressLabel(address),
      }));
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateAccountProfileDto,
  ) {
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      },
    });

    if (!updated) {
      throw new NotFoundException('User not found');
    }

    return this.getUserProfile(user.id);
  }

  @Post('password')
  async changePassword(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ChangePasswordDto,
  ) {
    await this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
    );

    return { success: true };
  }

  @Get('notification-preferences')
  async getNotificationPreferences(@CurrentUser() user: CurrentUserData) {
    const cacheKey = this.getNotificationPreferencesCacheKey(user.id);
    const cached = await this.cache.get<NotificationPreferencesDto>(cacheKey);
    return cached ?? this.getDefaultNotificationPreferences();
  }

  @Patch('notification-preferences')
  async updateNotificationPreferences(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: NotificationPreferencesDto,
  ) {
    const cacheKey = this.getNotificationPreferencesCacheKey(user.id);
    await this.cache.set(cacheKey, dto, { ttl: this.preferencesTtlSeconds });
    return dto;
  }

  @Post('2fa/enable')
  async enableTwoFactor(@CurrentUser() user: CurrentUserData) {
    const result = await this.twoFactorService.setupTwoFactor(user.id);
    return {
      qrCode: result.qrCodeUrl,
      secret: result.secret,
      backupCodes: result.backupCodes,
    };
  }

  @Post('2fa/verify')
  async verifyTwoFactor(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: TwoFactorCodeDto,
  ) {
    await this.twoFactorService.verifyAndEnableTwoFactor(user.id, dto.code);
    return { success: true };
  }

  @Post('2fa/disable')
  async disableTwoFactor(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: TwoFactorDisableDto,
  ) {
    if (dto?.code) {
      await this.twoFactorService.disableTwoFactor(user.id, dto.code);
      return { success: true };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
        twoFactorVerifiedAt: null,
      },
    });

    return { success: true };
  }

  private async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roles = user.userRoles.map((assignment) => assignment.role.name);

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: roles[0],
      roles,
      emailVerified: user.emailVerified,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }

  private getNotificationPreferencesCacheKey(userId: string) {
    return `user:notification-preferences:${userId}`;
  }

  private formatAddressLabel(address: {
    addressLine1: string;
    addressLine2: string | null;
    postalCode: string | null;
    city: {
      name: string;
      state: {
        name: string;
        country: { name: string };
      };
    };
  }) {
    return [
      address.addressLine1,
      address.addressLine2,
      address.city.name,
      address.city.state.name,
      address.city.state.country.name,
      address.postalCode,
    ]
      .filter(Boolean)
      .join(', ');
  }

  private getDefaultNotificationPreferences(): NotificationPreferencesDto {
    return {
      email: {
        events: true,
        leads: true,
        tasks: true,
        updates: false,
        marketing: false,
      },
      push: {
        events: true,
        leads: true,
        tasks: true,
        updates: false,
      },
      sms: {
        events: false,
        leads: false,
        tasks: false,
      },
    };
  }
}
