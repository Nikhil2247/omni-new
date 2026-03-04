// ============================================================================
// REDIS IO ADAPTER - WebSocket Scaling with Redis Pub/Sub
// ============================================================================
// Enables horizontal scaling of WebSocket connections across multiple
// server instances using Redis/Dragonfly as a pub/sub backend
// ============================================================================

import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ServerOptions, Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient, RedisClientType } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;
  private pubClient: RedisClientType | null = null;
  private subClient: RedisClientType | null = null;

  constructor(
    app: INestApplication,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  async connectToRedis(): Promise<void> {
    const host = this.configService.get<string>('DRAGONFLY_HOST', 'localhost');
    const port = this.configService.get<number>('DRAGONFLY_PORT', 6379);
    const password = this.configService.get<string>('DRAGONFLY_PASSWORD');
    const db = this.configService.get<number>('DRAGONFLY_WS_DB', 1); // Use separate DB for WebSocket

    const redisUrl = password
      ? `redis://:${password}@${host}:${port}/${db}`
      : `redis://${host}:${port}/${db}`;

    try {
      this.pubClient = createClient({ url: redisUrl });
      this.subClient = this.pubClient.duplicate();

      // Set up error handlers
      this.pubClient.on('error', (err) => {
        this.logger.error('Redis Pub client error:', err);
      });

      this.subClient.on('error', (err) => {
        this.logger.error('Redis Sub client error:', err);
      });

      // Connect both clients
      await Promise.all([this.pubClient.connect(), this.subClient.connect()]);

      this.adapterConstructor = createAdapter(this.pubClient, this.subClient);

      this.logger.log(`WebSocket Redis adapter connected to ${host}:${port}`);
    } catch (error) {
      this.logger.error('Failed to connect Redis adapter:', error);
      throw error;
    }
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

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
      this.logger.log('Socket.IO Redis adapter attached');
    } else {
      this.logger.warn(
        'Redis adapter not initialized, using default in-memory adapter',
      );
    }

    return server;
  }

  async close(): Promise<void> {
    await Promise.all([
      this.closeClient(this.subClient, 'sub'),
      this.closeClient(this.pubClient, 'pub'),
    ]);
    this.logger.log('Redis adapter connections closed');
  }

  private async closeClient(
    client: RedisClientType | null,
    label: string,
  ): Promise<void> {
    if (!client || !client.isOpen) {
      return;
    }

    try {
      await Promise.race([
        client.quit(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`${label} quit timeout`)), 2000),
        ),
      ]);
    } catch (error) {
      this.logger.warn(
        `Redis ${label} client quit failed, forcing disconnect`,
      );
      try {
        client.disconnect();
      } catch {
        // no-op: best effort during shutdown
      }
      this.logger.debug(
        `Redis ${label} disconnect fallback used: ${
          error instanceof Error ? error.message : 'unknown error'
        }`,
      );
    }
  }
}

/**
 * Factory function to create and initialize the Redis IO adapter
 */
export async function createRedisIoAdapter(
  app: INestApplication,
): Promise<RedisIoAdapter> {
  const configService = app.get(ConfigService);
  const adapter = new RedisIoAdapter(app, configService);

  const enableRedisAdapter = configService.get<boolean>(
    'WEBSOCKET_REDIS_ADAPTER',
    false,
  );

  if (enableRedisAdapter) {
    try {
      await adapter.connectToRedis();
    } catch (error) {
      const logger = new Logger('RedisIoAdapter');
      logger.warn(
        'Failed to connect Redis adapter, falling back to in-memory adapter',
      );
    }
  }

  return adapter;
}
