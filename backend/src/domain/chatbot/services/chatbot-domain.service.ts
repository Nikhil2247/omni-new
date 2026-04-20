import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CategoryLookupService } from '../../../core/lookup/category-lookup.service';
import { CountryLookupService } from '../../../core/lookup/country-lookup.service';
import { VendorProfileService } from '../../catalog/services/vendor-profile.service';
import { VendorIndexer } from '../../../infrastructure/search/indexers/vendor.indexer';
import {
  ChatbotAction,
  ChatbotCard,
  ChatbotFilters,
  ChatbotConversationMessage,
  ChatbotRequest,
  ChatbotResponse,
  ChatbotHistoryResponse,
  ChatbotVendorSuggestion,
  FollowUpQuestion,
  VendorSearchResult,
  PlanningToolLink,
  ChatbotSessionState,
} from '../types/chatbot.types';
import { ChatbotRankingService } from './chatbot-ranking.service';
import { ChatbotBudgetGuidanceService } from './chatbot-budget-guidance.service';
import { ChatbotChecklistGuidanceService } from './chatbot-checklist-guidance.service';
import { ChatbotTimelineGuidanceService } from './chatbot-timeline-guidance.service';
import { ChatbotSessionContextService } from './chatbot-session-context.service';
import { ChatbotLanguageIntentService } from './chatbot-language-intent.service';
import { ChatbotObservabilityService } from './chatbot-observability.service';
import { ChatbotPersistenceService } from './chatbot-persistence.service';
import {
  ChatbotLlmFactoryService,
  ChatbotLlmMessage,
  ChatbotLlmProvider,
  ChatbotLlmTurnResult,
  ChatbotToolDefinition,
} from './llm';

type DeterministicIntent =
  | 'FIND_VENDOR'
  | 'BUDGET_GUIDANCE'
  | 'CHECKLIST_GUIDANCE'
  | 'TIMELINE_GUIDANCE';

interface DeterministicResponse {
  intent: DeterministicIntent;
  reply: string;
  filters: ChatbotFilters;
  vendors: ChatbotVendorSuggestion[];
  confidence: number;
}

@Injectable()
export class ChatbotDomainService implements OnModuleInit {
  private readonly logger = new Logger(ChatbotDomainService.name);
  private llmProvider: ChatbotLlmProvider | null = null;

  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY_MS = 2000;
  private readonly MAX_TOOL_CALLS_PER_RESPONSE = 5;

  private readonly systemPrompt = `You are Omnicassion's event planning assistant. Be helpful and direct.

**Tools - USE THEM:**
- searchVendors(category, city, budgetMax): Find vendors
- getBudgetGuidance(eventType, totalBudget, guestCount): Budget breakdown
- getChecklistGuidance(eventType, monthsToEvent): Planning tasks
- getTimelineGuidance(eventType, eventDate, ceremonyStartTime): Day schedule

**CRITICAL RULES:**
1. READ THE CONVERSATION HISTORY - don't ask for info already provided
2. If user mentions a vendor type (photographer, caterer, etc.) → call searchVendors
3. If user mentions budget/money → call getBudgetGuidance
4. If user mentions planning/tasks/checklist → call getChecklistGuidance
5. If user mentions timeline/schedule → call getTimelineGuidance
6. SHOW function results with specific details, not summaries
7. Make reasonable assumptions - if user says "Delhi wedding", assume category=wedding-planning OR ask which vendor type

**NEVER:**
- Ask "What type of event?" if they already said wedding/party/etc.
- Ask "Which city?" if they already mentioned a city
- Ask "What's your budget?" if they already gave a number
- Give generic responses when you have specific function data

**Response format:**
- Use markdown (headers, bullets, bold)
- Include prices, names, and actionable details
- Keep responses focused and helpful`;

  private readonly vendorSearchFunction: ChatbotToolDefinition = {
    name: 'searchVendors',
    description:
      'Search vendors by category, city, and budget using Omnicassion internal data.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query text.',
        },
        category: {
          type: 'string',
          description: 'Vendor category or service type.',
        },
        city: {
          type: 'string',
          description: 'Event city name.',
        },
        budgetMax: {
          type: 'number',
          description: 'Maximum budget in INR.',
        },
        budgetMin: {
          type: 'number',
          description: 'Minimum budget in INR.',
        },
        verifiedOnly: {
          type: 'boolean',
          description: 'Only include verified vendors when true.',
        },
      },
      required: [],
    },
  };

  private readonly budgetGuidanceFunction: ChatbotToolDefinition = {
    name: 'getBudgetGuidance',
    description:
      'Get read-only budget split guidance for an event using internal planning logic.',
    parameters: {
      type: 'object',
      properties: {
        eventType: { type: 'string', description: 'Event type, e.g. wedding.' },
        totalBudget: { type: 'number', description: 'Total budget in INR.' },
        guestCount: { type: 'number', description: 'Expected guest count.' },
      },
      required: [],
    },
  };

  private readonly checklistGuidanceFunction: ChatbotToolDefinition = {
    name: 'getChecklistGuidance',
    description:
      'Get read-only phased checklist guidance personalized by event type and timeline.',
    parameters: {
      type: 'object',
      properties: {
        eventType: { type: 'string', description: 'Event type, e.g. wedding.' },
        monthsToEvent: {
          type: 'number',
          description: 'Months left before event day.',
        },
      },
      required: [],
    },
  };

  private readonly timelineGuidanceFunction: ChatbotToolDefinition = {
    name: 'getTimelineGuidance',
    description:
      'Get read-only run-of-show timeline guidance for event day planning.',
    parameters: {
      type: 'object',
      properties: {
        eventType: { type: 'string', description: 'Event type, e.g. wedding.' },
        eventDate: { type: 'string', description: 'Event date in ISO or natural format.' },
        ceremonyStartTime: {
          type: 'string',
          description: 'Main ceremony or event start time, e.g. 18:00.',
        },
      },
      required: [],
    },
  };

  private readonly llmTools: ChatbotToolDefinition[] = [
    this.vendorSearchFunction,
    this.budgetGuidanceFunction,
    this.checklistGuidanceFunction,
    this.timelineGuidanceFunction,
  ];

  constructor(
    private readonly categoryLookupService: CategoryLookupService,
    private readonly countryLookupService: CountryLookupService,
    private readonly vendorProfileService: VendorProfileService,
    private readonly vendorIndexer: VendorIndexer,
    private readonly rankingService: ChatbotRankingService,
    private readonly budgetGuidanceService: ChatbotBudgetGuidanceService,
    private readonly checklistGuidanceService: ChatbotChecklistGuidanceService,
    private readonly timelineGuidanceService: ChatbotTimelineGuidanceService,
    private readonly sessionContextService: ChatbotSessionContextService,
    private readonly persistenceService: ChatbotPersistenceService,
    private readonly languageIntentService: ChatbotLanguageIntentService,
    private readonly observabilityService: ChatbotObservabilityService,
    private readonly llmFactoryService: ChatbotLlmFactoryService,
  ) {}

  async getUserHistory(userId: string): Promise<ChatbotHistoryResponse> {
    const persistedState = await this.persistenceService.getUserState(userId);

    return {
      userId,
      sessionId: userId,
      turns: persistedState?.turns || 0,
      language: persistedState?.language || 'en',
      filters: persistedState?.filters || {},
      messages: persistedState?.history || [],
    };
  }

  private async tryDeterministicResponse(input: {
    message: string;
    filters: ChatbotFilters;
    conversationHistory: ChatbotConversationMessage[];
  }): Promise<DeterministicResponse | null> {
    if (this.isVendorSuggestionDeclineFollowUp(input.message, input.conversationHistory)) {
      return {
        intent: 'BUDGET_GUIDANCE',
        reply:
          'No problem. We can continue with planning instead. I can next help you with a checklist, timeline, or budget optimization ideas.',
        filters: input.filters,
        vendors: [],
        confidence: 0.88,
      };
    }

    const intent = this.detectDeterministicIntent(
      input.message,
      input.conversationHistory,
    );

    if (intent === 'FIND_VENDOR') {
      const vendorArgs = this.extractVendorSearchArgs(input.message, input.filters);

      if (!vendorArgs.category && !vendorArgs.city) {
        return {
          intent,
          reply:
            'I can find great options right away. Tell me the vendor type and city, for example: "photographers in Delhi" or "caterers in Mumbai under 50K".',
          filters: input.filters,
          vendors: [],
          confidence: 0.82,
        };
      }

      if (!vendorArgs.city) {
        return {
          intent,
          reply: `Got it, looking for ${String(vendorArgs.category || 'vendors')}. Which city is your event in?`,
          filters: input.filters,
          vendors: [],
          confidence: 0.84,
        };
      }

      if (!vendorArgs.category) {
        return {
          intent,
          reply: `Great, I can search in ${String(vendorArgs.city)}. Which vendor category do you need (photography, catering, decor, venue, makeup, DJ)?`,
          filters: input.filters,
          vendors: [],
          confidence: 0.84,
        };
      }

      const searchResult = await this.executeVendorSearch(vendorArgs);
      const vendors = this.rankingService.rankVendors(searchResult.vendors).slice(0, 5);
      const filters = { ...input.filters, ...searchResult.filters };

      return {
        intent,
        reply: this.buildVendorDirectReply(vendors, filters, searchResult.hasMore),
        filters,
        vendors,
        confidence: vendors.length > 0 ? 0.92 : 0.8,
      };
    }

    if (intent === 'BUDGET_GUIDANCE') {
      const budgetContext = this.extractBudgetContext(
        input.message,
        input.filters,
        input.conversationHistory,
      );

      if (!budgetContext.totalBudget) {
        return {
          intent,
          reply:
            'Share your total budget amount in INR (for example: 5 lakhs or 250000), and I will give a full category-wise allocation with savings tips.',
          filters: {
            ...input.filters,
            eventType: budgetContext.eventType,
          },
          vendors: [],
          confidence: 0.84,
        };
      }

      const guidance = this.budgetGuidanceService.getGuidance({
        eventType: budgetContext.eventType,
        totalBudget: budgetContext.totalBudget,
        guestCount: budgetContext.guestCount,
      });

      return {
        intent,
        reply: this.buildBudgetDirectReply(guidance),
        filters: {
          ...input.filters,
          eventType: budgetContext.eventType,
          budgetMax: budgetContext.totalBudget,
        },
        vendors: [],
        confidence: 0.9,
      };
    }

    if (intent === 'CHECKLIST_GUIDANCE') {
      const eventType = this.extractEventType(
        input.message,
        input.filters,
        input.conversationHistory,
      );
      const monthsToEvent = this.extractMonthsToEvent(input.message) || 6;
      const guidance = this.checklistGuidanceService.getGuidance({
        eventType,
        monthsToEvent,
      });

      return {
        intent,
        reply: this.buildChecklistDirectReply(guidance),
        filters: {
          ...input.filters,
          eventType,
        },
        vendors: [],
        confidence: 0.88,
      };
    }

    if (intent === 'TIMELINE_GUIDANCE') {
      const eventType = this.extractEventType(
        input.message,
        input.filters,
        input.conversationHistory,
      );
      const ceremonyStartTime = this.extractTime(input.message) || '18:00';
      const eventDate = this.extractDate(input.message);
      const guidance = this.timelineGuidanceService.getGuidance({
        eventType,
        eventDate,
        ceremonyStartTime,
      });

      return {
        intent,
        reply: this.buildTimelineDirectReply(guidance),
        filters: {
          ...input.filters,
          eventType,
        },
        vendors: [],
        confidence: 0.88,
      };
    }

    return null;
  }

  private inferFiltersFromConversation(
    history: ChatbotConversationMessage[],
  ): ChatbotFilters {
    if (!history.length) {
      return {};
    }

    const recentText = history
      .slice(-12)
      .map((turn) => turn.content || '')
      .join(' ')
      .toLowerCase();

    const inferred: ChatbotFilters = {};

    const city = this.extractCityName(recentText);
    if (city) {
      const cityEntity = this.findCity(city);
      if (cityEntity) {
        inferred.cityId = cityEntity.id;
        inferred.cityName = cityEntity.name;
      }
    }

    const category = this.findCategory(recentText);
    if (category) {
      inferred.categoryId = category.id;
      inferred.categoryName = category.name;
    }

    const budget = this.extractBudgetAmount(recentText);
    if (budget) {
      inferred.budgetMax = budget;
    }

    if (recentText.includes('wedding') || recentText.includes('shaadi')) {
      inferred.eventType = 'wedding';
    } else if (recentText.includes('birthday')) {
      inferred.eventType = 'birthday';
    } else if (recentText.includes('engagement')) {
      inferred.eventType = 'engagement';
    }

    return inferred;
  }

  private detectDeterministicIntent(
    message: string,
    conversationHistory: ChatbotConversationMessage[],
  ): DeterministicIntent | null {
    const normalized = message.toLowerCase();

    if (this.isVendorSuggestionFollowUp(normalized, conversationHistory)) {
      return 'FIND_VENDOR';
    }

    if (this.isVendorSearchFlowFollowUp(normalized, conversationHistory)) {
      return 'FIND_VENDOR';
    }

    const hasVendorKeyword =
      /(photograph|cater|venue|decor|dj|makeup|florist|planner|vendor|vendors?)/i.test(normalized) ||
      /\b(find|search|show|list|suggest|recommend)\b/i.test(normalized);

    const hasBudgetKeyword =
      /(\bbudget\b|\bcost\b|\bprice\b|\bpricing\b|\bspend\b|\binr\b|\brs\.?\b|₹|\blakh\b|\blac\b|\bcrore\b)/i.test(
        normalized,
      );

    const hasChecklistKeyword = /(checklist|todo|tasks?|plan my event|planning steps)/i.test(
      normalized,
    );
    const hasTimelineKeyword = /(timeline|schedule|run of show|itinerary)/i.test(normalized);

    const hasCategorySignal = Boolean(this.findCategory(normalized));
    const hasCitySignal = Boolean(this.extractCityName(normalized));
    const hasBudgetAmount = Boolean(this.extractBudgetAmount(normalized));

    const hasExplicitVendorSearchSignal =
      hasVendorKeyword &&
      (hasCategorySignal || hasCitySignal) &&
      !hasBudgetAmount &&
      !/(\bbudget\b|\bcost\b|\bprice\b|\bpricing\b|\bspend\b)/i.test(normalized);

    if (hasExplicitVendorSearchSignal) {
      return 'FIND_VENDOR';
    }

    if (hasBudgetKeyword || hasBudgetAmount || this.isBudgetFollowUp(conversationHistory, normalized)) {
      return 'BUDGET_GUIDANCE';
    }

    if (hasChecklistKeyword) {
      return 'CHECKLIST_GUIDANCE';
    }

    if (hasTimelineKeyword) {
      return 'TIMELINE_GUIDANCE';
    }

    if (hasVendorKeyword || hasCategorySignal || hasCitySignal) {
      return 'FIND_VENDOR';
    }

    return null;
  }

  private isVendorSearchFlowFollowUp(
    message: string,
    conversationHistory: ChatbotConversationMessage[],
  ): boolean {
    const hasBudgetInput = Boolean(this.extractBudgetAmount(message));
    const hasEventTypeInput = /(wedding|shaadi|birthday|anniversary|engagement|corporate|haldi|mehendi|sangeet|reception)/i.test(
      message,
    );

    if (!hasBudgetInput && !hasEventTypeInput) {
      return false;
    }

    const recentUserTurns = conversationHistory
      .slice(-8)
      .filter((turn) => turn.role === 'user')
      .map((turn) => (turn.content || '').toLowerCase())
      .join(' ');

    const recentAssistantTurns = conversationHistory
      .slice(-8)
      .filter((turn) => turn.role === 'assistant')
      .map((turn) => (turn.content || '').toLowerCase())
      .join(' ');

    const hasVendorContext =
      /(planner|planners|vendor|vendors|photograph|cater|venue|decor|dj|makeup|florist)/i.test(
        recentUserTurns,
      ) ||
      /(planner|planners|vendor|vendors|photograph|cater|venue|decor|dj|makeup|florist)/i.test(
        recentAssistantTurns,
      );

    const assistantAskedForSlots =
      /(budget range|what'?s your budget|what is your budget|event type|budget and event type|share your budget)/i.test(
        recentAssistantTurns,
      );

    return hasVendorContext && assistantAskedForSlots;
  }

  private isVendorSuggestionFollowUp(
    message: string,
    conversationHistory: ChatbotConversationMessage[],
  ): boolean {
    if (!this.isAffirmativeMessage(message)) {
      return false;
    }

    const recentAssistantTurns = conversationHistory
      .slice(-6)
      .filter((turn) => turn.role === 'assistant')
      .map((turn) => (turn.content || '').toLowerCase())
      .join(' ');

    return (
      recentAssistantTurns.includes('would you like me to suggest vendors') ||
      recentAssistantTurns.includes('recommended allocation') ||
      recentAssistantTurns.includes('budget tier') ||
      recentAssistantTurns.includes('total budget amount in inr')
    );
  }

  private isAffirmativeMessage(message: string): boolean {
    const trimmed = message.trim().toLowerCase();
    return /^(yes|yeah|yep|sure|ok|okay|haan|han|hmm yes|please do|go ahead)$/.test(trimmed);
  }

  private isVendorSuggestionDeclineFollowUp(
    message: string,
    conversationHistory: ChatbotConversationMessage[],
  ): boolean {
    const trimmed = message.trim().toLowerCase();
    const isNegative = /^(no|nope|nah|not now|later|skip)$/i.test(trimmed);
    if (!isNegative) {
      return false;
    }

    const recentAssistantTurns = conversationHistory
      .slice(-6)
      .filter((turn) => turn.role === 'assistant')
      .map((turn) => (turn.content || '').toLowerCase())
      .join(' ');

    return recentAssistantTurns.includes('would you like me to suggest vendors');
  }

  private isBudgetFollowUp(
    conversationHistory: ChatbotConversationMessage[],
    message: string,
  ): boolean {
    const budgetOnly = Boolean(this.extractBudgetAmount(message));
    if (!budgetOnly) {
      return false;
    }

    const lastTurns = conversationHistory.slice(-6);
    return lastTurns.some((turn) =>
      /(budget|wedding budget|total budget|guest)/i.test(turn.content || ''),
    );
  }

  private extractVendorSearchArgs(
    message: string,
    existingFilters: ChatbotFilters,
  ): Record<string, unknown> {
    const city = this.extractCityName(message) || existingFilters.cityName;
    const budget = this.extractBudgetAmount(message);
    const categoryFromMessage = this.extractCategoryText(message);
    const fallbackCategory = existingFilters.categoryName || 'venues';

    const args: Record<string, unknown> = {
      query: message,
      category: categoryFromMessage || fallbackCategory,
      city,
    };

    if (budget) {
      args.budgetMax = budget;
    }

    if (/verified|trusted|top rated/i.test(message)) {
      args.verifiedOnly = true;
    }

    return args;
  }

  private extractCategoryText(message: string): string | undefined {
    const category = this.findCategory(message);
    return category?.name;
  }

  private extractCityName(message: string): string | undefined {
    const cities = this.countryLookupService.getAllCities();
    const normalized = ` ${message.toLowerCase()} `;

    for (const city of cities) {
      const cityName = city.name.toLowerCase();
      if (normalized.includes(` ${cityName} `)) {
        return city.name;
      }
    }

    return undefined;
  }

  private extractBudgetAmount(message: string): number | undefined {
    const normalized = message.toLowerCase().replace(/,/g, '');

    const lakhMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(lakh|lakhs|lac|lacs|\bl\b)/i);
    if (lakhMatch) {
      return Math.round(parseFloat(lakhMatch[1]) * 100000);
    }

    const croreMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(crore|crores|cr)\b/i);
    if (croreMatch) {
      return Math.round(parseFloat(croreMatch[1]) * 10000000);
    }

    const thousandMatch = normalized.match(/(\d+(?:\.\d+)?)\s*k\b/i);
    if (thousandMatch) {
      return Math.round(parseFloat(thousandMatch[1]) * 1000);
    }

    const plainNumberMatch = normalized.match(/(?:₹|rs\.?|inr)?\s*(\d{4,8})\b/i);
    if (plainNumberMatch) {
      return Number(plainNumberMatch[1]);
    }

    return undefined;
  }

  private extractGuestCount(message: string): number | undefined {
    const guestMatch = message.match(/(\d{2,4})\s*(guests?|people|pax|members)/i);
    if (guestMatch) {
      return Number(guestMatch[1]);
    }

    return undefined;
  }

  private extractMonthsToEvent(message: string): number | undefined {
    const monthsMatch = message.match(/(\d{1,2})\s*(month|months|mnth|mnths)/i);
    if (monthsMatch) {
      return Number(monthsMatch[1]);
    }

    return undefined;
  }

  private extractTime(message: string): string | undefined {
    const time24 = message.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
    if (time24) {
      return `${time24[1].padStart(2, '0')}:${time24[2]}`;
    }

    const time12 = message.match(/\b(1[0-2]|0?[1-9])\s*(am|pm)\b/i);
    if (time12) {
      const hour = Number(time12[1]);
      const suffix = time12[2].toLowerCase();
      const hours24 = suffix === 'pm' ? (hour % 12) + 12 : hour % 12;
      return `${String(hours24).padStart(2, '0')}:00`;
    }

    return undefined;
  }

  private extractDate(message: string): string | undefined {
    const dateMatch = message.match(/\b\d{4}-\d{2}-\d{2}\b/);
    if (dateMatch) {
      return dateMatch[0];
    }

    return undefined;
  }

  private extractEventType(
    message: string,
    filters: ChatbotFilters,
    history: ChatbotConversationMessage[],
  ): string {
    const combined = `${history
      .slice(-6)
      .map((item) => item.content || '')
      .join(' ')} ${message}`.toLowerCase();

    if (combined.includes('wedding') || combined.includes('shaadi')) {
      return 'wedding';
    }

    if (combined.includes('birthday')) {
      return 'birthday';
    }

    if (combined.includes('engagement')) {
      return 'engagement';
    }

    return filters.eventType || 'wedding';
  }

  private extractBudgetContext(
    message: string,
    filters: ChatbotFilters,
    history: ChatbotConversationMessage[],
  ): {
    totalBudget?: number;
    guestCount?: number;
    eventType: string;
  } {
    const totalBudget =
      this.extractBudgetAmount(message) ||
      this.extractBudgetAmount(
        history
          .slice(-8)
          .map((item) => item.content || '')
          .join(' '),
      );

    const guestCount =
      this.extractGuestCount(message) ||
      this.extractGuestCount(
        history
          .slice(-8)
          .map((item) => item.content || '')
          .join(' '),
      ) ||
      100;

    const eventType = this.extractEventType(message, filters, history);

    return {
      totalBudget,
      guestCount,
      eventType,
    };
  }

  private buildVendorDirectReply(
    vendors: ChatbotVendorSuggestion[],
    filters: ChatbotFilters,
    hasMore: boolean,
  ): string {
    if (!vendors.length) {
      const categoryHint = filters.categoryName || 'vendors';
      const cityHint = filters.cityName ? ` in ${filters.cityName}` : '';
      return `I couldn't find strong matches for ${categoryHint}${cityHint} right now. Try adding a budget range or asking for verified vendors only.`;
    }

    const header = `Here are top ${filters.categoryName || 'vendor'} options${
      filters.cityName ? ` in ${filters.cityName}` : ''
    }:`;

    const lines = vendors.slice(0, 5).map((vendor, idx) => {
      const price = this.formatPriceRange(vendor.minPrice, vendor.maxPrice);
      const city = vendor.city ? ` | ${vendor.city}` : '';
      const verified = vendor.isVerified ? ' | Verified' : '';
      const recommendation = vendor.recommendationLabel
        ? `\n   - Recommendation: ${vendor.recommendationLabel.toUpperCase()} (${vendor.recommendationScore || 0}/100)`
        : '';
      return `${idx + 1}. **${vendor.businessName}**${city}${verified}\n   - Category: ${vendor.categoryName || 'Vendor'}\n   - Price: ${price}${recommendation}`;
    });

    const moreLine = hasMore ? '\nMore options are available. Ask me to show more or add budget/verified filters.' : '';

    return `${header}\n\n${lines.join('\n\n')}${moreLine}`;
  }

  private buildBudgetDirectReply(guidance: ReturnType<ChatbotBudgetGuidanceService['getGuidance']>): string {
    const topAllocations = guidance.allocations
      .slice(0, 6)
      .map(
        (item) =>
          `- **${item.category}**: ${this.formatCurrencyInr(item.amount)} (${item.percentage}%)`,
      )
      .join('\n');

    const tips = guidance.tips.slice(0, 3).map((tip) => `- ${tip}`).join('\n');
    const warnings = guidance.warnings.slice(0, 2).map((warning) => `- ${warning}`).join('\n');

    return [
      guidance.summary,
      '',
      `Per guest cost: **${this.formatCurrencyInr(guidance.analysis.perGuestCost)}**`,
      `Budget tier: **${guidance.analysis.budgetTier}** (${guidance.analysis.tierDescription})`,
      '',
      '**Recommended allocation:**',
      topAllocations,
      '',
      '**Top savings tips:**',
      tips || '- Keep a 5-10% contingency buffer for last-minute costs.',
      warnings ? '' : '',
      warnings ? '**Watchouts:**' : '',
      warnings,
      '',
      'Would you like me to suggest vendors that fit this budget? Reply with "yes" and optionally mention city/category (for example: "yes, Delhi photographers").',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private buildChecklistDirectReply(
    guidance: ReturnType<ChatbotChecklistGuidanceService['getGuidance']>,
  ): string {
    const immediate = guidance.immediateActions
      .slice(0, 5)
      .map((item) => `- ${item}`)
      .join('\n');

    const firstPhase = guidance.phases[0];
    const firstPhaseTasks = (firstPhase?.tasks || [])
      .slice(0, 5)
      .map((task) => `- ${task.task} (${task.priority})`)
      .join('\n');

    return [
      guidance.summary,
      '',
      `Urgency: **${guidance.analysis.urgencyLevel}** (${guidance.analysis.urgencyDescription})`,
      '',
      '**Immediate actions:**',
      immediate,
      '',
      firstPhase ? `**Current phase: ${firstPhase.title}**` : '',
      firstPhaseTasks,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private buildTimelineDirectReply(
    guidance: ReturnType<ChatbotTimelineGuidanceService['getGuidance']>,
  ): string {
    const timelineLines = guidance.timeline
      .slice(0, 8)
      .map((item) => `- **${item.time}**: ${item.activity}`)
      .join('\n');

    const notes = guidance.notes.slice(0, 3).map((note) => `- ${note}`).join('\n');

    return [
      guidance.summary,
      '',
      '**Recommended timeline:**',
      timelineLines,
      '',
      '**Execution notes:**',
      notes,
    ].join('\n');
  }

  private formatCurrencyInr(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.max(0, amount || 0));
  }

  private mapIntentFromTool(toolName: string | null, vendorsFound: number): string {
    if (toolName === 'searchVendors' || vendorsFound > 0) {
      return 'FIND_VENDOR';
    }

    if (toolName === 'getBudgetGuidance') {
      return 'BUDGET_GUIDANCE';
    }

    if (toolName === 'getChecklistGuidance') {
      return 'CHECKLIST_GUIDANCE';
    }

    if (toolName === 'getTimelineGuidance') {
      return 'TIMELINE_GUIDANCE';
    }

    return 'GENERAL';
  }

  private generateSuggestionsForIntent(
    intent: string,
    filters: ChatbotFilters,
    vendorsFound: number,
  ): string[] {
    if (intent === 'BUDGET_GUIDANCE') {
      return [
        'Yes, suggest vendors for this budget',
        'Suggest vendors in Delhi for this budget',
        'Wedding budget for 200 guests',
        'Cut costs by 15%',
        'Create planning checklist',
      ];
    }

    if (intent === 'CHECKLIST_GUIDANCE') {
      return [
        'Checklist for 6 months wedding plan',
        'What should I do this week?',
        'Build event timeline',
        'Find photographers in Delhi',
      ];
    }

    if (intent === 'TIMELINE_GUIDANCE') {
      return [
        'Timeline for wedding at 7 PM',
        'Vendor arrival schedule',
        'Add buffer for ceremonies',
        'Create task checklist',
      ];
    }

    return this.generateSuggestions(filters, vendorsFound);
  }

  private async maybeEnhanceReplyWithLlm(
    baseReply: string,
    intent: string,
    filters: ChatbotFilters,
    conversationHistory: ChatbotConversationMessage[],
  ): Promise<{ reply: string; refined: boolean; provider: string }> {
    if (!this.llmProvider) {
      return { reply: baseReply, refined: false, provider: 'none' };
    }

    try {
      const chat = await this.llmProvider.startChat({
        systemPrompt:
          'You are a response-refinement assistant. Keep all facts and numbers unchanged. Improve clarity and structure only. Keep concise and practical. If intent is budget guidance, end with a helpful vendor-suggestion follow-up question.',
        tools: [],
        history: this.buildHistory(conversationHistory.slice(-8)),
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 700,
        },
      });

      const result = await this.retryWithBackoff<ChatbotLlmTurnResult>(
        () =>
          chat.sendUserMessage(
            [
              `Intent: ${intent}`,
              `Filters: ${JSON.stringify(filters)}`,
              'Draft reply:',
              baseReply,
            ].join('\n\n'),
          ),
        'deterministic-llm-enhancement',
      );

      const candidate = (result.text || '').trim();
      return {
        reply: candidate || baseReply,
        refined: Boolean(candidate),
        provider: this.llmProvider.name,
      };
    } catch (error) {
      this.logger.warn(`LLM refinement skipped due to error: ${error}`);
      return {
        reply: baseReply,
        refined: false,
        provider: this.llmProvider?.name || 'none',
      };
    }
  }

  async onModuleInit(): Promise<void> {
    this.llmProvider = await this.llmFactoryService.initializePreferredProvider();

    if (!this.llmProvider) {
      this.logger.warn('No active LLM provider. Domain chatbot will use fallback responses.');
      return;
    }

    this.logger.log(`Domain chatbot initialized with ${this.llmProvider.name}`);
  }

  async respond(input: ChatbotRequest): Promise<ChatbotResponse> {
    const startTime = Date.now();
    const message = (input.message || '').trim();
    const sessionId = input.userId || input.sessionId;
    let conversationId = input.conversationId;

    if (input.resetSession && sessionId) {
      await this.sessionContextService.reset(sessionId);
    }

    const sessionState = await this.sessionContextService.get(sessionId);

    // If conversationId provided, load that specific conversation
    let persistedState: ChatbotSessionState | (ChatbotSessionState & { id: string; title: string }) | null = null;
    if (input.userId && conversationId) {
      persistedState = await this.persistenceService.getConversation(conversationId, input.userId);
    } else if (input.userId) {
      persistedState = await this.persistenceService.getUserState(input.userId);
    }

    const baseState = sessionState || persistedState;
    const normalized = this.languageIntentService.normalizeMessage(message);

    const mergedFilters: ChatbotFilters = {
      ...(baseState?.filters || {}),
      ...(input.context || {}),
    };

    const mergedConversationHistory = [
      ...(baseState?.history || []),
      ...(input.conversationHistory || []),
    ].slice(-20);

    const inferredHistoryFilters = this.inferFiltersFromConversation(
      mergedConversationHistory,
    );

    const contextualFilters: ChatbotFilters = {
      ...mergedFilters,
      ...inferredHistoryFilters,
      ...(input.context || {}),
    };

    const detectedLanguage = normalized.detectedLanguage;
    const previousTurns = baseState?.turns || 0;

    if (!message) {
      const welcome = this.buildWelcomeResponse(
        startTime,
        detectedLanguage,
        input.userId,
        sessionId,
        previousTurns,
        conversationId,
      );

      this.logRouteTrace(welcome.intent, welcome.meta.route, welcome.meta.provider, welcome.meta.responseTime);
      return welcome;
    }

    const deterministic = await this.tryDeterministicResponse({
      message: normalized.normalizedMessage,
      filters: contextualFilters,
      conversationHistory: mergedConversationHistory,
    });

    if (deterministic) {
      const enhancement = await this.maybeEnhanceReplyWithLlm(
        deterministic.reply,
        deterministic.intent,
        deterministic.filters,
        mergedConversationHistory,
      );
      const deterministicReply = enhancement.reply;

      const suggestions = this.generateSuggestionsForIntent(
        deterministic.intent,
        deterministic.filters,
        deterministic.vendors.length,
      );
      const followUpQuestions = this.generateFollowUpQuestions(
        deterministic.filters,
        deterministic.vendors.length,
        mergedConversationHistory,
        deterministic.intent,
      );
      const cards = this.generateCards(deterministic.vendors, deterministic.intent);
      const actions = this.generateActions(
        deterministic.filters,
        deterministic.vendors.length,
        deterministic.intent,
      );
      const planningTools = this.generatePlanningToolLinks();
      const vendorCategories = this.generateVendorCategories();

      const responsePayload: ChatbotResponse = {
        reply: deterministicReply,
        intent: deterministic.intent,
        language: detectedLanguage,
        confidence: deterministic.confidence,
        suggestions,
        actions,
        cards,
        vendors: deterministic.vendors,
        followUpQuestions,
        filters: deterministic.filters,
        planningTools,
        vendorCategories,
        session: {
          userId: input.userId,
          sessionId,
          conversationId,
          turns: previousTurns + 1,
        },
        meta: {
          responseTime: Date.now() - startTime,
          vendorsFound: deterministic.vendors.length,
          hasMoreResults: deterministic.vendors.length >= 5,
          route: enhancement.refined
            ? 'deterministic+llm-refine'
            : 'deterministic',
          provider: enhancement.provider,
        },
      };

      const newConversationId = await this.persistSessionState(
        sessionId,
        input.userId,
        conversationId,
        deterministic.filters,
        mergedConversationHistory,
        detectedLanguage,
        message,
        deterministicReply,
        message.slice(0, 50),
      );

      if (newConversationId) {
        responsePayload.session.conversationId = newConversationId;
      }

      this.emitInteraction(
        sessionId,
        deterministic.intent,
        detectedLanguage,
        deterministic.confidence,
        responsePayload.meta.vendorsFound,
        responsePayload.meta.responseTime,
      );

      this.logRouteTrace(
        responsePayload.intent,
        responsePayload.meta.route,
        responsePayload.meta.provider,
        responsePayload.meta.responseTime,
      );

      return responsePayload;
    }

    if (!this.llmProvider) {
      const fallback = this.buildFallbackResponse(
        message,
        startTime,
        detectedLanguage,
        contextualFilters,
        input.userId,
        sessionId,
        previousTurns,
        conversationId,
      );

      const newConversationId = await this.persistSessionState(
        sessionId,
        input.userId,
        conversationId,
        contextualFilters,
        mergedConversationHistory,
        detectedLanguage,
        message,
        fallback.reply,
        message.slice(0, 50),
      );

      if (newConversationId) {
        fallback.session.conversationId = newConversationId;
      }

      this.emitInteraction(
        sessionId,
        fallback.intent,
        detectedLanguage,
        fallback.confidence,
        fallback.meta.vendorsFound,
        fallback.meta.responseTime,
      );

      this.logRouteTrace(
        fallback.intent,
        fallback.meta.route,
        fallback.meta.provider,
        fallback.meta.responseTime,
      );

      return fallback;
    }

    try {
      const history = this.buildHistory(mergedConversationHistory);
      const chat = await this.llmProvider.startChat({
        systemPrompt: this.systemPrompt,
        tools: this.llmTools,
        history,
        generationConfig: {
          temperature: 0.5,
          topP: 0.9,
          maxOutputTokens: 1024,
        },
      });

      let result = await this.retryWithBackoff<ChatbotLlmTurnResult>(
        () => chat.sendUserMessage(normalized.normalizedMessage),
        'initial-message',
      );
      let vendors: ChatbotVendorSuggestion[] = [];
      let filters: ChatbotFilters = { ...contextualFilters };
      let resolvedToolName: string | null = null;
      let toolCallCount = 0;

      while (result.toolCall?.name) {
        if (toolCallCount >= this.MAX_TOOL_CALLS_PER_RESPONSE) {
          this.logger.warn(
            `LLM tool-call loop limit reached (${this.MAX_TOOL_CALLS_PER_RESPONSE}). Returning best available response.`,
          );
          break;
        }

        toolCallCount += 1;
        const functionCall = result.toolCall;
        resolvedToolName = functionCall.name;

        if (functionCall.name === 'searchVendors') {
          const args = functionCall.args as Record<string, any>;
          const searchResult = await this.executeVendorSearch(args);

          vendors = this.rankingService.rankVendors(searchResult.vendors).slice(0, 5);
          filters = { ...filters, ...searchResult.filters };

          result = await this.retryWithBackoff<ChatbotLlmTurnResult>(
            () =>
              chat.sendToolResult({
                name: 'searchVendors',
                result: {
                  vendors: vendors.map((vendor) => ({
                    name: vendor.businessName,
                    category: vendor.categoryName,
                    city: vendor.city,
                    priceRange: this.formatPriceRange(vendor.minPrice, vendor.maxPrice),
                    verified: vendor.isVerified,
                    url: vendor.profileUrl,
                  })),
                  totalFound: vendors.length,
                  hasMore: searchResult.hasMore,
                },
              }),
            'searchVendors-response',
          );
        } else if (functionCall.name === 'getBudgetGuidance') {
          const args = functionCall.args as Record<string, any>;
          const guidance = this.budgetGuidanceService.getGuidance({
            eventType: args.eventType,
            totalBudget: args.totalBudget,
            guestCount: args.guestCount,
          });

          result = await this.retryWithBackoff<ChatbotLlmTurnResult>(
            () =>
              chat.sendToolResult({
                name: 'getBudgetGuidance',
                result: guidance,
              }),
            'getBudgetGuidance-response',
          );
        } else if (functionCall.name === 'getChecklistGuidance') {
          const args = functionCall.args as Record<string, any>;
          const guidance = this.checklistGuidanceService.getGuidance({
            eventType: args.eventType,
            monthsToEvent: args.monthsToEvent,
          });

          result = await this.retryWithBackoff<ChatbotLlmTurnResult>(
            () =>
              chat.sendToolResult({
                name: 'getChecklistGuidance',
                result: guidance,
              }),
            'getChecklistGuidance-response',
          );
        } else if (functionCall.name === 'getTimelineGuidance') {
          const args = functionCall.args as Record<string, any>;
          const guidance = this.timelineGuidanceService.getGuidance({
            eventType: args.eventType,
            eventDate: args.eventDate,
            ceremonyStartTime: args.ceremonyStartTime,
          });

          result = await this.retryWithBackoff<ChatbotLlmTurnResult>(
            () =>
              chat.sendToolResult({
                name: 'getTimelineGuidance',
                result: guidance,
              }),
            'getTimelineGuidance-response',
          );
        } else {
          break;
        }
      }

      const textResponse =
        result.text ||
        "I'm here to help with vendor discovery and event planning. What do you need?";

      const intent = this.mapIntentFromTool(resolvedToolName, vendors.length);
      const suggestions = this.generateSuggestionsForIntent(intent, filters, vendors.length);
      const followUpQuestions = this.generateFollowUpQuestions(
        filters,
        vendors.length,
        mergedConversationHistory,
        intent,
      );
      const cards = this.generateCards(vendors, intent);
      const actions = this.generateActions(filters, vendors.length, intent);
      const confidence = this.estimateConfidence(intent, vendors.length, followUpQuestions.length);
      const planningTools = this.generatePlanningToolLinks();
      const vendorCategories = this.generateVendorCategories();

      const responsePayload: ChatbotResponse = {
        reply: textResponse,
        intent,
        language: detectedLanguage,
        confidence,
        suggestions,
        actions,
        cards,
        vendors,
        followUpQuestions,
        filters,
        planningTools,
        vendorCategories,
        session: {
          userId: input.userId,
          sessionId,
          conversationId,
          turns: previousTurns + 1,
        },
        meta: {
          responseTime: Date.now() - startTime,
          vendorsFound: vendors.length,
          hasMoreResults: vendors.length >= 5,
          route: 'llm-tools',
          provider: this.llmProvider?.name || 'none',
        },
      };

      const newConversationId = await this.persistSessionState(
        sessionId,
        input.userId,
        conversationId,
        filters,
        mergedConversationHistory,
        detectedLanguage,
        message,
        textResponse,
        message.slice(0, 50),
      );

      if (newConversationId) {
        responsePayload.session.conversationId = newConversationId;
      }

      this.emitInteraction(
        sessionId,
        intent,
        detectedLanguage,
        confidence,
        responsePayload.meta.vendorsFound,
        responsePayload.meta.responseTime,
      );

      this.logRouteTrace(
        responsePayload.intent,
        responsePayload.meta.route,
        responsePayload.meta.provider,
        responsePayload.meta.responseTime,
      );

      return responsePayload;
    } catch (error) {
      this.logger.error(`Domain chatbot respond failed: ${error}`);
      const fallback = this.buildFallbackResponse(
        message,
        startTime,
        detectedLanguage,
        contextualFilters,
        input.userId,
        sessionId,
        previousTurns,
        conversationId,
      );

      const newConversationId = await this.persistSessionState(
        sessionId,
        input.userId,
        conversationId,
        contextualFilters,
        mergedConversationHistory,
        detectedLanguage,
        message,
        fallback.reply,
        message.slice(0, 50),
      );

      if (newConversationId) {
        fallback.session.conversationId = newConversationId;
      }

      this.emitInteraction(
        sessionId,
        fallback.intent,
        detectedLanguage,
        fallback.confidence,
        fallback.meta.vendorsFound,
        fallback.meta.responseTime,
      );

      this.logRouteTrace(
        fallback.intent,
        fallback.meta.route,
        fallback.meta.provider,
        fallback.meta.responseTime,
      );

      return fallback;
    }
  }

  private buildHistory(
    conversationHistory: ChatbotConversationMessage[],
  ): ChatbotLlmMessage[] {
    return conversationHistory
      .filter((message) => message.content && message.content.trim())
      .map((message) => ({
        role: message.role,
        content: message.content,
      }));
  }

  /**
   * Retry a function with exponential backoff for rate limit errors
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    context: string,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        const errorMessage = error?.message || String(error);

        // Check if it's a rate limit error (429)
        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate')) {
          // Extract retry delay from error if available, otherwise use exponential backoff
          const retryMatch = errorMessage.match(/retry in (\d+(?:\.\d+)?)/i);
          const suggestedDelay = retryMatch ? parseFloat(retryMatch[1]) * 1000 : null;
          const backoffDelay = suggestedDelay || this.INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt);

          this.logger.warn(
            `[${context}] Rate limited (attempt ${attempt + 1}/${this.MAX_RETRIES}), retrying in ${Math.round(backoffDelay)}ms`,
          );

          await this.sleep(backoffDelay);
          continue;
        }

        // For non-rate-limit errors, don't retry
        throw error;
      }
    }

    throw lastError || new Error(`Failed after ${this.MAX_RETRIES} retries`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async executeVendorSearch(args: Record<string, any>): Promise<VendorSearchResult> {
    const filters: ChatbotFilters = {};

    let categoryId: string | undefined;
    if (args.category) {
      const category = this.findCategory(args.category);
      if (category) {
        categoryId = category.id;
        filters.categoryId = category.id;
        filters.categoryName = category.name;
      }
    }

    let cityId: string | undefined;
    if (args.city) {
      const city = this.findCity(args.city);
      if (city) {
        cityId = city.id;
        filters.cityId = city.id;
        filters.cityName = city.name;
      }
    }

    if (args.budgetMin) {
      filters.budgetMin = args.budgetMin;
    }

    if (args.budgetMax) {
      filters.budgetMax = args.budgetMax;
    }

    try {
      const searchResult = await this.vendorIndexer.searchVendors(args.query || '', {
        categoryId,
        city: args.city,
        priceMin: args.budgetMin,
        priceMax: args.budgetMax,
        isVerified: args.verifiedOnly,
        hitsPerPage: 8,
        sortBy: 'viewCount',
        sortOrder: 'desc',
      });

      const indexedVendors = searchResult.hits.map((hit) => ({
        id: hit.id,
        slug: hit.slug,
        businessName: hit.businessName,
        tagline: hit.tagline,
        categoryName: hit.categoryName as string | undefined,
        city: hit.city,
        minPrice: hit.minPrice,
        maxPrice: hit.maxPrice,
        isVerified: hit.isVerified as boolean | undefined,
        profileImageUrl: (hit.profilePhotoUrl as string | undefined) || undefined,
        planTier: hit.planTier as string | undefined,
        searchBoost: hit.searchBoost as number | undefined,
        isProfileBoosted: hit.isProfileBoosted as boolean | undefined,
        hasProBadge: hit.hasProBadge as boolean | undefined,
        hasPremiumBadge: hit.hasPremiumBadge as boolean | undefined,
        profileUrl: `/vendors/${hit.slug}`,
      }));

      const vendors = await this.populateMissingVendorMedia(indexedVendors);

      return {
        vendors,
        filters,
        hasMore: searchResult.hits.length > 5,
      };
    } catch (error) {
      this.logger.warn(`Search index lookup failed, falling back to DB: ${error}`);

      try {
        const fallback = await this.vendorProfileService.search({
          query: args.query,
          categoryId,
          cityId,
          page: 1,
          limit: 8,
          sortBy: 'viewCount',
          sortOrder: 'desc',
        });

        const vendors = fallback.data.map((vendor) => ({
          id: vendor.id,
          slug: vendor.slug,
          businessName: vendor.businessName,
          tagline: vendor.tagline || undefined,
          categoryName: (vendor as any).category?.name,
          city: (vendor as any).address?.city?.name,
          isVerified: Boolean((vendor as any).verifiedAt),
          profileImageUrl: (vendor as any).profilePhotoUrl || (vendor as any).bannerImageUrl || undefined,
          planTier: (vendor as any).planTier || undefined,
          searchBoost: (vendor as any).searchBoost ?? undefined,
          isProfileBoosted: Boolean((vendor as any).isProfileBoosted),
          hasProBadge: Boolean((vendor as any).hasProBadge),
          hasPremiumBadge: Boolean((vendor as any).hasPremiumBadge),
          profileUrl: `/vendors/${vendor.slug}`,
        }));

        return {
          vendors,
          filters,
          hasMore: fallback.data.length > 5,
        };
      } catch {
        return { vendors: [], filters, hasMore: false };
      }
    }
  }

  private async populateMissingVendorMedia(
    vendors: ChatbotVendorSuggestion[],
  ): Promise<ChatbotVendorSuggestion[]> {
    const missingIds = vendors
      .filter((vendor) => !vendor.profileImageUrl)
      .map((vendor) => vendor.id);

    if (!missingIds.length) {
      return vendors;
    }

    const mediaByVendorId = new Map<string, string>();

    await Promise.all(
      missingIds.map(async (vendorId) => {
        try {
          const vendorProfile = await this.vendorProfileService.findById(vendorId, false);
          const mediaUrl =
            (vendorProfile as any).profilePhotoUrl ||
            (vendorProfile as any).bannerImageUrl ||
            undefined;

          if (mediaUrl) {
            mediaByVendorId.set(vendorId, mediaUrl);
          }
        } catch {
          // Best-effort enrichment only; leave image empty if lookup fails.
        }
      }),
    );

    return vendors.map((vendor) => ({
      ...vendor,
      profileImageUrl: vendor.profileImageUrl || mediaByVendorId.get(vendor.id),
    }));
  }

  private findCategory(name: string): { id: string; name: string } | null {
    const categories = this.categoryLookupService.getAllCategories();
    const normalized = name.toLowerCase();

    const aliases: Record<string, string[]> = {
      photography: ['photographer', 'photographers', 'photo', 'photos'],
      videography: ['videographer', 'videographers', 'video'],
      catering: ['caterer', 'caterers', 'food', 'chef'],
      venues: ['venue', 'hall', 'banquet', 'resort'],
      florists: ['florist', 'flowers', 'floral'],
      'makeup-hair': ['makeup', 'hair', 'mua', 'stylist'],
      decor: ['decorator', 'decorators', 'decoration', 'theme'],
      'dj-music': ['dj', 'music', 'band', 'entertainment'],
      'wedding-planning': ['planner', 'planners', 'coordinator'],
      invitations: ['invitation', 'cards', 'invite'],
      cakes: ['cake', 'bakery', 'dessert'],
      rentals: ['rental', 'rent', 'furniture', 'tent'],
    };

    for (const category of categories) {
      if (
        category.name.toLowerCase() === normalized ||
        category.slug === normalized ||
        normalized.includes(category.slug)
      ) {
        return { id: category.id, name: category.name };
      }

      const categoryAliases = aliases[category.slug] || [];
      if (categoryAliases.some((alias) => normalized.includes(alias))) {
        return { id: category.id, name: category.name };
      }
    }

    return null;
  }

  private findCity(name: string): { id: string; name: string } | null {
    const cities = this.countryLookupService.getAllCities();
    const normalized = name.toLowerCase();

    for (const city of cities) {
      if (city.name.toLowerCase() === normalized) {
        return { id: city.id, name: city.name };
      }
    }

    return null;
  }

  private formatPriceRange(min?: number, max?: number): string {
    const format = (value: number) => {
      if (value >= 100000) {
        return `INR ${(value / 100000).toFixed(1)}L`;
      }

      if (value >= 1000) {
        return `INR ${(value / 1000).toFixed(0)}K`;
      }

      return `INR ${value}`;
    };

    if (min && max) {
      return `${format(min)} - ${format(max)}`;
    }

    if (max) {
      return `Up to ${format(max)}`;
    }

    if (min) {
      return `From ${format(min)}`;
    }

    return 'Contact for price';
  }

  private generateSuggestions(filters: ChatbotFilters, vendorsFound: number): string[] {
    const suggestions: string[] = [];

    if (vendorsFound > 0) {
      suggestions.push('Show me more options');
      suggestions.push('Only verified vendors');

      if (!filters.budgetMax) {
        suggestions.push('Filter by budget');
      }

      if (!filters.cityName) {
        suggestions.push('Search in specific city');
      }
    } else {
      suggestions.push('Wedding photographers');
      suggestions.push('Caterers in Mumbai');
      suggestions.push('Decorators under 50K');
      suggestions.push('Premium venues');
    }

    return suggestions.slice(0, 4);
  }

  private generateActions(
    filters: ChatbotFilters,
    vendorsFound: number,
    intent: string,
  ): ChatbotAction[] {
    const actions: ChatbotAction[] = [];

    if (intent === 'FIND_VENDOR' && vendorsFound > 0) {
      actions.push({
        id: 'compare-vendors',
        label: 'Compare Top Vendors',
        type: 'compare',
      });

      if (!filters.budgetMax) {
        actions.push({
          id: 'add-budget-filter',
          label: 'Add Budget Filter',
          type: 'filter',
        });
      }
    }

    actions.push({
      id: 'build-checklist',
      label: 'Build Planning Checklist',
      type: 'plan',
    });

    return actions.slice(0, 3);
  }

  private generateCards(vendors: ChatbotVendorSuggestion[], intent: string): ChatbotCard[] {
    if (intent === 'FIND_VENDOR' && vendors.length > 0) {
      return vendors.slice(0, 3).map((vendor) => ({
        id: vendor.id,
        type: 'vendor',
        title: vendor.businessName,
        subtitle: `${vendor.categoryName || 'Vendor'}${vendor.city ? ` | ${vendor.city}` : ''}`,
        description:
          vendor.tagline ||
          (vendor.recommendationLabel
            ? `AI match: ${vendor.recommendationLabel.toUpperCase()} (${vendor.recommendationScore || 0}/100)`
            : undefined),
        imageUrl: vendor.profileImageUrl,
        ctaLabel: 'View Profile',
        ctaUrl: vendor.profileUrl,
      }));
    }

    return [
      {
        id: 'planning-budget-card',
        type: 'planning',
        title: 'Budget Planner',
        subtitle: 'Smart split by event type',
        description: 'Get category-wise budget recommendations and contingency guidance.',
        ctaLabel: 'Plan Budget',
        ctaUrl: '/dashboard/budget',
      },
      {
        id: 'planning-timeline-card',
        type: 'planning',
        title: 'Event Timeline',
        subtitle: 'Run-of-show guidance',
        description: 'Generate a practical timeline with milestone ownership.',
        ctaLabel: 'Build Timeline',
        ctaUrl: '/dashboard/timeline',
      },
    ];
  }

  private generatePlanningToolLinks(): PlanningToolLink[] {
    return [
      {
        id: 'budget-tracker',
        label: 'Budget Tracker',
        description: 'Track expenses and manage your event budget',
        url: '/dashboard/budget',
        icon: 'budget',
      },
      {
        id: 'planning-checklist',
        label: 'Planning Checklist',
        description: 'Stay organized with a personalized task list',
        url: '/dashboard/checklist',
        icon: 'checklist',
      },
      {
        id: 'guest-list',
        label: 'Guest List Manager',
        description: 'Manage invitations and track RSVPs',
        url: '/dashboard/guestlist',
        icon: 'guestlist',
      },
      {
        id: 'event-timeline',
        label: 'Event Timeline',
        description: 'Plan your event day schedule',
        url: '/dashboard/timeline',
        icon: 'timeline',
      },
      {
        id: 'browse-vendors',
        label: 'Browse All Vendors',
        description: 'Discover and compare event vendors',
        url: '/vendors',
        icon: 'vendors',
      },
    ];
  }

  private generateVendorCategories(): Array<{ id: string; name: string; slug: string; url: string }> {
    const categories = this.categoryLookupService.getAllCategories();

    return categories.slice(0, 8).map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      url: `/vendors?category=${category.slug}`,
    }));
  }

  private estimateConfidence(
    intent: string,
    vendorsFound: number,
    followUpCount: number,
  ): number {
    if (intent === 'FIND_VENDOR' && vendorsFound > 0) {
      return 0.9;
    }

    if (followUpCount > 0) {
      return 0.76;
    }

    return 0.82;
  }

  private generateFollowUpQuestions(
    filters: ChatbotFilters,
    vendorsFound: number,
    conversationHistory: ChatbotConversationMessage[] = [],
    intent: string = 'GENERAL',
  ): FollowUpQuestion[] {
    if (vendorsFound > 0) {
      return [];
    }

    const questions: FollowUpQuestion[] = [];

    if (intent === 'FIND_VENDOR') {
      if (!filters.categoryName) {
        questions.push({
          id: 'category',
          text: 'What type of vendor do you need?',
          type: 'category',
        });
      }

      if (!filters.cityName) {
        questions.push({
          id: 'location',
          text: 'Which city is your event in?',
          type: 'location',
        });
      }

      if (!filters.budgetMax && !filters.budgetMin && filters.categoryName && filters.cityName) {
        questions.push({
          id: 'budget',
          text: 'Do you have a target budget range for better matches?',
          type: 'budget',
        });
      }

      return questions.slice(0, 2);
    }

    if (intent === 'BUDGET_GUIDANCE') {
      if (!filters.eventType) {
        questions.push({
          id: 'eventType',
          text: 'What type of event are you planning?',
          type: 'eventType',
        });
      }

      if (!filters.budgetMax && !filters.budgetMin) {
        questions.push({
          id: 'budget',
          text: 'What is your total budget in INR?',
          type: 'budget',
        });
      }

      return questions.slice(0, 2);
    }

    // For general responses, avoid noisy follow-ups once conversation is already established.
    if (conversationHistory.length >= 4) {
      return [];
    }

    if (!filters.categoryName) {
      questions.push({
        id: 'category',
        text: 'What type of vendor do you need?',
        type: 'category',
      });
    }

    if (!filters.cityName) {
      questions.push({
        id: 'location',
        text: 'Which city is your event in?',
        type: 'location',
      });
    }

    return questions.slice(0, 2);
  }

  private buildWelcomeResponse(
    startTime: number,
    language: 'en' | 'hi' | 'hinglish',
    userId?: string,
    sessionId?: string,
    previousTurns: number = 0,
    conversationId?: string,
  ): ChatbotResponse {
    return {
      reply:
        "Hi! I'm your event planning assistant. Tell me what you're planning and I'll help you find vendors, create budgets, and build checklists.",
      intent: 'WELCOME',
      language,
      confidence: 0.95,
      suggestions: [
        'Find photographers in Delhi',
        'Wedding budget for 2L',
        'Caterers in Mumbai',
        'Planning checklist',
      ],
      actions: [],
      cards: [],
      vendors: [],
      followUpQuestions: [],
      filters: {},
      session: {
        userId,
        sessionId,
        conversationId,
        turns: previousTurns,
      },
      meta: {
        responseTime: Date.now() - startTime,
        vendorsFound: 0,
        hasMoreResults: false,
        route: 'welcome',
        provider: this.llmProvider?.name || 'none',
      },
    };
  }

  private buildFallbackResponse(
    message: string,
    startTime: number,
    language: 'en' | 'hi' | 'hinglish',
    filters: ChatbotFilters,
    userId?: string,
    sessionId?: string,
    previousTurns: number = 0,
    conversationId?: string,
  ): ChatbotResponse {
    const normalized = message.toLowerCase();
    const vendorKeywords = [
      'find',
      'search',
      'show',
      'need',
      'looking',
      'photographer',
      'caterer',
      'venue',
      'decorator',
      'dj',
      'makeup',
    ];

    const isVendorSearch = vendorKeywords.some((keyword) =>
      normalized.includes(keyword),
    );

    if (isVendorSearch) {
      return {
        reply: 'I can help you find vendors! Try something like "photographers in Delhi" or "caterers under 50K in Mumbai".',
        intent: 'FIND_VENDOR',
        language,
        confidence: 0.72,
        suggestions: [
          'Photographers in Delhi',
          'Caterers in Mumbai',
          'Venues in Bangalore',
          'Decorators under 50K',
        ],
        actions: [],
        cards: [],
        vendors: [],
        followUpQuestions: [],
        filters,
        session: {
          userId,
          sessionId,
          conversationId,
          turns: previousTurns + 1,
        },
        meta: {
          responseTime: Date.now() - startTime,
          vendorsFound: 0,
          hasMoreResults: false,
          route: 'fallback',
          provider: this.llmProvider?.name || 'none',
        },
      };
    }

    return {
      reply: 'I can help with vendors, budgets, and planning! Try "find photographers in Delhi" or "budget for wedding with 100 guests".',
      intent: 'GENERAL',
      language,
      confidence: 0.75,
      suggestions: [
        'Find photographers in Delhi',
        'Wedding budget 2L',
        'Planning checklist',
        'Venues in Mumbai',
      ],
      actions: [],
      cards: [],
      vendors: [],
      followUpQuestions: [],
      filters,
      session: {
        userId,
        sessionId,
        conversationId,
        turns: previousTurns + 1,
      },
      meta: {
        responseTime: Date.now() - startTime,
        vendorsFound: 0,
        hasMoreResults: false,
        route: 'fallback',
        provider: this.llmProvider?.name || 'none',
      },
    };
  }

  private async persistSessionState(
    sessionId: string | undefined,
    userId: string | undefined,
    conversationId: string | undefined,
    filters: ChatbotFilters,
    history: ChatbotConversationMessage[],
    language: 'en' | 'hi' | 'hinglish',
    userMessage: string,
    assistantMessage: string,
    title?: string,
  ): Promise<string | null> {
    const nextHistory: ChatbotConversationMessage[] = [
      ...history,
      { role: 'user', content: userMessage },
      { role: 'assistant', content: assistantMessage },
    ];

    await this.sessionContextService.save(sessionId, {
      filters,
      history: nextHistory,
      language,
    });

    if (userId) {
      return await this.persistenceService.persistTurn({
        conversationId,
        userId,
        language,
        filters,
        turns: nextHistory.length,
        userMessage,
        assistantMessage,
        title,
      });
    }

    return null;
  }

  private emitInteraction(
    sessionId: string | undefined,
    intent: string,
    language: 'en' | 'hi' | 'hinglish',
    confidence: number,
    vendorsFound: number,
    responseTimeMs: number,
  ): void {
    this.observabilityService.emitInteraction({
      sessionId,
      intent,
      language,
      confidence,
      vendorsFound,
      responseTimeMs,
    });
  }

  private logRouteTrace(
    intent: string,
    route: string,
    provider: string,
    responseTimeMs: number,
  ): void {
    this.logger.log(
      `[ChatbotTrace] route=${route} provider=${provider} intent=${intent} responseTimeMs=${responseTimeMs}`,
    );
  }
}
