// ============================================================================
// EXPORT MODULE - PDF/CSV Generation Infrastructure
// ============================================================================

import { Module } from '@nestjs/common'
import { ExportService } from './export.service'

@Module({
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
