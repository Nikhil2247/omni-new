// ============================================================================
// LOOKUP MODULE - Cached Reference Data Services
// ============================================================================
// Provides globally accessible lookup services with OnModuleInit initialization
// ============================================================================

import { Module, Global } from '@nestjs/common';
import { CountryLookupService } from './country-lookup.service';
import { CategoryLookupService } from './category-lookup.service';
import { RoleLookupService } from './role-lookup.service';
import { ServiceTypeLookupService } from './service-type-lookup.service';
import { EventTypeLookupService } from './event-type-lookup.service';

@Global()
@Module({
  providers: [
    CountryLookupService,
    CategoryLookupService,
    RoleLookupService,
    ServiceTypeLookupService,
    EventTypeLookupService,
  ],
  exports: [
    CountryLookupService,
    CategoryLookupService,
    RoleLookupService,
    ServiceTypeLookupService,
    EventTypeLookupService,
  ],
})
export class LookupModule {}
