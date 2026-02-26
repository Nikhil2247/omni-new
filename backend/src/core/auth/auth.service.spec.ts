// ============================================================================
// AUTH SERVICE TESTS - Critical Authentication Flows
// ============================================================================

import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { PrismaService } from '../database/prisma.service';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';
import { LoginActivityService } from './login-activity.service';
import { EmailVerificationService } from './email-verification.service';
import { RoleLookupService } from '../lookup/role-lookup.service';
import { DragonflyService } from '../../infrastructure/cache/dragonfly.service';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let dragonflyService: DragonflyService;
  let tokenService: TokenService;
  let twoFactorService: TwoFactorService;

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    passwordHash: '$2a$12$mockHashedPassword',
    status: 'ACTIVE',
    emailVerified: true,
    twoFactorEnabled: false,
    firstName: 'Test',
    lastName: 'User',
    hasCompletedOnboarding: true,
    userRoles: [
      {
        role: { name: 'USER', id: 'role-1' },
      },
    ],
    vendorProfile: null,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    systemConfig: {
      findFirst: jest.fn().mockResolvedValue({ maintenanceMode: false }),
    },
  };

  const mockDragonflyService = {
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  };

  const mockTokenService = {
    generateTokenPair: jest.fn().mockResolvedValue({
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      expiresIn: 900,
    }),
  };

  const mockTwoFactorService = {
    verifyTwoFactorCode: jest.fn(),
  };

  const mockLoginActivityService = {
    recordLogin: jest.fn(),
    recordLoginAttempt: jest.fn(),
    checkAccountLockout: jest.fn().mockResolvedValue({ isLocked: false }),
  };

  const mockEmailVerificationService = {
    generateVerificationToken: jest.fn().mockResolvedValue('verification-token'),
  };

  const mockRoleLookupService = {
    getRoleIdByName: jest.fn().mockReturnValue('role-1'),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'MAINTENANCE_MODE') return 'false';
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: TokenService, useValue: mockTokenService },
        { provide: TwoFactorService, useValue: mockTwoFactorService },
        { provide: LoginActivityService, useValue: mockLoginActivityService },
        {
          provide: EmailVerificationService,
          useValue: mockEmailVerificationService,
        },
        { provide: RoleLookupService, useValue: mockRoleLookupService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: DragonflyService, useValue: mockDragonflyService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    dragonflyService = module.get<DragonflyService>(DragonflyService);
    tokenService = module.get<TokenService>(TokenService);
    twoFactorService = module.get<TwoFactorService>(TwoFactorService);

    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginContext = {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    };

    it('should successfully login user without 2FA', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(service as any, 'validatePassword').mockResolvedValue(true);

      const result = await service.login(
        'test@example.com',
        'password123',
        loginContext,
      );

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(result.requiresTwoFactor).toBeUndefined();
    });

    it('should require 2FA when enabled', async () => {
      const userWith2FA = { ...mockUser, twoFactorEnabled: true };
      mockPrismaService.user.findUnique.mockResolvedValue(userWith2FA);
      jest.spyOn(service as any, 'validatePassword').mockResolvedValue(true);
      mockDragonflyService.set.mockResolvedValue(true);

      const result = await service.login(
        'test@example.com',
        'password123',
        loginContext,
      );

      expect(result.requiresTwoFactor).toBe(true);
      expect(mockDragonflyService.set).toHaveBeenCalled();
      const setCall = mockDragonflyService.set.mock.calls[0];
      expect(setCall[0]).toContain('2fa:pending:');
    });

    it('should throw error for invalid email', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login('invalid@example.com', 'password123', loginContext),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw error for unverified email', async () => {
      const unverifiedUser = { ...mockUser, emailVerified: false };
      mockPrismaService.user.findUnique.mockResolvedValue(unverifiedUser);

      await expect(
        service.login('test@example.com', 'password123', loginContext),
      ).rejects.toThrow();
    });
  });

  describe('verifyTwoFactorAndLogin', () => {
    const loginContext = {
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
    };

    it('should complete 2FA verification successfully', async () => {
      const tempToken = '2fa-temp-token';
      const pending2FAData = {
        userId: 'user-123',
        expiresAt: Date.now() + 60000,
        context: loginContext,
      };

      mockDragonflyService.get.mockResolvedValue(pending2FAData);
      mockDragonflyService.delete.mockResolvedValue(true);
      mockTwoFactorService.verifyTwoFactorCode.mockResolvedValue({
        success: true,
        usedBackupCode: false,
      });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(service as any, 'getUserById').mockResolvedValue(mockUser);

      const result = await service.verifyTwoFactorAndLogin(
        tempToken,
        '123456',
        loginContext,
      );

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('mock-access-token');
      expect(mockDragonflyService.delete).toHaveBeenCalledWith(
        expect.stringContaining('2fa:pending:'),
      );
    });

    it('should reject expired 2FA session', async () => {
      const tempToken = '2fa-temp-token';
      const expired2FAData = {
        userId: 'user-123',
        expiresAt: Date.now() - 1000, // Expired
        context: loginContext,
      };

      mockDragonflyService.get.mockResolvedValue(expired2FAData);

      await expect(
        service.verifyTwoFactorAndLogin(tempToken, '123456', loginContext),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should reject invalid 2FA code', async () => {
      const tempToken = '2fa-temp-token';
      const pending2FAData = {
        userId: 'user-123',
        expiresAt: Date.now() + 60000,
        context: loginContext,
      };

      mockDragonflyService.get.mockResolvedValue(pending2FAData);
      mockTwoFactorService.verifyTwoFactorCode.mockResolvedValue({
        success: false,
      });

      await expect(
        service.verifyTwoFactorAndLogin(tempToken, 'wrong-code', loginContext),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should register new user successfully', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockResolvedValue({
        ...mockUser,
        status: 'PENDING',
      });

      const result = await service.register({
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(mockPrismaService.user.create).toHaveBeenCalled();
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'user.registered',
        expect.any(Object),
      );
    });

    it('should reject duplicate email registration', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.register({
          email: 'test@example.com',
          password: 'SecurePass123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
