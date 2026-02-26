# 🚀 QUICK START: Conversion Funnels Implementation

**Priority**: HIGHEST
**Estimated Time**: 2-3 days
**Impact**: Immediate visibility into where users drop off

---

## 📊 WHY START HERE?

Conversion funnels will instantly show you:
- ✅ Where 80% of users drop off (usually 1-2 specific steps)
- ✅ Which funnel to optimize first (highest drop-off × highest traffic)
- ✅ A/B test results (did new feature improve conversion?)
- ✅ ROI of feature development (prove features work with data)

**Example**: If funnel shows "90% of users who search vendors don't contact them", you know to optimize vendor profiles, not search.

---

## 🎯 IMPLEMENTATION STEPS

### **STEP 1: Database Schema** (15 minutes)

Create the funnel tracking table:

```sql
-- Create the funnel_events table
CREATE TABLE public."funnel_events" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  funnel_name VARCHAR(100) NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  step_index INTEGER NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB,

  -- Indexes for fast queries
  CONSTRAINT funnel_events_user_funnel_idx UNIQUE (user_id, funnel_name, step_name, session_id)
);

CREATE INDEX idx_funnel_events_user_funnel ON public."funnel_events"(user_id, funnel_name);
CREATE INDEX idx_funnel_events_session ON public."funnel_events"(session_id, funnel_name);
CREATE INDEX idx_funnel_events_timestamp ON public."funnel_events"(timestamp);
CREATE INDEX idx_funnel_events_funnel_step ON public."funnel_events"(funnel_name, step_index);
```

**Add to Prisma schema:**
```prisma
model FunnelEvent {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  sessionId  String   @map("session_id")
  funnelName String   @map("funnel_name")
  stepName   String   @map("step_name")
  stepIndex  Int      @map("step_index")
  timestamp  DateTime @default(now())
  metadata   Json?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, funnelName, stepName, sessionId])
  @@index([userId, funnelName])
  @@index([sessionId, funnelName])
  @@index([timestamp])
  @@index([funnelName, stepIndex])
  @@map("funnel_events")
  @@schema("public")
}
```

---

### **STEP 2: Funnel Analytics Service** (2 hours)

Create `backend/src/domain/insights/services/funnel-analytics.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/database/prisma.service';
import { DragonflyService } from '../../../infrastructure/cache/dragonfly.service';

export interface FunnelStep {
  name: string;
  stepIndex: number;
  count: number;
  percentage: number;
  dropoffCount: number;
  dropoffRate: number;
  avgTimeToNext: number | null; // seconds
}

export interface ConversionFunnel {
  name: string;
  period: { start: Date; end: Date };
  steps: FunnelStep[];
  totalEntered: number;
  totalCompleted: number;
  overallConversionRate: number;
  avgCompletionTime: number; // seconds
}

export interface FunnelDefinition {
  name: string;
  steps: Array<{ name: string; index: number }>;
}

@Injectable()
export class FunnelAnalyticsService {
  private readonly logger = new Logger(FunnelAnalyticsService.name);
  private readonly CACHE_PREFIX = 'funnel:';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: DragonflyService,
  ) {}

  // ============================================================================
  // TRACKING METHODS
  // ============================================================================

  /**
   * Track a funnel step for a user
   */
  async trackStep(
    userId: string,
    sessionId: string,
    funnelName: string,
    stepName: string,
    stepIndex: number,
    metadata?: Record<string, any>,
  ): Promise<void> {
    try {
      await this.prisma.funnelEvent.upsert({
        where: {
          userId_funnelName_stepName_sessionId: {
            userId,
            funnelName,
            stepName,
            sessionId,
          },
        },
        create: {
          userId,
          sessionId,
          funnelName,
          stepName,
          stepIndex,
          metadata,
        },
        update: {
          timestamp: new Date(), // Update timestamp if re-entering same step
          metadata,
        },
      });

      // Invalidate cache for this funnel
      await this.cache.delete(`${this.CACHE_PREFIX}${funnelName}`);
    } catch (error) {
      this.logger.error(
        `Failed to track funnel step: ${funnelName}/${stepName}`,
        error,
      );
      // Don't throw - funnel tracking should never break user flow
    }
  }

  // ============================================================================
  // PREDEFINED FUNNELS
  // ============================================================================

  /**
   * Vendor Discovery Funnel
   * Steps: Landing → Search → View Profile → Contact → Lead Sent
   */
  async getVendorDiscoveryFunnel(
    startDate: Date,
    endDate: Date,
  ): Promise<ConversionFunnel> {
    const definition: FunnelDefinition = {
      name: 'vendor_discovery',
      steps: [
        { name: 'landing', index: 0 },
        { name: 'search', index: 1 },
        { name: 'view_profile', index: 2 },
        { name: 'contact_click', index: 3 },
        { name: 'lead_sent', index: 4 },
      ],
    };

    return this.calculateFunnel(definition, startDate, endDate);
  }

  /**
   * Event Creation Funnel
   * Steps: Sign Up → Create Event → Add Details → Invite Partners → Active Event
   */
  async getEventCreationFunnel(
    startDate: Date,
    endDate: Date,
  ): Promise<ConversionFunnel> {
    const definition: FunnelDefinition = {
      name: 'event_creation',
      steps: [
        { name: 'signup_complete', index: 0 },
        { name: 'create_event_start', index: 1 },
        { name: 'event_details_complete', index: 2 },
        { name: 'partner_invited', index: 3 },
        { name: 'event_active', index: 4 },
      ],
    };

    return this.calculateFunnel(definition, startDate, endDate);
  }

  /**
   * Vendor Onboarding Funnel
   * Steps: Sign Up → Create Profile → Add Services → Add Portfolio → Verification → First Lead
   */
  async getVendorOnboardingFunnel(
    startDate: Date,
    endDate: Date,
  ): Promise<ConversionFunnel> {
    const definition: FunnelDefinition = {
      name: 'vendor_onboarding',
      steps: [
        { name: 'signup_complete', index: 0 },
        { name: 'profile_created', index: 1 },
        { name: 'services_added', index: 2 },
        { name: 'portfolio_added', index: 3 },
        { name: 'profile_verified', index: 4 },
        { name: 'first_lead_received', index: 5 },
      ],
    };

    return this.calculateFunnel(definition, startDate, endDate);
  }

  /**
   * Lead Conversion Funnel
   * Steps: Lead Sent → Vendor Views → Vendor Responds → Conversation → Quote Sent → Booked
   */
  async getLeadConversionFunnel(
    startDate: Date,
    endDate: Date,
  ): Promise<ConversionFunnel> {
    const definition: FunnelDefinition = {
      name: 'lead_conversion',
      steps: [
        { name: 'lead_created', index: 0 },
        { name: 'vendor_viewed', index: 1 },
        { name: 'vendor_responded', index: 2 },
        { name: 'conversation_started', index: 3 },
        { name: 'quote_sent', index: 4 },
        { name: 'lead_won', index: 5 },
      ],
    };

    return this.calculateFunnel(definition, startDate, endDate);
  }

  // ============================================================================
  // FUNNEL CALCULATION ENGINE
  // ============================================================================

  /**
   * Calculate funnel metrics for a given definition
   */
  private async calculateFunnel(
    definition: FunnelDefinition,
    startDate: Date,
    endDate: Date,
  ): Promise<ConversionFunnel> {
    const cacheKey = `${this.CACHE_PREFIX}${definition.name}:${startDate.toISOString()}:${endDate.toISOString()}`;
    const cached = await this.cache.get<ConversionFunnel>(cacheKey);

    if (cached) {
      return cached;
    }

    // Get all users who entered the funnel (step 0)
    const enteredUsers = await this.prisma.funnelEvent.groupBy({
      by: ['userId'],
      where: {
        funnelName: definition.name,
        stepIndex: 0,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalEntered = enteredUsers.length;

    if (totalEntered === 0) {
      return {
        name: definition.name,
        period: { start: startDate, end: endDate },
        steps: definition.steps.map((step) => ({
          name: step.name,
          stepIndex: step.index,
          count: 0,
          percentage: 0,
          dropoffCount: 0,
          dropoffRate: 0,
          avgTimeToNext: null,
        })),
        totalEntered: 0,
        totalCompleted: 0,
        overallConversionRate: 0,
        avgCompletionTime: 0,
      };
    }

    const userIdList = enteredUsers.map((u) => u.userId);

    // Calculate metrics for each step
    const steps: FunnelStep[] = [];
    let previousStepCount = totalEntered;

    for (let i = 0; i < definition.steps.length; i++) {
      const step = definition.steps[i];
      const nextStep = definition.steps[i + 1];

      // Count users who reached this step
      const stepUsers = await this.prisma.funnelEvent.groupBy({
        by: ['userId'],
        where: {
          funnelName: definition.name,
          stepIndex: step.index,
          userId: { in: userIdList },
          timestamp: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const stepCount = stepUsers.length;
      const stepUserIds = stepUsers.map((u) => u.userId);

      // Calculate time to next step
      let avgTimeToNext: number | null = null;
      if (nextStep) {
        const timeDiffs = await this.prisma.$queryRaw<
          Array<{ avg_seconds: number }>
        >`
          SELECT AVG(EXTRACT(EPOCH FROM (next.timestamp - current.timestamp))) as avg_seconds
          FROM public."funnel_events" current
          INNER JOIN public."funnel_events" next
            ON current.user_id = next.user_id
            AND current.funnel_name = next.funnel_name
            AND current.session_id = next.session_id
          WHERE current.funnel_name = ${definition.name}
            AND current.step_index = ${step.index}
            AND next.step_index = ${nextStep.index}
            AND current.user_id = ANY(${stepUserIds}::uuid[])
            AND current.timestamp BETWEEN ${startDate} AND ${endDate}
        `;

        avgTimeToNext = timeDiffs[0]?.avg_seconds || null;
      }

      // Calculate dropoff
      const dropoffCount = previousStepCount - stepCount;
      const dropoffRate = previousStepCount > 0 ? dropoffCount / previousStepCount : 0;

      steps.push({
        name: step.name,
        stepIndex: step.index,
        count: stepCount,
        percentage: (stepCount / totalEntered) * 100,
        dropoffCount,
        dropoffRate: dropoffRate * 100,
        avgTimeToNext: avgTimeToNext ? Math.round(avgTimeToNext) : null,
      });

      previousStepCount = stepCount;
    }

    // Calculate overall metrics
    const lastStep = steps[steps.length - 1];
    const totalCompleted = lastStep?.count || 0;
    const overallConversionRate = (totalCompleted / totalEntered) * 100;

    // Calculate average completion time
    const completionTimes = await this.prisma.$queryRaw<
      Array<{ avg_seconds: number }>
    >`
      SELECT AVG(EXTRACT(EPOCH FROM (last.timestamp - first.timestamp))) as avg_seconds
      FROM public."funnel_events" first
      INNER JOIN public."funnel_events" last
        ON first.user_id = last.user_id
        AND first.funnel_name = last.funnel_name
        AND first.session_id = last.session_id
      WHERE first.funnel_name = ${definition.name}
        AND first.step_index = 0
        AND last.step_index = ${definition.steps[definition.steps.length - 1].index}
        AND first.user_id = ANY(${userIdList}::uuid[])
        AND first.timestamp BETWEEN ${startDate} AND ${endDate}
    `;

    const avgCompletionTime = completionTimes[0]?.avg_seconds
      ? Math.round(completionTimes[0].avg_seconds)
      : 0;

    const funnel: ConversionFunnel = {
      name: definition.name,
      period: { start: startDate, end: endDate },
      steps,
      totalEntered,
      totalCompleted,
      overallConversionRate,
      avgCompletionTime,
    };

    await this.cache.set(cacheKey, funnel, { ttl: this.CACHE_TTL });

    return funnel;
  }

  // ============================================================================
  // COMPARISON & ANALYSIS
  // ============================================================================

  /**
   * Compare two date periods for the same funnel
   */
  async comparePeriods(
    funnelName: string,
    periodA: { start: Date; end: Date },
    periodB: { start: Date; end: Date },
  ): Promise<{
    periodA: ConversionFunnel;
    periodB: ConversionFunnel;
    improvements: Array<{
      step: string;
      changePercent: number;
      direction: 'improved' | 'declined' | 'stable';
    }>;
  }> {
    const getFunnelByName = async (
      name: string,
      start: Date,
      end: Date,
    ): Promise<ConversionFunnel> => {
      switch (name) {
        case 'vendor_discovery':
          return this.getVendorDiscoveryFunnel(start, end);
        case 'event_creation':
          return this.getEventCreationFunnel(start, end);
        case 'vendor_onboarding':
          return this.getVendorOnboardingFunnel(start, end);
        case 'lead_conversion':
          return this.getLeadConversionFunnel(start, end);
        default:
          throw new Error(`Unknown funnel: ${name}`);
      }
    };

    const [funnelA, funnelB] = await Promise.all([
      getFunnelByName(funnelName, periodA.start, periodA.end),
      getFunnelByName(funnelName, periodB.start, periodB.end),
    ]);

    const improvements = funnelA.steps.map((stepA, index) => {
      const stepB = funnelB.steps[index];
      const changePercent =
        stepA.percentage > 0
          ? ((stepB.percentage - stepA.percentage) / stepA.percentage) * 100
          : 0;

      let direction: 'improved' | 'declined' | 'stable' = 'stable';
      if (changePercent > 5) direction = 'improved';
      if (changePercent < -5) direction = 'declined';

      return {
        step: stepA.name,
        changePercent: Math.round(changePercent * 10) / 10,
        direction,
      };
    });

    return {
      periodA: funnelA,
      periodB: funnelB,
      improvements,
    };
  }
}
```

---

### **STEP 3: Add API Controller Endpoints** (30 minutes)

Add to `backend/src/api/admin-gateway/controllers/insights.controller.ts`:

```typescript
// Add to imports
import { FunnelAnalyticsService } from '../../../domain/insights/services/funnel-analytics.service';

// Add to constructor
constructor(
  // ... existing services
  private readonly funnelAnalytics: FunnelAnalyticsService,
) {}

// Add endpoints

/**
 * Get vendor discovery funnel
 */
@Get('funnels/vendor-discovery')
async getVendorDiscoveryFunnel(@Query() query: DateRangeDto) {
  const endDate = query.endDate ? new Date(query.endDate) : new Date();
  const startDate = query.startDate
    ? new Date(query.startDate)
    : new Date(endDate.getTime() - (query.days || 30) * 24 * 60 * 60 * 1000);

  return this.funnelAnalytics.getVendorDiscoveryFunnel(startDate, endDate);
}

/**
 * Get event creation funnel
 */
@Get('funnels/event-creation')
async getEventCreationFunnel(@Query() query: DateRangeDto) {
  const endDate = query.endDate ? new Date(query.endDate) : new Date();
  const startDate = query.startDate
    ? new Date(query.startDate)
    : new Date(endDate.getTime() - (query.days || 30) * 24 * 60 * 60 * 1000);

  return this.funnelAnalytics.getEventCreationFunnel(startDate, endDate);
}

/**
 * Get vendor onboarding funnel
 */
@Get('funnels/vendor-onboarding')
async getVendorOnboardingFunnel(@Query() query: DateRangeDto) {
  const endDate = query.endDate ? new Date(query.endDate) : new Date();
  const startDate = query.startDate
    ? new Date(query.startDate)
    : new Date(endDate.getTime() - (query.days || 30) * 24 * 60 * 60 * 1000);

  return this.funnelAnalytics.getVendorOnboardingFunnel(startDate, endDate);
}

/**
 * Get lead conversion funnel
 */
@Get('funnels/lead-conversion')
async getLeadConversionFunnel(@Query() query: DateRangeDto) {
  const endDate = query.endDate ? new Date(query.endDate) : new Date();
  const startDate = query.startDate
    ? new Date(query.startDate)
    : new Date(endDate.getTime() - (query.days || 30) * 24 * 60 * 60 * 1000);

  return this.funnelAnalytics.getLeadConversionFunnel(startDate, endDate);
}

/**
 * Compare funnel between two periods (for A/B testing)
 */
@Get('funnels/compare')
async compareFunnelPeriods(
  @Query('funnel') funnelName: string,
  @Query('startA') startA: string,
  @Query('endA') endA: string,
  @Query('startB') startB: string,
  @Query('endB') endB: string,
) {
  return this.funnelAnalytics.comparePeriods(
    funnelName,
    { start: new Date(startA), end: new Date(endA) },
    { start: new Date(startB), end: new Date(startB) },
  );
}
```

---

### **STEP 4: Add Tracking to Frontend** (1 hour)

Create `frontend/src/lib/analytics/funnel-tracker.ts`:

```typescript
import { apiClient } from '@/lib/api/client';

class FunnelTracker {
  private sessionId: string;

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('funnel_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('funnel_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Track a funnel step
   */
  async track(
    funnelName: string,
    stepName: string,
    stepIndex: number,
    metadata?: Record<string, any>,
  ) {
    try {
      const userId = this.getUserId(); // Get from auth store
      if (!userId) return; // Don't track anonymous users

      await apiClient.post('/api/insights/track-funnel', {
        userId,
        sessionId: this.sessionId,
        funnelName,
        stepName,
        stepIndex,
        metadata,
      });
    } catch (error) {
      console.error('Funnel tracking failed:', error);
      // Don't throw - tracking should never break UX
    }
  }

  private getUserId(): string | null {
    // Get from your auth store
    // return useAuthStore.getState().user?.id || null;
    return null; // Replace with actual implementation
  }
}

export const funnelTracker = new FunnelTracker();

// Convenience methods for each funnel
export const vendorDiscoveryFunnel = {
  trackLanding: () => funnelTracker.track('vendor_discovery', 'landing', 0),
  trackSearch: (query: string) =>
    funnelTracker.track('vendor_discovery', 'search', 1, { query }),
  trackProfileView: (vendorId: string) =>
    funnelTracker.track('vendor_discovery', 'view_profile', 2, { vendorId }),
  trackContactClick: (vendorId: string) =>
    funnelTracker.track('vendor_discovery', 'contact_click', 3, { vendorId }),
  trackLeadSent: (leadId: string) =>
    funnelTracker.track('vendor_discovery', 'lead_sent', 4, { leadId }),
};

export const eventCreationFunnel = {
  trackSignup: () => funnelTracker.track('event_creation', 'signup_complete', 0),
  trackCreateStart: () => funnelTracker.track('event_creation', 'create_event_start', 1),
  trackDetailsComplete: (eventId: string) =>
    funnelTracker.track('event_creation', 'event_details_complete', 2, { eventId }),
  trackPartnerInvited: (eventId: string) =>
    funnelTracker.track('event_creation', 'partner_invited', 3, { eventId }),
  trackEventActive: (eventId: string) =>
    funnelTracker.track('event_creation', 'event_active', 4, { eventId }),
};
```

**Usage in components**:

```typescript
// In vendor search page
import { vendorDiscoveryFunnel } from '@/lib/analytics/funnel-tracker';

// Track when user lands on search page
useEffect(() => {
  vendorDiscoveryFunnel.trackLanding();
}, []);

// Track when user searches
const handleSearch = (query: string) => {
  vendorDiscoveryFunnel.trackSearch(query);
  // ... rest of search logic
};

// Track when user views vendor profile
const handleViewProfile = (vendorId: string) => {
  vendorDiscoveryFunnel.trackProfileView(vendorId);
  router.push(`/vendors/${vendorId}`);
};
```

---

### **STEP 5: Frontend Funnel Visualization** (2 hours)

Create `frontend/src/components/admin/funnel-chart.tsx`:

```typescript
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDown, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';

interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropoffRate: number;
  avgTimeToNext: number | null;
}

interface FunnelChartProps {
  funnel: {
    name: string;
    steps: FunnelStep[];
    totalEntered: number;
    overallConversionRate: number;
  };
}

export function FunnelChart({ funnel }: FunnelChartProps) {
  const getStepWidth = (percentage: number) => {
    return Math.max(percentage, 10); // Minimum 10% for visibility
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="capitalize">{funnel.name.replace(/_/g, ' ')}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {funnel.totalEntered.toLocaleString()} users entered
            </p>
          </div>
          <Badge variant={funnel.overallConversionRate > 50 ? 'default' : 'destructive'}>
            {funnel.overallConversionRate.toFixed(1)}% conversion
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnel.steps.map((step, index) => {
            const isLastStep = index === funnel.steps.length - 1;
            const hasHighDropoff = step.dropoffRate > 50;

            return (
              <div key={step.name}>
                {/* Step Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize">
                      {index + 1}. {step.name.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center gap-4">
                      <span className="text-muted-foreground">
                        {step.count.toLocaleString()} users ({step.percentage.toFixed(1)}%)
                      </span>
                      {!isLastStep && step.avgTimeToNext && (
                        <Badge variant="outline" className="text-xs">
                          Avg: {formatTime(step.avgTimeToNext)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Funnel Bar */}
                  <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary/80 transition-all"
                      style={{ width: `${getStepWidth(step.percentage)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-foreground mix-blend-difference">
                        {step.count.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Dropoff Indicator */}
                  {!isLastStep && (
                    <div className="flex items-center gap-2 pl-2">
                      <ArrowDown
                        className={`h-4 w-4 ${hasHighDropoff ? 'text-destructive' : 'text-muted-foreground'}`}
                      />
                      <span
                        className={`text-xs ${hasHighDropoff ? 'text-destructive font-medium' : 'text-muted-foreground'}`}
                      >
                        {step.dropoffRate.toFixed(1)}% drop-off ({step.count - (funnel.steps[index + 1]?.count || 0)} users)
                      </span>
                      {hasHighDropoff && (
                        <Badge variant="destructive" className="text-xs">
                          High drop-off!
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Connector */}
                {!isLastStep && (
                  <div className="flex justify-center py-2">
                    <ArrowDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 rounded-lg border p-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{funnel.totalEntered.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Started</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {funnel.steps[funnel.steps.length - 1]?.count.toLocaleString() || 0}
            </p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{funnel.overallConversionRate.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground">Conversion</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

**Create funnel page** `frontend/src/app/(admin)/admin/insights/funnels/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { FunnelChart } from '@/components/admin/funnel-chart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DateRangeSelector } from '@/components/charts';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export default function FunnelsPage() {
  const [dateRange, setDateRange] = useState({
    startDate: startOfDay(subDays(new Date(), 29)),
    endDate: endOfDay(new Date()),
  });

  const { data: vendorDiscovery } = useQuery({
    queryKey: ['funnel', 'vendor-discovery', dateRange],
    queryFn: () =>
      apiClient.get('/api/admin/insights/funnels/vendor-discovery', {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
      }),
  });

  const { data: eventCreation } = useQuery({
    queryKey: ['funnel', 'event-creation', dateRange],
    queryFn: () =>
      apiClient.get('/api/admin/insights/funnels/event-creation', {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
      }),
  });

  const { data: vendorOnboarding } = useQuery({
    queryKey: ['funnel', 'vendor-onboarding', dateRange],
    queryFn: () =>
      apiClient.get('/api/admin/insights/funnels/vendor-onboarding', {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
      }),
  });

  const { data: leadConversion } = useQuery({
    queryKey: ['funnel', 'lead-conversion', dateRange],
    queryFn: () =>
      apiClient.get('/api/admin/insights/funnels/lead-conversion', {
        params: { startDate: dateRange.startDate, endDate: dateRange.endDate },
      }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Conversion Funnels</h1>
          <p className="text-sm text-muted-foreground">
            Track user journeys and identify drop-off points
          </p>
        </div>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      <Tabs defaultValue="vendor-discovery">
        <TabsList>
          <TabsTrigger value="vendor-discovery">Vendor Discovery</TabsTrigger>
          <TabsTrigger value="event-creation">Event Creation</TabsTrigger>
          <TabsTrigger value="vendor-onboarding">Vendor Onboarding</TabsTrigger>
          <TabsTrigger value="lead-conversion">Lead Conversion</TabsTrigger>
        </TabsList>

        <TabsContent value="vendor-discovery" className="mt-6">
          {vendorDiscovery && <FunnelChart funnel={vendorDiscovery.data} />}
        </TabsContent>

        <TabsContent value="event-creation" className="mt-6">
          {eventCreation && <FunnelChart funnel={eventCreation.data} />}
        </TabsContent>

        <TabsContent value="vendor-onboarding" className="mt-6">
          {vendorOnboarding && <FunnelChart funnel={vendorOnboarding.data} />}
        </TabsContent>

        <TabsContent value="lead-conversion" className="mt-6">
          {leadConversion && <FunnelChart funnel={leadConversion.data} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## ✅ TESTING

1. **Backend**: Navigate to `/admin/insights/funnels/vendor-discovery?days=30`
2. **Track some events** manually via API or frontend
3. **View funnel** in admin dashboard
4. **Identify** which step has highest drop-off
5. **Optimize** that step
6. **Compare** before/after using date range selector

---

## 📊 INTERPRETING RESULTS

**Example Output**:
```
Vendor Discovery Funnel (30 days):
1. Landing: 1,000 users (100%)
2. Search: 750 users (75%) → 25% drop-off ✅ Good
3. View Profile: 450 users (45%) → 40% drop-off ❌ HIGH
4. Contact Click: 200 users (20%) → 56% drop-off ❌ VERY HIGH
5. Lead Sent: 150 users (15%) → 25% drop-off ✅ Good

Overall Conversion: 15%
```

**Action Items**:
- **Step 2→3**: 40% drop from search to profile view → Improve search results relevance
- **Step 3→4**: 56% drop from profile view to contact → Optimize vendor profiles (better photos, clearer pricing, reviews)

---

**Next**: Repeat this process for all 4 funnels → prioritize optimizations → ship improvements → measure impact! 🚀
