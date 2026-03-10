import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { SearchModule } from '../../infrastructure/search/search.module';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import {
  ChatbotBudgetGuidanceService,
  ChatbotChecklistGuidanceService,
  ChatbotDomainService,
  ChatbotLanguageIntentService,
  ChatbotObservabilityService,
  ChatbotPersistenceService,
  ChatbotRankingService,
  ChatbotSessionContextService,
  ChatbotTimelineGuidanceService,
} from './services';

@Module({
  imports: [CatalogModule, SearchModule, CacheModule],
  providers: [
    ChatbotDomainService,
    ChatbotRankingService,
    ChatbotBudgetGuidanceService,
    ChatbotChecklistGuidanceService,
    ChatbotTimelineGuidanceService,
    ChatbotSessionContextService,
    ChatbotPersistenceService,
    ChatbotLanguageIntentService,
    ChatbotObservabilityService,
  ],
  exports: [ChatbotDomainService],
})
export class ChatbotModule {}
