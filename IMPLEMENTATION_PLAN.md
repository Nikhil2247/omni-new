# Omnicassion Payment & Campaign System Implementation Plan

## Overview

Based on comprehensive codebase analysis, this plan outlines all missing features and implementation steps for completing the payment module using **Razorpay** and the campaign management system.

---

## Current Implementation Status

| Component | Backend | Frontend | Status |
|-----------|---------|----------|--------|
| Subscription Models | Complete | Complete | Working |
| Plan Management | Complete | Complete | Working |
| Feature Gates | Complete | Complete | Working |
| Usage Tracking | Complete | Complete | Working |
| **Payment Processing** | **Missing** | **Missing** | **CRITICAL** |
| **Razorpay Integration** | **Missing** | **Missing** | **CRITICAL** |
| **Checkout Flow** | **Missing** | **Missing** | **CRITICAL** |
| **Webhooks** | **Missing** | **Missing** | **CRITICAL** |
| Invoice Generation | Partial | Missing | HIGH |
| Campaign CRUD | Complete | API Only | HIGH |
| Campaign UI | N/A | Missing | HIGH |
| Ad Credits Purchase | Partial | Missing | HIGH |

---

## Phase 1: Razorpay Backend Integration

### 1.1 Install Dependencies

```bash
# Backend
cd apps/backend
npm install razorpay crypto
npm install -D @types/razorpay
```

### 1.2 Environment Configuration

```env
# .env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
FRONTEND_URL=http://localhost:3000
```

### 1.3 Create Razorpay Service

**File:** `apps/backend/src/domain/subscription/services/razorpay.service.ts`

```typescript
// Key functionalities:
- initializeRazorpay() - Initialize SDK with credentials
- createOrder() - Create Razorpay order for subscription/credits
- verifyPaymentSignature() - Verify payment callback signature
- fetchPayment() - Get payment details by ID
- createRefund() - Process refunds
- createSubscription() - For recurring payments (future)
```

### 1.4 Create Payment Controller

**File:** `apps/backend/src/api/user-gateway/controllers/payment.controller.ts`

```typescript
// Endpoints:
POST /payments/create-order      // Create Razorpay order
POST /payments/verify            // Verify payment after checkout
GET  /payments/history           // Get payment history
GET  /payments/:id               // Get payment details
```

**File:** `apps/backend/src/api/business-gateway/controllers/payment.controller.ts`

```typescript
// Same endpoints for business/vendor payments
POST /business/payments/create-order
POST /business/payments/verify
GET  /business/payments/history
```

### 1.5 Create Webhook Controller

**File:** `apps/backend/src/api/webhooks/razorpay-webhook.controller.ts`

```typescript
// Webhook events to handle:
- payment.authorized    // Payment authorized
- payment.captured      // Payment captured successfully
- payment.failed        // Payment failed
- refund.created        // Refund initiated
- refund.processed      // Refund completed
- subscription.activated // Subscription started
- subscription.charged   // Recurring charge
- subscription.cancelled // Subscription cancelled
```

### 1.6 Update Billing Service

**File:** `apps/backend/src/domain/subscription/services/billing.service.ts`

```typescript
// Add methods:
- processPayment() - Integrate with Razorpay (replace mock)
- handlePaymentSuccess() - Update invoice, emit events
- handlePaymentFailure() - Update status, retry logic
- processRefund() - Create refund via Razorpay
```

### 1.7 Create DTOs

**File:** `apps/backend/src/domain/subscription/dto/razorpay.dto.ts`

```typescript
// DTOs needed:
- CreateOrderDto { amount, currency, planId?, type }
- VerifyPaymentDto { razorpay_order_id, razorpay_payment_id, razorpay_signature }
- RazorpayWebhookDto { event, payload }
- RefundRequestDto { paymentId, amount?, reason }
```

---

## Phase 2: Razorpay Frontend Integration

### 2.1 Install Dependencies

```bash
# Frontend
cd apps/frontend
npm install razorpay
```

### 2.2 Create Razorpay Types

**File:** `apps/frontend/src/lib/api/types/payment.types.ts`

```typescript
interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

interface PaymentVerifyRequest {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface PaymentResult {
  success: boolean;
  paymentId?: string;
  error?: string;
}
```

### 2.3 Create Payment Service

**File:** `apps/frontend/src/lib/api/services/payment.service.ts`

```typescript
// Methods:
- createOrder(amount, planId, type) - Create order on backend
- verifyPayment(paymentDetails) - Verify with backend
- getPaymentHistory() - Fetch payment history
- getPaymentDetails(id) - Get single payment
```

### 2.4 Create Razorpay Hook

**File:** `apps/frontend/src/hooks/use-razorpay.ts`

```typescript
// Hook functionality:
- loadRazorpayScript() - Dynamically load checkout.js
- openCheckout(options) - Open Razorpay checkout modal
- handlePaymentSuccess() - Process successful payment
- handlePaymentFailure() - Handle failures
```

### 2.5 Create Checkout Component

**File:** `apps/frontend/src/components/payment/checkout-modal.tsx`

```typescript
// Features:
- Plan selection summary
- Price display with tax
- Razorpay checkout trigger
- Loading states
- Error handling
- Success/failure callbacks
```

### 2.6 Create Payment Pages

**Files:**
- `apps/frontend/src/app/(user)/checkout/page.tsx`
- `apps/frontend/src/app/(user)/payment/success/page.tsx`
- `apps/frontend/src/app/(user)/payment/failed/page.tsx`
- `apps/frontend/src/app/(business)/business/checkout/page.tsx`
- `apps/frontend/src/app/(business)/business/payment/success/page.tsx`
- `apps/frontend/src/app/(business)/business/payment/failed/page.tsx`

### 2.7 Update Pricing Page

**File:** `apps/frontend/src/app/(public)/pricing/page.tsx`

```typescript
// Add:
- "Subscribe" buttons that redirect to checkout
- Handle plan selection with query params
- Show current plan for logged-in users
```

---

## Phase 3: Campaign Management UI

### 3.1 Campaign List Page

**File:** `apps/frontend/src/app/(business)/business/marketing/campaigns/page.tsx`

```typescript
// Features:
- Campaign list with status badges (DRAFT, ACTIVE, PAUSED, etc.)
- Filter by status, type
- Sort by date, budget, performance
- Quick actions (pause, resume, stop)
- Create new campaign button
- Budget utilization display
```

### 3.2 Campaign Creation Form

**File:** `apps/frontend/src/app/(business)/business/marketing/campaigns/new/page.tsx`

```typescript
// Form fields:
- Campaign type selector (PROFILE_BOOST, ALBUM_PROMOTION, etc.)
- Name and description
- Daily budget input
- Total budget input
- Start date picker
- End date picker (optional)
- Target entity selector (portfolio, service)
- Budget validation (daily <= total)
```

### 3.3 Campaign Detail Page

**File:** `apps/frontend/src/app/(business)/business/marketing/campaigns/[campaignId]/page.tsx`

```typescript
// Features:
- Campaign overview with status
- Performance metrics (impressions, clicks, conversions)
- CTR and conversion rate
- Cost per click/conversion
- Daily stats chart
- Budget utilization progress
- Action buttons (pause, resume, stop, edit)
```

### 3.4 Campaign Edit Page

**File:** `apps/frontend/src/app/(business)/business/marketing/campaigns/[campaignId]/edit/page.tsx`

```typescript
// Same as creation form but pre-filled
// Only editable for DRAFT/SCHEDULED campaigns
```

### 3.5 Campaign Components

**Files:**
- `apps/frontend/src/components/campaigns/campaign-card.tsx`
- `apps/frontend/src/components/campaigns/campaign-status-badge.tsx`
- `apps/frontend/src/components/campaigns/campaign-metrics.tsx`
- `apps/frontend/src/components/campaigns/campaign-form.tsx`
- `apps/frontend/src/components/campaigns/daily-stats-chart.tsx`

---

## Phase 4: Ad Credits System

### 4.1 Ad Credits Page

**File:** `apps/frontend/src/app/(business)/business/marketing/credits/page.tsx`

```typescript
// Features:
- Current balance display (prominent)
- Monthly allocation info (for PRO/ENTERPRISE)
- Transaction history table
- Spending summary chart
- Purchase credits button
- Low balance warning
```

### 4.2 Credit Purchase Flow

**File:** `apps/frontend/src/components/credits/purchase-credits-modal.tsx`

```typescript
// Features:
- Credit package selection (1000, 5000, 10000)
- Custom amount input
- Price display (credits to INR conversion)
- Razorpay checkout integration
- Success confirmation
```

### 4.3 Update Backend Credit Purchase

**File:** `apps/backend/src/api/business-gateway/controllers/ad-credits.controller.ts`

```typescript
// Update purchaseCredits():
- Create Razorpay order
- Return order details to frontend
- Handle payment verification
- Grant credits only after payment confirmed
```

---

## Phase 5: Invoice System

### 5.1 Invoice Generation Service

**File:** `apps/backend/src/domain/subscription/services/invoice-generator.service.ts`

```typescript
// Features:
- Generate PDF invoices using pdfkit or puppeteer
- Include company details, customer info, line items
- Calculate taxes (GST for India)
- Upload to S3/storage
- Return download URL
```

### 5.2 Invoice Display

**Files:**
- `apps/frontend/src/app/(user)/settings/billing/page.tsx`
- `apps/frontend/src/app/(business)/business/settings/billing/page.tsx`

```typescript
// Features:
- Invoice list with status
- Download PDF button
- Payment status indicators
- Filter by date range
```

---

## Phase 6: Additional Features

### 6.1 Payment Method Management

**Files:**
- `apps/frontend/src/components/payment/payment-methods.tsx`
- `apps/frontend/src/components/payment/add-payment-method.tsx`

```typescript
// Features:
- List saved payment methods
- Add new card/UPI
- Set default method
- Remove payment method
```

### 6.2 Automated Subscription Renewal

**File:** `apps/backend/src/domain/subscription/schedulers/subscription.scheduler.ts`

```typescript
// Scheduled tasks:
- Check subscriptions ending in 3 days (reminder)
- Process auto-renewals at period end
- Handle failed renewals with grace period
- Downgrade to FREE on non-payment
```

### 6.3 Trial Management

**File:** `apps/backend/src/domain/subscription/schedulers/trial.scheduler.ts`

```typescript
// Scheduled tasks:
- Send reminder 3 days before trial ends
- Convert trial to paid (if payment method exists)
- Downgrade to FREE (if no payment method)
```

---

## Implementation Order

### Week 1: Razorpay Core

1. Backend Razorpay service setup
2. Payment controller endpoints
3. Webhook handling
4. Frontend Razorpay hook
5. Checkout modal component

### Week 2: Payment Flow

6. Checkout pages (user & vendor)
7. Success/failure pages
8. Update pricing page buttons
9. Payment history page
10. Basic testing

### Week 3: Campaign UI

11. Campaign list page
12. Campaign creation form
13. Campaign detail page
14. Campaign components
15. Campaign stats charts

### Week 4: Credits & Invoices

16. Ad credits page
17. Credit purchase with payment
18. Invoice generation service
19. Billing/invoice pages
20. Payment method management

### Week 5: Automation & Polish

21. Subscription renewal scheduler
22. Trial management scheduler
23. Email notifications
24. Error handling improvements
25. End-to-end testing

---

## File Structure Summary

```
apps/backend/src/
├── domain/subscription/
│   ├── services/
│   │   ├── razorpay.service.ts      [NEW]
│   │   ├── invoice-generator.service.ts [NEW]
│   │   └── billing.service.ts       [UPDATE]
│   ├── dto/
│   │   └── razorpay.dto.ts          [NEW]
│   └── schedulers/
│       ├── subscription.scheduler.ts [NEW]
│       └── trial.scheduler.ts        [NEW]
├── api/
│   ├── user-gateway/controllers/
│   │   └── payment.controller.ts     [NEW]
│   ├── business-gateway/controllers/
│   │   ├── payment.controller.ts     [NEW]
│   │   └── ad-credits.controller.ts  [UPDATE]
│   └── webhooks/
│       └── razorpay-webhook.controller.ts [NEW]

apps/frontend/src/
├── lib/api/
│   ├── types/
│   │   └── payment.types.ts          [NEW]
│   └── services/
│       └── payment.service.ts        [NEW]
├── hooks/
│   └── use-razorpay.ts               [NEW]
├── components/
│   ├── payment/
│   │   ├── checkout-modal.tsx        [NEW]
│   │   ├── payment-methods.tsx       [NEW]
│   │   └── add-payment-method.tsx    [NEW]
│   ├── campaigns/
│   │   ├── campaign-card.tsx         [NEW]
│   │   ├── campaign-status-badge.tsx [NEW]
│   │   ├── campaign-metrics.tsx      [NEW]
│   │   ├── campaign-form.tsx         [NEW]
│   │   └── daily-stats-chart.tsx     [NEW]
│   └── credits/
│       └── purchase-credits-modal.tsx [NEW]
├── app/
│   ├── (user)/
│   │   ├── checkout/page.tsx         [NEW]
│   │   ├── payment/
│   │   │   ├── success/page.tsx      [NEW]
│   │   │   └── failed/page.tsx       [NEW]
│   │   └── settings/billing/page.tsx [NEW]
│   └── (business)/business/
│       ├── checkout/page.tsx         [NEW]
│       ├── payment/
│       │   ├── success/page.tsx      [NEW]
│       │   └── failed/page.tsx       [NEW]
│       ├── marketing/
│       │   ├── campaigns/
│       │   │   ├── page.tsx          [NEW]
│       │   │   ├── new/page.tsx      [NEW]
│       │   │   └── [campaignId]/
│       │   │       ├── page.tsx      [NEW]
│       │   │       └── edit/page.tsx [NEW]
│       │   └── credits/page.tsx      [NEW]
│       └── settings/billing/page.tsx [NEW]
```

---

## API Endpoints Summary

### Payment Endpoints (New)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/payments/create-order` | Create Razorpay order |
| POST | `/payments/verify` | Verify payment signature |
| GET | `/payments/history` | Get payment history |
| GET | `/payments/:id` | Get payment details |
| POST | `/webhooks/razorpay` | Razorpay webhook handler |

### Business Payment Endpoints (New)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/business/payments/create-order` | Create order for vendor |
| POST | `/business/payments/verify` | Verify vendor payment |
| GET | `/business/payments/history` | Vendor payment history |

---

## Testing Checklist

### Payment Flow
- [ ] Create order succeeds
- [ ] Razorpay checkout opens
- [ ] Payment verification works
- [ ] Webhook updates payment status
- [ ] Invoice generated after payment
- [ ] Subscription activated after payment

### Campaign Flow
- [ ] Create campaign with validation
- [ ] Start/pause/resume/stop campaigns
- [ ] Daily stats recording
- [ ] Budget exhaustion handling
- [ ] Credits deduction

### Ad Credits Flow
- [ ] Display balance correctly
- [ ] Purchase flow with payment
- [ ] Credits granted after payment
- [ ] Transaction history accurate

---

## Environment Variables Required

```env
# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# Frontend
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx

# Storage (for invoices)
AWS_S3_BUCKET=omnicassion-invoices
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_REGION=ap-south-1
```
