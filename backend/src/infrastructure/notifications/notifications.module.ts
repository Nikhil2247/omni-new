// ============================================================================
// NOTIFICATIONS MODULE - Email and Notification Services
// ============================================================================
// Provides email sending and notification management
// ============================================================================

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { NotificationService } from './notification.service';
import { EmailNotificationListener } from './email-notification.listener';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [EmailService, NotificationService, EmailNotificationListener],
  exports: [EmailService, NotificationService],
})
export class NotificationsModule {}
