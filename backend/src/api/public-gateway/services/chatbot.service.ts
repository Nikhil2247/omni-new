import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { GoogleGenerativeAI, Content, Part, FunctionDeclaration, SchemaType } from '@google/generative-ai'
import { CategoryLookupService } from '../../../core/lookup/category-lookup.service'
import { CountryLookupService } from '../../../core/lookup/country-lookup.service'
import { VendorProfileService } from '../../../domain/catalog/services/vendor-profile.service'
import { VendorIndexer } from '../../../infrastructure/search/indexers/vendor.indexer'
import { ChatbotMessageDto } from '../dto/chatbot.dto'

export interface ChatbotVendorSuggestion {
  id: string
  slug: string
  businessName: string
  tagline?: string
  categoryName?: string
  city?: string
  minPrice?: number
  maxPrice?: number
  isVerified?: boolean
  profileUrl: string
}

export interface FollowUpQuestion {
  id: string
  text: string
  type: 'category' | 'location' | 'budget' | 'eventType' | 'refinement'
}

export interface ChatbotResponse {
  reply: string
  intent: string
  suggestions: string[]
  vendors: ChatbotVendorSuggestion[]
  followUpQuestions: FollowUpQuestion[]
  filters: {
    categoryId?: string
    categoryName?: string
    cityId?: string
    cityName?: string
    budgetMin?: number
    budgetMax?: number
    eventType?: string
  }
  meta: {
    responseTime: number
    vendorsFound: number
    hasMoreResults: boolean
  }
}

@Injectable()
export class ChatbotService implements OnModuleInit {
  private readonly logger = new Logger(ChatbotService.name)
  private genAI: GoogleGenerativeAI | null = null
  private model: any = null

  // System prompt for the AI
  private readonly systemPrompt = `You are an AI assistant for Omnicassion, an event planning and vendor discovery platform in India. Your role is to help users find the perfect vendors for their events.

## Your Capabilities:
1. **Search Vendors**: Use the searchVendors function to find vendors based on category, location, and budget
2. **Answer Questions**: Help with event planning advice, vendor selection tips, pricing guidance
3. **Provide Recommendations**: Suggest vendor types based on event needs

## Available Vendor Categories:
- Photography & Videography
- Catering & Food Services
- Venues & Banquet Halls
- Decoration & Florists
- Makeup & Hair Styling
- DJ & Music/Entertainment
- Wedding Planning
- Invitations & Cards
- Cakes & Desserts
- Rentals & Equipment

## Guidelines:
- Be helpful, friendly, and professional
- When users ask about vendors, ALWAYS use the searchVendors function to get real results
- Understand Indian context (cities, budget in INR with K/L notation, event types like wedding, sangeet, haldi)
- Parse budgets: "50K" = 50000, "1L" or "1 lakh" = 100000
- If user mentions a category or city, search for vendors
- Provide brief, helpful responses - don't be overly verbose
- Always suggest next steps or follow-up actions
- When showing vendors, mention key details like location, pricing, verified status

## Response Format:
- Keep responses concise and actionable
- Use bullet points for listing multiple items
- Include vendor links when showing results
- Suggest related services when appropriate`

  // Function declarations for Gemini
  private readonly vendorSearchFunction: FunctionDeclaration = {
    name: 'searchVendors',
    description: 'Search for vendors based on category, location, budget, and other filters. Use this whenever a user asks about finding, booking, or recommending vendors.',
    parameters: {
      type: SchemaType.OBJECT,
      properties: {
        query: {
          type: SchemaType.STRING,
          description: 'Search query text (vendor name, service type, etc.)',
        },
        category: {
          type: SchemaType.STRING,
          description: 'Vendor category: photography, videography, catering, venues, florists, makeup-hair, decor, dj-music, wedding-planning, invitations, cakes, rentals',
        },
        city: {
          type: SchemaType.STRING,
          description: 'City name (e.g., Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Pune, Kolkata)',
        },
        budgetMax: {
          type: SchemaType.NUMBER,
          description: 'Maximum budget in INR (e.g., 50000 for 50K, 100000 for 1L)',
        },
        budgetMin: {
          type: SchemaType.NUMBER,
          description: 'Minimum budget in INR',
        },
        verifiedOnly: {
          type: SchemaType.BOOLEAN,
          description: 'Only show verified vendors',
        },
      },
      required: [],
    },
  }

  constructor(
    private readonly configService: ConfigService,
    private readonly categoryLookupService: CategoryLookupService,
    private readonly countryLookupService: CountryLookupService,
    private readonly vendorProfileService: VendorProfileService,
    private readonly vendorIndexer: VendorIndexer,
  ) {}

  async onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY')

    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY not configured - chatbot will use fallback responses')
      return
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey)
      this.model = this.genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        tools: [{ functionDeclarations: [this.vendorSearchFunction] }],
        systemInstruction: this.systemPrompt,
      })
      this.logger.log('Gemini AI initialized successfully')
    } catch (error) {
      this.logger.error(`Failed to initialize Gemini AI: ${error}`)
    }
  }

  async respond(dto: ChatbotMessageDto): Promise<ChatbotResponse> {
    const startTime = Date.now()
    const message = (dto.message || '').trim()

    if (!message) {
      return this.buildWelcomeResponse(startTime)
    }

    // If Gemini is not configured, use fallback
    if (!this.model) {
      return this.buildFallbackResponse(message, startTime)
    }

    try {
      // Build conversation history for context
      const history = this.buildGeminiHistory(dto.conversationHistory || [])

      // Start chat with history
      const chat = this.model.startChat({
        history,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      })

      // Send message and handle function calls
      let response = await chat.sendMessage(message)
      let result = response.response
      let vendors: ChatbotVendorSuggestion[] = []
      let filters: ChatbotResponse['filters'] = {}

      // Handle function calls (tool use)
      while (result.candidates?.[0]?.content?.parts?.some((part: Part) => 'functionCall' in part)) {
        const functionCallPart = result.candidates[0].content.parts.find(
          (part: Part) => 'functionCall' in part
        )

        if (functionCallPart && 'functionCall' in functionCallPart) {
          const functionCall = functionCallPart.functionCall

          if (functionCall.name === 'searchVendors') {
            const args = functionCall.args as Record<string, any>

            // Execute vendor search
            const searchResult = await this.executeVendorSearch(args)
            vendors = searchResult.vendors
            filters = searchResult.filters

            // Send function result back to model
            response = await chat.sendMessage([
              {
                functionResponse: {
                  name: 'searchVendors',
                  response: {
                    vendors: vendors.map(v => ({
                      name: v.businessName,
                      category: v.categoryName,
                      city: v.city,
                      priceRange: this.formatPriceRange(v.minPrice, v.maxPrice),
                      verified: v.isVerified,
                      url: v.profileUrl,
                    })),
                    totalFound: vendors.length,
                    hasMore: searchResult.hasMore,
                  },
                },
              },
            ])
            result = response.response
          }
        }
      }

      // Extract text response
      const textResponse = result.text() || "I'm here to help you find vendors. What are you looking for?"

      // Generate contextual suggestions
      const suggestions = this.generateSuggestions(filters, vendors.length)
      const followUpQuestions = this.generateFollowUpQuestions(filters, vendors.length)

      return {
        reply: textResponse,
        intent: vendors.length > 0 ? 'FIND_VENDOR' : 'GENERAL',
        suggestions,
        vendors,
        followUpQuestions,
        filters,
        meta: {
          responseTime: Date.now() - startTime,
          vendorsFound: vendors.length,
          hasMoreResults: vendors.length >= 5,
        },
      }
    } catch (error) {
      this.logger.error(`Gemini API error: ${error}`)
      return this.buildFallbackResponse(message, startTime)
    }
  }

  private buildGeminiHistory(conversationHistory: Array<{ role: string; content: string }>): Content[] {
    return conversationHistory
      .filter(msg => msg.content && msg.content.trim())
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }))
  }

  private async executeVendorSearch(args: Record<string, any>): Promise<{
    vendors: ChatbotVendorSuggestion[]
    filters: ChatbotResponse['filters']
    hasMore: boolean
  }> {
    const filters: ChatbotResponse['filters'] = {}

    // Resolve category
    let categoryId: string | undefined
    if (args.category) {
      const category = this.findCategory(args.category)
      if (category) {
        categoryId = category.id
        filters.categoryId = category.id
        filters.categoryName = category.name
      }
    }

    // Resolve city
    let cityId: string | undefined
    if (args.city) {
      const city = this.findCity(args.city)
      if (city) {
        cityId = city.id
        filters.cityId = city.id
        filters.cityName = city.name
      }
    }

    // Budget filters
    if (args.budgetMin) filters.budgetMin = args.budgetMin
    if (args.budgetMax) filters.budgetMax = args.budgetMax

    // Search for vendors
    try {
      const searchResult = await this.vendorIndexer.searchVendors(args.query || '', {
        categoryId,
        city: args.city,
        priceMin: args.budgetMin,
        priceMax: args.budgetMax,
        isVerified: args.verifiedOnly,
        hitsPerPage: 6,
        sortBy: 'viewCount',
        sortOrder: 'desc',
      })

      const vendors = searchResult.hits.map(hit => ({
        id: hit.id as string,
        slug: hit.slug as string,
        businessName: hit.businessName as string,
        tagline: hit.tagline as string | undefined,
        categoryName: hit.categoryName as string | undefined,
        city: hit.city as string | undefined,
        minPrice: hit.minPrice as number | undefined,
        maxPrice: hit.maxPrice as number | undefined,
        isVerified: hit.isVerified as boolean | undefined,
        profileUrl: `/vendors/${hit.slug}`,
      }))

      return {
        vendors: vendors.slice(0, 5),
        filters,
        hasMore: searchResult.hits.length > 5,
      }
    } catch (error) {
      this.logger.warn(`Vendor search failed: ${error}`)

      // Fallback to database search
      try {
        const fallback = await this.vendorProfileService.search({
          query: args.query,
          categoryId,
          cityId,
          page: 1,
          limit: 6,
          sortBy: 'viewCount',
          sortOrder: 'desc',
        })

        const vendors = fallback.data.map(vendor => ({
          id: vendor.id,
          slug: vendor.slug,
          businessName: vendor.businessName,
          tagline: vendor.tagline || undefined,
          categoryName: (vendor as any).category?.name,
          city: (vendor as any).address?.city?.name,
          isVerified: Boolean((vendor as any).verifiedAt),
          profileUrl: `/vendors/${vendor.slug}`,
        }))

        return {
          vendors: vendors.slice(0, 5),
          filters,
          hasMore: fallback.data.length > 5,
        }
      } catch {
        return { vendors: [], filters, hasMore: false }
      }
    }
  }

  private findCategory(name: string): { id: string; name: string } | null {
    const categories = this.categoryLookupService.getAllCategories()
    const normalized = name.toLowerCase()

    // Category aliases
    const aliases: Record<string, string[]> = {
      photography: ['photographer', 'photographers', 'photo', 'photos', 'photoshoot'],
      videography: ['videographer', 'videographers', 'video', 'filming'],
      catering: ['caterer', 'caterers', 'food', 'cuisine', 'chef'],
      venues: ['venue', 'hall', 'banquet', 'farmhouse', 'resort', 'hotel'],
      florists: ['florist', 'flowers', 'floral', 'bouquet'],
      'makeup-hair': ['makeup', 'hair', 'mua', 'stylist', 'beautician'],
      decor: ['decorator', 'decorators', 'decoration', 'theme'],
      'dj-music': ['dj', 'music', 'band', 'entertainment', 'singer'],
      'wedding-planning': ['planner', 'planners', 'coordinator', 'organizer'],
      invitations: ['invitation', 'cards', 'invite'],
      cakes: ['cake', 'bakery', 'dessert', 'pastry'],
      rentals: ['rental', 'rent', 'furniture', 'tent'],
    }

    for (const category of categories) {
      // Direct match
      if (category.name.toLowerCase() === normalized || category.slug === normalized) {
        return { id: category.id, name: category.name }
      }

      // Alias match
      const categoryAliases = aliases[category.slug] || []
      if (categoryAliases.some(alias => normalized.includes(alias))) {
        return { id: category.id, name: category.name }
      }
    }

    return null
  }

  private findCity(name: string): { id: string; name: string } | null {
    const cities = this.countryLookupService.getAllCities()
    const normalized = name.toLowerCase()

    for (const city of cities) {
      if (city.name.toLowerCase() === normalized) {
        return { id: city.id, name: city.name }
      }
    }

    return null
  }

  private formatPriceRange(min?: number, max?: number): string {
    const format = (n: number) => {
      if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
      if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`
      return `₹${n}`
    }

    if (min && max) return `${format(min)} - ${format(max)}`
    if (max) return `Up to ${format(max)}`
    if (min) return `From ${format(min)}`
    return 'Contact for price'
  }

  private generateSuggestions(
    filters: ChatbotResponse['filters'],
    vendorsFound: number,
  ): string[] {
    const suggestions: string[] = []

    if (vendorsFound > 0) {
      suggestions.push('Show me more options')
      suggestions.push('Only verified vendors')
      if (!filters.budgetMax) suggestions.push('Filter by budget')
      if (!filters.cityName) suggestions.push('Search in specific city')
    } else {
      suggestions.push('Wedding photographers')
      suggestions.push('Caterers in Mumbai')
      suggestions.push('Decorators under 50K')
      suggestions.push('Premium venues')
    }

    return suggestions.slice(0, 4)
  }

  private generateFollowUpQuestions(
    filters: ChatbotResponse['filters'],
    vendorsFound: number,
  ): FollowUpQuestion[] {
    const questions: FollowUpQuestion[] = []

    if (!filters.categoryName) {
      questions.push({
        id: 'category',
        text: 'What type of vendor do you need?',
        type: 'category',
      })
    }

    if (!filters.cityName) {
      questions.push({
        id: 'location',
        text: 'Which city is your event in?',
        type: 'location',
      })
    }

    if (!filters.budgetMax && vendorsFound > 0) {
      questions.push({
        id: 'budget',
        text: "What's your budget range?",
        type: 'budget',
      })
    }

    return questions.slice(0, 3)
  }

  private buildWelcomeResponse(startTime: number): ChatbotResponse {
    return {
      reply: "Hi! I'm your AI event planning assistant. I can help you find photographers, caterers, venues, decorators, and more. Just tell me what you're looking for!\n\nTry saying:\n• \"Find photographers in Mumbai under 50K\"\n• \"Best caterers for a wedding\"\n• \"Show me decorators in Delhi\"",
      intent: 'WELCOME',
      suggestions: [
        'Wedding photographer in Delhi',
        'Caterers in Mumbai',
        'Decorators under ₹50K',
        'Premium venues',
      ],
      vendors: [],
      followUpQuestions: [
        { id: 'event', text: 'What type of event are you planning?', type: 'eventType' },
        { id: 'vendor', text: 'What kind of vendor do you need?', type: 'category' },
      ],
      filters: {},
      meta: {
        responseTime: Date.now() - startTime,
        vendorsFound: 0,
        hasMoreResults: false,
      },
    }
  }

  private buildFallbackResponse(message: string, startTime: number): ChatbotResponse {
    // Simple keyword-based fallback when Gemini is not available
    const normalized = message.toLowerCase()

    // Try to detect vendor search intent
    const vendorKeywords = ['find', 'search', 'show', 'need', 'looking', 'photographer', 'caterer', 'venue', 'decorator', 'dj', 'makeup']
    const isVendorSearch = vendorKeywords.some(kw => normalized.includes(kw))

    if (isVendorSearch) {
      return {
        reply: "I'd love to help you find vendors! However, I'm currently running in limited mode. Please try browsing our vendor directory or check back later for AI-powered recommendations.",
        intent: 'FIND_VENDOR',
        suggestions: [
          'Browse all vendors',
          'View categories',
          'Popular in your city',
        ],
        vendors: [],
        followUpQuestions: [],
        filters: {},
        meta: {
          responseTime: Date.now() - startTime,
          vendorsFound: 0,
          hasMoreResults: false,
        },
      }
    }

    return {
      reply: "I'm here to help you find the perfect vendors for your event! Tell me:\n• What type of vendor you need\n• Your city\n• Your budget (optional)\n\nFor example: \"Find photographers in Mumbai under 50K\"",
      intent: 'GENERAL',
      suggestions: [
        'Find photographers',
        'Search caterers',
        'Browse venues',
        'View all categories',
      ],
      vendors: [],
      followUpQuestions: [
        { id: 'vendor', text: 'What type of vendor are you looking for?', type: 'category' },
      ],
      filters: {},
      meta: {
        responseTime: Date.now() - startTime,
        vendorsFound: 0,
        hasMoreResults: false,
      },
    }
  }
}
