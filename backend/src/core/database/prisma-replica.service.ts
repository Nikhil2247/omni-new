// ============================================================================
// PRISMA REPLICA SERVICE - Read Replica Support
// ============================================================================
// Provides read replica routing for horizontal database scaling
// Routes read queries to replicas and writes to the primary database
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

export type ReplicaMode = 'primary' | 'replica' | 'auto';

@Injectable()
export class PrismaReplicaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaReplicaService.name);

  private primaryClient: PrismaClient;
  private replicaClient: PrismaClient | null = null;
  private primaryPool: Pool;
  private replicaPool: Pool | null = null;

  private readonly hasReplica: boolean;

  constructor(private readonly configService: ConfigService) {
    // Check if replica is configured
    this.hasReplica = !!this.configService.get<string>('DATABASE_REPLICA_URL');

    // Initialize primary connection
    const primaryUrl = this.configService.get<string>('DATABASE_URL');
    this.primaryPool = new Pool({ connectionString: primaryUrl });
    const primaryAdapter = new PrismaPg(this.primaryPool);

    this.primaryClient = new PrismaClient({
      adapter: primaryAdapter,
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
    });

    // Initialize replica connection if configured
    if (this.hasReplica) {
      const replicaUrl = this.configService.get<string>('DATABASE_REPLICA_URL');
      this.replicaPool = new Pool({ connectionString: replicaUrl });
      const replicaAdapter = new PrismaPg(this.replicaPool);

      this.replicaClient = new PrismaClient({
        adapter: replicaAdapter,
        log: [
          { emit: 'event', level: 'warn' },
          { emit: 'event', level: 'error' },
        ],
      });

      this.logger.log('Read replica configured and initialized');
    }

    this.setupEventListeners();
  }

  async onModuleInit(): Promise<void> {
    this.logger.log('Connecting to primary database...');
    await this.primaryClient.$connect();
    this.logger.log('Primary database connected');

    if (this.replicaClient) {
      this.logger.log('Connecting to replica database...');
      await this.replicaClient.$connect();
      this.logger.log('Replica database connected');
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('Disconnecting from databases...');

    await this.primaryClient.$disconnect();
    await this.primaryPool.end();

    if (this.replicaClient && this.replicaPool) {
      await this.replicaClient.$disconnect();
      await this.replicaPool.end();
    }

    this.logger.log('Databases disconnected');
  }

  /**
   * Get the primary client for write operations
   */
  get primary(): PrismaClient {
    return this.primaryClient;
  }

  /**
   * Get the replica client for read operations
   * Falls back to primary if replica is not available
   */
  get replica(): PrismaClient {
    return this.replicaClient || this.primaryClient;
  }

  /**
   * Get client based on mode
   * @param mode - 'primary' for writes, 'replica' for reads, 'auto' for automatic routing
   */
  getClient(mode: ReplicaMode = 'auto'): PrismaClient {
    switch (mode) {
      case 'primary':
        return this.primaryClient;
      case 'replica':
        return this.replica;
      case 'auto':
      default:
        // For auto mode, use replica for simple queries
        // This is a simplified implementation - in production you'd want more sophisticated routing
        return this.replica;
    }
  }

  /**
   * Execute a read query on the replica
   */
  async read<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
    return operation(this.replica);
  }

  /**
   * Execute a write query on the primary
   */
  async write<T>(operation: (client: PrismaClient) => Promise<T>): Promise<T> {
    return operation(this.primary);
  }

  /**
   * Execute a transaction on the primary (transactions must go to primary)
   */
  async transaction<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> {
    return this.primary.$transaction(fn, options);
  }

  /**
   * Check if replica is available
   */
  hasReplicaConnection(): boolean {
    return this.hasReplica && this.replicaClient !== null;
  }

  /**
   * Health check for both primary and replica
   */
  async healthCheck(): Promise<{
    primary: boolean;
    replica: boolean | null;
    replicationLag?: number;
  }> {
    const result: {
      primary: boolean;
      replica: boolean | null;
      replicationLag?: number;
    } = {
      primary: false,
      replica: null,
    };

    try {
      await this.primaryClient.$queryRaw`SELECT 1`;
      result.primary = true;
    } catch (error) {
      this.logger.error('Primary database health check failed', error);
    }

    if (this.replicaClient) {
      try {
        await this.replicaClient.$queryRaw`SELECT 1`;
        result.replica = true;

        // Optionally check replication lag (PostgreSQL specific)
        try {
          const lagResult = await this.replicaClient.$queryRaw<
            [{ lag: number }]
          >`
            SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::integer as lag
          `;
          result.replicationLag = lagResult[0]?.lag ?? undefined;
        } catch {
          // Replication lag check is optional
        }
      } catch (error) {
        this.logger.error('Replica database health check failed', error);
        result.replica = false;
      }
    }

    return result;
  }

  /**
   * Get connection pool statistics
   */
  async getPoolStats(): Promise<{
    primary: { total: number; idle: number; waiting: number };
    replica?: { total: number; idle: number; waiting: number };
  }> {
    const stats: {
      primary: { total: number; idle: number; waiting: number };
      replica?: { total: number; idle: number; waiting: number };
    } = {
      primary: {
        total: this.primaryPool.totalCount,
        idle: this.primaryPool.idleCount,
        waiting: this.primaryPool.waitingCount,
      },
    };

    if (this.replicaPool) {
      stats.replica = {
        total: this.replicaPool.totalCount,
        idle: this.replicaPool.idleCount,
        waiting: this.replicaPool.waitingCount,
      };
    }

    return stats;
  }

  private setupEventListeners(): void {
    // @ts-expect-error Prisma client event API type issue
    this.primaryClient.$on('warn', (e: { message: string }) => {
      this.logger.warn(`[Primary] ${e.message}`);
    });

    // @ts-expect-error Prisma client event API type issue
    this.primaryClient.$on('error', (e: { message: string }) => {
      this.logger.error(`[Primary] ${e.message}`);
    });

    if (this.replicaClient) {
      // @ts-expect-error Prisma client event API type issue
      this.replicaClient.$on('warn', (e: { message: string }) => {
        this.logger.warn(`[Replica] ${e.message}`);
      });

      // @ts-expect-error Prisma client event API type issue
      this.replicaClient.$on('error', (e: { message: string }) => {
        this.logger.error(`[Replica] ${e.message}`);
      });
    }
  }
}
