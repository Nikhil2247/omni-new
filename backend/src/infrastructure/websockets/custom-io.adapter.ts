// ============================================================================
// CUSTOM IO ADAPTER - WebSocket Adapter with Custom Path
// ============================================================================
// Basic Socket.IO adapter that configures the custom path for development
// ============================================================================

import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServerOptions, Server } from 'socket.io';

export class CustomIoAdapter extends IoAdapter {
  private readonly logger = new Logger(CustomIoAdapter.name);

  constructor(
    app: INestApplication,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const corsOrigins = this.configService
      .get<string>('CORS_ORIGINS')
      ?.split(',')
      .map((origin) => origin.trim())
      .filter(Boolean) || [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://omnicassion.com',
      'https://www.omnicassion.com',
      'https://backend.omnicassion.com',
    ];

    const socketPath = this.configService.get<string>(
      'SOCKET_IO_PATH',
      '/api/socket.io',
    );

    this.logger.log(`Socket.IO path configured: ${socketPath}`);

    const server = super.createIOServer(port, {
      ...options,
      path: socketPath,
      cors: {
        origin: corsOrigins,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingInterval: 25000,
      pingTimeout: 20000,
      maxHttpBufferSize: 1e6, // 1MB
      connectTimeout: 45000,
    });

    return server;
  }
}
