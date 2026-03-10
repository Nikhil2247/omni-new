import { Injectable } from '@nestjs/common';

export interface BudgetGuidanceInput {
  eventType?: string;
  totalBudget?: number;
  guestCount?: number;
  city?: string;
}

export interface BudgetAllocation {
  category: string;
  percentage: number;
  amount: number;
  priority: 'high' | 'medium' | 'low';
  vendorCategory?: string;
  vendorCategorySlug?: string;
  description: string;
  savingTips: string[];
}

export interface BudgetGuidanceOutput {
  summary: string;
  analysis: {
    totalBudget: number;
    guestCount: number;
    perGuestCost: number;
    budgetTier: 'budget' | 'mid-range' | 'premium' | 'luxury';
    tierDescription: string;
  };
  allocations: BudgetAllocation[];
  tips: string[];
  warnings: string[];
  recommendations: string[];
  planningToolLinks: Array<{
    label: string;
    description: string;
    url: string;
  }>;
  suggestedVendorCategories: Array<{
    category: string;
    slug: string;
    priorityOrder: number;
    reason: string;
  }>;
}

@Injectable()
export class ChatbotBudgetGuidanceService {
  getGuidance(input: BudgetGuidanceInput): BudgetGuidanceOutput {
    const eventType = (input.eventType || 'event').toLowerCase();
    const totalBudget = Math.max(0, input.totalBudget || 0);
    const guestCount = Math.max(0, input.guestCount || 100);
    const perGuestCost = guestCount > 0 && totalBudget > 0 ? Math.round(totalBudget / guestCount) : 0;

    const budgetTier = this.determineBudgetTier(totalBudget, guestCount, eventType);
    const allocations = this.getDetailedAllocations(eventType, totalBudget, budgetTier);
    const warnings = this.generateWarnings(totalBudget, guestCount, perGuestCost, eventType);
    const recommendations = this.generateRecommendations(budgetTier, eventType, totalBudget);

    return {
      summary: this.generateSummary(eventType, totalBudget, guestCount, budgetTier),
      analysis: {
        totalBudget,
        guestCount,
        perGuestCost,
        budgetTier: budgetTier.tier,
        tierDescription: budgetTier.description,
      },
      allocations,
      tips: this.generateTips(budgetTier.tier, eventType, perGuestCost),
      warnings,
      recommendations,
      planningToolLinks: [
        {
          label: 'Budget Tracker',
          description: 'Track expenses against your allocated budget in real-time',
          url: '/dashboard/budget',
        },
        {
          label: 'Planning Checklist',
          description: 'Create a personalized checklist based on your budget priorities',
          url: '/dashboard/checklist',
        },
        {
          label: 'Browse Vendors',
          description: 'Find vendors that match your budget range',
          url: '/vendors',
        },
      ],
      suggestedVendorCategories: this.getSuggestedVendorCategories(eventType, budgetTier.tier),
    };
  }

  private generateSummary(
    eventType: string,
    totalBudget: number,
    guestCount: number,
    budgetTier: { tier: string; description: string },
  ): string {
    if (totalBudget === 0) {
      return `I've prepared a ${eventType} budget framework. Share your target budget to get specific amount allocations and vendor recommendations tailored to your price range.`;
    }

    const formattedBudget = this.formatCurrency(totalBudget);
    return `Here's your detailed ${eventType} budget plan for ${formattedBudget} with ${guestCount} guests. This falls in the ${budgetTier.tier} category - ${budgetTier.description}`;
  }

  private determineBudgetTier(
    totalBudget: number,
    guestCount: number,
    eventType: string,
  ): { tier: 'budget' | 'mid-range' | 'premium' | 'luxury'; description: string } {
    const perGuest = guestCount > 0 ? totalBudget / guestCount : 0;

    if (eventType.includes('wedding')) {
      if (perGuest < 5000) {
        return { tier: 'budget', description: 'focused on essentials with creative cost-saving strategies' };
      } else if (perGuest < 15000) {
        return { tier: 'mid-range', description: 'balanced quality across all categories with room for personalization' };
      } else if (perGuest < 30000) {
        return { tier: 'premium', description: 'high-quality vendors and premium experiences throughout' };
      } else {
        return { tier: 'luxury', description: 'top-tier vendors, bespoke experiences, and exceptional attention to detail' };
      }
    }

    // Generic events
    if (perGuest < 2000) {
      return { tier: 'budget', description: 'essential coverage with smart spending' };
    } else if (perGuest < 5000) {
      return { tier: 'mid-range', description: 'good quality across categories' };
    } else if (perGuest < 10000) {
      return { tier: 'premium', description: 'elevated experiences for guests' };
    } else {
      return { tier: 'luxury', description: 'exceptional quality and personalization' };
    }
  }

  private getDetailedAllocations(
    eventType: string,
    totalBudget: number,
    budgetTier: { tier: string },
  ): BudgetAllocation[] {
    const template = this.getAllocationTemplate(eventType, budgetTier.tier);

    return template.map((item) => ({
      ...item,
      amount: Math.round((totalBudget * item.percentage) / 100),
    }));
  }

  private getAllocationTemplate(
    eventType: string,
    tier: string,
  ): Array<Omit<BudgetAllocation, 'amount'>> {
    if (eventType.includes('wedding')) {
      return [
        {
          category: 'Venue & Hospitality',
          percentage: tier === 'luxury' ? 25 : 28,
          priority: 'high',
          vendorCategory: 'Venues',
          vendorCategorySlug: 'venues',
          description: 'Includes venue rental, basic furniture, and hospitality staff',
          savingTips: [
            'Consider off-season dates (monsoon months) for 20-30% savings',
            'Weekday events can reduce venue costs by 15-25%',
            'Farm houses and open lawns are often more affordable than hotels',
          ],
        },
        {
          category: 'Food & Catering',
          percentage: tier === 'budget' ? 35 : 30,
          priority: 'high',
          vendorCategory: 'Catering',
          vendorCategorySlug: 'catering',
          description: 'Main meals, welcome drinks, desserts, and service staff',
          savingTips: [
            'Buffet service is typically 30% cheaper than plated meals',
            'Limit cuisine variety to 2-3 types to reduce wastage',
            'Negotiate based on confirmed guest count, not estimated',
          ],
        },
        {
          category: 'Photography & Videography',
          percentage: 12,
          priority: 'high',
          vendorCategory: 'Photography',
          vendorCategorySlug: 'photography',
          description: 'Candid photography, cinematic video, album, and highlight reels',
          savingTips: [
            'Book photo+video packages for 15-20% combined savings',
            'Pre-wedding shoots can be done on weekdays at lower rates',
            'Digital-only packages save on album printing costs',
          ],
        },
        {
          category: 'Decor & Florals',
          percentage: tier === 'luxury' ? 15 : 10,
          priority: 'medium',
          vendorCategory: 'Decor',
          vendorCategorySlug: 'decor',
          description: 'Stage design, floral arrangements, lighting, and props',
          savingTips: [
            'Choose in-season flowers for significant savings',
            'Repurpose mandap decor for reception stage',
            'LED lights are cheaper to rent than fresh flower walls',
          ],
        },
        {
          category: 'Outfits & Styling',
          percentage: tier === 'budget' ? 8 : 12,
          priority: 'medium',
          vendorCategory: 'Makeup & Hair',
          vendorCategorySlug: 'makeup-hair',
          description: 'Bridal/groom outfits, jewelry, makeup, and mehndi',
          savingTips: [
            'Designer rentals offer premium looks at 40-60% of purchase cost',
            'Book makeup artist for multiple events at package rates',
            'Mix high-end pieces with affordable accessories',
          ],
        },
        {
          category: 'Entertainment & Music',
          percentage: 8,
          priority: 'low',
          vendorCategory: 'DJ & Music',
          vendorCategorySlug: 'dj-music',
          description: 'DJ, live band, performers, and sound system',
          savingTips: [
            'Solo performers cost less than full bands',
            'Book DJ for peak hours only (4-5 hours)',
            'Venue sound systems can reduce rental equipment needs',
          ],
        },
        {
          category: 'Invitations & Stationery',
          percentage: 3,
          priority: 'low',
          vendorCategory: 'Invitations',
          vendorCategorySlug: 'invitations',
          description: 'Physical invites, save-the-dates, and day-of stationery',
          savingTips: [
            'Digital invites for distant relatives save 50%+ on printing',
            'Combine all event cards into a single box set',
            'Local printers often match quality at lower prices',
          ],
        },
        {
          category: 'Contingency & Miscellaneous',
          percentage: tier === 'budget' ? 4 : 5,
          priority: 'high',
          description: 'Buffer for last-minute changes, tips, and unexpected costs',
          savingTips: [
            'Never skip contingency - unexpected costs always arise',
            'Keep this fund in a separate account to avoid accidental spending',
            'Review this fund 2 weeks before event and reallocate if unused',
          ],
        },
      ];
    }

    // Generic event template
    return [
      {
        category: 'Venue',
        percentage: 30,
        priority: 'high',
        vendorCategory: 'Venues',
        vendorCategorySlug: 'venues',
        description: 'Event space rental and basic amenities',
        savingTips: [
          'Off-peak timing (morning/afternoon) is often cheaper',
          'Community spaces and co-working venues offer good rates',
        ],
      },
      {
        category: 'Food & Beverages',
        percentage: 30,
        priority: 'high',
        vendorCategory: 'Catering',
        vendorCategorySlug: 'catering',
        description: 'Meals, snacks, and beverages for guests',
        savingTips: [
          'Finger food/appetizers are cheaper than full meals',
          'BYOB venues can significantly reduce beverage costs',
        ],
      },
      {
        category: 'Photography',
        percentage: 10,
        priority: 'medium',
        vendorCategory: 'Photography',
        vendorCategorySlug: 'photography',
        description: 'Event coverage and key moment captures',
        savingTips: [
          'Hourly packages for shorter events save costs',
          'Student photographers offer good quality at lower rates',
        ],
      },
      {
        category: 'Decor',
        percentage: 12,
        priority: 'medium',
        vendorCategory: 'Decor',
        vendorCategorySlug: 'decor',
        description: 'Theming, centerpieces, and ambient design',
        savingTips: [
          'DIY elements can add personal touch and save money',
          'Balloon and paper decor is budget-friendly',
        ],
      },
      {
        category: 'Entertainment',
        percentage: 10,
        priority: 'low',
        vendorCategory: 'DJ & Music',
        vendorCategorySlug: 'dj-music',
        description: 'Music, performances, and activities',
        savingTips: [
          'Spotify playlists with good speakers work for casual events',
          'Interactive games are cheaper than hiring performers',
        ],
      },
      {
        category: 'Miscellaneous',
        percentage: 8,
        priority: 'medium',
        description: 'Buffer and unexpected expenses',
        savingTips: ['Always keep 8-10% buffer for surprises'],
      },
    ];
  }

  private generateTips(tier: string, eventType: string, perGuestCost: number): string[] {
    const tips: string[] = [
      `Keep 8-12% contingency for last-minute changes and emergencies.`,
    ];

    if (perGuestCost > 0) {
      tips.push(`Your current budget estimates INR ${perGuestCost.toLocaleString('en-IN')} per guest.`);
    }

    tips.push('Prioritize 2-3 non-negotiables first, then optimize secondary categories.');
    tips.push('Book vendors 6-8 months ahead for better rates and availability.');

    if (tier === 'budget') {
      tips.push('Consider weekday events for 20-30% savings across most vendors.');
      tips.push('Negotiate package deals when booking multiple services from one vendor.');
    } else if (tier === 'premium' || tier === 'luxury') {
      tips.push('At this budget tier, focus on experience quality over quantity.');
      tips.push('Consider a wedding planner - they often save more than their fee through vendor negotiations.');
    }

    return tips;
  }

  private generateWarnings(
    totalBudget: number,
    guestCount: number,
    perGuestCost: number,
    eventType: string,
  ): string[] {
    const warnings: string[] = [];

    if (eventType.includes('wedding')) {
      if (perGuestCost > 0 && perGuestCost < 3000) {
        warnings.push(
          `At INR ${perGuestCost.toLocaleString('en-IN')} per guest, you may need to make significant compromises. Consider reducing guest count or increasing budget.`,
        );
      }

      if (totalBudget > 0 && totalBudget < 300000 && guestCount > 100) {
        warnings.push(
          'This budget for 100+ guests is very tight. Consider a smaller intimate celebration or phased events.',
        );
      }
    }

    if (guestCount > 500) {
      warnings.push(
        'Large guest counts require experienced vendors who can handle scale. Budget 10-15% more for logistics.',
      );
    }

    return warnings;
  }

  private generateRecommendations(
    budgetTier: { tier: string },
    eventType: string,
    totalBudget: number,
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(
      `Start by booking your venue and catering first - they take the longest to finalize and have limited availability.`,
    );

    if (eventType.includes('wedding')) {
      recommendations.push(
        'Photography is one area where quality matters most - your photos and videos are forever memories.',
      );

      if (budgetTier.tier === 'budget' || budgetTier.tier === 'mid-range') {
        recommendations.push(
          'Consider a talented emerging photographer - check their portfolio carefully for consistent quality.',
        );
      }

      recommendations.push(
        'Create a detailed vendor payment schedule to avoid cash flow issues closer to the event.',
      );
    }

    recommendations.push(
      'Use our planning tools to track expenses in real-time and stay on budget.',
    );

    return recommendations;
  }

  private getSuggestedVendorCategories(
    eventType: string,
    tier: string,
  ): Array<{ category: string; slug: string; priorityOrder: number; reason: string }> {
    if (eventType.includes('wedding')) {
      return [
        {
          category: 'Venues',
          slug: 'venues',
          priorityOrder: 1,
          reason: 'Book first - limited availability, especially for popular dates',
        },
        {
          category: 'Catering',
          slug: 'catering',
          priorityOrder: 2,
          reason: 'Second priority - often bundled with venue or needs coordination',
        },
        {
          category: 'Photography',
          slug: 'photography',
          priorityOrder: 3,
          reason: 'Top photographers book 8-12 months ahead',
        },
        {
          category: 'Decor',
          slug: 'decor',
          priorityOrder: 4,
          reason: 'Plan after venue is confirmed to match the space',
        },
        {
          category: 'Makeup & Hair',
          slug: 'makeup-hair',
          priorityOrder: 5,
          reason: 'Schedule trial sessions 2-3 months before the event',
        },
      ];
    }

    return [
      {
        category: 'Venues',
        slug: 'venues',
        priorityOrder: 1,
        reason: 'Essential first step - all other planning depends on this',
      },
      {
        category: 'Catering',
        slug: 'catering',
        priorityOrder: 2,
        reason: 'Food quality significantly impacts guest experience',
      },
      {
        category: 'Photography',
        slug: 'photography',
        priorityOrder: 3,
        reason: 'Capture memories of your special event',
      },
    ];
  }

  private formatCurrency(amount: number): string {
    if (amount >= 10000000) {
      return `INR ${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (amount >= 100000) {
      return `INR ${(amount / 100000).toFixed(2)} Lakhs`;
    }
    if (amount >= 1000) {
      return `INR ${(amount / 1000).toFixed(0)}K`;
    }
    return `INR ${amount.toLocaleString('en-IN')}`;
  }
}
