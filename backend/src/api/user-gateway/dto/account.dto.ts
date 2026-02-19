// ============================================================================
// USER ACCOUNT DTOs - Profile, Notification Preferences, and 2FA
// ============================================================================

import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';

export class UpdateAccountProfileDto {
  @ApiProperty({ required: false, example: 'Jane' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ required: false, example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ required: false, example: '+1 (555) 000-0000' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class NotificationEmailPreferencesDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  events: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  leads: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  tasks: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  updates: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  marketing: boolean;
}

export class NotificationPushPreferencesDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  events: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  leads: boolean;

  @ApiProperty({ example: true })
  @IsBoolean()
  tasks: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  updates: boolean;
}

export class NotificationSmsPreferencesDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  events: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  leads: boolean;

  @ApiProperty({ example: false })
  @IsBoolean()
  tasks: boolean;
}

export class NotificationPreferencesDto {
  @ApiProperty({ type: NotificationEmailPreferencesDto })
  @ValidateNested()
  @Type(() => NotificationEmailPreferencesDto)
  email: NotificationEmailPreferencesDto;

  @ApiProperty({ type: NotificationPushPreferencesDto })
  @ValidateNested()
  @Type(() => NotificationPushPreferencesDto)
  push: NotificationPushPreferencesDto;

  @ApiProperty({ type: NotificationSmsPreferencesDto })
  @ValidateNested()
  @Type(() => NotificationSmsPreferencesDto)
  sms: NotificationSmsPreferencesDto;
}

export class TwoFactorCodeDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 8)
  code: string;
}

export class TwoFactorDisableDto {
  @ApiProperty({ required: false, example: '123456' })
  @IsOptional()
  @IsString()
  @Length(6, 8)
  code?: string;
}
