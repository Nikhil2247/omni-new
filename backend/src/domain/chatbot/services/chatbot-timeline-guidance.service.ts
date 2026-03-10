import { Injectable } from '@nestjs/common';

export interface TimelineGuidanceInput {
  eventType?: string;
  eventDate?: string;
  ceremonyStartTime?: string;
}

export interface TimelineGuidanceOutput {
  summary: string;
  timeline: Array<{
    time: string;
    activity: string;
  }>;
  notes: string[];
}

@Injectable()
export class ChatbotTimelineGuidanceService {
  getGuidance(input: TimelineGuidanceInput): TimelineGuidanceOutput {
    const eventType = (input.eventType || 'event').toLowerCase();
    const startTime = input.ceremonyStartTime || '18:00';

    const timeline = eventType.includes('wedding')
      ? [
          { time: '09:00', activity: 'Venue handover and decor setup starts' },
          { time: '12:00', activity: 'Photo/video team arrival and detail shots' },
          { time: '15:00', activity: 'Styling and family prep window' },
          { time: startTime, activity: 'Main ceremony starts' },
          { time: '20:00', activity: 'Dinner service and guest flow management' },
          { time: '22:00', activity: 'Key moments and closing captures' },
        ]
      : [
          { time: '10:00', activity: 'Setup and technical checks' },
          { time: '12:00', activity: 'Team briefing and vendor alignment' },
          { time: startTime, activity: 'Main event starts' },
          { time: '2 hours after start', activity: 'Food service peak window' },
          { time: 'Event end - 30 min', activity: 'Closure and dispatch planning' },
        ];

    return {
      summary: `Suggested ${eventType} run-of-show timeline${input.eventDate ? ` for ${input.eventDate}` : ''}.`,
      timeline,
      notes: [
        'Keep 20-30 minute float before major moments.',
        'Assign one owner per milestone to avoid coordination gaps.',
        'Confirm all vendor ETAs one day before the event.',
      ],
    };
  }
}
