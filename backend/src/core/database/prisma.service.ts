// ============================================================================
// PRISMA SERVICE - Prisma 7 Implementation
// ============================================================================
// Database connection service using Prisma ORM 7
// ============================================================================

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;

  constructor(private configService: ConfigService) {
    if (!process.env.PRISMA_CLIENT_ENGINE_TYPE) {
      process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';
    }

    if (!process.env.PRISMA_QUERY_ENGINE_TYPE) {
      process.env.PRISMA_QUERY_ENGINE_TYPE = 'binary';
    }

    const connectionString = configService.get<string>('DATABASE_URL');
    const pool = new Pool({
      connectionString,
      max: configService.get<number>('DATABASE_POOL_MAX', 20),
      idleTimeoutMillis: configService.get<number>(
        'DATABASE_IDLE_TIMEOUT_MS',
        30000,
      ),
      connectionTimeoutMillis: configService.get<number>(
        'DATABASE_CONNECTION_TIMEOUT_MS',
        10000,
      ),
      statement_timeout: configService.get<number>(
        'DATABASE_STATEMENT_TIMEOUT_MS',
        30000,
      ),
    });
    const adapter = new PrismaPg(pool);

    const logLevels: Prisma.LogLevel[] = ['warn', 'error'];

    super({
      adapter,
      log: logLevels.map((level) => ({
        emit: 'event',
        level,
      })),
    });

    this.pool = pool;

    // @ts-expect-error Prisma client event API type issue
    this.$on('warn', (e: { message: string }) => {
      this.logger.warn(e.message);
    });

    // @ts-expect-error Prisma client event API type issue
    this.$on('error', (e: { message: string }) => {
      this.logger.error(e.message);
    });
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to database...');
    await this.$connect();
    this.logger.log('Database connected successfully');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from database...');
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Database disconnected');
  }

  /**
   * Clean the database (for testing).
   * WARNING: This deletes ALL data!
   */
  async cleanDatabase(): Promise<void> {
    if (this.configService.get('app.nodeEnv') === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const tablenames = await this.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    if (tables.length > 0) {
      await this.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    }
  }

  /**
   * Health check for the database.
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return false;
    }
  }
}
