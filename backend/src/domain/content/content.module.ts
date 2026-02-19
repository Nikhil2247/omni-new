// ============================================================================
// CONTENT MODULE - Content Domain
// ============================================================================

import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../core/database/database.module';

// Services
import { BlogService } from './services';

// Repositories
import { BlogPostRepository } from './repositories';

// Event Handlers
import { BlogPostEventHandler } from './events';

@Module({
  imports: [DatabaseModule],
  providers: [
    // Services
    BlogService,

    // Repositories
    BlogPostRepository,

    // Event Handlers
    BlogPostEventHandler,
  ],
  exports: [BlogService],
})
export class ContentModule {}
