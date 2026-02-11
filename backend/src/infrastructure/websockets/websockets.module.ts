// ============================================================================
// WEBSOCKETS MODULE - Real-time Communication
// ============================================================================
// Provides WebSocket gateways for notifications and messaging
// Integrates with Socket.IO for real-time bidirectional communication
// ============================================================================

import { Global, Module } from '@nestjs/common'
import { NotificationGateway } from './notification.gateway'
import { MessagingGateway } from './messaging.gateway'
import { MessagingModule } from '../../domain/messaging/messaging.module'

@Global()
@Module({
  imports: [MessagingModule],
  providers: [NotificationGateway, MessagingGateway],
  exports: [NotificationGateway, MessagingGateway],
})
export class WebsocketsModule {}
