// ============================================================================
// DATABASE MODULE - Global Database Configuration
// ============================================================================
// Provides Prisma service and database utilities globally
// Includes read replica support for horizontal scaling
// ============================================================================

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaReplicaService } from './prisma-replica.service';

@Global()
@Module({
  providers: [PrismaService, PrismaReplicaService],
  exports: [PrismaService, PrismaReplicaService],
})
export class DatabaseModule {}
