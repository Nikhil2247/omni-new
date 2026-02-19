// ============================================================================
// NOTIFICATIONS MODULE - Email and Notification Services
// ============================================================================
// Provides email sending and notification management
// ============================================================================

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { NotificationService } from './notification.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailService, NotificationService],
  exports: [EmailService, NotificationService],
})
export class NotificationsModule {}
