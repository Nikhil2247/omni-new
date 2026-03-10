import { Injectable } from '@nestjs/common';

export interface ChecklistGuidanceInput {
  eventType?: string;
  monthsToEvent?: number;
  eventDate?: string;
  budget?: number;
  guestCount?: number;
}

export interface ChecklistTask {
  task: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  vendorCategory?: string;
  vendorCategorySlug?: string;
  estimatedDays?: number;
  toolLink?: {
    label: string;
    url: string;
  };
}

export interface ChecklistPhase {
  phase: string;
  title: string;
  description: string;
  tasks: ChecklistTask[];
  keyMilestone: string;
}

export interface ChecklistGuidanceOutput {
  summary: string;
  analysis: {
    monthsToEvent: number;
    urgencyLevel: 'relaxed' | 'normal' | 'urgent' | 'critical';
    urgencyDescription: string;
    completionPercentage: number;
  };
  phases: ChecklistPhase[];
  immediateActions: string[];
  tips: string[];
  planningToolLinks: Array<{
    label: string;
    description: string;
    url: string;
  }>;
  suggestedVendorCategories: Array<{
    category: string;
    slug: string;
    bookByMonth: number;
    reason: string;
  }>;
}

@Injectable()
export class ChatbotChecklistGuidanceService {
  getGuidance(input: ChecklistGuidanceInput): ChecklistGuidanceOutput {
    const monthsToEvent = Math.max(1, input.monthsToEvent || 6);
    const eventType = (input.eventType || 'event').toLowerCase();
    const urgency = this.determineUrgency(monthsToEvent, eventType);

    const phases = this.getDetailedPhases(eventType, monthsToEvent);
    const immediateActions = this.getImmediateActions(monthsToEvent, eventType);
    const tips = this.generateTips(monthsToEvent, eventType);
    const suggestedVendorCategories = this.getSuggestedVendorCategories(monthsToEvent, eventType);

    return {
      summary: this.generateSummary(eventType, monthsToEvent, urgency),
      analysis: {
        monthsToEvent,
        urgencyLevel: urgency.level,
        urgencyDescription: urgency.description,
        completionPercentage: this.estimateCompletionPercentage(monthsToEvent),
      },
      phases,
      immediateActions,
      tips,
      planningToolLinks: [
        {
          label: 'Interactive Checklist',
          description: 'Track your progress with our customizable checklist tool',
          url: '/dashboard/checklist',
        },
        {
          label: 'Budget Tracker',
          description: 'Monitor expenses as you book vendors',
          url: '/dashboard/budget',
        },
        {
          label: 'Guest List Manager',
          description: 'Manage RSVPs and guest communications',
          url: '/dashboard/guestlist',
        },
        {
          label: 'Event Timeline',
          description: 'Plan your event day schedule',
          url: '/dashboard/timeline',
        },
      ],
      suggestedVendorCategories,
    };
  }

  private generateSummary(
    eventType: string,
    monthsToEvent: number,
    urgency: { level: string; description: string },
  ): string {
    if (monthsToEvent >= 12) {
      return `Excellent! You have ${monthsToEvent} months to plan your ${eventType}. This gives you ample time to research, compare vendors, and secure the best options. Here's a phased approach to keep you on track.`;
    } else if (monthsToEvent >= 6) {
      return `With ${monthsToEvent} months to your ${eventType}, you're in a good position. Focus on booking key vendors soon as popular ones fill up quickly. Here's your personalized planning roadmap.`;
    } else if (monthsToEvent >= 3) {
      return `With ${monthsToEvent} months left, you'll need to move quickly on vendor bookings. The good news is focused planning can still deliver a beautiful ${eventType}. Here's what to prioritize.`;
    } else {
      return `Planning a ${eventType} in ${monthsToEvent} month(s) is challenging but doable! Focus on essentials and consider vendors with last-minute availability. Here's an accelerated plan.`;
    }
  }

  private determineUrgency(
    monthsToEvent: number,
    eventType: string,
  ): { level: 'relaxed' | 'normal' | 'urgent' | 'critical'; description: string } {
    if (eventType.includes('wedding')) {
      if (monthsToEvent >= 12) {
        return { level: 'relaxed', description: 'Plenty of time for thorough planning' };
      } else if (monthsToEvent >= 6) {
        return { level: 'normal', description: 'Good timeline - start vendor bookings now' };
      } else if (monthsToEvent >= 3) {
        return { level: 'urgent', description: 'Time-sensitive - prioritize key vendors immediately' };
      } else {
        return { level: 'critical', description: 'Rush planning required - focus on essentials only' };
      }
    }

    // Generic events
    if (monthsToEvent >= 6) {
      return { level: 'relaxed', description: 'Comfortable timeline for planning' };
    } else if (monthsToEvent >= 3) {
      return { level: 'normal', description: 'Standard planning timeline' };
    } else if (monthsToEvent >= 1) {
      return { level: 'urgent', description: 'Quick turnaround needed' };
    } else {
      return { level: 'critical', description: 'Last-minute planning mode' };
    }
  }

  private estimateCompletionPercentage(monthsToEvent: number): number {
    // This is a heuristic - assume more time = less completion
    if (monthsToEvent >= 12) return 5;
    if (monthsToEvent >= 9) return 15;
    if (monthsToEvent >= 6) return 30;
    if (monthsToEvent >= 3) return 50;
    if (monthsToEvent >= 1) return 75;
    return 90;
  }

  private getDetailedPhases(eventType: string, monthsToEvent: number): ChecklistPhase[] {
    if (eventType.includes('wedding')) {
      return this.getWeddingPhases(monthsToEvent);
    }
    return this.getGenericEventPhases(monthsToEvent);
  }

  private getWeddingPhases(monthsToEvent: number): ChecklistPhase[] {
    const phases: ChecklistPhase[] = [];

    // Phase 1: Foundation (12-9 months or first phase)
    if (monthsToEvent >= 9) {
      phases.push({
        phase: `Month ${monthsToEvent}-${Math.max(9, monthsToEvent - 3)}`,
        title: 'Foundation & Major Bookings',
        description: 'Establish your vision, budget, and lock in high-demand vendors',
        tasks: [
          {
            task: 'Finalize wedding date and backup dates',
            description: 'Consider season, weather, and auspicious dates. Have 2-3 options ready.',
            priority: 'critical',
            estimatedDays: 7,
          },
          {
            task: 'Set overall budget and payment timeline',
            description: 'Include contingency of 10-15%. Create a spreadsheet or use our budget tool.',
            priority: 'critical',
            estimatedDays: 3,
            toolLink: { label: 'Budget Planner', url: '/dashboard/budget' },
          },
          {
            task: 'Draft initial guest list',
            description: 'Separate into must-invite and nice-to-have. This affects venue and catering decisions.',
            priority: 'critical',
            estimatedDays: 7,
            toolLink: { label: 'Guest List Tool', url: '/dashboard/guestlist' },
          },
          {
            task: 'Research and book venue',
            description: 'Visit 3-5 venues. Check availability for your dates. Negotiate terms.',
            priority: 'critical',
            vendorCategory: 'Venues',
            vendorCategorySlug: 'venues',
            estimatedDays: 21,
          },
          {
            task: 'Book photographer and videographer',
            description: 'Review portfolios, check availability. Book photo+video packages for savings.',
            priority: 'high',
            vendorCategory: 'Photography',
            vendorCategorySlug: 'photography',
            estimatedDays: 14,
          },
          {
            task: 'Create wedding inspiration board',
            description: 'Collect images, colors, themes. This guides all vendor conversations.',
            priority: 'medium',
            estimatedDays: 7,
          },
        ],
        keyMilestone: 'Venue and photographer booked',
      });
    }

    // Phase 2: Vendor Bookings (9-6 months or second phase)
    if (monthsToEvent >= 6) {
      const phaseStart = Math.min(monthsToEvent, 9);
      phases.push({
        phase: `Month ${phaseStart}-${Math.max(6, monthsToEvent - 3)}`,
        title: 'Vendor Selection & Contracts',
        description: 'Book remaining key vendors and finalize service agreements',
        tasks: [
          {
            task: 'Book catering service',
            description: 'Schedule tasting sessions. Finalize menu based on guest preferences and budget.',
            priority: 'critical',
            vendorCategory: 'Catering',
            vendorCategorySlug: 'catering',
            estimatedDays: 14,
          },
          {
            task: 'Hire decorator and discuss theme',
            description: 'Share your inspiration board. Get detailed proposals with 3D renders if possible.',
            priority: 'high',
            vendorCategory: 'Decor',
            vendorCategorySlug: 'decor',
            estimatedDays: 14,
          },
          {
            task: 'Book makeup artist and schedule trial',
            description: 'Book for all events. Trial should be 2-3 months before wedding.',
            priority: 'high',
            vendorCategory: 'Makeup & Hair',
            vendorCategorySlug: 'makeup-hair',
            estimatedDays: 10,
          },
          {
            task: 'Book entertainment (DJ/band)',
            description: 'Discuss playlist, special requests, and coordination with other events.',
            priority: 'medium',
            vendorCategory: 'DJ & Music',
            vendorCategorySlug: 'dj-music',
            estimatedDays: 7,
          },
          {
            task: 'Start shopping for wedding outfits',
            description: 'Bridal outfits need 3-6 months for customization. Start early.',
            priority: 'high',
            estimatedDays: 30,
          },
          {
            task: 'Design and order invitations',
            description: 'Finalize guest list first. Order extra invites for last-minute additions.',
            priority: 'medium',
            vendorCategory: 'Invitations',
            vendorCategorySlug: 'invitations',
            estimatedDays: 14,
          },
        ],
        keyMilestone: 'All major vendors contracted',
      });
    }

    // Phase 3: Details & Coordination (6-2 months or third phase)
    if (monthsToEvent >= 2) {
      const phaseStart = Math.min(monthsToEvent, 6);
      phases.push({
        phase: `Month ${phaseStart}-2`,
        title: 'Details & Refinement',
        description: 'Finalize all details and coordinate between vendors',
        tasks: [
          {
            task: 'Send invitations and track RSVPs',
            description: 'Send 8-10 weeks before. Follow up on pending RSVPs at 4 weeks.',
            priority: 'high',
            estimatedDays: 7,
            toolLink: { label: 'RSVP Tracker', url: '/dashboard/guestlist' },
          },
          {
            task: 'Finalize seating arrangement',
            description: 'Group guests thoughtfully. Consider dietary restrictions for catering.',
            priority: 'medium',
            estimatedDays: 5,
          },
          {
            task: 'Final fittings for outfits',
            description: 'Schedule alterations if needed. Include accessories.',
            priority: 'high',
            estimatedDays: 3,
          },
          {
            task: 'Makeup and hair trial',
            description: 'Take photos in different lighting. Make adjustments as needed.',
            priority: 'high',
            vendorCategory: 'Makeup & Hair',
            vendorCategorySlug: 'makeup-hair',
            estimatedDays: 1,
          },
          {
            task: 'Create detailed event timeline',
            description: 'Hour-by-hour schedule for each event. Share with all vendors.',
            priority: 'high',
            estimatedDays: 3,
            toolLink: { label: 'Timeline Builder', url: '/dashboard/timeline' },
          },
          {
            task: 'Confirm all vendor deliverables',
            description: 'Review contracts. Clarify any ambiguities. Confirm arrival times.',
            priority: 'critical',
            estimatedDays: 2,
          },
        ],
        keyMilestone: 'RSVPs confirmed, timeline finalized',
      });
    }

    // Phase 4: Final Countdown (Last 4 weeks)
    phases.push({
      phase: 'Final 4 Weeks',
      title: 'Final Preparations',
      description: 'Execute remaining tasks and prepare for the big day',
      tasks: [
        {
          task: 'Final headcount to caterer',
          description: 'Confirm exact numbers. Discuss buffer for extras.',
          priority: 'critical',
          estimatedDays: 1,
        },
        {
          task: 'Final payment schedule review',
          description: 'Check all pending payments. Prepare tips for vendors.',
          priority: 'critical',
          estimatedDays: 1,
          toolLink: { label: 'Budget Tracker', url: '/dashboard/budget' },
        },
        {
          task: 'Prepare wedding day emergency kit',
          description: 'Safety pins, tissues, pain relievers, snacks, phone chargers.',
          priority: 'medium',
          estimatedDays: 1,
        },
        {
          task: 'Venue walkthrough with vendors',
          description: 'Walk through with decor, photo, and coordinator. Mark positions.',
          priority: 'high',
          estimatedDays: 1,
        },
        {
          task: 'Distribute day-of timeline to everyone',
          description: 'Family, bridal party, vendors - everyone should have the schedule.',
          priority: 'critical',
          estimatedDays: 1,
        },
        {
          task: 'Delegate responsibilities',
          description: 'Assign point persons for specific tasks. You should enjoy your day!',
          priority: 'high',
          estimatedDays: 1,
        },
        {
          task: 'Backup plans ready',
          description: 'Weather contingency, vendor no-show plan, emergency contacts.',
          priority: 'medium',
          estimatedDays: 1,
        },
      ],
      keyMilestone: 'Everything in place, ready to celebrate!',
    });

    return phases;
  }

  private getGenericEventPhases(monthsToEvent: number): ChecklistPhase[] {
    const phases: ChecklistPhase[] = [];

    // Phase 1: Planning
    if (monthsToEvent >= 3) {
      phases.push({
        phase: `Month ${monthsToEvent}-${Math.max(3, monthsToEvent - 2)}`,
        title: 'Planning & Booking',
        description: 'Define event scope and book key vendors',
        tasks: [
          {
            task: 'Finalize event date and format',
            description: 'Confirm date, duration, and type (formal, casual, hybrid).',
            priority: 'critical',
            estimatedDays: 3,
          },
          {
            task: 'Set budget',
            description: 'Allocate funds across categories. Keep 10% contingency.',
            priority: 'critical',
            estimatedDays: 2,
            toolLink: { label: 'Budget Planner', url: '/dashboard/budget' },
          },
          {
            task: 'Create guest list',
            description: 'Finalize invitees. This determines venue size and catering quantity.',
            priority: 'critical',
            estimatedDays: 3,
            toolLink: { label: 'Guest List', url: '/dashboard/guestlist' },
          },
          {
            task: 'Book venue',
            description: 'Visit options, check amenities, negotiate terms.',
            priority: 'critical',
            vendorCategory: 'Venues',
            vendorCategorySlug: 'venues',
            estimatedDays: 10,
          },
          {
            task: 'Arrange catering',
            description: 'Get quotes, schedule tasting, finalize menu.',
            priority: 'high',
            vendorCategory: 'Catering',
            vendorCategorySlug: 'catering',
            estimatedDays: 7,
          },
        ],
        keyMilestone: 'Venue and catering confirmed',
      });
    }

    // Phase 2: Coordination
    if (monthsToEvent >= 1) {
      phases.push({
        phase: `Month ${Math.min(monthsToEvent, 3)}-1`,
        title: 'Coordination & Details',
        description: 'Book remaining services and finalize logistics',
        tasks: [
          {
            task: 'Book photographer',
            description: 'Review portfolios, confirm coverage hours.',
            priority: 'high',
            vendorCategory: 'Photography',
            vendorCategorySlug: 'photography',
            estimatedDays: 5,
          },
          {
            task: 'Arrange decor',
            description: 'Discuss theme with decorator, approve design.',
            priority: 'medium',
            vendorCategory: 'Decor',
            vendorCategorySlug: 'decor',
            estimatedDays: 5,
          },
          {
            task: 'Send invitations',
            description: 'Send 4-6 weeks before event. Track RSVPs.',
            priority: 'high',
            estimatedDays: 2,
          },
          {
            task: 'Plan event flow and agenda',
            description: 'Create schedule for the day. Share with key stakeholders.',
            priority: 'high',
            estimatedDays: 2,
            toolLink: { label: 'Timeline Builder', url: '/dashboard/timeline' },
          },
        ],
        keyMilestone: 'All vendors booked, invites sent',
      });
    }

    // Final phase
    phases.push({
      phase: 'Final 2 Weeks',
      title: 'Final Preparations',
      description: 'Confirm everything and prepare for the event',
      tasks: [
        {
          task: 'Confirm final headcount',
          description: 'Update caterer with confirmed numbers.',
          priority: 'critical',
          estimatedDays: 1,
        },
        {
          task: 'Reconfirm all vendors',
          description: 'Call each vendor. Confirm timing and requirements.',
          priority: 'critical',
          estimatedDays: 1,
        },
        {
          task: 'Create run sheet',
          description: 'Minute-by-minute schedule for event day.',
          priority: 'high',
          estimatedDays: 1,
        },
        {
          task: 'Prepare backup plans',
          description: 'Contingency for weather, no-shows, technical issues.',
          priority: 'medium',
          estimatedDays: 1,
        },
      ],
      keyMilestone: 'Event ready!',
    });

    return phases;
  }

  private getImmediateActions(monthsToEvent: number, eventType: string): string[] {
    if (monthsToEvent <= 2) {
      return [
        'Book venue immediately - availability is your biggest constraint',
        'Contact photographers today - last-minute availability is rare',
        'Finalize guest list to determine exact requirements',
        'Set up a planning war room - you need focused execution',
      ];
    }

    if (monthsToEvent <= 4) {
      return [
        'Finalize and book your venue this week',
        'Start photographer research and schedule portfolio reviews',
        'Lock in your budget allocations',
        'Create your planning checklist and set reminders',
      ];
    }

    return [
      'Start researching venues in your preferred locations',
      'Define your budget range and allocation priorities',
      'Begin building your inspiration and style direction',
      'Create a master timeline with key booking deadlines',
    ];
  }

  private generateTips(monthsToEvent: number, eventType: string): string[] {
    const tips: string[] = [
      'Book high-demand vendors (venue, photography, catering) first - they fill up fastest.',
      'Keep all vendor contracts and correspondence organized in one place.',
      'Build in buffer time for each task - delays are common.',
    ];

    if (monthsToEvent <= 3) {
      tips.push('Focus on essentials first. Nice-to-haves can wait or be simplified.');
      tips.push('Consider hiring a day-of coordinator to manage logistics.');
    }

    if (eventType.includes('wedding')) {
      tips.push('Delegate tasks to family and friends - you don\'t have to do everything yourself.');
      tips.push('Schedule regular check-ins with key vendors as the date approaches.');
    }

    return tips;
  }

  private getSuggestedVendorCategories(
    monthsToEvent: number,
    eventType: string,
  ): Array<{ category: string; slug: string; bookByMonth: number; reason: string }> {
    if (eventType.includes('wedding')) {
      return [
        {
          category: 'Venues',
          slug: 'venues',
          bookByMonth: 10,
          reason: 'Popular venues book 10-12 months in advance for peak season dates',
        },
        {
          category: 'Photography',
          slug: 'photography',
          bookByMonth: 8,
          reason: 'Top photographers have limited weekend availability',
        },
        {
          category: 'Catering',
          slug: 'catering',
          bookByMonth: 6,
          reason: 'Caterers need time for menu planning and logistics',
        },
        {
          category: 'Decor',
          slug: 'decor',
          bookByMonth: 4,
          reason: 'Book after venue to ensure decor matches the space',
        },
        {
          category: 'Makeup & Hair',
          slug: 'makeup-hair',
          bookByMonth: 3,
          reason: 'Schedule trial 2-3 months before event',
        },
        {
          category: 'DJ & Music',
          slug: 'dj-music',
          bookByMonth: 3,
          reason: 'Good DJs book up for wedding season',
        },
      ];
    }

    return [
      {
        category: 'Venues',
        slug: 'venues',
        bookByMonth: 4,
        reason: 'Book venue first - all other decisions depend on this',
      },
      {
        category: 'Catering',
        slug: 'catering',
        bookByMonth: 3,
        reason: 'Caterers need lead time for large events',
      },
      {
        category: 'Photography',
        slug: 'photography',
        bookByMonth: 2,
        reason: 'Good photographers fill up on weekends',
      },
    ];
  }
}
