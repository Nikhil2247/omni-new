# 📊 INSIGHTS MODULE - COMPREHENSIVE ENHANCEMENT PLAN

**Project**: Omnicassion V2.0
**Purpose**: Transform insights into enterprise-grade analytics for scaling & data-driven decisions
**Target Roles**: ADMIN (platform analytics), BUSINESS (vendor intelligence), USER (personal insights)

---

## 🎯 STRATEGIC OBJECTIVES

### **Why This Matters for Scaling**
1. **Data-Driven Product Decisions**: Know exactly what features to build next
2. **Revenue Optimization**: Understand which categories/vendors drive profit
3. **Churn Prevention**: Predict and prevent user/vendor churn before it happens
4. **Growth Levers**: Identify and amplify what drives user acquisition
5. **Operational Efficiency**: Automate insights that currently require manual analysis
6. **Competitive Intelligence**: Benchmark performance against industry standards
7. **Investor Metrics**: Track SaaS metrics investors care about (CAC, LTV, MRR, churn)

---

## 📋 CURRENT STATE ANALYSIS

### **✅ What You Have (Solid Foundation)**
- User engagement tracking (sessions, searches, leads, messages)
- Vendor performance metrics (views, leads, conversions, response times)
- Platform health (DAU/WAU/MAU, distributions, growth trends)
- Admin dashboard with executive summary
- Retention cohorts (weekly/monthly)
- Industry benchmarks for vendors
- Real-time statistics
- Search analytics
- Top performers ranking

### **❌ Critical Gaps for Scaling**
1. No user behavior funnels (don't know where users drop off)
2. No revenue analytics (can't answer "which categories make money?")
3. No churn prediction (react to churn instead of preventing it)
4. No cohort LTV analysis (don't know long-term value of users)
5. No A/B testing framework (can't validate feature changes)
6. No user segmentation (treat all users the same)
7. No predictive analytics (all reactive, not proactive)
8. No marketing attribution (don't know which channels work)
9. No financial forecasting (can't predict next quarter revenue)
10. No custom reporting (manual exports for stakeholders)

---

## 🚀 COMPREHENSIVE ENHANCEMENTS

## **PHASE 1: USER BEHAVIOR INTELLIGENCE** (Foundation for Product Decisions)

### **1.1 Conversion Funnels & Drop-off Analysis** ⭐ HIGH PRIORITY

**Why**: Know exactly where users abandon the journey → optimize for conversions

**Implementation**:

```typescript
// backend/src/domain/insights/services/funnel-analytics.service.ts

export interface FunnelStep {
  name: string
  event: string
  count: number
  percentage: number
  dropoffRate: number
  avgTimeToNext: number | null
}

export interface ConversionFunnel {
  name: string
  steps: FunnelStep[]
  totalEntered: number
  totalCompleted: number
  overallConversionRate: number
  avgCompletionTime: number
}

@Injectable()
export class FunnelAnalyticsService {
  // Predefined funnels
  async getVendorDiscoveryFunnel(startDate: Date, endDate: Date): Promise<ConversionFunnel> {
    // Steps: Landing → Search → View Profile → Contact → Lead Sent
  }

  async getEventCreationFunnel(startDate: Date, endDate: Date): Promise<ConversionFunnel> {
    // Steps: Sign Up → Create Event → Add Details → Invite Partners → Active Event
  }

  async getVendorOnboardingFunnel(startDate: Date, endDate: Date): Promise<ConversionFunnel> {
    // Steps: Sign Up → Create Profile → Add Services → Verification → First Lead
  }

  async getLeadConversionFunnel(startDate: Date, endDate: Date): Promise<ConversionFunnel> {
    // Steps: Lead Sent → Vendor Views → Vendor Responds → Conversation → Booked/Won
  }

  // Custom funnel builder
  async buildCustomFunnel(name: string, steps: string[]): Promise<ConversionFunnel>

  // Funnel comparison (A/B test results)
  async compareFunnels(funnelA: string, funnelB: string): Promise<FunnelComparison>
}
```

**Database Schema** (new table):
```typescript
model FunnelEvent {
  id        String   @id @default(uuid())
  userId    String
  sessionId String
  funnelName String
  stepName  String
  stepIndex Int
  timestamp DateTime @default(now())
  metadata  Json?

  user User @relation(fields: [userId], references: [id])

  @@index([userId, funnelName])
  @@index([sessionId, funnelName])
  @@index([timestamp])
}
```

**API Endpoints**:
```typescript
GET /admin/insights/funnels/vendor-discovery
GET /admin/insights/funnels/event-creation
GET /admin/insights/funnels/lead-conversion
POST /admin/insights/funnels/custom
GET /admin/insights/funnels/compare
```

**Frontend Component** (`/admin/insights/funnels`):
```typescript
<FunnelVisualization
  funnel={vendorDiscoveryFunnel}
  highlightDropoffs={true}
  showTimings={true}
/>
```

---

### **1.2 User Journey Mapping** ⭐ HIGH PRIORITY

**Why**: Understand actual user paths (not just predefined funnels)

**Implementation**:

```typescript
// backend/src/domain/insights/services/journey-analytics.service.ts

export interface JourneyPath {
  path: string[]  // e.g., ["home", "search", "vendor_profile", "contact"]
  count: number
  avgDuration: number
  conversionRate: number
  commonNextSteps: { step: string; probability: number }[]
}

@Injectable()
export class JourneyAnalyticsService {
  // Most common user paths
  async getTopJourneys(role: 'USER' | 'BUSINESS', limit: number): Promise<JourneyPath[]>

  // Paths that lead to conversion
  async getSuccessfulJourneys(): Promise<JourneyPath[]>

  // Paths that lead to abandonment
  async getAbandonmentJourneys(): Promise<JourneyPath[]>

  // Predict next best action for a user
  async predictNextStep(userId: string): Promise<{ step: string; confidence: number }[]>
}
```

**Use Cases**:
- "Users who search for 'photographers' tend to also search for 'videographers' 78% of the time"
- "Users who add 3+ vendors to wishlist have 5x higher conversion rate"
- "90% of users who view pricing page but don't contact vendor need a reminder email"

---

### **1.3 Feature Adoption Tracking**

**Why**: Know which features to double down on and which to sunset

**Implementation**:

```typescript
// Track feature usage automatically
export interface FeatureAdoption {
  featureName: string
  category: 'core' | 'secondary' | 'experimental'
  totalUsers: number
  activeUsers: number  // Used in last 30 days
  adoptionRate: number
  retentionRate: number
  avgUsageFrequency: number
  powerUsers: number  // Top 10% users
  churnRate: number
}

@Injectable()
export class FeatureAdoptionService {
  async trackFeatureUsage(userId: string, featureName: string): Promise<void>

  async getFeatureAdoption(days: number): Promise<FeatureAdoption[]>

  async getFeatureStickinessScore(featureName: string): Promise<number>

  // Feature usage by cohort
  async getFeatureAdoptionByCohort(featureName: string): Promise<CohortAdoption[]>
}
```

**Features to Track**:
- **Core**: Event creation, vendor search, lead sending, messaging
- **Secondary**: Wishlist, checklist, budget tracker, timeline
- **Experimental**: Vibe quiz, whatsapp invites, partner collaboration

---

### **1.4 User Segmentation Engine** ⭐ CRITICAL FOR PERSONALIZATION

**Why**: Treat different user types differently → higher retention & revenue

**Implementation**:

```typescript
export interface UserSegment {
  id: string
  name: string
  description: string
  criteria: SegmentCriteria
  userCount: number
  avgLTV: number
  churnRate: number
  conversionRate: number
}

export interface SegmentCriteria {
  role?: 'USER' | 'BUSINESS'
  signupDateRange?: { start: Date; end: Date }
  engagementScore?: { min: number; max: number }
  totalSpent?: { min: number; max: number }
  leadsSent?: { min: number; max: number }
  eventStatus?: string[]
  location?: string[]
  behaviors?: { action: string; frequency: number }[]
}

@Injectable()
export class SegmentationService {
  // Predefined segments
  async getHighValueUsers(): Promise<UserSegment>  // Top 20% by LTV
  async getAtRiskUsers(): Promise<UserSegment>     // High churn probability
  async getChampions(): Promise<UserSegment>       // High engagement + high spending
  async getNewcomers(): Promise<UserSegment>       // Signed up in last 30 days
  async getDormantUsers(): Promise<UserSegment>    // Inactive for 60+ days

  // RFM Analysis (Recency, Frequency, Monetary)
  async getRFMSegments(): Promise<RFMSegment[]>

  // Custom segments
  async createCustomSegment(criteria: SegmentCriteria): Promise<UserSegment>

  // Segment growth/decline
  async getSegmentTrends(segmentId: string): Promise<SegmentTrend[]>
}
```

**RFM Segments** (Industry Standard):
- **Champions**: Recent, frequent, high-value
- **Loyal Customers**: Frequent, moderate spend
- **Potential Loyalists**: Recent, moderate frequency
- **New Customers**: Very recent, low frequency
- **Promising**: Recent, low frequency
- **Need Attention**: Moderate recency, declining
- **About to Sleep**: Low recency, low frequency
- **At Risk**: Low recency, was high-value
- **Can't Lose Them**: Lowest recency, was high-value
- **Hibernating**: Very low recency, very low value
- **Lost**: Lowest scores across all metrics

---

## **PHASE 2: REVENUE & BUSINESS INTELLIGENCE**

### **2.1 Revenue Analytics Dashboard** ⭐ CRITICAL FOR BUSINESS

**Why**: Know exactly where money comes from and where it goes

**Implementation**:

```typescript
export interface RevenueMetrics {
  // Overall
  totalRevenue: number
  recurringRevenue: number  // MRR if subscription model
  oneTimeRevenue: number
  revenueGrowthRate: number
  revenuePerUser: number
  revenuePerVendor: number

  // By category
  byCategoryBreakdown: CategoryRevenue[]
  topRevenueCategories: { category: string; revenue: number; percentage: number }[]

  // By geography
  byRegion: RegionRevenue[]
  topRevenueRegions: string[]

  // Commission tracking
  totalCommissions: number
  pendingPayouts: number
  paidOut: number

  // Forecasting
  projectedMonthly: number
  projectedQuarterly: number
  projectedYearly: number
}

export interface CategoryRevenue {
  categoryId: string
  categoryName: string
  revenue: number
  leads: number
  conversions: number
  avgDealSize: number
  profitMargin: number
}

@Injectable()
export class RevenueAnalyticsService {
  async getRevenueMetrics(startDate: Date, endDate: Date): Promise<RevenueMetrics>

  async getRevenueBreakdown(groupBy: 'category' | 'region' | 'vendor'): Promise<any[]>

  async getRevenueTrends(period: 'daily' | 'weekly' | 'monthly'): Promise<RevenueTrend[]>

  async getCommissionReport(vendorId?: string): Promise<CommissionReport>

  // Revenue forecasting (linear regression + seasonality)
  async forecastRevenue(months: number): Promise<RevenueForecast[]>
}
```

---

### **2.2 Unit Economics & SaaS Metrics** ⭐ INVESTOR-GRADE

**Why**: Track metrics investors care about for fundraising/valuation

**Implementation**:

```typescript
export interface SaaSMetrics {
  // Customer Metrics
  totalCustomers: number
  newCustomers: number
  churnedCustomers: number
  netRevRetention: number  // NRR

  // Financial Metrics
  MRR: number  // Monthly Recurring Revenue
  ARR: number  // Annual Recurring Revenue
  ARPU: number  // Average Revenue Per User
  LTV: number  // Customer Lifetime Value
  CAC: number  // Customer Acquisition Cost
  LTV_CAC_Ratio: number  // Should be > 3
  paybackPeriod: number  // Months to recover CAC
  grossMargin: number

  // Growth Metrics
  MRR_Growth: number
  quickRatio: number  // (New MRR + Expansion) / (Churned MRR + Contraction)

  // Efficiency Metrics
  burnRate: number
  runway: number  // Months of cash left
  capitalEfficiency: number
}

@Injectable()
export class SaaSMetricsService {
  async getSaaSMetrics(asOf: Date): Promise<SaaSMetrics>

  async getLTVBySegment(): Promise<Map<string, number>>

  async getCACByChannel(): Promise<Map<string, number>>

  async calculatePaybackPeriod(): Promise<number>

  async getUnitEconomics(): Promise<UnitEconomics>
}
```

---

### **2.3 Vendor Business Intelligence** ⭐ FOR BUSINESS ROLE

**Why**: Give vendors actionable insights to grow their business on your platform

**Implementation**:

```typescript
// Endpoint: GET /business/insights/dashboard
export interface VendorBusinessInsights {
  // Performance vs Peers
  ranking: {
    overall: number
    inCategory: number
    inRegion: number
  }

  // Revenue Insights
  revenue: {
    total: number
    projected30Days: number
    avgDealSize: number
    topRevenueSources: string[]
  }

  // Lead Quality
  leadQuality: {
    avgLeadScore: number
    topLeadSources: string[]
    bestPerformingTimes: { day: string; hour: number }[]
    conversionRateByLeadSource: Map<string, number>
  }

  // Competitive Intelligence
  competitive: {
    avgCategoryPrice: number
    yourPrice: number
    pricePositioning: 'budget' | 'mid' | 'premium'
    marketShare: number
    topCompetitors: { name: string; leads: number }[]
  }

  // Recommendations
  recommendations: {
    type: 'pricing' | 'response_time' | 'portfolio' | 'availability'
    impact: 'high' | 'medium' | 'low'
    message: string
    expectedImprovement: string
  }[]

  // Growth Opportunities
  opportunities: {
    untappedRegions: string[]
    trendingCategories: string[]
    seasonalDemand: { month: number; demandMultiplier: number }[]
  }
}

@Injectable()
export class VendorIntelligenceService {
  async getVendorInsights(vendorId: string): Promise<VendorBusinessInsights>

  async getCompetitiveAnalysis(vendorId: string): Promise<CompetitiveAnalysis>

  async getGrowthOpportunities(vendorId: string): Promise<GrowthOpportunity[]>

  async getPricingRecommendations(vendorId: string): Promise<PricingRecommendation>
}
```

---

## **PHASE 3: PREDICTIVE ANALYTICS & AI**

### **3.1 Churn Prediction** ⭐ CRITICAL FOR RETENTION

**Why**: Prevent churn before it happens → retain 20-30% more users

**Implementation**:

```typescript
export interface ChurnPrediction {
  userId: string
  churnProbability: number  // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  churnFactors: {
    factor: string
    weight: number
    description: string
  }[]
  recommendedActions: {
    action: string
    priority: number
    expectedImpact: number
  }[]
  daysToChurn: number | null
}

@Injectable()
export class ChurnPredictionService {
  // ML Model training
  async trainChurnModel(): Promise<ModelMetrics>

  // Predict churn for all users
  async predictChurnRisk(): Promise<ChurnPrediction[]>

  // Get users at high risk
  async getHighRiskUsers(limit: number): Promise<ChurnPrediction[]>

  // Predict churn for specific user
  async predictUserChurn(userId: string): Promise<ChurnPrediction>

  // Automated interventions
  async triggerRetentionCampaign(userIds: string[]): Promise<void>
}
```

**Churn Factors to Track**:
- Days since last activity
- Engagement score decline rate
- Failed payment attempts
- Support tickets opened
- Feature usage drop-off
- Session frequency decline
- Negative sentiment in messages
- Competitor browsing behavior

---

### **3.2 Lead Scoring & Conversion Prediction**

**Why**: Prioritize high-value leads → increase conversion rate

**Implementation**:

```typescript
export interface LeadScore {
  leadId: string
  score: number  // 0-100
  conversionProbability: number  // 0-1
  tier: 'cold' | 'warm' | 'hot' | 'scorching'
  signals: {
    signal: string
    impact: number
    description: string
  }[]
  recommendedFollowUpTime: Date
  urgency: 'low' | 'medium' | 'high'
}

@Injectable()
export class LeadScoringService {
  async scoreAllLeads(): Promise<LeadScore[]>

  async getHotLeads(vendorId?: string): Promise<LeadScore[]>

  async predictLeadConversion(leadId: string): Promise<LeadScore>

  // Optimal contact timing
  async getOptimalContactTime(leadId: string): Promise<Date>
}
```

**Scoring Signals**:
- User engagement history
- Event budget size
- Event date proximity
- Number of vendors contacted
- Message response rate
- Profile completeness
- Payment method on file

---

### **3.3 Demand Forecasting**

**Why**: Know when to hire vendors, run promotions, allocate resources

**Implementation**:

```typescript
export interface DemandForecast {
  period: Date
  categoryId: string
  predictedLeads: number
  confidenceInterval: { low: number; high: number }
  seasonalityFactor: number
  trendDirection: 'increasing' | 'stable' | 'decreasing'
}

@Injectable()
export class DemandForecastingService {
  // Forecast leads by category
  async forecastDemand(categoryId: string, months: number): Promise<DemandForecast[]>

  // Seasonal patterns
  async getSeasonalityPatterns(categoryId: string): Promise<SeasonalityPattern>

  // Vendor capacity planning
  async getVendorCapacityNeeds(categoryId: string, region: string): Promise<CapacityRecommendation>
}
```

---

## **PHASE 4: MARKETING & ATTRIBUTION ANALYTICS**

### **4.1 Attribution Modeling** ⭐ KNOW WHAT WORKS

**Why**: Stop wasting money on channels that don't convert

**Implementation**:

```typescript
export interface AttributionReport {
  channel: string
  touchpoints: number
  assisted Conversions: number
  lastClickConversions: number
  firstClickConversions: number
  linearAttributionValue: number
  timeDecayAttributionValue: number
  uShapedAttributionValue: number
  CAC: number
  ROAS: number  // Return on Ad Spend
}

@Injectable()
export class AttributionService {
  async getAttributionReport(model: 'firstClick' | 'lastClick' | 'linear' | 'timeDecay' | 'uShaped'): Promise<AttributionReport[]>

  async getChannelEffectiveness(): Promise<ChannelMetrics[]>

  async getMultiTouchJourneys(): Promise<CustomerJourney[]>
}
```

**Channels to Track**:
- Organic search (SEO)
- Paid search (Google Ads)
- Social media (organic & paid)
- Email campaigns
- Referrals
- Direct traffic
- Content marketing
- Influencer partnerships

---

### **4.2 Campaign Performance Tracking**

**Why**: Measure ROI of marketing campaigns

**Implementation**:

```typescript
export interface CampaignMetrics {
  campaignId: string
  name: string
  channel: string
  status: 'active' | 'paused' | 'completed'

  // Reach
  impressions: number
  reach: number

  // Engagement
  clicks: number
  CTR: number

  // Conversions
  signups: number
  leads: number
  conversions: number
  conversionRate: number

  // Financial
  spend: number
  revenue: number
  ROI: number
  CAC: number
  LTV: number
  LTV_CAC_Ratio: number
}

@Injectable()
export class CampaignAnalyticsService {
  async trackCampaignEvent(campaignId: string, event: string, userId?: string): Promise<void>

  async getCampaignMetrics(campaignId: string): Promise<CampaignMetrics>

  async compareCampaigns(campaignIds: string[]): Promise<CampaignComparison>

  async getTopPerformingCampaigns(): Promise<CampaignMetrics[]>
}
```

---

## **PHASE 5: CUSTOM REPORTING & DATA EXPORTS**

### **5.1 Report Builder**

**Why**: Empower teams to answer their own questions

**Implementation**:

```typescript
export interface CustomReport {
  id: string
  name: string
  description: string
  metrics: string[]  // Which KPIs to include
  dimensions: string[]  // Group by what
  filters: ReportFilter[]
  dateRange: { start: Date; end: Date }
  visualization: 'table' | 'chart' | 'mixed'
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly'
    recipients: string[]
  }
}

@Injectable()
export class ReportBuilderService {
  async createReport(report: CustomReport): Promise<string>

  async runReport(reportId: string): Promise<ReportData>

  async scheduleReport(reportId: string, schedule: ReportSchedule): Promise<void>

  async exportReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<Buffer>
}
```

---

### **5.2 Data Warehouse Integration**

**Why**: Connect to BI tools (Metabase, Looker, Tableau) for advanced analysis

**Implementation**:

```typescript
// Expose read-only database replica for analytics tools
// Configure BigQuery/Snowflake sync
// Create materialized views for common queries
```

---

## 📊 IMPLEMENTATION PRIORITY MATRIX

### **Must-Have (Launch Blockers)**
1. ✅ User Segmentation (already critical for personalization)
2. ✅ Conversion Funnels (need to know where users drop)
3. ✅ Revenue Analytics (business viability)
4. ✅ Vendor Business Intelligence (vendor retention)

### **Should-Have (6-Month Roadmap)**
5. Churn Prediction
6. Lead Scoring
7. Attribution Modeling
8. Feature Adoption Tracking

### **Nice-to-Have (12-Month Roadmap)**
9. User Journey Mapping
10. Demand Forecasting
11. Campaign Analytics
12. Custom Report Builder

---

## 🎯 QUICK WINS (Implement First)

### **Week 1-2: Conversion Funnels**
- Track 3 core funnels (vendor discovery, event creation, lead conversion)
- Build funnel visualization component
- Identify top drop-off points

### **Week 3-4: User Segmentation**
- Implement RFM analysis
- Create 10 predefined segments
- Build segment dashboard

### **Week 5-6: Revenue Analytics**
- Track revenue by category
- Calculate LTV and CAC
- Build revenue forecast model

### **Week 7-8: Vendor Intelligence**
- Competitive benchmarking
- Personalized recommendations
- Growth opportunities

---

## 📈 SUCCESS METRICS

**Track These to Measure Impact**:
- ✅ Conversion rate improvement (target: +15% after funnel optimization)
- ✅ Churn reduction (target: -20% after prediction model)
- ✅ Revenue per user increase (target: +25% after segmentation)
- ✅ CAC reduction (target: -30% after attribution modeling)
- ✅ Vendor retention increase (target: +40% after business intelligence)

---

## 🛠️ TECHNICAL ARCHITECTURE

### **Database Changes**:
```sql
-- Funnel tracking
CREATE TABLE funnel_events (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  session_id VARCHAR(255),
  funnel_name VARCHAR(100),
  step_name VARCHAR(100),
  step_index INTEGER,
  timestamp TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- User segments
CREATE TABLE user_segments (
  id UUID PRIMARY KEY,
  name VARCHAR(100),
  criteria JSONB,
  user_count INTEGER,
  last_calculated TIMESTAMP
);

CREATE TABLE user_segment_memberships (
  user_id UUID,
  segment_id UUID,
  added_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, segment_id)
);

-- Revenue tracking
CREATE TABLE revenue_events (
  id UUID PRIMARY KEY,
  user_id UUID,
  vendor_id UUID,
  lead_id UUID,
  amount DECIMAL(10,2),
  commission DECIMAL(10,2),
  category_id UUID,
  event_date DATE,
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- Attribution tracking
CREATE TABLE marketing_touchpoints (
  id UUID PRIMARY KEY,
  user_id UUID,
  session_id VARCHAR(255),
  channel VARCHAR(50),
  campaign_id VARCHAR(100),
  source VARCHAR(100),
  medium VARCHAR(100),
  content VARCHAR(255),
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### **Caching Strategy**:
- Cache funnel results for 5 minutes
- Cache segment membership for 1 hour
- Cache revenue reports for 15 minutes
- Real-time for churn predictions

### **Background Jobs** (BullMQ):
- Daily: Calculate user segments
- Daily: Update churn scores
- Hourly: Refresh revenue metrics
- Weekly: Train ML models
- Monthly: Generate trend reports

---

## 📚 DELIVERABLES CHECKLIST

### **Backend Services**
- [ ] FunnelAnalyticsService
- [ ] JourneyAnalyticsService
- [ ] SegmentationService
- [ ] RevenueAnalyticsService
- [ ] SaaSMetricsService
- [ ] VendorIntelligenceService
- [ ] ChurnPredictionService
- [ ] LeadScoringService
- [ ] AttributionService
- [ ] ReportBuilderService

### **API Endpoints**
- [ ] GET /admin/insights/funnels/:name
- [ ] GET /admin/insights/segments
- [ ] GET /admin/insights/revenue
- [ ] GET /admin/insights/saas-metrics
- [ ] GET /business/insights/dashboard
- [ ] GET /business/insights/competitive-analysis
- [ ] GET /admin/insights/churn-risk
- [ ] GET /admin/insights/attribution

### **Frontend Pages**
- [ ] /admin/insights/funnels
- [ ] /admin/insights/segments
- [ ] /admin/insights/revenue
- [ ] /admin/insights/predictions
- [ ] /business/insights (vendor dashboard)
- [ ] /user/insights (personal analytics)

### **Components**
- [ ] FunnelVisualization
- [ ] SegmentBuilder
- [ ] RevenueChart
- [ ] ChurnRiskTable
- [ ] AttributionSankey
- [ ] ReportBuilder

---

## 🎓 LEARNING RESOURCES

**For Implementing These Features**:
- Segment's [Analytics Academy](https://segment.com/academy/)
- Mixpanel's [Product Analytics Playbook](https://mixpanel.com/playbook/)
- Amplitude's [Mastering Retention](https://amplitude.com/books/mastering-retention)
- ChartMogul's [SaaS Metrics Guide](https://chartmogul.com/blog/saas-metrics/)
- OpenView's [SaaS Benchmarks](https://openviewpartners.com/blog/saas-benchmarks/)

---

**Ready to Start**: Begin with Phase 1.1 (Conversion Funnels) - highest ROI, lowest complexity!
