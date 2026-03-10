import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Content,
  FunctionDeclaration,
  GenerateContentResult,
  GoogleGenerativeAI,
  Part,
  SchemaType,
} from '@google/generative-ai';
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

@Injectable()
export class ChatbotDomainService implements OnModuleInit {
  private readonly logger = new Logger(ChatbotDomainService.name);
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;

  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY_MS = 2000;

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

  private readonly vendorSearchFunction: FunctionDeclaration = {
    name: 'searchVendors',
    description:
      'Search vendors by category, city, and budget using Omnicassion internal data.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: 'Search query text.',
        },
        category: {
          type: SchemaType.STRING,
          description: 'Vendor category or service type.',
        },
        city: {
          type: SchemaType.STRING,
          description: 'Event city name.',
        },
        budgetMax: {
          type: SchemaType.NUMBER,
          description: 'Maximum budget in INR.',
        },
        budgetMin: {
          type: SchemaType.NUMBER,
          description: 'Minimum budget in INR.',
        },
        verifiedOnly: {
          type: SchemaType.BOOLEAN,
          description: 'Only include verified vendors when true.',
        },
      },
      required: [],
    },
  };

  private readonly budgetGuidanceFunction: FunctionDeclaration = {
    name: 'getBudgetGuidance',
    description:
      'Get read-only budget split guidance for an event using internal planning logic.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        eventType: { type: SchemaType.STRING, description: 'Event type, e.g. wedding.' },
        totalBudget: { type: SchemaType.NUMBER, description: 'Total budget in INR.' },
        guestCount: { type: SchemaType.NUMBER, description: 'Expected guest count.' },
      },
      required: [],
    },
  };

  private readonly checklistGuidanceFunction: FunctionDeclaration = {
    name: 'getChecklistGuidance',
    description:
      'Get read-only phased checklist guidance personalized by event type and timeline.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        eventType: { type: SchemaType.STRING, description: 'Event type, e.g. wedding.' },
        monthsToEvent: {
          type: SchemaType.NUMBER,
          description: 'Months left before event day.',
        },
      },
      required: [],
    },
  };

  private readonly timelineGuidanceFunction: FunctionDeclaration = {
    name: 'getTimelineGuidance',
    description:
      'Get read-only run-of-show timeline guidance for event day planning.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        eventType: { type: SchemaType.STRING, description: 'Event type, e.g. wedding.' },
        eventDate: { type: SchemaType.STRING, description: 'Event date in ISO or natural format.' },
        ceremonyStartTime: {
          type: SchemaType.STRING,
          description: 'Main ceremony or event start time, e.g. 18:00.',
        },
      },
      required: [],
    },
  };

  constructor(
    private readonly configService: ConfigService,
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

  async onModuleInit(): Promise<void> {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY not configured. Domain chatbot will use fallback responses.',
      );
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        tools: [
          {
            functionDeclarations: [
              this.vendorSearchFunction,
              this.budgetGuidanceFunction,
              this.checklistGuidanceFunction,
              this.timelineGuidanceFunction,
            ],
          },
        ],
        systemInstruction: this.systemPrompt,
      });
      this.logger.log('Domain chatbot initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize domain chatbot model: ${error}`);
    }
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

    const detectedLanguage = normalized.detectedLanguage;
    const previousTurns = baseState?.turns || 0;

    if (!message) {
      return this.buildWelcomeResponse(
        startTime,
        detectedLanguage,
        input.userId,
        sessionId,
        previousTurns,
        conversationId,
      );
    }

    if (!this.model) {
      const fallback = this.buildFallbackResponse(
        message,
        startTime,
        detectedLanguage,
        mergedFilters,
        input.userId,
        sessionId,
        previousTurns,
        conversationId,
      );

      const newConversationId = await this.persistSessionState(
        sessionId,
        input.userId,
        conversationId,
        mergedFilters,
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

      return fallback;
    }

    try {
      const history = this.buildHistory(mergedConversationHistory);
      const chat = this.model.startChat({
        history,
        generationConfig: {
          temperature: 0.5,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 1024,
        },
      });

      let response = await this.retryWithBackoff<GenerateContentResult>(
        () => chat.sendMessage(normalized.normalizedMessage),
        'initial-message',
      );
      let result = response.response;
      let vendors: ChatbotVendorSuggestion[] = [];
      let filters: ChatbotFilters = { ...mergedFilters };

      while (
        result.candidates?.[0]?.content?.parts?.some(
          (part: Part) => 'functionCall' in part,
        )
      ) {
        const functionCallPart = result.candidates[0].content.parts.find(
          (part: Part) => 'functionCall' in part,
        );

        if (!functionCallPart || !('functionCall' in functionCallPart)) {
          break;
        }

        const functionCall = functionCallPart.functionCall;
        if (!functionCall) {
          break;
        }

        if (functionCall.name === 'searchVendors') {
          const args = functionCall.args as Record<string, any>;
          const searchResult = await this.executeVendorSearch(args);

          vendors = this.rankingService.rankVendors(searchResult.vendors).slice(0, 5);
          filters = { ...filters, ...searchResult.filters };

          response = await this.retryWithBackoff<GenerateContentResult>(
            () => chat.sendMessage([
              {
                functionResponse: {
                  name: 'searchVendors',
                  response: {
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
                },
              },
            ]),
            'searchVendors-response',
          );

          result = response.response;
        } else if (functionCall.name === 'getBudgetGuidance') {
          const args = functionCall.args as Record<string, any>;
          const guidance = this.budgetGuidanceService.getGuidance({
            eventType: args.eventType,
            totalBudget: args.totalBudget,
            guestCount: args.guestCount,
          });

          response = await this.retryWithBackoff<GenerateContentResult>(
            () => chat.sendMessage([
              {
                functionResponse: {
                  name: 'getBudgetGuidance',
                  response: guidance,
                },
              },
            ]),
            'getBudgetGuidance-response',
          );

          result = response.response;
        } else if (functionCall.name === 'getChecklistGuidance') {
          const args = functionCall.args as Record<string, any>;
          const guidance = this.checklistGuidanceService.getGuidance({
            eventType: args.eventType,
            monthsToEvent: args.monthsToEvent,
          });

          response = await this.retryWithBackoff<GenerateContentResult>(
            () => chat.sendMessage([
              {
                functionResponse: {
                  name: 'getChecklistGuidance',
                  response: guidance,
                },
              },
            ]),
            'getChecklistGuidance-response',
          );

          result = response.response;
        } else if (functionCall.name === 'getTimelineGuidance') {
          const args = functionCall.args as Record<string, any>;
          const guidance = this.timelineGuidanceService.getGuidance({
            eventType: args.eventType,
            eventDate: args.eventDate,
            ceremonyStartTime: args.ceremonyStartTime,
          });

          response = await this.retryWithBackoff<GenerateContentResult>(
            () => chat.sendMessage([
              {
                functionResponse: {
                  name: 'getTimelineGuidance',
                  response: guidance,
                },
              },
            ]),
            'getTimelineGuidance-response',
          );

          result = response.response;
        } else {
          break;
        }
      }

      const textResponse =
        result.text() ||
        "I'm here to help with vendor discovery and event planning. What do you need?";

      const intent = vendors.length > 0 ? 'FIND_VENDOR' : 'GENERAL';
      const suggestions = this.generateSuggestions(filters, vendors.length);
      const followUpQuestions = this.generateFollowUpQuestions(filters, vendors.length, mergedConversationHistory);
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

      return responsePayload;
    } catch (error) {
      this.logger.error(`Domain chatbot respond failed: ${error}`);
      const fallback = this.buildFallbackResponse(
        message,
        startTime,
        detectedLanguage,
        mergedFilters,
        input.userId,
        sessionId,
        previousTurns,
        conversationId,
      );

      const newConversationId = await this.persistSessionState(
        sessionId,
        input.userId,
        conversationId,
        mergedFilters,
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

      return fallback;
    }
  }

  private buildHistory(conversationHistory: ChatbotConversationMessage[]): Content[] {
    return conversationHistory
      .filter((message) => message.content && message.content.trim())
      .map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
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

      const vendors = searchResult.hits.map((hit) => ({
        id: hit.id,
        slug: hit.slug,
        businessName: hit.businessName,
        tagline: hit.tagline,
        categoryName: hit.categoryName as string | undefined,
        city: hit.city,
        minPrice: hit.minPrice,
        maxPrice: hit.maxPrice,
        isVerified: hit.isVerified as boolean | undefined,
        profileUrl: `/vendors/${hit.slug}`,
      }));

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
        description: vendor.tagline,
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
  ): FollowUpQuestion[] {
    // Don't generate follow-up questions if we already have a meaningful conversation
    // or if we found vendors (the AI should handle follow-ups naturally)
    if (conversationHistory.length >= 4 || vendorsFound > 0) {
      return [];
    }

    const questions: FollowUpQuestion[] = [];

    // Only ask basic questions if this is a fresh conversation
    if (!filters.categoryName && conversationHistory.length < 2) {
      questions.push({
        id: 'category',
        text: 'What type of vendor do you need?',
        type: 'category',
      });
    }

    if (!filters.cityName && conversationHistory.length < 2) {
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
}
