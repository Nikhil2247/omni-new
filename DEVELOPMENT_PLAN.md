# Omnicassion V2.0 - Development Plan
## Hyper-Scalable Event Planning Ecosystem

**Author:** Senior Principal Architect
**Version:** 1.0
**Target Scale:** 100k+ DAU, High Concurrency Write/Read Loads

---

## Executive Summary

This document outlines the phased development approach for Omnicassion V2.0, a **Modular Monolith** designed with explicit seams for future Microservices decomposition. The architecture follows **Service-Based patterns** with Event-Driven side effects, ensuring horizontal scalability without code refactoring.

---

## Part 1: Architecture Decisions Record (ADR)

### ADR-001: Modular Monolith with Microservices-Ready Seams

**Decision:** Build as Modular Monolith with strict module boundaries.

**Rationale:**
- Reduces operational complexity during MVP phase
- Maintains strong consistency guarantees
- Each domain module communicates via **In-Process Event Bus** (easily swapped to message broker)
- Module boundaries enforced via **NestJS Dynamic Modules** with explicit exports

**Future Split Strategy:**
```
Module Communication Pattern:
┌─────────────────────────────────────────────────────────────┐
│  Current: @nestjs/event-emitter (In-Process)                │
│  Future:  RabbitMQ/Kafka Topic per Bounded Context          │
└─────────────────────────────────────────────────────────────┘
```

### ADR-002: Service-Based Architecture

**Decision:** Use traditional NestJS service-based architecture with event-driven side effects.

```
Request Flow:
┌──────────┐    ┌─────────────┐    ┌────────────┐    ┌──────────┐
│ Controller│───▶│   Service   │───▶│ Repository │───▶│ Postgres │
│  (REST)  │    │  (Business) │    │  (Prisma)  │    │   (DB)   │
└──────────┘    └──────┬──────┘    └────────────┘    └──────────┘
                       │
                       ▼ Domain Event (@nestjs/event-emitter)
                ┌─────────────┐
                │  Event Bus  │
                └──────┬──────┘
                       │
    ┌──────────────────┼──────────────────┐
    ▼                  ▼                  ▼
┌─────────┐     ┌─────────────┐    ┌───────────┐
│ Cache   │     │ Meilisearch │    │ WebSocket │
│ Update  │     │   Indexer   │    │  Notify   │
└─────────┘     └─────────────┘    └───────────┘
```

**Rationale:**
- Simpler mental model for developers
- Easier debugging and testing
- Standard NestJS patterns
- Events used only for side effects (cache invalidation, search indexing, notifications)

### ADR-003: Multi-Gateway API Architecture

**Decision:** Separate API Gateways per Actor Type with shared authentication.

**Rationale:**
- Different rate limits per actor type
- Independent scaling of gateway pods (future)
- Clear authorization boundaries
- Separate OpenAPI specs per audience

```
Gateway Routing Matrix:
┌─────────────────────┬──────────────────┬────────────────┬─────────────┬─────────────────────────────────────────┐
│ Gateway             │ Base Path        │ Auth Strategy  │ Rate Limit  │ Authorized Roles                        │
├─────────────────────┼──────────────────┼────────────────┼─────────────┼─────────────────────────────────────────┤
│ admin-gateway       │ /api/admin/*     │ JWT + RBAC     │ 1000/min    │ ADMIN_SYSTEM                            │
│ ops-gateway         │ /api/ops/*       │ JWT + RBAC     │ 500/min     │ OPERATIONAL_ADMIN, OPERATIONAL_MANAGER, │
│                     │                  │                │             │ OPERATIONAL_ASSISTANT                   │
│ marketing-gateway   │ /api/marketing/* │ JWT + RBAC     │ 300/min     │ MARKETING_SERVICES_ADMIN, CONTENT_WRITER│
│                     │                  │                │             │ MULTI_MEDIA_MANAGER                     │
│ sales-gateway       │ /api/sales/*     │ JWT + RBAC     │ 300/min     │ SALES_MANAGER, OPERATIONAL_MANAGER      │
│ business-gateway    │ /api/business/*  │ JWT + Tenant   │ 200/min     │ BUSINESS_ADMIN                          │
│ user-gateway        │ /api/user/*      │ JWT + Session  │ 100/min     │ USER, BUSINESS_ADMIN                    │
│ public-gateway      │ /api/public/*    │ API Key/None   │ 50/min      │ Anonymous                               │
└─────────────────────┴──────────────────┴────────────────┴─────────────┴─────────────────────────────────────────┘
```

### ADR-004: Role Hierarchy & Permissions

**Decision:** Implement hierarchical RBAC with granular permissions per role.

```
Role Hierarchy & Permissions Matrix:
┌──────────────────────────┬─────────────────────────────────────────────────────────────────────┐
│ Role                     │ Permissions & Responsibilities                                       │
├──────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ ADMIN_SYSTEM             │ Full system access (superuser)                                       │
│ (System Admin)           │ • Manage all users and roles                                        │
│                          │ • System configuration                                               │
│                          │ • Access all modules and data                                       │
│                          │ • Audit logs and compliance                                          │
├──────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ OPERATIONAL_ADMIN        │ Full operational control (Control Tower)                             │
│ (Ops Admin)              │ • Manage operations team                                            │
│                          │ • KYC/KYB approval/rejection                                        │
│                          │ • Dispute resolution                                                 │
│                          │ • Vendor verification                                                │
│                          │ • Platform moderation                                                │
│                          │ EVENT WORKFLOW:                                                      │
│                          │ • Verify & convert CRM leads to Active Events                       │
│                          │ • Create Direct Booking events (walk-ins, phone)                    │
│                          │ • Assign Ops Managers to events                                     │
│                          │ • View Global Calendar & Financial Dashboard                        │
│                          │ • Monitor team analytics & invoice center                           │
├──────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ OPERATIONAL_MANAGER      │ Event execution management                                           │
│ (Ops Manager)            │ • Assign tasks to assistants                                        │
│                          │ • Review KYC submissions                                             │
│                          │ • Handle escalated disputes                                          │
│                          │ • View analytics/reports                                             │
│                          │ EVENT WORKFLOW:                                                      │
│                          │ • Create Requirement Sheets for assigned events                     │
│                          │ • Search & select vendors from Internal Database                    │
│                          │ • Negotiate & enter agreed amounts                                  │
│                          │ • Send vendor agreements & track acceptance                         │
│                          │ • Create & delegate tasks to Ops Assistants/Vendors                 │
│                          │ • Review task submissions & approve/reject                          │
│                          │ • View event-level cost vs budget                                   │
├──────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ OPERATIONAL_ASSISTANT    │ Execute operational tasks (Boots on the Ground)                     │
│ (Ops Assistant)          │ • Process KYC documents                                             │
│                          │ • First-line dispute handling                                        │
│                          │ • Content moderation                                                 │
│                          │ • User support tickets                                               │
│                          │ EVENT WORKFLOW:                                                      │
│                          │ • Receive assigned tasks on mobile                                  │
│                          │ • Execute field work (collections, setups, verifications)           │
│                          │ • Upload proof attachments (photos, PDFs, receipts)                 │
│                          │ • Submit tasks for manager review                                   │
├──────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ MARKETING_SERVICES_ADMIN │ Marketing & services management                                      │
│ (Marketing Admin)        │ • Campaign management                                                │
│                          │ • Featured vendor promotions                                         │
│                          │ • Service category management                                        │
│                          │ • Manage content & media teams                                      │
├──────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ CONTENT_WRITER           │ Content creation & management                                        │
│                          │ • Blog posts, articles                                               │
│                          │ • SEO content                                                        │
│                          │ • Vendor spotlights                                                  │
│                          │ • Email newsletter content                                           │
├──────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ MULTI_MEDIA_MANAGER      │ Media asset management                                               │
│                          │ • Image/video moderation                                             │
│                          │ • CDN management                                                     │
│                          │ • Media optimization                                                 │
│                          │ • Gallery curation                                                   │
├──────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ SALES_MANAGER            │ Sales & lead management                                              │
│                          │ • View all leads/inquiries                                           │
│                          │ • Sales analytics                                                    │
│                          │ • Vendor acquisition                                                 │
│                          │ • Partnership management                                             │
├──────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ BUSINESS_ADMIN           │ Vendor/Business administration                                       │
│ (Vendor Account)         │ • Manage own vendor profile                                         │
│                          │ • Portfolio & media management                                       │
│                          │ • Lead/inquiry responses                                             │
│                          │ • View own analytics                                                 │
│                          │ • Pricing & service management                                       │
│                          │ EVENT WORKFLOW:                                                      │
│                          │ • Receive vendor agreement notifications                            │
│                          │ • Accept/Decline agreements                                         │
│                          │ • Receive assigned operational tasks                                │
│                          │ • Upload task proofs & submit for review                            │
│                          │ • Mark date availability (blocked dates)                            │
├──────────────────────────┼─────────────────────────────────────────────────────────────────────┤
│ USER                     │ Standard platform user                                               │
│ (End User/Planner)       │ • Browse vendors                                                     │
│                          │ • Create events                                                      │
│                          │ • Send inquiries                                                     │
│                          │ • Planning tools access                                              │
│                          │ • Submit reviews                                                     │
└──────────────────────────┴─────────────────────────────────────────────────────────────────────┘

Role Inheritance (Higher roles inherit lower role permissions):
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ADMIN_SYSTEM                                      │
│                                 │                                            │
│          ┌──────────────────────┼──────────────────────┐                    │
│          ▼                      ▼                      ▼                    │
│  OPERATIONAL_ADMIN     MARKETING_SERVICES_ADMIN   SALES_MANAGER             │
│          │                      │                                            │
│          ▼                      ├────────────────┐                          │
│  OPERATIONAL_MANAGER            │                │                          │
│          │                      ▼                ▼                          │
│          ▼               CONTENT_WRITER   MULTI_MEDIA_MANAGER               │
│  OPERATIONAL_ASSISTANT                                                       │
│                                                                              │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Business & End Users (No inheritance - standalone permissions):            │
│                                                                              │
│          BUSINESS_ADMIN ◄───────────────────► USER                          │
│          (Vendors)                            (Planners/Couples)            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### ADR-005: Database Partitioning Strategy

**Decision:** Partition high-volume tables by time (Year-Quarter) and region.

```sql
-- Events Table: Partition by event_date (Year)
events_y2024, events_y2025, events_y2026...

-- Leads Table: Partition by created_at (Year-Quarter)
leads_2024_q1, leads_2024_q2, leads_2024_q3, leads_2024_q4...

-- Analytics: Partition by region + month
analytics_us_2024_01, analytics_eu_2024_01...
```

### ADR-006: Caching Strategy Matrix

```
┌─────────────────────┬──────────────────┬─────────────┬─────────────┐
│ Data Type           │ Strategy         │ TTL         │ Invalidation│
├─────────────────────┼──────────────────┼─────────────┼─────────────┤
│ Vendor Profile      │ Cache-Aside      │ 15 min      │ On Update   │
│ Event Details       │ Cache-Aside      │ 5 min       │ On Update   │
│ Discovery Feed      │ Read-Through     │ 1 min       │ Background  │
│ Like/View Counters  │ Write-Through    │ Permanent   │ Never       │
│ Session Data        │ Write-Behind     │ 24 hours    │ On Logout   │
│ Search Results      │ Cache-Aside      │ 30 sec      │ On Index    │
└─────────────────────┴──────────────────┴─────────────┴─────────────┘
```

### ADR-007: Engineering Best Practices

**Decision:** Implement robust patterns for data operations, lookups, and system reliability.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        ENGINEERING BEST PRACTICES                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. TRANSACTION MANAGEMENT                                                       │
│  ─────────────────────────                                                       │
│  • Use database transactions for multi-step write operations                    │
│  • Batch uploads (photos, documents) wrapped in transactions                    │
│  • Implement saga pattern for cross-module operations                           │
│  • Use optimistic locking for concurrent updates                                │
│                                                                                  │
│  2. LOOKUP SERVICES                                                              │
│  ─────────────────────                                                           │
│  • Dedicated lookup services for frequently accessed reference data             │
│  • Pre-loaded and cached at startup (countries, categories, roles)              │
│  • In-memory maps for O(1) lookups                                              │
│  • Background refresh on data changes                                           │
│                                                                                  │
│  3. BULK OPERATIONS                                                              │
│  ──────────────────                                                              │
│  • Chunked processing for large datasets (batch size: 100-500)                  │
│  • Streaming uploads with progress tracking                                     │
│  • Queue-based processing for heavy operations                                  │
│  • Partial failure handling with rollback support                               │
│                                                                                  │
│  4. RESILIENCE PATTERNS                                                          │
│  ──────────────────────                                                          │
│  • Circuit breaker for external service calls                                   │
│  • Retry with exponential backoff                                               │
│  • Timeout policies per operation type                                          │
│  • Graceful degradation on service failures                                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**7.1 Transaction Patterns for Bulk Uploads:**

```typescript
// infrastructure/storage/upload.service.ts
@Injectable()
export class UploadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async uploadPortfolioMedia(
    vendorProfileId: string,
    portfolioId: string,
    files: Express.Multer.File[],
  ): Promise<UploadResult> {
    const uploadedFiles: UploadedFile[] = [];
    const failedFiles: FailedUpload[] = [];

    // 1. Upload files to storage first (outside transaction)
    for (const file of files) {
      try {
        const uploaded = await this.storageService.upload(file, {
          bucket: 'portfolios',
          path: `${vendorProfileId}/${portfolioId}`,
        });
        uploadedFiles.push(uploaded);
      } catch (error) {
        failedFiles.push({ file: file.originalname, error: error.message });
      }
    }

    if (uploadedFiles.length === 0) {
      throw new BadRequestException('All file uploads failed');
    }

    // 2. Database operations in transaction
    const mediaItems = await this.prisma.$transaction(async (tx) => {
      // Get current max sort order
      const lastItem = await tx.mediaItem.findFirst({
        where: { portfolioId },
        orderBy: { sortOrder: 'desc' },
        select: { sortOrder: true },
      });

      let sortOrder = (lastItem?.sortOrder ?? -1) + 1;

      // Batch insert all media items
      const items = await Promise.all(
        uploadedFiles.map((file) =>
          tx.mediaItem.create({
            data: {
              portfolioId,
              type: file.mimeType.startsWith('video') ? 'VIDEO' : 'IMAGE',
              url: file.url,
              thumbnailUrl: file.thumbnailUrl,
              cdnUrl: file.cdnUrl,
              width: file.width,
              height: file.height,
              size: file.size,
              mimeType: file.mimeType,
              sortOrder: sortOrder++,
            },
          }),
        ),
      );

      // Update portfolio timestamp
      await tx.portfolio.update({
        where: { id: portfolioId },
        data: { updatedAt: new Date() },
      });

      return items;
    });

    // 3. Emit event for async processing (thumbnails, CDN sync)
    this.eventEmitter.emit('media.uploaded', {
      vendorProfileId,
      portfolioId,
      mediaItems,
    });

    return {
      successful: mediaItems.length,
      failed: failedFiles,
      items: mediaItems,
    };
  }
}
```

**7.2 Lookup Service Pattern:**

```typescript
// core/lookup/lookup.module.ts
@Global()
@Module({
  providers: [
    CountryLookupService,
    CategoryLookupService,
    RoleLookupService,
    ServiceTypeLookupService,
    EventTypeLookupService,
  ],
  exports: [
    CountryLookupService,
    CategoryLookupService,
    RoleLookupService,
    ServiceTypeLookupService,
    EventTypeLookupService,
  ],
})
export class LookupModule implements OnModuleInit {
  constructor(
    private readonly countryLookup: CountryLookupService,
    private readonly categoryLookup: CategoryLookupService,
    private readonly roleLookup: RoleLookupService,
  ) {}

  async onModuleInit() {
    // Pre-load all lookup data at startup
    await Promise.all([
      this.countryLookup.initialize(),
      this.categoryLookup.initialize(),
      this.roleLookup.initialize(),
    ]);
  }
}

// core/lookup/services/category-lookup.service.ts
@Injectable()
export class CategoryLookupService {
  private categoriesById: Map<string, Category> = new Map();
  private categoriesBySlug: Map<string, Category> = new Map();
  private categoryTree: Category[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Listen for category changes
    this.eventEmitter.on('category.updated', () => this.refresh());
  }

  async initialize(): Promise<void> {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ parentId: 'asc' }, { sortOrder: 'asc' }],
    });

    this.categoriesById.clear();
    this.categoriesBySlug.clear();

    for (const category of categories) {
      this.categoriesById.set(category.id, category);
      this.categoriesBySlug.set(category.slug, category);
    }

    // Build tree structure
    this.categoryTree = this.buildTree(categories);
  }

  // O(1) lookups
  getById(id: string): Category | undefined {
    return this.categoriesById.get(id);
  }

  getBySlug(slug: string): Category | undefined {
    return this.categoriesBySlug.get(slug);
  }

  getAll(): Category[] {
    return Array.from(this.categoriesById.values());
  }

  getTree(): Category[] {
    return this.categoryTree;
  }

  getChildren(parentId: string): Category[] {
    return this.getAll().filter((c) => c.parentId === parentId);
  }

  async refresh(): Promise<void> {
    await this.initialize();
  }

  private buildTree(categories: Category[]): Category[] {
    const map = new Map<string, Category & { children: Category[] }>();
    const roots: (Category & { children: Category[] })[] = [];

    categories.forEach((cat) => map.set(cat.id, { ...cat, children: [] }));

    categories.forEach((cat) => {
      if (cat.parentId) {
        map.get(cat.parentId)?.children.push(map.get(cat.id)!);
      } else {
        roots.push(map.get(cat.id)!);
      }
    });

    return roots;
  }
}
```

**7.3 Chunked Processing for Bulk Operations:**

```typescript
// core/common/utils/batch-processor.ts
export class BatchProcessor {
  static async processInChunks<T, R>(
    items: T[],
    processor: (chunk: T[]) => Promise<R[]>,
    options: { chunkSize?: number; onProgress?: (processed: number, total: number) => void } = {},
  ): Promise<R[]> {
    const { chunkSize = 100, onProgress } = options;
    const results: R[] = [];
    let processed = 0;

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      const chunkResults = await processor(chunk);
      results.push(...chunkResults);

      processed += chunk.length;
      onProgress?.(processed, items.length);
    }

    return results;
  }

  static async processWithTransaction<T, R>(
    prisma: PrismaService,
    items: T[],
    processor: (tx: Prisma.TransactionClient, item: T) => Promise<R>,
    options: { chunkSize?: number; maxRetries?: number } = {},
  ): Promise<{ successful: R[]; failed: { item: T; error: string }[] }> {
    const { chunkSize = 50, maxRetries = 3 } = options;
    const successful: R[] = [];
    const failed: { item: T; error: string }[] = [];

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);

      try {
        const results = await prisma.$transaction(
          async (tx) => {
            return Promise.all(chunk.map((item) => processor(tx, item)));
          },
          { timeout: 30000, maxWait: 5000 },
        );
        successful.push(...results);
      } catch (error) {
        // Process individually on chunk failure
        for (const item of chunk) {
          try {
            const result = await prisma.$transaction((tx) => processor(tx, item));
            successful.push(result);
          } catch (itemError) {
            failed.push({ item, error: itemError.message });
          }
        }
      }
    }

    return { successful, failed };
  }
}
```

**7.4 Circuit Breaker for External Services:**

```typescript
// infrastructure/resilience/circuit-breaker.service.ts
import CircuitBreaker from 'opossum';

@Injectable()
export class CircuitBreakerService {
  private breakers: Map<string, CircuitBreaker> = new Map();

  create<T>(
    name: string,
    action: (...args: any[]) => Promise<T>,
    options: CircuitBreakerOptions = {},
  ): CircuitBreaker<T> {
    const defaultOptions = {
      timeout: 10000,           // 10 seconds
      errorThresholdPercentage: 50,
      resetTimeout: 30000,      // 30 seconds
      volumeThreshold: 5,       // Min requests before tripping
    };

    const breaker = new CircuitBreaker(action, { ...defaultOptions, ...options });

    breaker.on('open', () => {
      this.logger.warn(`Circuit breaker "${name}" opened`);
    });

    breaker.on('halfOpen', () => {
      this.logger.log(`Circuit breaker "${name}" half-open, testing...`);
    });

    breaker.on('close', () => {
      this.logger.log(`Circuit breaker "${name}" closed`);
    });

    this.breakers.set(name, breaker);
    return breaker;
  }

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }
}

// Usage in external service
@Injectable()
export class PaymentGatewayService {
  private processPaymentBreaker: CircuitBreaker;

  constructor(
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly httpService: HttpService,
  ) {
    this.processPaymentBreaker = this.circuitBreakerService.create(
      'payment-gateway',
      this.processPaymentInternal.bind(this),
      { timeout: 15000, errorThresholdPercentage: 30 },
    );
  }

  async processPayment(payload: PaymentPayload): Promise<PaymentResult> {
    return this.processPaymentBreaker.fire(payload);
  }

  private async processPaymentInternal(payload: PaymentPayload): Promise<PaymentResult> {
    const response = await firstValueFrom(
      this.httpService.post('/payments', payload),
    );
    return response.data;
  }
}
```

### ADR-008: WebSocket-Based Real-time Notifications

**Decision:** Use WebSockets (@nestjs/websockets with Socket.IO) for real-time notifications and messaging.

```
WebSocket Architecture:
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        REAL-TIME COMMUNICATION                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Client (Next.js)                    Server (NestJS)                            │
│  ┌─────────────┐                     ┌─────────────────────────────────────┐    │
│  │  Socket.IO  │◄───────────────────▶│  WebSocket Gateway                  │    │
│  │   Client    │     WSS/TLS         │  ├── NotificationGateway            │    │
│  └─────────────┘                     │  ├── MessagingGateway               │    │
│                                      │  └── Authenticated via JWT          │    │
│                                      └─────────────────────────────────────┘    │
│                                                     │                            │
│                                                     ▼                            │
│                                      ┌─────────────────────────────────────┐    │
│                                      │  Event Handlers (Domain Events)     │    │
│                                      │  • lead.created → notify vendor     │    │
│                                      │  • message.sent → notify recipient  │    │
│                                      │  • event.updated → notify planner   │    │
│                                      └─────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

Notification Events:
┌────────────────────────┬──────────────────────────────────────────────────────────┐
│ Event                  │ Description                                               │
├────────────────────────┼──────────────────────────────────────────────────────────┤
│ notification:new       │ New notification received                                 │
│ notification:read      │ Notification marked as read                               │
│ lead:new               │ New lead received (vendor)                                │
│ lead:status_changed    │ Lead status updated                                       │
│ message:new            │ New message in lead conversation                          │
│ message:read           │ Message read receipt                                      │
│ event:updated          │ Event details changed                                     │
│ vendor:verified        │ Vendor verification status changed                        │
└────────────────────────┴──────────────────────────────────────────────────────────┘
```

**8.1 WebSocket Gateway Implementation:**

```typescript
// infrastructure/websockets/notification.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtGuard } from './websocket-auth.guard';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({
  namespace: '/notifications',
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Set<string>> = new Map();

  async handleConnection(client: Socket) {
    try {
      const user = await this.validateToken(client.handshake.auth.token);
      client.data.userId = user.id;

      // Track user's socket connections
      if (!this.userSockets.has(user.id)) {
        this.userSockets.set(user.id, new Set());
      }
      this.userSockets.get(user.id).add(client.id);

      // Join user-specific room
      client.join(`user:${user.id}`);

      // Join role-based rooms for broadcasts
      user.roles.forEach(role => client.join(`role:${role}`));
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
  }

  // Send notification to specific user
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Send to all users with specific role
  sendToRole(role: string, event: string, data: any) {
    this.server.to(`role:${role}`).emit(event, data);
  }

  // Listen for domain events and broadcast
  @OnEvent('lead.created')
  handleLeadCreated(payload: LeadCreatedEvent) {
    this.sendToUser(payload.vendorUserId, 'lead:new', {
      id: payload.leadId,
      message: 'New lead received',
      data: payload.summary,
    });
  }

  @OnEvent('message.sent')
  handleMessageSent(payload: MessageSentEvent) {
    this.sendToUser(payload.recipientId, 'message:new', {
      leadId: payload.leadId,
      message: payload.preview,
      senderId: payload.senderId,
    });
  }

  @SubscribeMessage('notification:mark_read')
  @UseGuards(WsJwtGuard)
  async handleMarkRead(client: Socket, notificationId: string) {
    // Mark notification as read in database
    await this.notificationService.markAsRead(client.data.userId, notificationId);
    return { success: true };
  }
}
```

**8.2 WebSocket Authentication Guard:**

```typescript
// infrastructure/websockets/websocket-auth.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new WsException('Unauthorized');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;
      return true;
    } catch {
      throw new WsException('Invalid token');
    }
  }
}
```

### ADR-009: Database Indexing Strategy

**Decision:** Implement strategic indexes based on query patterns and access frequency.

```
Indexing Strategy by Table:
┌─────────────────────┬─────────────────────────────────┬──────────────────────────────────┐
│ Table               │ Index Type                      │ Purpose                          │
├─────────────────────┼─────────────────────────────────┼──────────────────────────────────┤
│ users               │                                 │                                  │
│                     │ UNIQUE(email)                   │ Login lookup                     │
│                     │ INDEX(status)                   │ Active user filtering            │
│                     │ INDEX(created_at)               │ User analytics                   │
├─────────────────────┼─────────────────────────────────┼──────────────────────────────────┤
│ user_role_assignments│                                │                                  │
│                     │ INDEX(user_id)                  │ User roles lookup                │
│                     │ INDEX(role_id)                  │ Role-based queries               │
│                     │ UNIQUE(user_id, role_id)        │ Prevent duplicate assignments    │
├─────────────────────┼─────────────────────────────────┼──────────────────────────────────┤
│ vendor_profiles     │                                 │                                  │
│                     │ UNIQUE(slug)                    │ URL-based lookup                 │
│                     │ INDEX(category_id, status)      │ Category browsing                │
│                     │ INDEX(status, avg_rating DESC)  │ Top-rated queries                │
│                     │ INDEX(address_id)               │ Location-based joins             │
│                     │ INDEX(created_at)               │ New vendor listings              │
│                     │ GIN(to_tsvector(business_name)) │ Full-text search (PostgreSQL)    │
├─────────────────────┼─────────────────────────────────┼──────────────────────────────────┤
│ addresses           │                                 │                                  │
│                     │ INDEX(city_id)                  │ City-based filtering             │
│                     │ INDEX(latitude, longitude)      │ Geo-spatial queries              │
│                     │ GIST(point(lat,lng))            │ Radius search (with PostGIS)     │
├─────────────────────┼─────────────────────────────────┼──────────────────────────────────┤
│ leads               │                                 │                                  │
│                     │ INDEX(vendor_profile_id, status)│ Vendor lead management           │
│                     │ INDEX(planner_id)               │ User lead history                │
│                     │ INDEX(created_at DESC)          │ Recent leads                     │
│                     │ INDEX(status, created_at)       │ Lead funnel analytics            │
├─────────────────────┼─────────────────────────────────┼──────────────────────────────────┤
│ reviews             │                                 │                                  │
│                     │ INDEX(vendor_profile_id, status)│ Approved vendor reviews          │
│                     │ INDEX(author_id)                │ User review history              │
│                     │ INDEX(created_at DESC)          │ Recent reviews                   │
├─────────────────────┼─────────────────────────────────┼──────────────────────────────────┤
│ events              │                                 │                                  │
│                     │ INDEX(user_id)                  │ User events lookup               │
│                     │ INDEX(event_type_id)            │ Event type filtering             │
│                     │ INDEX(date)                     │ Upcoming events                  │
│                     │ INDEX(status)                   │ Active events                    │
├─────────────────────┼─────────────────────────────────┼──────────────────────────────────┤
│ categories          │                                 │                                  │
│                     │ UNIQUE(slug)                    │ URL-based lookup                 │
│                     │ INDEX(parent_id)                │ Subcategory queries              │
│                     │ INDEX(is_active, sort_order)    │ Active categories listing        │
├─────────────────────┼─────────────────────────────────┼──────────────────────────────────┤
│ services            │                                 │                                  │
│                     │ INDEX(vendor_profile_id)        │ Vendor services lookup           │
│                     │ INDEX(service_type_id)          │ Service type filtering           │
│                     │ INDEX(vendor_profile_id, is_active)│ Active vendor services        │
└─────────────────────┴─────────────────────────────────┴──────────────────────────────────┘

Index Best Practices:
• Use composite indexes for frequently combined WHERE clauses
• Place high-cardinality columns first in composite indexes
• Consider partial indexes for status-based queries (WHERE status = 'ACTIVE')
• Use covering indexes for read-heavy queries
• Monitor index usage with pg_stat_user_indexes
• Avoid over-indexing write-heavy tables
```

### ADR-010: Database Normalization Strategy

**Decision:** Apply 3NF normalization with strategic denormalization for read performance.

```
Normalization Decisions:
┌───────────────────────┬─────────────────────────────────────────────────────────────┐
│ Data Element          │ Decision & Rationale                                         │
├───────────────────────┼─────────────────────────────────────────────────────────────┤
│ User Roles            │ NORMALIZED: Role table with hierarchy support.              │
│                       │ Allows dynamic role creation, role inheritance via          │
│                       │ parent/child, and role expiration. Users can have           │
│                       │ multiple roles. Access controlled at role level.            │
├───────────────────────┼─────────────────────────────────────────────────────────────┤
│ Location/Address      │ NORMALIZED: Country → State → City → Address hierarchy.     │
│                       │ Enables efficient geo-queries, consistent data, and         │
│                       │ location-based analytics. Reduces data duplication.         │
├───────────────────────┼─────────────────────────────────────────────────────────────┤
│ Categories            │ NORMALIZED: Self-referencing table for subcategories.       │
│                       │ Supports unlimited category depth, easy management,         │
│                       │ and category-based filtering without enum changes.          │
├───────────────────────┼─────────────────────────────────────────────────────────────┤
│ Service Types         │ NORMALIZED: Linked to categories with separate table.       │
│                       │ Enables category-specific service types and allows          │
│                       │ dynamic addition without code changes.                      │
├───────────────────────┼─────────────────────────────────────────────────────────────┤
│ Business Hours        │ NORMALIZED: Separate table with day-of-week rows.           │
│                       │ Enables easy querying for "open now" and schedule           │
│                       │ modifications without JSON parsing.                         │
├───────────────────────┼─────────────────────────────────────────────────────────────┤
│ Pricing Tiers         │ NORMALIZED: Separate table for complex pricing structures.  │
│                       │ Supports multiple pricing options per service, unit-based   │
│                       │ pricing, and quantity ranges.                               │
├───────────────────────┼─────────────────────────────────────────────────────────────┤
│ Tags                  │ NORMALIZED: Tag table with junction table to vendors.       │
│                       │ Enables tag-based search, tag analytics, and prevents       │
│                       │ tag duplication.                                            │
├───────────────────────┼─────────────────────────────────────────────────────────────┤
│ Service Areas         │ NORMALIZED: Junction table for vendor-city relationships.   │
│                       │ Vendors can serve multiple areas with different fees.       │
├───────────────────────┼─────────────────────────────────────────────────────────────┤
│ Event Types           │ NORMALIZED: Separate table instead of enum.                 │
│                       │ Enables dynamic event types, checklist templates per        │
│                       │ event type, and event type analytics.                       │
├───────────────────────┼─────────────────────────────────────────────────────────────┤
│ Vendor Metrics        │ DENORMALIZED: avg_rating, review_count, lead_count, etc.    │
│ (avgRating, counts)   │ Updated via domain events for read performance.             │
│                       │ Avoids expensive COUNT/AVG queries on every read.           │
├───────────────────────┼─────────────────────────────────────────────────────────────┤
│ Lead Event Details    │ DENORMALIZED: eventDate, guestCount on Lead.                │
│                       │ Vendor dashboard needs quick access without joins.          │
│                       │ Source of truth remains in Event table.                     │
└───────────────────────┴─────────────────────────────────────────────────────────────┘

Normalization Form Applied:
• 1NF: All tables have atomic values, no repeating groups
• 2NF: All non-key attributes fully depend on primary key
• 3NF: No transitive dependencies (except strategic denormalization)
• BCNF: Applied where practical without performance impact

Query Optimization Benefits:
• JOINs on foreign keys are indexed for efficient lookups
• Denormalized counters eliminate aggregate queries
• Location hierarchy enables efficient geo-filtering
• Category hierarchy supports breadcrumb generation
```

### ADR-011: Security Best Practices

**Decision:** Implement comprehensive security measures following OWASP guidelines.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SECURITY ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. AUTHENTICATION & SESSION MANAGEMENT                                          │
│  ───────────────────────────────────────                                         │
│  • JWT with short expiry (15 min access token)                                  │
│  • Refresh token rotation (7 days, single use)                                  │
│  • Secure HTTP-only cookies for refresh tokens                                  │
│  • Bcrypt password hashing (cost factor: 12)                                    │
│  • Account lockout after 5 failed attempts (15 min)                             │
│  • Session invalidation on password change                                       │
│                                                                                  │
│  2. INPUT VALIDATION & SANITIZATION                                              │
│  ──────────────────────────────────────                                          │
│  • class-validator for all DTOs                                                 │
│  • Whitelist-only validation (forbidNonWhitelisted: true)                       │
│  • SQL injection prevention via Prisma parameterized queries                    │
│  • XSS prevention via output encoding                                           │
│  • File upload validation (type, size, magic bytes)                             │
│                                                                                  │
│  3. AUTHORIZATION                                                                │
│  ────────────────                                                                │
│  • Role-based access control (RBAC) via guards                                  │
│  • Resource ownership validation                                                 │
│  • Principle of least privilege                                                  │
│  • API rate limiting per user/IP                                                │
│                                                                                  │
│  4. DATA PROTECTION                                                              │
│  ─────────────────                                                               │
│  • HTTPS/TLS 1.3 for all connections                                            │
│  • Sensitive data encryption at rest (AES-256)                                  │
│  • PII masking in logs                                                          │
│  • Database field-level encryption for sensitive data                           │
│                                                                                  │
│  5. API SECURITY                                                                 │
│  ──────────────                                                                  │
│  • CORS with strict origin whitelist                                            │
│  • Helmet.js security headers                                                   │
│  • CSRF protection for state-changing operations                                │
│  • Request size limits                                                          │
│  • API versioning                                                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**11.1 Authentication Implementation:**

```typescript
// core/auth/auth.module.ts
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  providers: [AuthService, JwtStrategy, RefreshTokenStrategy],
  exports: [AuthService],
})
export class AuthModule {}

// core/auth/services/auth.service.ts
@Injectable()
export class AuthService {
  private readonly SALT_ROUNDS = 12;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: { userRoles: { include: { role: true } } },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check account lockout
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException('Account temporarily locked');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      await this.handleFailedLogin(user.id);
      throw new UnauthorizedException('Invalid credentials');
    }

    // Reset failed attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    return user;
  }

  async generateTokens(user: User): Promise<TokenPair> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.userRoles.map(ur => ur.role.name),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, { expiresIn: '15m' }),
      this.jwtService.signAsync(
        { sub: user.id, type: 'refresh' },
        { expiresIn: '7d', secret: this.configService.get('JWT_REFRESH_SECRET') },
      ),
    ]);

    // Store refresh token hash in database
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken: refreshTokenHash,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    const payload = await this.jwtService.verifyAsync(refreshToken, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
    });

    const sessions = await this.prisma.userSession.findMany({
      where: { userId: payload.sub, expiresAt: { gt: new Date() } },
    });

    // Verify refresh token matches stored hash
    let validSession = null;
    for (const session of sessions) {
      if (await bcrypt.compare(refreshToken, session.refreshToken)) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Rotate refresh token (invalidate old, issue new)
    await this.prisma.userSession.delete({ where: { id: validSession.id } });

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { userRoles: { include: { role: true } } },
    });

    return this.generateTokens(user);
  }

  private async handleFailedLogin(userId: string): Promise<void> {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: { increment: 1 } },
    });

    if (user.failedLoginAttempts >= this.MAX_LOGIN_ATTEMPTS) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { lockedUntil: new Date(Date.now() + this.LOCKOUT_DURATION) },
      });
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }
}
```

**11.2 Security Guards & Decorators:**

```typescript
// core/auth/guards/jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }
    return user;
  }
}

// core/auth/guards/roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some(role => user.roles?.includes(role));
  }
}

// core/auth/guards/resource-owner.guard.ts
@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceUserId = request.params.userId || request.body.userId;

    // Admins can access any resource
    if (user.roles?.includes('ADMIN_SYSTEM')) {
      return true;
    }

    // Users can only access their own resources
    return user.sub === resourceUserId;
  }
}

// core/auth/decorators/roles.decorator.ts
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// core/auth/decorators/public.decorator.ts
export const Public = () => SetMetadata('isPublic', true);

// core/auth/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
```

**11.3 Input Validation & Sanitization:**

```typescript
// main.ts - Global validation pipe
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,                    // Strip non-whitelisted properties
    forbidNonWhitelisted: true,         // Throw error on extra properties
    transform: true,                    // Auto-transform to DTO types
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);

// Example DTO with validation
// domain/catalog/dto/create-vendor-profile.dto.ts
import { IsString, IsEmail, IsOptional, MaxLength, MinLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitize } from 'class-sanitizer';

export class CreateVendorProfileDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  businessName: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  @Transform(({ value }) => sanitizeHtml(value, { allowedTags: [] }))
  description?: string;

  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  contactEmail: string;

  @IsString()
  @Matches(/^[+]?[\d\s-]{10,15}$/, { message: 'Invalid phone number format' })
  contactPhone: string;

  @IsUUID()
  categoryId: string;
}
```

**11.4 Security Headers & CORS:**

```typescript
// main.ts
import helmet from 'helmet';

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-site' },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// CORS configuration
app.enableCors({
  origin: [
    process.env.FRONTEND_URL,
    'https://omnicassion.com',
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
});

// Request size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
```

**11.5 Rate Limiting:**

```typescript
// core/common/guards/throttle.guard.ts
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// In app.module.ts
@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,        // Time window in seconds
      limit: 100,     // Max requests per window
    }),
  ],
})
export class AppModule {}

// Custom rate limits per route
@Controller('auth')
export class AuthController {
  @Post('login')
  @Throttle(5, 60)  // 5 requests per minute for login
  async login(@Body() dto: LoginDto) { ... }

  @Post('register')
  @Throttle(3, 60)  // 3 requests per minute for registration
  async register(@Body() dto: RegisterDto) { ... }
}
```

**11.6 File Upload Security:**

```typescript
// infrastructure/storage/upload.interceptor.ts
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fileType from 'file-type';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/quicktime',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const SecureFileInterceptor = (fieldName: string) =>
  FileInterceptor(fieldName, {
    limits: {
      fileSize: MAX_FILE_SIZE,
    },
    fileFilter: async (req, file, callback) => {
      // Check extension
      const ext = extname(file.originalname).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.mov'];

      if (!allowedExtensions.includes(ext)) {
        return callback(new BadRequestException('Invalid file extension'), false);
      }

      // Check MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return callback(new BadRequestException('Invalid file type'), false);
      }

      callback(null, true);
    },
  });

// Validate magic bytes after upload
async function validateFileContent(filePath: string): Promise<boolean> {
  const type = await fileType.fromFile(filePath);
  return type && ALLOWED_MIME_TYPES.includes(type.mime);
}
```

**11.7 Sensitive Data Handling:**

```typescript
// core/common/interceptors/logging.interceptor.ts
const SENSITIVE_FIELDS = ['password', 'passwordHash', 'refreshToken', 'accessToken', 'phone', 'email'];

function maskSensitiveData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const masked = { ...data };
  for (const key of Object.keys(masked)) {
    if (SENSITIVE_FIELDS.includes(key)) {
      masked[key] = '***REDACTED***';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  return masked;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;

    // Log request with masked sensitive data
    this.logger.log(`${method} ${url} - Body: ${JSON.stringify(maskSensitiveData(body))}`);

    return next.handle();
  }
}
```

---

## Part 2: Domain Model & Bounded Contexts

### Bounded Context Map

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        OMNICASSION DOMAIN MAP                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐         ┌─────────────────┐                       │
│  │    IDENTITY     │◀───────▶│    CATALOG      │                       │
│  │    CONTEXT      │         │    CONTEXT      │                       │
│  │                 │         │                 │                       │
│  │ • User          │         │ • VendorProfile │                       │
│  │ • Vendor        │         │ • Portfolio     │                       │
│  │ • Admin         │         │ • Service       │                       │
│  │ • Role/Perm     │         │ • Pricing       │                       │
│  └────────┬────────┘         └────────┬────────┘                       │
│           │                           │                                 │
│           │    ┌──────────────────────┘                                │
│           │    │                                                        │
│           ▼    ▼                                                        │
│  ┌─────────────────┐         ┌─────────────────┐                       │
│  │     LEADS       │◀───────▶│    PLANNING     │                       │
│  │    CONTEXT      │         │    CONTEXT      │                       │
│  │                 │         │                 │                       │
│  │ • Lead          │         │ • Event         │                       │
│  │ • Inquiry       │         │ • Checklist     │                       │
│  │ • Message       │         │ • Guestlist     │                       │
│  │ • StatusHistory │         │ • Budget        │                       │
│  │                 │         │ • Timeline      │                       │
│  └────────┬────────┘         └─────────────────┘                       │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐         ┌─────────────────┐                       │
│  │   OPERATIONS    │◀───────▶│   DISCOVERY     │                       │
│  │    CONTEXT      │         │    CONTEXT      │                       │
│  │                 │         │                 │                       │
│  │ • KYC/KYB       │         │ • Search Index  │                       │
│  │ • Dispute       │         │ • Feed Algo     │                       │
│  │ • Payout        │         │ • Trending      │                       │
│  │ • AuditLog      │         │ • Recommend     │                       │
│  └────────┬────────┘         └─────────────────┘                       │
│           │                                                             │
│           ▼                                                             │
│  ┌─────────────────┐                                                   │
│  │  SUBSCRIPTION   │                                                   │
│  │    CONTEXT      │                                                   │
│  │                 │                                                   │
│  │ • Plan          │                                                   │
│  │ • Subscription  │                                                   │
│  │ • Billing       │                                                   │
│  │ • Usage         │                                                   │
│  └─────────────────┘                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Domain Model Relationships

```
// CATALOG MODULE
VendorProfile
├── Portfolio[]
│   └── MediaItem[]
├── Service[]
│   └── PricingTier[]
├── BusinessHours[]
└── Address

// LEADS MODULE
Lead
├── Message[]
├── StatusHistory[]
└── Event (reference)

// PLANNING MODULE
Event
├── Checklist[]
│   └── ChecklistItem[]
├── Guestlist
│   └── Guest[]
├── Budget
│   └── BudgetItem[]
└── Timeline[]

// OPERATIONS MODULE - Compliance
VendorKYC
├── Document[]
├── VerificationStatus
└── ComplianceCheck[]

// OPERATIONS MODULE - Event Execution Workflow
ActiveEvent (Unified event from Digital Lead or Direct Booking)
├── RequirementSheet
│   └── RequirementItem[]
├── VendorAgreement[]
│   └── ProvisionalInvoice
├── OperationalTask[]
│   └── TaskAttachment[]
└── EventNote[]

// SUBSCRIPTION MODULE - Plans & Billing
SubscriptionPlan (Available subscription tiers)
├── FeatureLimit[]           // Limits per feature (leads, listings, etc.)
└── PlanPrice[]              // Pricing per billing cycle

Subscription (User's active subscription)
├── SubscriptionPlan         // Current plan
├── PaymentMethod            // Stored payment method
├── BillingHistory[]         // Invoice/payment records
└── UsageRecord[]            // Feature usage tracking

VendorSubscription (Vendor-specific subscription)
├── Subscription             // Base subscription
├── VendorProfile            // Linked vendor
└── FeatureUsage             // Current period usage
```

### Operational Workflow Context Map

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    DUAL-ORIGIN OPERATIONAL WORKFLOW                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ENTRY POINT A: Digital Lead                ENTRY POINT B: Direct Booking       │
│  ──────────────────────────                 ─────────────────────────────        │
│  User browses feed                          Client calls/walks in               │
│       ↓                                           ↓                              │
│  Clicks "Get Quote"                         Ops Admin creates event             │
│       ↓                                           ↓                              │
│  CRM Lead created                           Manual data entry                    │
│       ↓                                           ↓                              │
│  Admin verifies & converts                  Admin saves event                    │
│       ↓                                           ↓                              │
│  ═══════════════════════════════════════════════════════════════════════════    │
│                              ↓                                                   │
│                       ACTIVE EVENT                                               │
│                     (Unified Record)                                             │
│                              ↓                                                   │
│  ═══════════════════════════════════════════════════════════════════════════    │
│                                                                                  │
│  STEP 1: ASSIGNMENT                                                              │
│  Ops Admin assigns Ops Manager to event                                          │
│                              ↓                                                   │
│  STEP 2: REQUIREMENTS                                                            │
│  Ops Manager creates Requirement Sheet                                           │
│  (e.g., "1 Photographer, 1 Decorator, 2 Security")                              │
│                              ↓                                                   │
│  STEP 3: VENDOR AGREEMENTS                                                       │
│  Manager negotiates → Enters agreed amount → Sends agreement                    │
│  Vendor accepts → Contract Locked → Invoice generated                           │
│                              ↓                                                   │
│  STEP 4: TASK DELEGATION                                                         │
│  Manager creates tasks → Assigns to Ops Assistants/Vendors                      │
│  (e.g., "Collect advance check", "Upload stage photos by 4 PM")                 │
│                              ↓                                                   │
│  STEP 5: EXECUTION & PROOF                                                       │
│  Assistant/Vendor receives task on mobile                                        │
│  Performs work → Uploads proof (photos/PDFs)                                    │
│  Submits for review → Manager approves/rejects                                  │
│                              ↓                                                   │
│  STEP 6: COMPLETION                                                              │
│  All tasks closed → Event marked complete                                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Ops Admin Oversight Dashboard Views

```
┌──────────────────────┬────────────────────────────────┬─────────────────────────────────────┐
│ View                 │ Metric                         │ Purpose                             │
├──────────────────────┼────────────────────────────────┼─────────────────────────────────────┤
│ Global Calendar      │ All Events (Web + Offline)     │ See date clashes, resource shortage │
│ Financial Dashboard  │ Total Cost vs. Client Budget   │ Ensure profit margins across events │
│ Team Analytics       │ Task Completion Rate           │ Monitor Manager/Assistant efficiency│
│ Invoice Center       │ Pending Payments               │ Track vendor payment status         │
│ Event Pipeline       │ Events by Status               │ Monitor workflow bottlenecks        │
└──────────────────────┴────────────────────────────────┴─────────────────────────────────────┘
```

---

## Part 3: Development Phases

### Phase 0: Foundation (Week 1-2)
**Goal:** Establish infrastructure, tooling, and base architecture.

```
Deliverables:
├── Project scaffold with folder structure
├── Docker Compose (Postgres, Dragonfly, Meilisearch, MinIO)
├── Prisma schema with base models
├── NestJS core modules (auth, database, common)
├── Event bus setup (@nestjs/event-emitter)
├── Base service and repository patterns
├── CI/CD pipeline skeleton
└── Development environment documentation
```

**Tasks:**
1. Initialize NestJS monorepo with strict TypeScript
2. Configure Prisma 7 with PostgreSQL
3. Set up Dragonfly connection pooling
4. Implement base CQRS decorators and buses
5. Create authentication guards and strategies
6. Set up MinIO buckets and upload service
7. Configure BullMQ with Dragonfly backend
8. Docker Compose for local development

---

### Phase 1: Identity & Catalog Context (Week 3-5)
**Goal:** Core user management and vendor profile system.

```
Deliverables:
├── User registration/authentication (JWT + Refresh)
├── Role-based access control (RBAC)
├── Vendor onboarding flow
├── VendorProfile CRUD with CQRS
├── Portfolio management with media upload
├── Service/Pricing management
├── Basic search indexing (Meilisearch)
└── Admin gateway for user management
```

**Domain Events Emitted:**
- `UserRegistered`
- `VendorOnboarded`
- `ProfileUpdated`
- `PortfolioMediaUploaded`
- `ServicePublished`

**Read Models Generated:**
- `VendorProfileView` (Dragonfly)
- `VendorSearchDocument` (Meilisearch)

---

### Phase 2: Interaction Context (Week 6-8)
**Goal:** Lead management and review system.

```
Deliverables:
├── Lead creation and lifecycle management
├── Inquiry system with message threading
├── Lead status workflow (FSM)
├── Review submission and moderation
├── Like/Save functionality (optimistic UI)
├── Notification system (in-app + email queues)
├── Vendor dashboard analytics
└── Planner-Vendor messaging
```

**Domain Events Emitted:**
- `LeadCreated`
- `LeadStatusChanged`
- `InquiryReceived`
- `ReviewSubmitted`
- `ReviewModerated`
- `VendorLiked`
- `VendorSaved`

**Read Models Generated:**
- `LeadListView` (Dragonfly)
- `VendorAnalyticsView` (Dragonfly)
- `ReviewFeedView` (Meilisearch)

---

### Phase 3: Planning Context (Week 9-11)
**Goal:** Event planning tools for couples/planners.

```
Deliverables:
├── Event creation and management
├── Checklist templates and custom items
├── Guest list with RSVP tracking
├── Budget calculator with vendor linking
├── Timeline/schedule builder
├── Collaboration features (share with partner)
├── Export functionality (PDF, CSV)
└── AI hook preparation (interface only)
```

**Domain Events Emitted:**
- `EventCreated`
- `ChecklistItemCompleted`
- `GuestRSVPReceived`
- `BudgetItemAdded`
- `VendorLinkedToEvent`

**Read Models Generated:**
- `EventDashboardView` (Dragonfly)
- `PlanningProgressView` (Dragonfly)

---

### Phase 4: Operations Context (Week 12-14)
**Goal:** Business operations, compliance, and monetization.

```
Deliverables:
├── KYC/KYB document management
├── Verification workflow (manual + automated)
├── Payout management
├── Dispute resolution system
├── Admin operations dashboard
├── Audit logging
└── Compliance reporting
```

**Domain Events Emitted:**
- `KYCSubmitted`
- `KYCApproved`
- `KYCRejected`
- `PayoutProcessed`
- `DisputeOpened`
- `DisputeResolved`

---

### Phase 4A: Subscription & Plans Context (Week 13-15)
**Goal:** Comprehensive subscription and billing system for vendors.

```
Deliverables:
├── Subscription Plans Management
│   ├── Plan creation and configuration (Admin)
│   ├── Feature limits definition per plan
│   ├── Multi-currency pricing support
│   ├── Billing cycle configuration (monthly/yearly)
│   └── Plan comparison and upgrade paths
├── Subscription Lifecycle
│   ├── Vendor subscription signup flow
│   ├── Plan selection and checkout
│   ├── Trial period management
│   ├── Subscription activation/deactivation
│   ├── Plan upgrades and downgrades
│   ├── Subscription cancellation with grace period
│   └── Subscription renewal automation
├── Billing & Payments
│   ├── Payment gateway integration (Stripe/Razorpay)
│   ├── Payment method management
│   ├── Invoice generation (PDF)
│   ├── Payment processing and retry logic
│   ├── Refund processing
│   └── Billing history and receipts
├── Usage Tracking & Limits
│   ├── Feature usage metering
│   ├── Limit enforcement (leads, listings, photos)
│   ├── Usage alerts and notifications
│   ├── Overage handling
│   └── Usage analytics dashboard
├── Admin Features
│   ├── Subscription management dashboard
│   ├── Revenue analytics and reporting
│   ├── Manual subscription adjustments
│   ├── Coupon/discount code management
│   └── Churn analysis and retention tools
└── Vendor Self-Service
    ├── Subscription status and usage view
    ├── Plan comparison and upgrade UI
    ├── Billing history access
    ├── Payment method management
    └── Invoice download
```

**Subscription Plans Matrix:**
```
┌─────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Feature         │ FREE         │ STARTER      │ PROFESSIONAL │ ENTERPRISE   │
├─────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ Profile Listing │ Basic        │ Enhanced     │ Premium      │ Premium+     │
│ Photos/Videos   │ 5            │ 25           │ 100          │ Unlimited    │
│ Leads/Month     │ 3            │ 25           │ 100          │ Unlimited    │
│ Portfolio Items │ 1            │ 5            │ 20           │ Unlimited    │
│ Services Listed │ 2            │ 10           │ Unlimited    │ Unlimited    │
│ Featured Badge  │ ✗            │ ✗            │ ✓            │ ✓            │
│ Priority Search │ ✗            │ ✗            │ ✓            │ ✓            │
│ Analytics       │ Basic        │ Standard     │ Advanced     │ Enterprise   │
│ Support         │ Community    │ Email        │ Priority     │ Dedicated    │
│ API Access      │ ✗            │ ✗            │ ✗            │ ✓            │
└─────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

**Domain Events Emitted:**
- `SubscriptionCreated`
- `SubscriptionActivated`
- `SubscriptionUpgraded`
- `SubscriptionDowngraded`
- `SubscriptionCancelled`
- `SubscriptionRenewed`
- `SubscriptionExpired`
- `PaymentProcessed`
- `PaymentFailed`
- `InvoiceGenerated`
- `RefundProcessed`
- `UsageLimitReached`
- `UsageLimitWarning`

**Read Models Generated:**
- `VendorSubscriptionView` (Dragonfly)
- `SubscriptionAnalyticsView` (Dragonfly)
- `BillingDashboardView` (Dragonfly)

---

### Phase 4B: Event Execution Workflow (Week 14-16)
**Goal:** Dual-origin event management and vendor coordination system.

```
Deliverables:
├── Lead-to-Event Conversion
│   ├── Lead verification UI (Ops Admin)
│   ├── "Convert to Event" action
│   └── Reference image linking
├── Direct Booking Module
│   ├── Manual event creation form
│   ├── Client information capture
│   └── Event type selection
├── Active Event Management
│   ├── Event dashboard (list, filters, search)
│   ├── Ops Manager assignment
│   ├── Status workflow transitions
│   └── Event notes/comments
├── Requirement Sheet Builder
│   ├── Create/edit requirement items
│   ├── Category-based organization
│   ├── Budget estimation per item
│   └── Status tracking per requirement
├── Vendor Agreement System
│   ├── Internal vendor search
│   ├── Agreement creation & negotiation
│   ├── Send agreement (app notification)
│   ├── Vendor accept/decline flow
│   ├── Contract lock mechanism
│   └── Provisional invoice generation
├── Task Delegation Engine
│   ├── Task creation from requirements
│   ├── Assignment to Ops Assistants
│   ├── Assignment to Vendors
│   ├── Priority & due date management
│   └── Mobile-friendly task list
├── Task Execution & Proof
│   ├── Task status updates
│   ├── Attachment uploads (photos, PDFs)
│   ├── Submit for review action
│   ├── Manager approval/rejection
│   └── Revision workflow
└── Ops Admin Oversight Dashboards
    ├── Global Calendar view
    ├── Financial Dashboard (Cost vs Budget)
    ├── Team Analytics (completion rates)
    ├── Invoice Center (pending payments)
    └── Event Pipeline (by status)
```

**Domain Events Emitted:**
- `LeadConvertedToEvent`
- `ActiveEventCreated`
- `OpsManagerAssigned`
- `RequirementSheetCreated`
- `RequirementItemAdded`
- `VendorAgreementSent`
- `VendorAgreementAccepted`
- `VendorAgreementDeclined`
- `ContractLocked`
- `InvoiceGenerated`
- `TaskAssigned`
- `TaskSubmitted`
- `TaskApproved`
- `TaskRejected`
- `EventCompleted`

**Read Models Generated:**
- `ActiveEventListView` (Dragonfly)
- `EventCalendarView` (Dragonfly)
- `TaskDashboardView` (Dragonfly)
- `VendorAgreementView` (Dragonfly)
- `FinancialSummaryView` (Dragonfly)

---

### Phase 5: Discovery & Feed (Week 17-19)
**Goal:** Visual discovery feed and recommendation engine.

```
Deliverables:
├── Discovery feed algorithm
├── Trending vendors calculation
├── Personalized recommendations
├── Advanced search filters
├── Geo-based discovery
├── Category/style browsing
├── Feed infinite scroll optimization
└── A/B testing infrastructure
```

**Technical Implementation:**
- Meilisearch for full-text + faceted search
- Dragonfly sorted sets for trending
- Background jobs for feed pre-computation
- CDN integration for media delivery

---

### Phase 6: Performance & Scale (Week 18-20)
**Goal:** Production hardening and scale testing.

```
Deliverables:
├── Database partitioning implementation
├── Connection pooling optimization
├── Query optimization and indexing
├── Load testing (k6/Artillery)
├── Chaos engineering tests
├── Monitoring setup (Prometheus/Grafana)
├── APM integration
├── Rate limiting fine-tuning
└── CDN optimization
```

---

### Phase 7: Frontend Integration (Parallel Track)
**Goal:** Next.js frontend with RSC optimization.

```
Deliverables:
├── Next.js App Router setup
├── Authentication flow (JWT handling)
├── Redux Toolkit with RTK Query
├── Optimistic updates for interactions
├── Image optimization pipeline
├── Core Web Vitals optimization
├── PWA capabilities
└── Mobile-responsive design system
```

---

## Part 4: Technical Implementation Details

### 4.1 Folder Structure (Detailed)

```
src/
├── api/                              # Interface Layer (Controllers)
│   ├── admin-gateway/                # ADMIN_SYSTEM only
│   │   ├── admin-gateway.module.ts
│   │   ├── controllers/
│   │   │   ├── users.controller.ts
│   │   │   ├── roles.controller.ts
│   │   │   ├── system-config.controller.ts
│   │   │   └── audit.controller.ts
│   │   └── dto/
│   │
│   ├── ops-gateway/                  # OPERATIONAL_ADMIN, OPERATIONAL_MANAGER, OPERATIONAL_ASSISTANT
│   │   ├── ops-gateway.module.ts
│   │   ├── controllers/
│   │   │   │   # Compliance Controllers
│   │   │   ├── kyc.controller.ts
│   │   │   ├── disputes.controller.ts
│   │   │   ├── moderation.controller.ts
│   │   │   ├── vendors.controller.ts
│   │   │   ├── support.controller.ts
│   │   │   │
│   │   │   │   # Event Execution Workflow Controllers
│   │   │   ├── active-events.controller.ts       # CRUD for active events
│   │   │   ├── lead-conversion.controller.ts     # Convert leads to events
│   │   │   ├── requirements.controller.ts        # Requirement sheets & items
│   │   │   ├── vendor-agreements.controller.ts   # Vendor contracts
│   │   │   ├── invoices.controller.ts            # Provisional invoices
│   │   │   ├── operational-tasks.controller.ts   # Task management
│   │   │   ├── task-attachments.controller.ts    # Proof uploads
│   │   │   └── ops-dashboard.controller.ts       # Calendar, financials, analytics
│   │   └── dto/
│   │
│   ├── marketing-gateway/            # MARKETING_SERVICES_ADMIN, CONTENT_WRITER, MULTI_MEDIA_MANAGER
│   │   ├── marketing-gateway.module.ts
│   │   ├── controllers/
│   │   │   ├── campaigns.controller.ts
│   │   │   ├── content.controller.ts
│   │   │   ├── media.controller.ts
│   │   │   ├── promotions.controller.ts
│   │   │   └── categories.controller.ts
│   │   └── dto/
│   │
│   ├── sales-gateway/                # SALES_MANAGER
│   │   ├── sales-gateway.module.ts
│   │   ├── controllers/
│   │   │   ├── leads.controller.ts
│   │   │   ├── acquisitions.controller.ts
│   │   │   ├── partnerships.controller.ts
│   │   │   └── analytics.controller.ts
│   │   └── dto/
│   │
│   ├── business-gateway/             # BUSINESS_ADMIN (Vendors)
│   │   ├── business-gateway.module.ts
│   │   ├── controllers/
│   │   │   ├── profile.controller.ts
│   │   │   ├── portfolio.controller.ts
│   │   │   ├── services.controller.ts
│   │   │   ├── leads.controller.ts
│   │   │   ├── reviews.controller.ts
│   │   │   ├── analytics.controller.ts
│   │   │   ├── calendar.controller.ts            # Date blocking/availability
│   │   │   │
│   │   │   │   # Vendor Workflow Controllers
│   │   │   ├── agreements.controller.ts          # View/accept/decline agreements
│   │   │   └── tasks.controller.ts               # View/complete assigned tasks
│   │   └── dto/
│   │
│   ├── user-gateway/                 # USER (Planners/Couples)
│   │   ├── user-gateway.module.ts
│   │   ├── controllers/
│   │   │   │   # Core User Controllers
│   │   │   ├── events.controller.ts              # Create/manage user events
│   │   │   ├── discovery.controller.ts           # Browse vendors, feed
│   │   │   ├── interactions.controller.ts        # Inquiries, messages
│   │   │   ├── account.controller.ts             # Profile, settings
│   │   │   │
│   │   │   │   # Planning Suite Controllers
│   │   │   ├── checklists.controller.ts          # Checklist & items management
│   │   │   ├── guestlist.controller.ts           # Guest management, RSVP tracking
│   │   │   ├── budget.controller.ts              # Budget & expense tracking
│   │   │   ├── timeline.controller.ts            # Schedule/timeline builder
│   │   │   ├── event-vendors.controller.ts       # Shortlist/book vendors for event
│   │   │   │
│   │   │   │   # Wishlists & Memories
│   │   │   ├── wishlists.controller.ts           # Save vendors to boards
│   │   │   └── memories.controller.ts            # QR codes, guest uploads, gallery
│   │   └── dto/
│   │
│   └── public-gateway/               # Anonymous/API Key
│       ├── public-gateway.module.ts
│       ├── controllers/
│       │   ├── webhooks.controller.ts
│       │   ├── discovery.controller.ts
│       │   ├── health.controller.ts
│       │   │
│       │   │   # Guest Portal (No Login Required)
│       │   ├── guest-upload.controller.ts        # QR code scan, photo uploads
│       │   └── rsvp.controller.ts                # Public RSVP responses
│       └── dto/
│
├── core/                             # Shared Kernel
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── api-key.strategy.ts
│   │   │   └── refresh-token.strategy.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── roles.guard.ts
│   │   │   └── tenant.guard.ts
│   │   └── decorators/
│   │       ├── current-user.decorator.ts
│   │       ├── roles.decorator.ts
│   │       └── public.decorator.ts
│   │
│   ├── database/
│   │   ├── database.module.ts
│   │   ├── prisma.service.ts
│   │   ├── prisma.extension.ts        # Soft delete, audit
│   │   └── repositories/
│   │       └── base.repository.ts
│   │
│   ├── events/
│   │   ├── events.module.ts              # Configures @nestjs/event-emitter
│   │   ├── event-constants.ts            # Event name constants
│   │   └── handlers/                     # Global event handlers
│   │       ├── cache-invalidation.handler.ts
│   │       └── search-index.handler.ts
│   │
│   ├── lookup/                           # Lookup Services (O(1) reference data)
│   │   ├── lookup.module.ts
│   │   └── services/
│   │       ├── country-lookup.service.ts
│   │       ├── category-lookup.service.ts
│   │       ├── role-lookup.service.ts
│   │       ├── service-type-lookup.service.ts
│   │       └── event-type-lookup.service.ts
│   │
│   └── common/
│       ├── decorators/
│       │   ├── api-paginated.decorator.ts
│       │   ├── cache-key.decorator.ts
│       │   └── idempotent.decorator.ts
│       ├── interceptors/
│       │   ├── logging.interceptor.ts
│       │   ├── cache.interceptor.ts
│       │   └── transform.interceptor.ts
│       ├── filters/
│       │   ├── http-exception.filter.ts
│       │   └── prisma-exception.filter.ts
│       ├── pipes/
│       │   └── validation.pipe.ts
│       └── utils/
│           ├── pagination.ts
│           ├── crypto.ts
│           ├── batch-processor.ts
│           └── slug-generator.ts
│
├── domain/                           # Business Logic Modules
│   ├── catalog/
│   │   ├── catalog.module.ts
│   │   ├── dto/
│   │   │   ├── vendor-profile.dto.ts
│   │   │   ├── create-vendor-profile.dto.ts
│   │   │   ├── update-vendor-profile.dto.ts
│   │   │   ├── portfolio.dto.ts
│   │   │   ├── service.dto.ts
│   │   │   └── pricing-tier.dto.ts
│   │   ├── services/
│   │   │   ├── vendor-profile.service.ts
│   │   │   ├── portfolio.service.ts
│   │   │   └── service.service.ts
│   │   ├── repositories/
│   │   │   └── vendor-profile.repository.ts
│   │   └── events/
│   │       ├── vendor-profile.events.ts
│   │       └── vendor-profile.listener.ts
│   │
│   ├── leads/
│   │   ├── leads.module.ts
│   │   ├── dto/
│   │   │   ├── lead.dto.ts
│   │   │   ├── create-lead.dto.ts
│   │   │   ├── update-lead-status.dto.ts
│   │   │   └── message.dto.ts
│   │   ├── services/
│   │   │   ├── lead.service.ts
│   │   │   └── message.service.ts
│   │   ├── repositories/
│   │   │   └── lead.repository.ts
│   │   └── events/
│   │       ├── lead.events.ts
│   │       └── lead.listener.ts
│   │
│   ├── planning/
│   │   ├── planning.module.ts
│   │   ├── dto/
│   │   │   │   # Event DTOs
│   │   │   ├── event.dto.ts
│   │   │   ├── create-event.dto.ts
│   │   │   ├── update-event.dto.ts
│   │   │   │
│   │   │   │   # Checklist DTOs
│   │   │   ├── checklist.dto.ts
│   │   │   ├── create-checklist.dto.ts
│   │   │   ├── checklist-item.dto.ts
│   │   │   ├── create-checklist-item.dto.ts
│   │   │   ├── update-checklist-item.dto.ts
│   │   │   │
│   │   │   │   # Guestlist DTOs
│   │   │   ├── guestlist.dto.ts
│   │   │   ├── guest.dto.ts
│   │   │   ├── create-guest.dto.ts
│   │   │   ├── update-guest.dto.ts
│   │   │   ├── update-rsvp.dto.ts
│   │   │   ├── bulk-import-guests.dto.ts
│   │   │   │
│   │   │   │   # Budget DTOs
│   │   │   ├── budget.dto.ts
│   │   │   ├── budget-item.dto.ts
│   │   │   ├── create-budget-item.dto.ts
│   │   │   ├── update-budget-item.dto.ts
│   │   │   │
│   │   │   │   # Timeline DTOs
│   │   │   ├── timeline.dto.ts
│   │   │   ├── create-timeline.dto.ts
│   │   │   ├── timeline-item.dto.ts
│   │   │   │
│   │   │   │   # Event-Vendor DTOs (shortlisting/booking)
│   │   │   ├── event-vendor.dto.ts
│   │   │   ├── add-event-vendor.dto.ts
│   │   │   ├── update-event-vendor.dto.ts
│   │   │   │
│   │   │   │   # Wishlist DTOs
│   │   │   ├── wishlist.dto.ts
│   │   │   ├── create-wishlist.dto.ts
│   │   │   │
│   │   │   │   # Event Memories DTOs
│   │   │   ├── event-memory.dto.ts
│   │   │   └── guest-upload.dto.ts
│   │   │
│   │   ├── services/
│   │   │   ├── event.service.ts
│   │   │   ├── checklist.service.ts
│   │   │   ├── checklist-item.service.ts
│   │   │   ├── guestlist.service.ts
│   │   │   ├── guest.service.ts
│   │   │   ├── budget.service.ts
│   │   │   ├── budget-item.service.ts
│   │   │   ├── timeline.service.ts
│   │   │   ├── event-vendor.service.ts
│   │   │   ├── wishlist.service.ts
│   │   │   └── event-memory.service.ts
│   │   │
│   │   ├── repositories/
│   │   │   ├── event.repository.ts
│   │   │   ├── checklist.repository.ts
│   │   │   ├── guestlist.repository.ts
│   │   │   ├── budget.repository.ts
│   │   │   ├── timeline.repository.ts
│   │   │   ├── event-vendor.repository.ts
│   │   │   └── wishlist.repository.ts
│   │   │
│   │   └── events/
│   │       ├── event.events.ts
│   │       ├── event.listener.ts
│   │       ├── checklist.events.ts
│   │       ├── guestlist.events.ts
│   │       └── budget.events.ts
│   │
│   ├── operations/
│   │   ├── operations.module.ts
│   │   ├── dto/
│   │   │   ├── vendor-kyc.dto.ts
│   │   │   ├── kyc-document.dto.ts
│   │   │   ├── dispute.dto.ts
│   │   │   ├── payout.dto.ts
│   │   │   │
│   │   │   │   # Event Execution Workflow DTOs
│   │   │   ├── active-event.dto.ts
│   │   │   ├── create-active-event.dto.ts
│   │   │   ├── update-active-event.dto.ts
│   │   │   ├── convert-lead-to-event.dto.ts
│   │   │   ├── event-note.dto.ts
│   │   │   ├── requirement-sheet.dto.ts
│   │   │   ├── requirement-item.dto.ts
│   │   │   ├── vendor-agreement.dto.ts
│   │   │   ├── create-vendor-agreement.dto.ts
│   │   │   ├── provisional-invoice.dto.ts
│   │   │   ├── operational-task.dto.ts
│   │   │   ├── create-operational-task.dto.ts
│   │   │   ├── update-task-status.dto.ts
│   │   │   └── task-attachment.dto.ts
│   │   │
│   │   ├── services/
│   │   │   │   # Compliance Services
│   │   │   ├── kyc-verification.service.ts
│   │   │   ├── dispute.service.ts
│   │   │   │
│   │   │   │   # Event Execution Workflow Services
│   │   │   ├── active-event.service.ts
│   │   │   ├── lead-conversion.service.ts
│   │   │   ├── event-note.service.ts
│   │   │   ├── requirement-sheet.service.ts
│   │   │   ├── vendor-agreement.service.ts
│   │   │   ├── provisional-invoice.service.ts
│   │   │   ├── operational-task.service.ts
│   │   │   ├── task-attachment.service.ts
│   │   │   └── ops-dashboard.service.ts
│   │   │
│   │   ├── repositories/
│   │   │   ├── kyc.repository.ts
│   │   │   ├── active-event.repository.ts
│   │   │   ├── requirement-sheet.repository.ts
│   │   │   ├── vendor-agreement.repository.ts
│   │   │   ├── operational-task.repository.ts
│   │   │   └── provisional-invoice.repository.ts
│   │   │
│   │   └── events/
│   │       ├── kyc.listener.ts
│   │       ├── active-event.events.ts
│   │       ├── active-event.listener.ts
│   │       ├── vendor-agreement.events.ts
│   │       ├── vendor-agreement.listener.ts
│   │       ├── operational-task.events.ts
│   │       └── operational-task.listener.ts
│   │
│   └── subscription/                        # Subscription & Billing Module
│       ├── subscription.module.ts
│       ├── dto/
│       │   │   # Plan DTOs
│       │   ├── subscription-plan.dto.ts
│       │   ├── create-plan.dto.ts
│       │   ├── update-plan.dto.ts
│       │   ├── plan-feature.dto.ts
│       │   ├── plan-price.dto.ts
│       │   │
│       │   │   # Subscription DTOs
│       │   ├── subscription.dto.ts
│       │   ├── create-subscription.dto.ts
│       │   ├── upgrade-subscription.dto.ts
│       │   ├── cancel-subscription.dto.ts
│       │   │
│       │   │   # Billing DTOs
│       │   ├── payment-method.dto.ts
│       │   ├── add-payment-method.dto.ts
│       │   ├── invoice.dto.ts
│       │   ├── payment.dto.ts
│       │   ├── process-payment.dto.ts
│       │   ├── refund.dto.ts
│       │   │
│       │   │   # Usage DTOs
│       │   ├── usage-record.dto.ts
│       │   ├── usage-summary.dto.ts
│       │   │
│       │   │   # Coupon DTOs
│       │   ├── coupon.dto.ts
│       │   └── apply-coupon.dto.ts
│       │
│       ├── services/
│       │   ├── subscription-plan.service.ts    # Plan CRUD & management
│       │   ├── subscription.service.ts         # Subscription lifecycle
│       │   ├── subscription-billing.service.ts # Payment processing
│       │   ├── payment-method.service.ts       # Stored payment methods
│       │   ├── invoice.service.ts              # Invoice generation
│       │   ├── usage-tracking.service.ts       # Feature usage metering
│       │   ├── usage-enforcement.service.ts    # Limit checking & enforcement
│       │   ├── coupon.service.ts               # Discount code management
│       │   └── subscription-analytics.service.ts # Revenue & churn analytics
│       │
│       ├── repositories/
│       │   ├── subscription-plan.repository.ts
│       │   ├── subscription.repository.ts
│       │   ├── payment-method.repository.ts
│       │   ├── invoice.repository.ts
│       │   ├── payment.repository.ts
│       │   ├── usage-record.repository.ts
│       │   └── coupon.repository.ts
│       │
│       ├── guards/
│       │   ├── subscription-required.guard.ts  # Requires active subscription
│       │   ├── plan-feature.guard.ts           # Checks feature access
│       │   └── usage-limit.guard.ts            # Enforces usage limits
│       │
│       ├── decorators/
│       │   ├── requires-subscription.decorator.ts
│       │   ├── requires-plan.decorator.ts      # @RequiresPlan('PROFESSIONAL')
│       │   └── track-usage.decorator.ts        # @TrackUsage('leads')
│       │
│       └── events/
│           ├── subscription.events.ts
│           ├── subscription.listener.ts
│           ├── payment.events.ts
│           ├── payment.listener.ts
│           ├── usage.events.ts
│           └── usage.listener.ts
│
└── infrastructure/                   # External Adapters
    ├── storage/
    │   ├── storage.module.ts
    │   ├── minio.service.ts
    │   ├── upload.service.ts
    │   └── cdn.service.ts
    │
    ├── jobs/
    │   ├── jobs.module.ts
    │   ├── processors/
    │   │   ├── email.processor.ts
    │   │   ├── notification.processor.ts
    │   │   ├── media-processing.processor.ts
    │   │   └── search-sync.processor.ts
    │   └── queues/
    │       ├── email.queue.ts
    │       └── media.queue.ts
    │
    ├── search/
    │   ├── search.module.ts
    │   ├── meilisearch.service.ts
    │   └── indexers/
    │       ├── vendor.indexer.ts
    │       └── event.indexer.ts
    │
    ├── cache/
    │   ├── cache.module.ts
    │   ├── dragonfly.service.ts
    │   └── strategies/
    │       ├── cache-aside.strategy.ts
    │       ├── write-through.strategy.ts
    │       └── read-through.strategy.ts
    │
    ├── notifications/
    │   ├── notifications.module.ts
    │   ├── email.service.ts
    │   └── templates/
    │
    ├── websockets/                      # Real-time Communication
    │   ├── websockets.module.ts
    │   ├── websocket.gateway.ts
    │   ├── websocket-auth.guard.ts
    │   ├── notification.gateway.ts      # Real-time notifications
    │   ├── messaging.gateway.ts         # Lead messaging
    │   └── dto/
    │       ├── notification.dto.ts
    │       └── message.dto.ts
    │
    └── resilience/                      # Reliability Patterns
        ├── resilience.module.ts
        ├── circuit-breaker.service.ts
        ├── retry.service.ts
        └── timeout.interceptor.ts
```

### 4.2 Prisma Schema Structure

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["multiSchema", "postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [uuid_ossp(schema: "extensions"), pg_trgm(schema: "extensions")]
  schemas    = ["public", "catalog", "interaction", "planning", "operations", "content"]
}

// ============================================
// IDENTITY & RBAC MODELS (public schema)
// ============================================

model User {
  id            String    @id @default(uuid()) @db.Uuid
  email         String    @unique
  passwordHash  String    @map("password_hash")
  firstName     String?   @map("first_name")
  lastName      String?   @map("last_name")
  phone         String?
  avatarUrl     String?   @map("avatar_url")
  status        UserStatus @default(PENDING)

  // Timestamps
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  deletedAt     DateTime? @map("deleted_at")
  lastLoginAt   DateTime? @map("last_login_at")

  // Relations
  userRoles     UserRoleAssignment[]
  vendorProfile VendorProfile?
  events        Event[]
  leads         Lead[]
  sessions      UserSession[]

  @@index([email])
  @@index([status])
  @@map("users")
  @@schema("public")
}

enum UserStatus {
  PENDING
  ACTIVE
  SUSPENDED
  DELETED

  @@schema("public")
}

// ============================================
// NORMALIZED RBAC: Roles & Assignments
// ============================================

model Role {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique                    // e.g., "ADMIN_SYSTEM", "OPERATIONAL_ADMIN"
  displayName String   @map("display_name")       // e.g., "System Administrator"
  description String?
  isSystem    Boolean  @default(false) @map("is_system") // System roles cannot be deleted
  level       Int      @default(0)                // Hierarchy level (higher = more privileges)

  // Timestamps
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  users       UserRoleAssignment[]
  parentRole  Role?    @relation("RoleHierarchy", fields: [parentRoleId], references: [id])
  parentRoleId String? @map("parent_role_id") @db.Uuid
  childRoles  Role[]   @relation("RoleHierarchy")

  @@index([name])
  @@index([level])
  @@map("roles")
  @@schema("public")
}

model UserRoleAssignment {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  roleId    String    @map("role_id") @db.Uuid
  assignedBy String?  @map("assigned_by") @db.Uuid
  expiresAt DateTime? @map("expires_at")          // Optional role expiration

  // Timestamps
  createdAt DateTime  @default(now()) @map("created_at")

  // Relations
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role      @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@unique([userId, roleId])
  @@index([userId])
  @@index([roleId])
  @@map("user_role_assignments")
  @@schema("public")
}

model UserSession {
  id           String   @id @default(uuid()) @db.Uuid
  userId       String   @map("user_id") @db.Uuid
  refreshToken String   @unique @map("refresh_token")
  userAgent    String?  @map("user_agent")
  ipAddress    String?  @map("ip_address")
  expiresAt    DateTime @map("expires_at")

  // Timestamps
  createdAt    DateTime @default(now()) @map("created_at")

  // Relations
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([expiresAt])
  @@map("user_sessions")
  @@schema("public")
}

// ============================================
// NORMALIZED LOCATION/ADDRESS (public schema)
// ============================================

model Country {
  id        String   @id @default(uuid()) @db.Uuid
  name      String   @unique
  code      String   @unique @db.VarChar(3)       // ISO 3166-1 alpha-3
  code2     String   @unique @db.VarChar(2)       // ISO 3166-1 alpha-2

  // Relations
  states    State[]

  @@index([code])
  @@map("countries")
  @@schema("public")
}

model State {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  code      String   @db.VarChar(10)              // State/Province code
  countryId String   @map("country_id") @db.Uuid

  // Relations
  country   Country  @relation(fields: [countryId], references: [id])
  cities    City[]

  @@unique([countryId, code])
  @@index([countryId])
  @@map("states")
  @@schema("public")
}

model City {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  stateId   String   @map("state_id") @db.Uuid

  // Relations
  state     State    @relation(fields: [stateId], references: [id])
  addresses Address[]

  @@index([stateId])
  @@index([name])
  @@map("cities")
  @@schema("public")
}

model Address {
  id           String   @id @default(uuid()) @db.Uuid
  addressLine1 String   @map("address_line_1")
  addressLine2 String?  @map("address_line_2")
  cityId       String   @map("city_id") @db.Uuid
  postalCode   String?  @map("postal_code")
  latitude     Decimal? @db.Decimal(10, 8)
  longitude    Decimal? @db.Decimal(11, 8)

  // Timestamps
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  city         City     @relation(fields: [cityId], references: [id])
  vendorProfiles VendorProfile[]
  events       Event[]

  @@index([cityId])
  @@index([latitude, longitude])
  @@map("addresses")
  @@schema("public")
}

// ============================================
// CATALOG MODELS (catalog schema)
// ============================================

// Normalized Category hierarchy (supports subcategories)
model Category {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique
  slug        String   @unique
  description String?
  icon        String?                              // Icon identifier or URL
  sortOrder   Int      @default(0) @map("sort_order")
  isActive    Boolean  @default(true) @map("is_active")

  // Self-referencing for subcategories
  parentId    String?  @map("parent_id") @db.Uuid
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")

  // Timestamps
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  vendors     VendorProfile[]
  serviceTypes ServiceType[]

  @@index([parentId])
  @@index([slug])
  @@index([isActive, sortOrder])
  @@map("categories")
  @@schema("catalog")
}

// Normalized Service Types per Category
model ServiceType {
  id          String   @id @default(uuid()) @db.Uuid
  categoryId  String   @map("category_id") @db.Uuid
  name        String
  slug        String
  description String?
  isActive    Boolean  @default(true) @map("is_active")

  // Timestamps
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  category    Category @relation(fields: [categoryId], references: [id])
  services    Service[]

  @@unique([categoryId, slug])
  @@index([categoryId])
  @@map("service_types")
  @@schema("catalog")
}

model VendorProfile {
  id              String    @id @default(uuid()) @db.Uuid
  userId          String    @unique @map("user_id") @db.Uuid
  businessName    String    @map("business_name")
  slug            String    @unique
  categoryId      String    @map("category_id") @db.Uuid
  description     String?
  tagline         String?                           // Short business tagline

  // Normalized Address reference
  addressId       String?   @map("address_id") @db.Uuid
  serviceRadius   Int?      @map("service_radius")  // in miles

  // Contact Info (normalized for quick access)
  contactEmail    String?   @map("contact_email")
  contactPhone    String?   @map("contact_phone")
  website         String?

  // Metrics (denormalized for read performance - updated via events)
  leadCount       Int       @default(0) @map("lead_count")
  viewCount       Int       @default(0) @map("view_count")

  // Status
  status          VendorStatus @default(DRAFT)
  verifiedAt      DateTime?    @map("verified_at")
  featuredUntil   DateTime?    @map("featured_until")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  user            User      @relation(fields: [userId], references: [id])
  category        Category  @relation(fields: [categoryId], references: [id])
  address         Address?  @relation(fields: [addressId], references: [id])
  businessHours   BusinessHour[]
  portfolios      Portfolio[]
  services        Service[]
  leads           Lead[]
  kyc             VendorKYC?
  tags            VendorTag[]
  serviceAreas    ServiceArea[]

  @@index([categoryId, status])
  @@index([slug])
  @@index([addressId])
  @@index([status])
  @@index([createdAt])
  @@map("vendor_profiles")
  @@schema("catalog")
}

enum VendorStatus {
  DRAFT
  PENDING_REVIEW
  ACTIVE
  SUSPENDED
  ARCHIVED

  @@schema("catalog")
}

// Normalized Business Hours
model BusinessHour {
  id              String   @id @default(uuid()) @db.Uuid
  vendorProfileId String   @map("vendor_profile_id") @db.Uuid
  dayOfWeek       Int      @map("day_of_week")       // 0=Sunday, 6=Saturday
  openTime        String   @map("open_time")         // HH:MM format
  closeTime       String   @map("close_time")        // HH:MM format
  isClosed        Boolean  @default(false) @map("is_closed")

  // Relations
  vendorProfile   VendorProfile @relation(fields: [vendorProfileId], references: [id], onDelete: Cascade)

  @@unique([vendorProfileId, dayOfWeek])
  @@index([vendorProfileId])
  @@map("business_hours")
  @@schema("catalog")
}

// Vendor Tags (for search and filtering)
model Tag {
  id        String   @id @default(uuid()) @db.Uuid
  name      String   @unique
  slug      String   @unique

  // Timestamps
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  vendors   VendorTag[]

  @@index([slug])
  @@map("tags")
  @@schema("catalog")
}

model VendorTag {
  id              String   @id @default(uuid()) @db.Uuid
  vendorProfileId String   @map("vendor_profile_id") @db.Uuid
  tagId           String   @map("tag_id") @db.Uuid

  // Relations
  vendorProfile   VendorProfile @relation(fields: [vendorProfileId], references: [id], onDelete: Cascade)
  tag             Tag           @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([vendorProfileId, tagId])
  @@index([vendorProfileId])
  @@index([tagId])
  @@map("vendor_tags")
  @@schema("catalog")
}

// Service Areas (vendors can serve multiple cities/regions)
model ServiceArea {
  id              String   @id @default(uuid()) @db.Uuid
  vendorProfileId String   @map("vendor_profile_id") @db.Uuid
  cityId          String   @map("city_id") @db.Uuid
  radiusMiles     Int?     @map("radius_miles")
  additionalFee   Decimal? @map("additional_fee") @db.Decimal(10, 2)

  // Relations
  vendorProfile   VendorProfile @relation(fields: [vendorProfileId], references: [id], onDelete: Cascade)

  @@unique([vendorProfileId, cityId])
  @@index([vendorProfileId])
  @@index([cityId])
  @@map("service_areas")
  @@schema("catalog")
}

model Portfolio {
  id              String    @id @default(uuid()) @db.Uuid
  vendorProfileId String    @map("vendor_profile_id") @db.Uuid
  title           String
  description     String?
  sortOrder       Int       @default(0) @map("sort_order")
  isFeatured      Boolean   @default(false) @map("is_featured")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  vendorProfile   VendorProfile @relation(fields: [vendorProfileId], references: [id], onDelete: Cascade)
  mediaItems      MediaItem[]

  @@index([vendorProfileId])
  @@index([vendorProfileId, sortOrder])
  @@map("portfolios")
  @@schema("catalog")
}

model MediaItem {
  id          String    @id @default(uuid()) @db.Uuid
  portfolioId String    @map("portfolio_id") @db.Uuid
  type        MediaType
  url         String
  thumbnailUrl String?  @map("thumbnail_url")
  cdnUrl      String?   @map("cdn_url")
  altText     String?   @map("alt_text")          // Accessibility

  // Metadata
  width       Int?
  height      Int?
  duration    Int?      // for video, in seconds
  size        Int       // in bytes
  mimeType    String    @map("mime_type")

  // Ordering & Status
  sortOrder   Int       @default(0) @map("sort_order")
  isApproved  Boolean   @default(true) @map("is_approved")

  // Timestamps
  createdAt   DateTime  @default(now()) @map("created_at")

  // Relations
  portfolio   Portfolio @relation(fields: [portfolioId], references: [id], onDelete: Cascade)

  @@index([portfolioId])
  @@index([portfolioId, sortOrder])
  @@map("media_items")
  @@schema("catalog")
}

enum MediaType {
  IMAGE
  VIDEO

  @@schema("catalog")
}

model Service {
  id              String    @id @default(uuid()) @db.Uuid
  vendorProfileId String    @map("vendor_profile_id") @db.Uuid
  serviceTypeId   String?   @map("service_type_id") @db.Uuid  // Normalized reference
  name            String
  description     String?

  // Pricing (normalized into separate table for complex pricing)
  pricingType     PricingType @map("pricing_type")
  currency        String      @default("USD") @db.VarChar(3)
  startingPrice   Decimal?    @map("starting_price") @db.Decimal(10, 2)
  maxPrice        Decimal?    @map("max_price") @db.Decimal(10, 2)

  // Availability
  isActive        Boolean   @default(true) @map("is_active")
  sortOrder       Int       @default(0) @map("sort_order")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  vendorProfile   VendorProfile @relation(fields: [vendorProfileId], references: [id], onDelete: Cascade)
  serviceType     ServiceType?  @relation(fields: [serviceTypeId], references: [id])
  pricingTiers    PricingTier[]

  @@index([vendorProfileId])
  @@index([serviceTypeId])
  @@index([vendorProfileId, isActive])
  @@map("services")
  @@schema("catalog")
}

// Normalized Pricing Tiers for complex pricing structures
model PricingTier {
  id          String   @id @default(uuid()) @db.Uuid
  serviceId   String   @map("service_id") @db.Uuid
  name        String                                // e.g., "Basic", "Premium", "Full Day"
  description String?
  price       Decimal  @db.Decimal(10, 2)
  unit        String                                // e.g., "per hour", "per event", "per person"
  minQuantity Int?     @map("min_quantity")
  maxQuantity Int?     @map("max_quantity")
  sortOrder   Int      @default(0) @map("sort_order")

  // Timestamps
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  service     Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@index([serviceId])
  @@map("pricing_tiers")
  @@schema("catalog")
}

enum PricingType {
  FIXED
  RANGE
  STARTING_AT
  TIERED
  CONTACT_FOR_QUOTE

  @@schema("catalog")
}

// ============================================
// INTERACTION MODELS (interaction schema)
// ============================================

model Lead {
  id              String    @id @default(uuid()) @db.Uuid
  vendorProfileId String    @map("vendor_profile_id") @db.Uuid
  plannerId       String    @map("planner_id") @db.Uuid
  eventId         String?   @map("event_id") @db.Uuid

  // Lead Info
  status          LeadStatus @default(NEW)
  source          LeadSource @default(INQUIRY)

  // Event Details (denormalized for vendor view)
  eventDate       DateTime?  @map("event_date")
  eventType       String?    @map("event_type")
  guestCount      Int?       @map("guest_count")
  budget          Decimal?   @db.Decimal(10, 2)

  // Communication
  initialMessage  String?    @map("initial_message")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  respondedAt     DateTime? @map("responded_at")
  convertedAt     DateTime? @map("converted_at")

  // Relations
  vendorProfile   VendorProfile @relation(fields: [vendorProfileId], references: [id])
  planner         User          @relation(fields: [plannerId], references: [id])
  event           Event?        @relation(fields: [eventId], references: [id])
  messages        Message[]
  statusHistory   LeadStatusHistory[]

  @@index([vendorProfileId, status])
  @@index([plannerId])
  @@index([createdAt])
  @@map("leads")
  @@schema("interaction")
}

enum LeadStatus {
  NEW
  CONTACTED
  QUALIFIED
  PROPOSAL_SENT
  NEGOTIATING
  WON
  LOST
  ARCHIVED

  @@schema("interaction")
}

enum LeadSource {
  INQUIRY
  DIRECT_MESSAGE
  PHONE
  EXTERNAL
  REFERRAL

  @@schema("interaction")
}

model LeadStatusHistory {
  id        String     @id @default(uuid()) @db.Uuid
  leadId    String     @map("lead_id") @db.Uuid
  fromStatus LeadStatus? @map("from_status")
  toStatus  LeadStatus @map("to_status")
  note      String?
  changedBy String     @map("changed_by") @db.Uuid
  createdAt DateTime   @default(now()) @map("created_at")

  lead      Lead       @relation(fields: [leadId], references: [id])

  @@map("lead_status_history")
  @@schema("interaction")
}

model Message {
  id        String    @id @default(uuid()) @db.Uuid
  leadId    String    @map("lead_id") @db.Uuid
  senderId  String    @map("sender_id") @db.Uuid
  content   String
  readAt    DateTime? @map("read_at")
  createdAt DateTime  @default(now()) @map("created_at")

  lead      Lead      @relation(fields: [leadId], references: [id])

  @@index([leadId, createdAt])
  @@map("messages")
  @@schema("interaction")
}

// ============================================
// PLANNING MODELS (planning schema)
// ============================================

// Normalized Event Type (allows dynamic event types)
model EventType {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique                    // e.g., "Wedding", "Engagement"
  slug        String   @unique
  description String?
  icon        String?
  isActive    Boolean  @default(true) @map("is_active")
  sortOrder   Int      @default(0) @map("sort_order")

  // Timestamps
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  events      Event[]
  checklistTemplates ChecklistTemplate[]

  @@index([slug])
  @@index([isActive, sortOrder])
  @@map("event_types")
  @@schema("planning")
}

// Checklist Templates per Event Type
model ChecklistTemplate {
  id          String   @id @default(uuid()) @db.Uuid
  eventTypeId String   @map("event_type_id") @db.Uuid
  name        String
  description String?
  items       Json                               // Array of template items
  sortOrder   Int      @default(0) @map("sort_order")

  // Timestamps
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  eventType   EventType @relation(fields: [eventTypeId], references: [id])

  @@index([eventTypeId])
  @@map("checklist_templates")
  @@schema("planning")
}

model Event {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  eventTypeId String    @map("event_type_id") @db.Uuid

  // Event Info
  name        String
  date        DateTime?
  endDate     DateTime? @map("end_date")

  // Normalized Location reference
  addressId   String?   @map("address_id") @db.Uuid
  venueName   String?   @map("venue_name")

  // Details
  guestCount  Int?      @map("guest_count")
  description String?

  // Status
  status      EventStatus @default(PLANNING)

  // Timestamps
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")

  // Relations
  user        User      @relation(fields: [userId], references: [id])
  eventType   EventType @relation(fields: [eventTypeId], references: [id])
  address     Address?  @relation(fields: [addressId], references: [id])
  checklists  Checklist[]
  guestlist   Guestlist?
  budget      Budget?
  timelines   Timeline[]
  leads       Lead[]
  vendors     EventVendor[]
  eventMemory EventMemory?                              // QR code & guest uploads

  @@index([userId])
  @@index([eventTypeId])
  @@index([addressId])
  @@index([date])
  @@index([status])
  @@map("events")
  @@schema("planning")
}

enum EventStatus {
  PLANNING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED

  @@schema("planning")
}

// Junction table for Event-Vendor relationship
model EventVendor {
  id              String   @id @default(uuid()) @db.Uuid
  eventId         String   @map("event_id") @db.Uuid
  vendorProfileId String   @map("vendor_profile_id") @db.Uuid
  status          EventVendorStatus @default(SHORTLISTED)
  notes           String?
  contractAmount  Decimal? @map("contract_amount") @db.Decimal(10, 2)
  depositPaid     Decimal? @map("deposit_paid") @db.Decimal(10, 2)

  // Timestamps
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")

  // Relations
  event           Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([eventId, vendorProfileId])
  @@index([eventId])
  @@index([vendorProfileId])
  @@map("event_vendors")
  @@schema("planning")
}

enum EventVendorStatus {
  SHORTLISTED
  CONTACTED
  BOOKED
  CONFIRMED
  CANCELLED

  @@schema("planning")
}

model Checklist {
  id        String    @id @default(uuid()) @db.Uuid
  eventId   String    @map("event_id") @db.Uuid
  name      String
  sortOrder Int       @default(0) @map("sort_order")
  createdAt DateTime  @default(now()) @map("created_at")

  event     Event     @relation(fields: [eventId], references: [id])
  items     ChecklistItem[]

  @@map("checklists")
  @@schema("planning")
}

model ChecklistItem {
  id          String    @id @default(uuid()) @db.Uuid
  checklistId String    @map("checklist_id") @db.Uuid
  title       String
  description String?
  dueDate     DateTime? @map("due_date")
  isCompleted Boolean   @default(false) @map("is_completed")
  completedAt DateTime? @map("completed_at")
  sortOrder   Int       @default(0) @map("sort_order")
  createdAt   DateTime  @default(now()) @map("created_at")

  checklist   Checklist @relation(fields: [checklistId], references: [id])

  @@map("checklist_items")
  @@schema("planning")
}

model Guestlist {
  id        String   @id @default(uuid()) @db.Uuid
  eventId   String   @unique @map("event_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  event     Event    @relation(fields: [eventId], references: [id])
  guests    Guest[]

  @@map("guestlists")
  @@schema("planning")
}

model Guest {
  id          String      @id @default(uuid()) @db.Uuid
  guestlistId String      @map("guestlist_id") @db.Uuid
  firstName   String      @map("first_name")
  lastName    String?     @map("last_name")
  email       String?
  phone       String?
  rsvpStatus  RSVPStatus  @default(PENDING) @map("rsvp_status")
  plusOne     Int         @default(0) @map("plus_one")
  tableNumber Int?        @map("table_number")
  dietaryReq  String?     @map("dietary_req")
  notes       String?
  createdAt   DateTime    @default(now()) @map("created_at")

  guestlist   Guestlist   @relation(fields: [guestlistId], references: [id])

  @@map("guests")
  @@schema("planning")
}

enum RSVPStatus {
  PENDING
  ATTENDING
  NOT_ATTENDING
  MAYBE

  @@schema("planning")
}

model Budget {
  id           String       @id @default(uuid()) @db.Uuid
  eventId      String       @unique @map("event_id") @db.Uuid
  totalBudget  Decimal?     @map("total_budget") @db.Decimal(10, 2)
  createdAt    DateTime     @default(now()) @map("created_at")
  updatedAt    DateTime     @updatedAt @map("updated_at")

  event        Event        @relation(fields: [eventId], references: [id])
  items        BudgetItem[]

  @@map("budgets")
  @@schema("planning")
}

model BudgetItem {
  id           String    @id @default(uuid()) @db.Uuid
  budgetId     String    @map("budget_id") @db.Uuid
  category     String
  name         String
  estimatedCost Decimal? @map("estimated_cost") @db.Decimal(10, 2)
  actualCost   Decimal?  @map("actual_cost") @db.Decimal(10, 2)
  isPaid       Boolean   @default(false) @map("is_paid")
  notes        String?
  createdAt    DateTime  @default(now()) @map("created_at")

  budget       Budget    @relation(fields: [budgetId], references: [id])

  @@map("budget_items")
  @@schema("planning")
}

model Timeline {
  id        String   @id @default(uuid()) @db.Uuid
  eventId   String   @map("event_id") @db.Uuid
  name      String
  date      DateTime
  items     Json     // Array of { time, title, description, vendor? }
  createdAt DateTime @default(now()) @map("created_at")

  event     Event    @relation(fields: [eventId], references: [id])

  @@map("timelines")
  @@schema("planning")
}

// Wishlist/Board for saving vendors
model Wishlist {
  id          String         @id @default(uuid()) @db.Uuid
  userId      String         @map("user_id") @db.Uuid
  name        String                                        // e.g., "Wedding Photographers", "Backup Options"
  description String?
  isDefault   Boolean        @default(false) @map("is_default")
  createdAt   DateTime       @default(now()) @map("created_at")
  updatedAt   DateTime       @updatedAt @map("updated_at")

  items       WishlistItem[]

  @@index([userId])
  @@map("wishlists")
  @@schema("planning")
}

model WishlistItem {
  id              String    @id @default(uuid()) @db.Uuid
  wishlistId      String    @map("wishlist_id") @db.Uuid
  vendorProfileId String    @map("vendor_profile_id") @db.Uuid
  notes           String?
  createdAt       DateTime  @default(now()) @map("created_at")

  wishlist        Wishlist  @relation(fields: [wishlistId], references: [id], onDelete: Cascade)

  @@unique([wishlistId, vendorProfileId])
  @@map("wishlist_items")
  @@schema("planning")
}

// Event Memory - QR Codes and Guest Uploads
model EventMemory {
  id            String       @id @default(uuid()) @db.Uuid
  eventId       String       @unique @map("event_id") @db.Uuid

  // QR Code
  qrCode        String       @unique @map("qr_code")          // Unique code for guest access
  qrCodeUrl     String?      @map("qr_code_url")              // Generated QR image URL

  // Settings
  isActive      Boolean      @default(true) @map("is_active")
  allowUploads  Boolean      @default(true) @map("allow_uploads")
  requireApproval Boolean    @default(false) @map("require_approval")

  // Timestamps
  createdAt     DateTime     @default(now()) @map("created_at")
  expiresAt     DateTime?    @map("expires_at")               // Optional expiry

  // Relations
  event         Event        @relation(fields: [eventId], references: [id])
  uploads       GuestUpload[]

  @@map("event_memories")
  @@schema("planning")
}

model GuestUpload {
  id            String       @id @default(uuid()) @db.Uuid
  eventMemoryId String       @map("event_memory_id") @db.Uuid

  // Uploader Info (no login required)
  uploaderName  String?      @map("uploader_name")
  uploaderEmail String?      @map("uploader_email")

  // Media
  mediaUrl      String       @map("media_url")
  thumbnailUrl  String?      @map("thumbnail_url")
  mediaType     MediaType    @map("media_type")
  fileSize      Int          @map("file_size")               // bytes
  caption       String?

  // Moderation
  status        UploadStatus @default(PENDING)
  approvedAt    DateTime?    @map("approved_at")
  rejectedAt    DateTime?    @map("rejected_at")

  // Timestamps
  createdAt     DateTime     @default(now()) @map("created_at")

  eventMemory   EventMemory  @relation(fields: [eventMemoryId], references: [id], onDelete: Cascade)

  @@index([eventMemoryId])
  @@index([status])
  @@map("guest_uploads")
  @@schema("planning")
}

enum MediaType {
  IMAGE
  VIDEO

  @@schema("planning")
}

enum UploadStatus {
  PENDING
  APPROVED
  REJECTED

  @@schema("planning")
}

// ============================================
// OPERATIONS MODELS (operations schema)
// ============================================

model VendorKYC {
  id              String    @id @default(uuid()) @db.Uuid
  vendorProfileId String    @unique @map("vendor_profile_id") @db.Uuid

  // Business Details
  legalName       String    @map("legal_name")
  businessType    String    @map("business_type")
  taxId           String?   @map("tax_id")

  // Status
  status          KYCStatus @default(PENDING)
  submittedAt     DateTime? @map("submitted_at")
  approvedAt      DateTime? @map("approved_at")
  rejectedAt      DateTime? @map("rejected_at")
  rejectionReason String?   @map("rejection_reason")

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  // Relations
  vendorProfile   VendorProfile @relation(fields: [vendorProfileId], references: [id])
  documents       KYCDocument[]

  @@map("vendor_kyc")
  @@schema("operations")
}

enum KYCStatus {
  PENDING
  SUBMITTED
  UNDER_REVIEW
  APPROVED
  REJECTED
  EXPIRED

  @@schema("operations")
}

model KYCDocument {
  id        String       @id @default(uuid()) @db.Uuid
  kycId     String       @map("kyc_id") @db.Uuid
  type      DocumentType
  url       String
  status    DocumentStatus @default(PENDING)
  notes     String?
  createdAt DateTime     @default(now()) @map("created_at")

  kyc       VendorKYC    @relation(fields: [kycId], references: [id])

  @@map("kyc_documents")
  @@schema("operations")
}

enum DocumentType {
  BUSINESS_LICENSE
  TAX_CERTIFICATE
  INSURANCE
  ID_DOCUMENT
  ADDRESS_PROOF
  OTHER

  @@schema("operations")
}

enum DocumentStatus {
  PENDING
  VERIFIED
  REJECTED
  EXPIRED

  @@schema("operations")
}

model Dispute {
  id              String    @id @default(uuid()) @db.Uuid
  vendorProfileId String    @map("vendor_profile_id") @db.Uuid
  reporterId      String    @map("reporter_id") @db.Uuid

  type            DisputeType
  status          DisputeStatus @default(OPEN)
  description     String
  resolution      String?

  // Timestamps
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  resolvedAt      DateTime? @map("resolved_at")
  resolvedBy      String?   @map("resolved_by") @db.Uuid

  @@map("disputes")
  @@schema("operations")
}

enum DisputeType {
  SERVICE_QUALITY
  PRICING
  NO_SHOW
  HARASSMENT
  FRAUD
  OTHER

  @@schema("operations")
}

enum DisputeStatus {
  OPEN
  INVESTIGATING
  RESOLVED
  ESCALATED
  CLOSED

  @@schema("operations")
}

model AuditLog {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String?  @map("user_id") @db.Uuid
  action     String
  entityType String   @map("entity_type")
  entityId   String   @map("entity_id") @db.Uuid
  oldValue   Json?    @map("old_value")
  newValue   Json?    @map("new_value")
  ipAddress  String?  @map("ip_address")
  userAgent  String?  @map("user_agent")
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([entityType, entityId])
  @@index([userId])
  @@index([createdAt])
  @@map("audit_logs")
  @@schema("operations")
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPERATIONAL WORKFLOW MODELS (operations schema) - Event Execution System
// ═══════════════════════════════════════════════════════════════════════════════

// Origin of how the event entered the system
enum EventOrigin {
  DIGITAL_LEAD       // User browsed website, clicked "Get Quote" → CRM Lead converted
  DIRECT_BOOKING     // Walk-in, phone call, VIP client → Manual entry by Ops Admin

  @@schema("operations")
}

// The unified Active Event record (post-conversion from Lead OR direct creation)
model ActiveEvent {
  id              String       @id @default(uuid()) @db.Uuid

  // Origin tracking
  origin          EventOrigin
  convertedFromLeadId String?  @unique @map("converted_from_lead_id") @db.Uuid  // If from Digital Lead
  referenceImageId    String?  @map("reference_image_id") @db.Uuid              // The image user clicked on

  // Client Info
  clientName      String       @map("client_name")
  clientPhone     String?      @map("client_phone")
  clientEmail     String?      @map("client_email")

  // Event Details
  eventDate       DateTime?    @map("event_date")
  eventEndDate    DateTime?    @map("event_end_date")
  eventType       String       @map("event_type")                               // Wedding, Concert, Corporate, etc.
  venueName       String?      @map("venue_name")
  venueAddressId  String?      @map("venue_address_id") @db.Uuid

  // Budget
  totalBudget     Decimal?     @map("total_budget") @db.Decimal(12, 2)
  totalSpend      Decimal      @default(0) @map("total_spend") @db.Decimal(12, 2)  // Sum of all vendor agreements

  // Assignments
  opsAdminId      String?      @map("ops_admin_id") @db.Uuid                    // Who converted/created
  opsManagerId    String?      @map("ops_manager_id") @db.Uuid                  // Assigned manager

  // Status
  status          ActiveEventStatus @default(NEW)

  // Timestamps
  createdAt       DateTime     @default(now()) @map("created_at")
  updatedAt       DateTime     @updatedAt @map("updated_at")
  completedAt     DateTime?    @map("completed_at")

  // Relations
  requirementSheet RequirementSheet?
  vendorAgreements VendorAgreement[]
  operationalTasks OperationalTask[]
  eventNotes       EventNote[]

  @@index([opsManagerId])
  @@index([opsAdminId])
  @@index([eventDate])
  @@index([status])
  @@index([origin])
  @@map("active_events")
  @@schema("operations")
}

enum ActiveEventStatus {
  NEW                // Just created/converted
  ASSIGNED           // Ops Manager assigned
  REQUIREMENTS_SET   // Requirement sheet created
  VENDOR_SOURCING    // Finding and negotiating with vendors
  CONTRACTS_LOCKED   // All vendor agreements finalized
  EXECUTION          // Event day - tasks being executed
  COMPLETED          // Event finished successfully
  CANCELLED          // Event cancelled

  @@schema("operations")
}

// Notes/comments on an active event
model EventNote {
  id            String      @id @default(uuid()) @db.Uuid
  activeEventId String      @map("active_event_id") @db.Uuid
  authorId      String      @map("author_id") @db.Uuid           // Ops Admin/Manager/Assistant
  content       String
  isInternal    Boolean     @default(true) @map("is_internal")   // Internal vs client-visible
  createdAt     DateTime    @default(now()) @map("created_at")

  activeEvent   ActiveEvent @relation(fields: [activeEventId], references: [id], onDelete: Cascade)

  @@index([activeEventId])
  @@map("event_notes")
  @@schema("operations")
}

// Requirement breakdown created by Ops Manager
model RequirementSheet {
  id            String       @id @default(uuid()) @db.Uuid
  activeEventId String       @unique @map("active_event_id") @db.Uuid

  // Summary
  notes         String?

  // Timestamps
  createdAt     DateTime     @default(now()) @map("created_at")
  updatedAt     DateTime     @updatedAt @map("updated_at")
  createdBy     String       @map("created_by") @db.Uuid         // Ops Manager who created

  // Relations
  activeEvent   ActiveEvent  @relation(fields: [activeEventId], references: [id], onDelete: Cascade)
  items         RequirementItem[]

  @@map("requirement_sheets")
  @@schema("operations")
}

// Individual requirements (e.g., "1 Photographer", "1 Decorator", "2 Security Guards")
model RequirementItem {
  id                  String            @id @default(uuid()) @db.Uuid
  requirementSheetId  String            @map("requirement_sheet_id") @db.Uuid

  // Requirement details
  category            String                                      // Photography, Decor, Security, Catering, etc.
  description         String
  quantity            Int               @default(1)
  estimatedBudget     Decimal?          @map("estimated_budget") @db.Decimal(10, 2)
  notes               String?

  // Status
  status              RequirementStatus @default(PENDING)

  // Timestamps
  createdAt           DateTime          @default(now()) @map("created_at")
  updatedAt           DateTime          @updatedAt @map("updated_at")

  // Relations
  requirementSheet    RequirementSheet  @relation(fields: [requirementSheetId], references: [id], onDelete: Cascade)
  vendorAgreement     VendorAgreement?  // The vendor selected for this requirement

  @@index([requirementSheetId])
  @@map("requirement_items")
  @@schema("operations")
}

enum RequirementStatus {
  PENDING           // Not yet sourced
  SOURCING          // Looking for vendors
  VENDOR_SELECTED   // Vendor chosen, agreement pending
  CONTRACTED        // Vendor agreement locked
  FULFILLED         // Vendor completed the work

  @@schema("operations")
}

// Vendor Agreement/Contract for an event
model VendorAgreement {
  id              String          @id @default(uuid()) @db.Uuid
  activeEventId   String          @map("active_event_id") @db.Uuid
  requirementItemId String?       @unique @map("requirement_item_id") @db.Uuid  // Links to requirement

  // Vendor Info
  vendorProfileId String          @map("vendor_profile_id") @db.Uuid
  vendorName      String          @map("vendor_name")                           // Denormalized for quick access

  // Financial
  agreedAmount    Decimal         @map("agreed_amount") @db.Decimal(10, 2)
  advancePaid     Decimal         @default(0) @map("advance_paid") @db.Decimal(10, 2)
  balanceDue      Decimal         @default(0) @map("balance_due") @db.Decimal(10, 2)

  // Agreement lifecycle
  status          AgreementStatus @default(DRAFT)
  sentAt          DateTime?       @map("sent_at")
  acceptedAt      DateTime?       @map("accepted_at")
  declinedAt      DateTime?       @map("declined_at")
  declineReason   String?         @map("decline_reason")

  // Contract document
  contractUrl     String?         @map("contract_url")

  // Timestamps
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")

  // Relations
  activeEvent     ActiveEvent     @relation(fields: [activeEventId], references: [id], onDelete: Cascade)
  requirementItem RequirementItem? @relation(fields: [requirementItemId], references: [id])
  invoice         ProvisionalInvoice?

  @@index([activeEventId])
  @@index([vendorProfileId])
  @@index([status])
  @@map("vendor_agreements")
  @@schema("operations")
}

enum AgreementStatus {
  DRAFT             // Created but not sent
  SENT              // Agreement sent to vendor
  ACCEPTED          // Vendor accepted
  DECLINED          // Vendor declined
  CONTRACT_LOCKED   // Finalized and locked
  COMPLETED         // Work completed
  CANCELLED         // Agreement cancelled

  @@schema("operations")
}

// Provisional Invoice generated when agreement is locked
model ProvisionalInvoice {
  id                String          @id @default(uuid()) @db.Uuid
  vendorAgreementId String          @unique @map("vendor_agreement_id") @db.Uuid

  invoiceNumber     String          @unique @map("invoice_number")
  amount            Decimal         @db.Decimal(10, 2)
  status            InvoiceStatus   @default(PENDING)

  issuedAt          DateTime        @default(now()) @map("issued_at")
  paidAt            DateTime?       @map("paid_at")

  vendorAgreement   VendorAgreement @relation(fields: [vendorAgreementId], references: [id])

  @@index([status])
  @@map("provisional_invoices")
  @@schema("operations")
}

enum InvoiceStatus {
  PENDING
  PARTIALLY_PAID
  PAID
  OVERDUE
  CANCELLED

  @@schema("operations")
}

// Operational Tasks - delegated by Ops Manager to Ops Assistants or Vendors
model OperationalTask {
  id              String          @id @default(uuid()) @db.Uuid
  activeEventId   String          @map("active_event_id") @db.Uuid

  // Task details
  title           String
  description     String?
  category        String?                                         // Collection, Setup, Verification, etc.
  priority        TaskPriority    @default(NORMAL)
  dueDate         DateTime?       @map("due_date")

  // Assignment
  assignedToUserId  String?       @map("assigned_to_user_id") @db.Uuid   // Ops Assistant
  assignedToVendorId String?      @map("assigned_to_vendor_id") @db.Uuid // Or Vendor
  assignedBy      String          @map("assigned_by") @db.Uuid           // Ops Manager

  // Status workflow
  status          OperationalTaskStatus @default(PENDING)

  // Review
  submittedAt     DateTime?       @map("submitted_at")
  reviewedBy      String?         @map("reviewed_by") @db.Uuid
  reviewedAt      DateTime?       @map("reviewed_at")
  reviewNotes     String?         @map("review_notes")

  // Timestamps
  createdAt       DateTime        @default(now()) @map("created_at")
  updatedAt       DateTime        @updatedAt @map("updated_at")
  completedAt     DateTime?       @map("completed_at")

  // Relations
  activeEvent     ActiveEvent     @relation(fields: [activeEventId], references: [id], onDelete: Cascade)
  attachments     TaskAttachment[]

  @@index([activeEventId])
  @@index([assignedToUserId])
  @@index([assignedToVendorId])
  @@index([status])
  @@index([dueDate])
  @@map("operational_tasks")
  @@schema("operations")
}

enum TaskPriority {
  LOW
  NORMAL
  HIGH
  URGENT

  @@schema("operations")
}

enum OperationalTaskStatus {
  PENDING           // Created, not yet assigned
  ASSIGNED          // Assigned to assistant/vendor
  IN_PROGRESS       // Work started
  SUBMITTED         // Submitted for review (with proof)
  APPROVED          // Manager approved
  REJECTED          // Manager rejected, needs rework
  COMPLETED         // Finished
  CANCELLED         // Task cancelled

  @@schema("operations")
}

// Task Attachments - proof of work (photos, PDFs, receipts)
model TaskAttachment {
  id              String          @id @default(uuid()) @db.Uuid
  taskId          String          @map("task_id") @db.Uuid

  type            AttachmentType
  url             String
  fileName        String          @map("file_name")
  fileSize        Int             @map("file_size")                // bytes
  mimeType        String          @map("mime_type")
  description     String?

  uploadedBy      String          @map("uploaded_by") @db.Uuid
  createdAt       DateTime        @default(now()) @map("created_at")

  task            OperationalTask @relation(fields: [taskId], references: [id], onDelete: Cascade)

  @@index([taskId])
  @@map("task_attachments")
  @@schema("operations")
}

enum AttachmentType {
  IMAGE
  PDF
  DOCUMENT
  RECEIPT
  VIDEO
  OTHER

  @@schema("operations")
}


// ═══════════════════════════════════════════════════════════════════════════════
// BLOG MODELS (content schema) - Simplified SEO Blog System
// ═══════════════════════════════════════════════════════════════════════════════

model BlogPost {
  id                  String           @id @default(uuid()) @db.Uuid

  // Core Content
  title               String           @db.VarChar(200)
  slug                String           @unique @db.VarChar(250)
  excerpt             String?          @db.VarChar(300)
  content             String           @db.Text

  // SEO Essentials (auto-fallback to title/excerpt if null)
  metaTitle           String?          @map("meta_title") @db.VarChar(70)
  metaDescription     String?          @map("meta_description") @db.VarChar(160)
  focusKeyword        String?          @map("focus_keyword") @db.VarChar(100)
  keywords            String[]         @default([])

  // Open Graph (falls back to meta fields if null)
  ogImage             String?          @map("og_image") @db.VarChar(500)

  // Featured Image
  featuredImage       String?          @map("featured_image") @db.VarChar(500)
  featuredImageAlt    String?          @map("featured_image_alt") @db.VarChar(125)

  // Publishing
  status              BlogStatus       @default(DRAFT)
  publishedAt         DateTime?        @map("published_at")

  // Author (links to User model directly)
  authorId            String           @map("author_id") @db.Uuid

  // Category & Tags
  categoryId          String?          @map("category_id") @db.Uuid
  category            BlogCategory?    @relation(fields: [categoryId], references: [id])
  tags                BlogPostTag[]

  // Metrics (auto-calculated)
  viewCount           Int              @default(0) @map("view_count")
  readingTime         Int              @default(0) @map("reading_time") // minutes

  // Vendor Spotlight (optional link to vendor)
  vendorId            String?          @map("vendor_id") @db.Uuid

  // Timestamps
  createdAt           DateTime         @default(now()) @map("created_at")
  updatedAt           DateTime         @updatedAt @map("updated_at")

  @@index([slug])
  @@index([status, publishedAt])
  @@index([authorId])
  @@index([categoryId])
  @@index([publishedAt(sort: Desc)])
  @@map("blog_posts")
  @@schema("content")
}

model BlogCategory {
  id                  String           @id @default(uuid()) @db.Uuid
  name                String           @db.VarChar(100)
  slug                String           @unique @db.VarChar(120)
  description         String?          @db.VarChar(300)

  // SEO
  metaTitle           String?          @map("meta_title") @db.VarChar(70)
  metaDescription     String?          @map("meta_description") @db.VarChar(160)

  // Display
  color               String?          @db.VarChar(7)
  sortOrder           Int              @default(0) @map("sort_order")

  // Relations
  posts               BlogPost[]

  // Timestamps
  isActive            Boolean          @default(true) @map("is_active")
  createdAt           DateTime         @default(now()) @map("created_at")
  updatedAt           DateTime         @updatedAt @map("updated_at")

  @@index([slug])
  @@index([isActive, sortOrder])
  @@map("blog_categories")
  @@schema("content")
}

model BlogTag {
  id                  String           @id @default(uuid()) @db.Uuid
  name                String           @unique @db.VarChar(50)
  slug                String           @unique @db.VarChar(60)

  // Relations
  posts               BlogPostTag[]

  // Timestamps
  createdAt           DateTime         @default(now()) @map("created_at")

  @@index([slug])
  @@map("blog_tags")
  @@schema("content")
}

model BlogPostTag {
  postId              String           @map("post_id") @db.Uuid
  post                BlogPost         @relation(fields: [postId], references: [id], onDelete: Cascade)
  tagId               String           @map("tag_id") @db.Uuid
  tag                 BlogTag          @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([postId, tagId])
  @@map("blog_post_tags")
  @@schema("content")
}

// ═══════════════════════════════════════════════════════════════════════════════
// BLOG ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

enum BlogStatus {
  DRAFT
  PUBLISHED
  ARCHIVED

  @@schema("content")
}
```

---

## Part 5: Key Implementation Patterns

### 5.1 Service Pattern Example

```typescript
// domain/catalog/services/vendor-profile.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '@/core/database/prisma.service';
import { DragonflyService } from '@/infrastructure/cache/dragonfly.service';
import { CreateVendorProfileDto, UpdateVendorProfileDto, VendorProfileDto } from '../dto';

@Injectable()
export class VendorProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: DragonflyService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateVendorProfileDto): Promise<VendorProfileDto> {
    // 1. Generate slug
    const slug = this.generateSlug(dto.businessName);

    // 2. Create profile in database
    const profile = await this.prisma.vendorProfile.create({
      data: {
        userId,
        businessName: dto.businessName,
        slug,
        categoryId: dto.categoryId,
        description: dto.description,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
      },
      include: { category: true, address: true },
    });

    // 3. Emit event for side effects (search indexing, etc.)
    this.eventEmitter.emit('vendor.profile.created', {
      profileId: profile.id,
      userId,
      businessName: profile.businessName,
      categoryId: profile.categoryId,
    });

    return this.toDto(profile);
  }

  async findById(id: string): Promise<VendorProfileDto> {
    const cacheKey = `vendor:profile:${id}`;

    // 1. Check cache first
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      return JSON.parse(cached) as VendorProfileDto;
    }

    // 2. Cache miss - fetch from database
    const profile = await this.prisma.vendorProfile.findUnique({
      where: { id },
      include: { category: true, address: true, businessHours: true },
    });

    if (!profile) {
      throw new NotFoundException('Vendor profile not found');
    }

    const dto = this.toDto(profile);

    // 3. Populate cache
    await this.cache.setex(cacheKey, 900, JSON.stringify(dto));

    return dto;
  }

  async update(id: string, dto: UpdateVendorProfileDto): Promise<VendorProfileDto> {
    const profile = await this.prisma.vendorProfile.update({
      where: { id },
      data: {
        businessName: dto.businessName,
        description: dto.description,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
      },
      include: { category: true, address: true },
    });

    // Emit event for cache invalidation and search re-indexing
    this.eventEmitter.emit('vendor.profile.updated', {
      profileId: profile.id,
      changes: dto,
    });

    return this.toDto(profile);
  }

  private generateSlug(businessName: string): string {
    return businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private toDto(profile: any): VendorProfileDto {
    return {
      id: profile.id,
      businessName: profile.businessName,
      slug: profile.slug,
      category: profile.category,
      description: profile.description,
      status: profile.status,
      // ... map other fields
    };
  }
}
```

### 5.2 Event Listener for Side Effects

```typescript
// domain/catalog/events/vendor-profile.listener.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MeilisearchService } from '@/infrastructure/search/meilisearch.service';
import { DragonflyService } from '@/infrastructure/cache/dragonfly.service';

@Injectable()
export class VendorProfileListener {
  constructor(
    private readonly searchService: MeilisearchService,
    private readonly cacheService: DragonflyService,
  ) {}

  @OnEvent('vendor.profile.created')
  async handleCreated(payload: { profileId: string; businessName: string; categoryId: string }) {
    // Index in search engine
    await this.searchService.indexVendor({
      id: payload.profileId,
      businessName: payload.businessName,
      categoryId: payload.categoryId,
    });
  }

  @OnEvent('vendor.profile.updated')
  async handleUpdated(payload: { profileId: string; changes: any }) {
    // 1. Invalidate cache
    await this.cacheService.del(`vendor:profile:${payload.profileId}`);

    // 2. Re-index in search engine
    await this.searchService.updateVendor(payload.profileId, payload.changes);
  }

  @OnEvent('vendor.profile.deleted')
  async handleDeleted(payload: { profileId: string }) {
    // Remove from cache and search index
    await this.cacheService.del(`vendor:profile:${payload.profileId}`);
    await this.searchService.removeVendor(payload.profileId);
  }
}
```

### 5.3 Controller Pattern

```typescript
// api/business-gateway/controllers/profile.controller.ts
import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/auth/guards/roles.guard';
import { Roles } from '@/core/auth/decorators/roles.decorator';
import { CurrentUser } from '@/core/auth/decorators/current-user.decorator';
import { VendorProfileService } from '@/domain/catalog/services/vendor-profile.service';
import { CreateVendorProfileDto, UpdateVendorProfileDto } from '@/domain/catalog/dto';

@ApiTags('Vendor Profile')
@ApiBearerAuth()
@Controller('profile')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('BUSINESS_ADMIN')
export class ProfileController {
  constructor(private readonly vendorProfileService: VendorProfileService) {}

  @Post()
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateVendorProfileDto,
  ) {
    return this.vendorProfileService.create(userId, dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.vendorProfileService.findById(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVendorProfileDto,
  ) {
    return this.vendorProfileService.update(id, dto);
  }
}
```

### 5.4 Repository Pattern (Optional Abstraction)

```typescript
// domain/catalog/repositories/vendor-profile.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { Prisma, VendorProfile } from '@prisma/client';

@Injectable()
export class VendorProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, include?: Prisma.VendorProfileInclude): Promise<VendorProfile | null> {
    return this.prisma.vendorProfile.findUnique({
      where: { id },
      include,
    });
  }

  async findBySlug(slug: string): Promise<VendorProfile | null> {
    return this.prisma.vendorProfile.findUnique({
      where: { slug },
      include: { category: true, address: true, businessHours: true },
    });
  }

  async findByUserId(userId: string): Promise<VendorProfile | null> {
    return this.prisma.vendorProfile.findUnique({
      where: { userId },
    });
  }

  async search(params: {
    categoryId?: string;
    cityId?: string;
    status?: string;
    skip?: number;
    take?: number;
  }): Promise<{ data: VendorProfile[]; total: number }> {
    const where: Prisma.VendorProfileWhereInput = {
      status: params.status as any || 'ACTIVE',
      ...(params.categoryId && { categoryId: params.categoryId }),
      ...(params.cityId && { address: { cityId: params.cityId } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.vendorProfile.findMany({
        where,
        skip: params.skip || 0,
        take: params.take || 20,
        include: { category: true, address: { include: { city: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.vendorProfile.count({ where }),
    ]);

    return { data, total };
  }
}
```

---

## Part 6: Infrastructure Setup

### 6.1 Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: omnicassion
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: omnicassion
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-schemas.sql:/docker-entrypoint-initdb.d/01-schemas.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U omnicassion"]
      interval: 5s
      timeout: 5s
      retries: 5

  dragonfly:
    image: docker.dragonflydb.io/dragonflydb/dragonfly
    command: --maxmemory 512mb --proactor_threads 2
    ports:
      - "6379:6379"
    volumes:
      - dragonfly_data:/data

  meilisearch:
    image: getmeili/meilisearch:v1.6
    environment:
      MEILI_MASTER_KEY: ${MEILI_MASTER_KEY}
      MEILI_ENV: development
    ports:
      - "7700:7700"
    volumes:
      - meilisearch_data:/meili_data

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  dragonfly_data:
  meilisearch_data:
  minio_data:
```

### 6.2 Environment Configuration

```bash
# .env.example
NODE_ENV=development

# Database
DATABASE_URL="postgresql://omnicassion:password@localhost:5432/omnicassion?schema=public"
DATABASE_POOL_SIZE=20

# Dragonfly (Redis-compatible)
DRAGONFLY_URL="redis://localhost:6379"

# Meilisearch
MEILI_HOST="http://localhost:7700"
MEILI_MASTER_KEY="your-master-key"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT=9000
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET="omnicassion"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_REFRESH_EXPIRES_IN="7d"

# BullMQ
BULLMQ_REDIS_URL="redis://localhost:6379"
```

---

## Part 6B: Security, Soft Delete & Audit Logging

### ADR-012: Comprehensive Soft Delete Strategy

**Decision:** Implement soft delete across all user-facing entities with automatic filtering and recovery capabilities.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           SOFT DELETE ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  SOFT DELETE FIELDS (Added to all soft-deletable entities):                     │
│  ─────────────────────────────────────────────────────────────                  │
│  • deletedAt     DateTime?  - Timestamp when record was soft deleted           │
│  • deletedBy     String?    - User ID who performed the deletion               │
│  • deletionReason String?   - Optional reason for deletion (compliance)        │
│                                                                                  │
│  ENTITIES WITH SOFT DELETE:                                                      │
│  ──────────────────────────                                                      │
│  ├── User                    (identity)                                         │
│  ├── VendorProfile           (catalog)                                          │
│  ├── Portfolio               (catalog)                                          │
│  ├── MediaItem               (catalog)                                          │
│  ├── Service                 (catalog)                                          │
│  ├── Lead                    (interaction)                                      │
│  ├── Message                 (interaction)                                      │
│  ├── Event                   (planning)                                         │
│  ├── Checklist               (planning)                                         │
│  ├── Guest                   (planning)                                         │
│  └── Dispute                 (operations)                                       │
│                                                                                  │
│  HARD DELETE ENTITIES (Reference/System data):                                  │
│  ─────────────────────────────────────────────                                  │
│  ├── Country, State, City    (immutable reference)                              │
│  ├── Category, ServiceType   (admin-managed reference)                          │
│  ├── Role                    (system-managed)                                   │
│  ├── AuditLog                (compliance - immutable)                           │
│  └── UserSession             (ephemeral - auto-expired)                         │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**12.1 Prisma Extension for Soft Delete:**

```typescript
// core/database/prisma.extension.ts
import { Prisma, PrismaClient } from '@prisma/client';

// Models that support soft delete
const SOFT_DELETE_MODELS = [
  'user',
  'vendorProfile',
  'portfolio',
  'mediaItem',
  'service',
  'lead',
  'message',
  'event',
  'checklist',
  'checklistItem',
  'guest',
  'dispute',
] as const;

type SoftDeleteModel = typeof SOFT_DELETE_MODELS[number];

function isSoftDeleteModel(model: string): model is SoftDeleteModel {
  return SOFT_DELETE_MODELS.includes(model as SoftDeleteModel);
}

export const softDeleteExtension = Prisma.defineExtension({
  name: 'soft-delete',
  query: {
    $allModels: {
      // Automatically filter out soft-deleted records
      async findMany({ model, args, query }) {
        if (isSoftDeleteModel(model)) {
          args.where = { ...args.where, deletedAt: null };
        }
        return query(args);
      },
      async findFirst({ model, args, query }) {
        if (isSoftDeleteModel(model)) {
          args.where = { ...args.where, deletedAt: null };
        }
        return query(args);
      },
      async findUnique({ model, args, query }) {
        if (isSoftDeleteModel(model)) {
          // findUnique doesn't support complex where, use findFirst
          const result = await query(args);
          if (result && (result as any).deletedAt !== null) {
            return null;
          }
          return result;
        }
        return query(args);
      },
      async count({ model, args, query }) {
        if (isSoftDeleteModel(model)) {
          args.where = { ...args.where, deletedAt: null };
        }
        return query(args);
      },
      // Convert delete to soft delete
      async delete({ model, args, query }) {
        if (isSoftDeleteModel(model)) {
          return (query as any)({
            ...args,
            data: {
              deletedAt: new Date(),
            },
          });
        }
        return query(args);
      },
      async deleteMany({ model, args, query }) {
        if (isSoftDeleteModel(model)) {
          return (query as any)({
            where: args.where,
            data: {
              deletedAt: new Date(),
            },
          });
        }
        return query(args);
      },
    },
  },
});

// Extended client with soft delete
export type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

export function createExtendedClient(prisma: PrismaClient) {
  return prisma.$extends(softDeleteExtension);
}
```

**12.2 Soft Delete Service:**

```typescript
// core/database/services/soft-delete.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface SoftDeleteOptions {
  deletedBy: string;
  reason?: string;
}

export interface RestoreOptions {
  restoredBy: string;
}

@Injectable()
export class SoftDeleteService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Soft delete a record with metadata
   */
  async softDelete<T extends { id: string }>(
    model: string,
    id: string,
    options: SoftDeleteOptions,
  ): Promise<T> {
    const modelDelegate = (this.prisma as any)[model];

    return modelDelegate.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy: options.deletedBy,
        deletionReason: options.reason,
      },
    });
  }

  /**
   * Restore a soft-deleted record
   */
  async restore<T extends { id: string }>(
    model: string,
    id: string,
    options: RestoreOptions,
  ): Promise<T> {
    const modelDelegate = (this.prisma as any)[model];

    // First, find including deleted
    const record = await this.findIncludingDeleted(model, id);

    if (!record) {
      throw new Error(`Record ${model}:${id} not found`);
    }

    if (!record.deletedAt) {
      throw new Error(`Record ${model}:${id} is not deleted`);
    }

    return modelDelegate.update({
      where: { id },
      data: {
        deletedAt: null,
        deletedBy: null,
        deletionReason: null,
      },
    });
  }

  /**
   * Find a record including soft-deleted ones
   */
  async findIncludingDeleted<T>(model: string, id: string): Promise<T | null> {
    const modelDelegate = (this.prisma as any)[model];

    // Use raw query to bypass soft-delete filter
    return this.prisma.$queryRawUnsafe(
      `SELECT * FROM "${model}" WHERE id = $1`,
      id,
    );
  }

  /**
   * Find all soft-deleted records for a model
   */
  async findDeleted<T>(
    model: string,
    options?: {
      deletedAfter?: Date;
      deletedBefore?: Date;
      deletedBy?: string;
    },
  ): Promise<T[]> {
    const conditions: string[] = ['deleted_at IS NOT NULL'];
    const params: any[] = [];
    let paramIndex = 1;

    if (options?.deletedAfter) {
      conditions.push(`deleted_at >= $${paramIndex++}`);
      params.push(options.deletedAfter);
    }
    if (options?.deletedBefore) {
      conditions.push(`deleted_at <= $${paramIndex++}`);
      params.push(options.deletedBefore);
    }
    if (options?.deletedBy) {
      conditions.push(`deleted_by = $${paramIndex++}`);
      params.push(options.deletedBy);
    }

    return this.prisma.$queryRawUnsafe(
      `SELECT * FROM "${model}" WHERE ${conditions.join(' AND ')}`,
      ...params,
    );
  }

  /**
   * Permanently delete soft-deleted records older than retention period
   */
  async purgeDeleted(
    model: string,
    retentionDays: number = 90,
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.$executeRawUnsafe(
      `DELETE FROM "${model}" WHERE deleted_at IS NOT NULL AND deleted_at < $1`,
      cutoffDate,
    );

    return result;
  }
}
```

**12.3 Updated Prisma Schema with Soft Delete Fields:**

```prisma
// Add to all soft-deletable models:

model User {
  // ... existing fields ...

  // Soft Delete
  deletedAt       DateTime? @map("deleted_at")
  deletedBy       String?   @map("deleted_by") @db.Uuid
  deletionReason  String?   @map("deletion_reason")

  @@index([deletedAt])
}

model VendorProfile {
  // ... existing fields ...

  // Soft Delete
  deletedAt       DateTime? @map("deleted_at")
  deletedBy       String?   @map("deleted_by") @db.Uuid
  deletionReason  String?   @map("deletion_reason")

  @@index([deletedAt])
}

model Lead {
  // ... existing fields ...

  // Soft Delete
  deletedAt       DateTime? @map("deleted_at")
  deletedBy       String?   @map("deleted_by") @db.Uuid
  deletionReason  String?   @map("deletion_reason")

  @@index([deletedAt])
}

model Event {
  // ... existing fields ...

  // Soft Delete
  deletedAt       DateTime? @map("deleted_at")
  deletedBy       String?   @map("deleted_by") @db.Uuid
  deletionReason  String?   @map("deletion_reason")

  @@index([deletedAt])
}

// Apply similar pattern to: Portfolio, MediaItem, Service, Message,
// Checklist, ChecklistItem, Guest, Dispute
```

**12.4 Cascade Soft Delete Handler:**

```typescript
// core/database/handlers/cascade-soft-delete.handler.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '../prisma.service';

interface CascadeConfig {
  [parentModel: string]: {
    children: Array<{
      model: string;
      foreignKey: string;
    }>;
  };
}

const CASCADE_CONFIG: CascadeConfig = {
  user: {
    children: [
      { model: 'vendorProfile', foreignKey: 'userId' },
      { model: 'event', foreignKey: 'userId' },
      { model: 'lead', foreignKey: 'plannerId' },
    ],
  },
  vendorProfile: {
    children: [
      { model: 'portfolio', foreignKey: 'vendorProfileId' },
      { model: 'service', foreignKey: 'vendorProfileId' },
      { model: 'lead', foreignKey: 'vendorProfileId' },
    ],
  },
  portfolio: {
    children: [
      { model: 'mediaItem', foreignKey: 'portfolioId' },
    ],
  },
  event: {
    children: [
      { model: 'checklist', foreignKey: 'eventId' },
      { model: 'timeline', foreignKey: 'eventId' },
    ],
  },
  checklist: {
    children: [
      { model: 'checklistItem', foreignKey: 'checklistId' },
    ],
  },
};

@Injectable()
export class CascadeSoftDeleteHandler {
  constructor(private readonly prisma: PrismaService) {}

  @OnEvent('entity.soft_deleted')
  async handleCascadeDelete(payload: {
    model: string;
    id: string;
    deletedBy: string;
    deletedAt: Date;
  }) {
    const config = CASCADE_CONFIG[payload.model];
    if (!config) return;

    for (const child of config.children) {
      await (this.prisma as any)[child.model].updateMany({
        where: {
          [child.foreignKey]: payload.id,
          deletedAt: null,
        },
        data: {
          deletedAt: payload.deletedAt,
          deletedBy: payload.deletedBy,
          deletionReason: `Cascade delete from ${payload.model}:${payload.id}`,
        },
      });
    }
  }
}
```

---

### ADR-013: Comprehensive Audit Logging System

**Decision:** Implement a robust audit logging system that tracks all data changes, user actions, and security events.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           AUDIT LOGGING ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  AUDIT LOG CATEGORIES:                                                           │
│  ─────────────────────                                                           │
│  1. DATA_CHANGE      - Create, Update, Delete operations on entities            │
│  2. AUTHENTICATION   - Login, logout, password changes, MFA events              │
│  3. AUTHORIZATION    - Permission checks, role changes, access denials          │
│  4. SECURITY         - Suspicious activity, rate limiting, IP blocks            │
│  5. SYSTEM           - Configuration changes, deployments, maintenance          │
│  6. COMPLIANCE       - GDPR requests, data exports, consent changes             │
│                                                                                  │
│  AUDIT LOG RETENTION:                                                            │
│  ────────────────────                                                            │
│  • Security Events:    7 years (compliance requirement)                         │
│  • Data Changes:       3 years                                                  │
│  • Authentication:     1 year                                                   │
│  • System Events:      90 days                                                  │
│                                                                                  │
│  STORAGE STRATEGY:                                                               │
│  ─────────────────                                                               │
│  • Hot Storage:   PostgreSQL (last 90 days) - indexed for quick queries        │
│  • Warm Storage:  Compressed PostgreSQL partitions (90 days - 1 year)          │
│  • Cold Storage:  S3/MinIO archive (> 1 year) - compliance retention           │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**13.1 Enhanced Audit Log Schema:**

```prisma
// prisma/schema.prisma - Enhanced AuditLog model

model AuditLog {
  id              String         @id @default(uuid()) @db.Uuid

  // Actor Information
  userId          String?        @map("user_id") @db.Uuid
  userEmail       String?        @map("user_email")
  userRoles       String[]       @map("user_roles")
  impersonatedBy  String?        @map("impersonated_by") @db.Uuid

  // Action Details
  category        AuditCategory
  action          String                              // e.g., "CREATE", "UPDATE", "DELETE", "LOGIN"
  actionDetail    String?        @map("action_detail") // e.g., "password_reset", "role_assigned"

  // Target Entity
  entityType      String         @map("entity_type")  // e.g., "User", "VendorProfile"
  entityId        String?        @map("entity_id") @db.Uuid
  entityName      String?        @map("entity_name")  // Human-readable identifier

  // Change Tracking
  oldValue        Json?          @map("old_value")
  newValue        Json?          @map("new_value")
  changedFields   String[]       @map("changed_fields")

  // Request Context
  requestId       String?        @map("request_id") @db.Uuid
  ipAddress       String?        @map("ip_address")
  userAgent       String?        @map("user_agent")
  geoLocation     Json?          @map("geo_location")  // { country, region, city }

  // Additional Context
  metadata        Json?                               // Additional context-specific data
  severity        AuditSeverity  @default(INFO)

  // Timestamps
  createdAt       DateTime       @default(now()) @map("created_at")

  // Indexes for efficient querying
  @@index([userId])
  @@index([category])
  @@index([entityType, entityId])
  @@index([action])
  @@index([createdAt])
  @@index([severity])
  @@index([ipAddress])

  @@map("audit_logs")
  @@schema("operations")
}

enum AuditCategory {
  DATA_CHANGE
  AUTHENTICATION
  AUTHORIZATION
  SECURITY
  SYSTEM
  COMPLIANCE

  @@schema("operations")
}

enum AuditSeverity {
  DEBUG
  INFO
  WARNING
  ERROR
  CRITICAL

  @@schema("operations")
}

// Security-specific audit events
model SecurityEvent {
  id              String         @id @default(uuid()) @db.Uuid

  eventType       SecurityEventType
  userId          String?        @map("user_id") @db.Uuid
  ipAddress       String         @map("ip_address")
  userAgent       String?        @map("user_agent")

  // Event Details
  description     String
  metadata        Json?

  // Risk Assessment
  riskScore       Int            @default(0) @map("risk_score")  // 0-100
  isBlocked       Boolean        @default(false) @map("is_blocked")

  // Resolution
  resolvedAt      DateTime?      @map("resolved_at")
  resolvedBy      String?        @map("resolved_by") @db.Uuid
  resolution      String?

  createdAt       DateTime       @default(now()) @map("created_at")

  @@index([eventType])
  @@index([userId])
  @@index([ipAddress])
  @@index([riskScore])
  @@index([createdAt])

  @@map("security_events")
  @@schema("operations")
}

enum SecurityEventType {
  FAILED_LOGIN
  BRUTE_FORCE_ATTEMPT
  SUSPICIOUS_ACTIVITY
  UNAUTHORIZED_ACCESS
  RATE_LIMIT_EXCEEDED
  IP_BLOCKED
  SESSION_HIJACK_ATTEMPT
  PRIVILEGE_ESCALATION
  DATA_EXFILTRATION_ATTEMPT

  @@schema("operations")
}
```

**13.2 Audit Service Implementation:**

```typescript
// core/audit/audit.service.ts
import { Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Inject } from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '@/core/database/prisma.service';
import { AuditCategory, AuditSeverity } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { v4 as uuidv4 } from 'uuid';

export interface AuditContext {
  userId?: string;
  userEmail?: string;
  userRoles?: string[];
  impersonatedBy?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogEntry {
  category: AuditCategory;
  action: string;
  actionDetail?: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  oldValue?: any;
  newValue?: any;
  changedFields?: string[];
  metadata?: Record<string, any>;
  severity?: AuditSeverity;
}

@Injectable({ scope: Scope.REQUEST })
export class AuditService {
  private context: AuditContext = {};

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(REQUEST) private readonly request: Request,
  ) {
    this.initializeContext();
  }

  private initializeContext(): void {
    const user = (this.request as any).user;

    this.context = {
      requestId: uuidv4(),
      userId: user?.sub,
      userEmail: user?.email,
      userRoles: user?.roles || [],
      ipAddress: this.getClientIp(),
      userAgent: this.request.headers['user-agent'],
      impersonatedBy: user?.impersonatedBy,
    };
  }

  private getClientIp(): string {
    const forwarded = this.request.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    }
    return this.request.ip || 'unknown';
  }

  /**
   * Log an audit event
   */
  async log(entry: AuditLogEntry): Promise<void> {
    const auditLog = await this.prisma.auditLog.create({
      data: {
        ...this.context,
        ...entry,
        geoLocation: await this.getGeoLocation(this.context.ipAddress),
      },
    });

    // Emit event for real-time monitoring
    this.eventEmitter.emit('audit.logged', auditLog);

    // Check for security concerns
    if (entry.severity === 'CRITICAL' || entry.severity === 'ERROR') {
      this.eventEmitter.emit('audit.security_concern', auditLog);
    }
  }

  /**
   * Log a data change with automatic diff calculation
   */
  async logDataChange(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    entityType: string,
    entityId: string,
    options: {
      entityName?: string;
      oldValue?: any;
      newValue?: any;
      metadata?: Record<string, any>;
    } = {},
  ): Promise<void> {
    const changedFields = this.calculateChangedFields(
      options.oldValue,
      options.newValue,
    );

    // Sanitize sensitive fields from audit log
    const sanitizedOld = this.sanitizeSensitiveData(options.oldValue);
    const sanitizedNew = this.sanitizeSensitiveData(options.newValue);

    await this.log({
      category: 'DATA_CHANGE',
      action,
      entityType,
      entityId,
      entityName: options.entityName,
      oldValue: sanitizedOld,
      newValue: sanitizedNew,
      changedFields,
      metadata: options.metadata,
      severity: action === 'DELETE' ? 'WARNING' : 'INFO',
    });
  }

  /**
   * Log authentication events
   */
  async logAuth(
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | 'MFA_ENABLED' | 'MFA_DISABLED',
    options: {
      userId?: string;
      userEmail?: string;
      metadata?: Record<string, any>;
      severity?: AuditSeverity;
    } = {},
  ): Promise<void> {
    await this.log({
      category: 'AUTHENTICATION',
      action,
      entityType: 'User',
      entityId: options.userId || this.context.userId,
      entityName: options.userEmail || this.context.userEmail,
      metadata: options.metadata,
      severity: options.severity || (action === 'LOGIN_FAILED' ? 'WARNING' : 'INFO'),
    });
  }

  /**
   * Log security events
   */
  async logSecurity(
    eventType: string,
    description: string,
    options: {
      metadata?: Record<string, any>;
      riskScore?: number;
      severity?: AuditSeverity;
    } = {},
  ): Promise<void> {
    await this.log({
      category: 'SECURITY',
      action: eventType,
      actionDetail: description,
      entityType: 'Security',
      metadata: options.metadata,
      severity: options.severity || 'WARNING',
    });

    // Also create security event record for tracking
    await this.prisma.securityEvent.create({
      data: {
        eventType: eventType as any,
        userId: this.context.userId,
        ipAddress: this.context.ipAddress || 'unknown',
        userAgent: this.context.userAgent,
        description,
        metadata: options.metadata,
        riskScore: options.riskScore || 50,
      },
    });
  }

  /**
   * Calculate changed fields between old and new values
   */
  private calculateChangedFields(oldValue: any, newValue: any): string[] {
    if (!oldValue || !newValue) return [];

    const changes: string[] = [];
    const allKeys = new Set([
      ...Object.keys(oldValue || {}),
      ...Object.keys(newValue || {}),
    ]);

    for (const key of allKeys) {
      if (JSON.stringify(oldValue?.[key]) !== JSON.stringify(newValue?.[key])) {
        changes.push(key);
      }
    }

    return changes;
  }

  /**
   * Remove sensitive fields from audit data
   */
  private sanitizeSensitiveData(data: any): any {
    if (!data) return data;

    const SENSITIVE_FIELDS = [
      'password',
      'passwordHash',
      'refreshToken',
      'accessToken',
      'apiKey',
      'secret',
      'ssn',
      'taxId',
      'creditCard',
    ];

    const sanitized = { ...data };
    for (const field of SENSITIVE_FIELDS) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Get geo location from IP (using external service)
   */
  private async getGeoLocation(ip?: string): Promise<any> {
    if (!ip || ip === 'unknown' || ip === '127.0.0.1') {
      return null;
    }
    // Implement IP geolocation lookup
    // Can use services like MaxMind, IP-API, etc.
    return null;
  }
}
```

**13.3 Audit Interceptor for Automatic Logging:**

```typescript
// core/audit/audit.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditService } from './audit.service';

export const AUDIT_METADATA_KEY = 'audit';

export interface AuditMetadata {
  action: string;
  entityType: string;
  getEntityId?: (request: any, response: any) => string;
  getEntityName?: (request: any, response: any) => string;
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
}

export const Audited = (metadata: AuditMetadata) =>
  SetMetadata(AUDIT_METADATA_KEY, metadata);

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditService: AuditService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const metadata = this.reflector.get<AuditMetadata>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );

    if (!metadata) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: async (response) => {
          const duration = Date.now() - startTime;

          await this.auditService.log({
            category: 'DATA_CHANGE',
            action: metadata.action,
            entityType: metadata.entityType,
            entityId: metadata.getEntityId?.(request, response),
            entityName: metadata.getEntityName?.(request, response),
            newValue: metadata.includeResponseBody ? response : undefined,
            metadata: {
              duration,
              method: request.method,
              path: request.path,
              ...(metadata.includeRequestBody && { requestBody: request.body }),
            },
          });
        },
        error: async (error) => {
          await this.auditService.log({
            category: 'DATA_CHANGE',
            action: `${metadata.action}_FAILED`,
            entityType: metadata.entityType,
            metadata: {
              error: error.message,
              method: request.method,
              path: request.path,
            },
            severity: 'ERROR',
          });
        },
      }),
    );
  }
}
```

**13.4 Prisma Middleware for Automatic Change Tracking:**

```typescript
// core/database/middleware/audit.middleware.ts
import { Prisma } from '@prisma/client';
import { AuditService } from '@/core/audit/audit.service';

// Models that should be automatically audited
const AUDITED_MODELS = [
  'User',
  'VendorProfile',
  'Portfolio',
  'Service',
  'Lead',
  'Event',
  'VendorKYC',
  'Dispute',
];

export function createAuditMiddleware(
  getAuditService: () => AuditService,
): Prisma.Middleware {
  return async (params, next) => {
    const { model, action, args } = params;

    if (!model || !AUDITED_MODELS.includes(model)) {
      return next(params);
    }

    const auditService = getAuditService();
    let oldValue: any = null;

    // Capture old value for updates and deletes
    if (action === 'update' || action === 'delete') {
      const modelDelegate = (params as any).dataProxy?.[model.toLowerCase()];
      if (modelDelegate && args.where) {
        oldValue = await modelDelegate.findUnique({ where: args.where });
      }
    }

    // Execute the operation
    const result = await next(params);

    // Log the change
    try {
      switch (action) {
        case 'create':
          await auditService.logDataChange('CREATE', model, result.id, {
            newValue: result,
          });
          break;
        case 'update':
          await auditService.logDataChange('UPDATE', model, result.id, {
            oldValue,
            newValue: result,
          });
          break;
        case 'delete':
          await auditService.logDataChange('DELETE', model, oldValue?.id, {
            oldValue,
          });
          break;
      }
    } catch (error) {
      // Don't fail the operation if audit logging fails
      console.error('Audit logging failed:', error);
    }

    return result;
  };
}
```

**13.5 Audit Query Service:**

```typescript
// core/audit/audit-query.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { AuditCategory, AuditSeverity } from '@prisma/client';

export interface AuditQueryOptions {
  userId?: string;
  entityType?: string;
  entityId?: string;
  category?: AuditCategory;
  severity?: AuditSeverity;
  action?: string;
  ipAddress?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditQueryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Query audit logs with filters
   */
  async queryLogs(options: AuditQueryOptions) {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      ...filters
    } = options;

    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.category) where.category = filters.category;
    if (filters.severity) where.severity = filters.severity;
    if (filters.action) where.action = { contains: filters.action };
    if (filters.ipAddress) where.ipAddress = filters.ipAddress;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get entity history (all changes to a specific entity)
   */
  async getEntityHistory(entityType: string, entityId: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
        category: 'DATA_CHANGE',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get user activity log
   */
  async getUserActivity(userId: string, options: { days?: number } = {}) {
    const { days = 30 } = options;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get security events summary
   */
  async getSecuritySummary(options: { days?: number } = {}) {
    const { days = 7 } = options;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [events, byType, byRiskLevel] = await Promise.all([
      this.prisma.securityEvent.findMany({
        where: { createdAt: { gte: startDate } },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.securityEvent.groupBy({
        by: ['eventType'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
      this.prisma.securityEvent.groupBy({
        by: ['riskScore'],
        where: { createdAt: { gte: startDate } },
        _count: true,
      }),
    ]);

    return {
      recentEvents: events,
      byType,
      byRiskLevel,
    };
  }

  /**
   * Export audit logs for compliance
   */
  async exportForCompliance(options: {
    startDate: Date;
    endDate: Date;
    categories?: AuditCategory[];
  }) {
    const where: any = {
      createdAt: {
        gte: options.startDate,
        lte: options.endDate,
      },
    };

    if (options.categories?.length) {
      where.category = { in: options.categories };
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
  }
}
```

---

### ADR-014: Enhanced Security Hardening

**Decision:** Implement defense-in-depth security measures beyond basic authentication.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY HARDENING ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  LAYER 1: NETWORK SECURITY                                                       │
│  ─────────────────────────                                                       │
│  • WAF (Web Application Firewall) rules                                         │
│  • DDoS protection (Cloudflare/AWS Shield)                                      │
│  • IP reputation filtering                                                       │
│  • Geo-blocking for admin endpoints                                             │
│                                                                                  │
│  LAYER 2: APPLICATION SECURITY                                                   │
│  ────────────────────────────                                                    │
│  • Input validation & sanitization                                              │
│  • Output encoding (XSS prevention)                                             │
│  • CSRF protection                                                               │
│  • Security headers (CSP, HSTS, etc.)                                           │
│  • Request signing for sensitive operations                                     │
│                                                                                  │
│  LAYER 3: AUTHENTICATION & SESSION                                               │
│  ─────────────────────────────────                                               │
│  • MFA support (TOTP, SMS, Email)                                               │
│  • Session fingerprinting                                                        │
│  • Device tracking & trusted devices                                            │
│  • Suspicious login detection                                                    │
│                                                                                  │
│  LAYER 4: DATA SECURITY                                                          │
│  ──────────────────────                                                          │
│  • Field-level encryption for PII                                               │
│  • Database encryption at rest                                                   │
│  • TLS 1.3 for all connections                                                  │
│  • Secure key management                                                         │
│                                                                                  │
│  LAYER 5: MONITORING & RESPONSE                                                  │
│  ────────────────────────────                                                    │
│  • Real-time threat detection                                                    │
│  • Automated response to attacks                                                │
│  • Security alerting & escalation                                               │
│  • Incident response procedures                                                 │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**14.1 Security Configuration Module:**

```typescript
// core/security/security.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { SecurityService } from './security.service';
import { EncryptionService } from './encryption.service';
import { ThreatDetectionService } from './threat-detection.service';
import { IpReputationService } from './ip-reputation.service';
import { SessionSecurityService } from './session-security.service';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            name: 'short',
            ttl: 1000,    // 1 second
            limit: 10,    // 10 requests per second
          },
          {
            name: 'medium',
            ttl: 60000,   // 1 minute
            limit: 100,   // 100 requests per minute
          },
          {
            name: 'long',
            ttl: 3600000, // 1 hour
            limit: 1000,  // 1000 requests per hour
          },
        ],
      }),
    }),
  ],
  providers: [
    SecurityService,
    EncryptionService,
    ThreatDetectionService,
    IpReputationService,
    SessionSecurityService,
  ],
  exports: [
    SecurityService,
    EncryptionService,
    ThreatDetectionService,
    IpReputationService,
    SessionSecurityService,
  ],
})
export class SecurityModule {}
```

**14.2 Field-Level Encryption Service:**

```typescript
// core/security/encryption.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly tagLength = 16;
  private readonly encryptionKey: Buffer;

  constructor(private readonly config: ConfigService) {
    const key = this.config.getOrThrow<string>('ENCRYPTION_KEY');
    this.encryptionKey = this.deriveKey(key);
  }

  private deriveKey(secret: string): Buffer {
    return crypto.scryptSync(secret, 'salt', this.keyLength);
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    // Format: iv:tag:encrypted
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(ciphertext: string): string {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }

    const [ivHex, tagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Hash data (one-way, for comparison)
   */
  hash(data: string): string {
    return crypto
      .createHmac('sha256', this.encryptionKey)
      .update(data)
      .digest('hex');
  }

  /**
   * Generate secure random token
   */
  generateToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Create searchable blind index for encrypted fields
   */
  createBlindIndex(value: string): string {
    // Use HMAC to create a deterministic but secure index
    return crypto
      .createHmac('sha256', this.encryptionKey)
      .update(value.toLowerCase().trim())
      .digest('hex')
      .substring(0, 32);
  }
}
```

**14.3 Threat Detection Service:**

```typescript
// core/security/threat-detection.service.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/core/database/prisma.service';
import { AuditService } from '@/core/audit/audit.service';
import { DragonflyService } from '@/infrastructure/cache/dragonfly.service';

interface ThreatIndicator {
  type: string;
  score: number;
  details: string;
}

@Injectable()
export class ThreatDetectionService {
  private readonly THRESHOLDS = {
    FAILED_LOGINS: 5,
    REQUESTS_PER_MINUTE: 100,
    SUSPICIOUS_PATTERNS: 3,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: DragonflyService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Analyze request for potential threats
   */
  async analyzeRequest(context: {
    ipAddress: string;
    userId?: string;
    userAgent?: string;
    path: string;
    method: string;
    body?: any;
  }): Promise<{ blocked: boolean; riskScore: number; indicators: ThreatIndicator[] }> {
    const indicators: ThreatIndicator[] = [];
    let totalRiskScore = 0;

    // Check rate limiting violations
    const rateViolation = await this.checkRateLimit(context.ipAddress);
    if (rateViolation) {
      indicators.push(rateViolation);
      totalRiskScore += rateViolation.score;
    }

    // Check IP reputation
    const ipReputation = await this.checkIpReputation(context.ipAddress);
    if (ipReputation) {
      indicators.push(ipReputation);
      totalRiskScore += ipReputation.score;
    }

    // Check for SQL injection patterns
    const sqlInjection = this.checkSqlInjection(context.body);
    if (sqlInjection) {
      indicators.push(sqlInjection);
      totalRiskScore += sqlInjection.score;
    }

    // Check for XSS patterns
    const xssPattern = this.checkXssPatterns(context.body);
    if (xssPattern) {
      indicators.push(xssPattern);
      totalRiskScore += xssPattern.score;
    }

    // Check user behavior anomaly
    if (context.userId) {
      const anomaly = await this.checkBehaviorAnomaly(context.userId, context);
      if (anomaly) {
        indicators.push(anomaly);
        totalRiskScore += anomaly.score;
      }
    }

    const blocked = totalRiskScore >= 70;

    if (indicators.length > 0) {
      await this.auditService.logSecurity('THREAT_DETECTED', 'Potential security threat detected', {
        metadata: { indicators, totalRiskScore, blocked, ...context },
        riskScore: totalRiskScore,
        severity: blocked ? 'CRITICAL' : 'WARNING',
      });
    }

    return { blocked, riskScore: totalRiskScore, indicators };
  }

  /**
   * Check rate limit violations
   */
  private async checkRateLimit(ip: string): Promise<ThreatIndicator | null> {
    const key = `rate:${ip}`;
    const count = await this.cache.incr(key);

    if (count === 1) {
      await this.cache.expire(key, 60);
    }

    if (count > this.THRESHOLDS.REQUESTS_PER_MINUTE) {
      return {
        type: 'RATE_LIMIT_EXCEEDED',
        score: 30,
        details: `${count} requests in last minute`,
      };
    }

    return null;
  }

  /**
   * Check IP reputation from cache/database
   */
  private async checkIpReputation(ip: string): Promise<ThreatIndicator | null> {
    const reputationKey = `ip_reputation:${ip}`;
    const cached = await this.cache.get(reputationKey);

    if (cached === 'blocked') {
      return {
        type: 'BLOCKED_IP',
        score: 100,
        details: 'IP address is blocked',
      };
    }

    if (cached === 'suspicious') {
      return {
        type: 'SUSPICIOUS_IP',
        score: 40,
        details: 'IP address has suspicious history',
      };
    }

    // Check recent security events for this IP
    const recentEvents = await this.prisma.securityEvent.count({
      where: {
        ipAddress: ip,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    });

    if (recentEvents >= 10) {
      return {
        type: 'HIGH_INCIDENT_IP',
        score: 25,
        details: `${recentEvents} security events in last 24h`,
      };
    }

    return null;
  }

  /**
   * Check for SQL injection patterns
   */
  private checkSqlInjection(body: any): ThreatIndicator | null {
    if (!body) return null;

    const patterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /((\%27)|(\'))union/i,
      /exec(\s|\+)+(s|x)p\w+/i,
    ];

    const bodyStr = JSON.stringify(body).toLowerCase();
    for (const pattern of patterns) {
      if (pattern.test(bodyStr)) {
        return {
          type: 'SQL_INJECTION_ATTEMPT',
          score: 80,
          details: 'SQL injection pattern detected',
        };
      }
    }

    return null;
  }

  /**
   * Check for XSS patterns
   */
  private checkXssPatterns(body: any): ThreatIndicator | null {
    if (!body) return null;

    const patterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<object/gi,
      /<embed/gi,
      /expression\s*\(/gi,
    ];

    const bodyStr = JSON.stringify(body);
    for (const pattern of patterns) {
      if (pattern.test(bodyStr)) {
        return {
          type: 'XSS_ATTEMPT',
          score: 70,
          details: 'XSS pattern detected',
        };
      }
    }

    return null;
  }

  /**
   * Check for user behavior anomalies
   */
  private async checkBehaviorAnomaly(
    userId: string,
    context: any,
  ): Promise<ThreatIndicator | null> {
    // Check if user is accessing from unusual location
    const recentSessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    if (recentSessions.length > 0) {
      const knownIps = new Set(recentSessions.map(s => s.ipAddress));
      if (!knownIps.has(context.ipAddress) && knownIps.size >= 3) {
        return {
          type: 'UNUSUAL_LOCATION',
          score: 20,
          details: 'Access from new IP address',
        };
      }
    }

    return null;
  }

  /**
   * Block an IP address
   */
  async blockIp(ip: string, duration: number = 24 * 60 * 60): Promise<void> {
    await this.cache.set(`ip_reputation:${ip}`, 'blocked', duration);

    await this.prisma.securityEvent.create({
      data: {
        eventType: 'IP_BLOCKED',
        ipAddress: ip,
        description: `IP blocked for ${duration / 3600} hours`,
        riskScore: 100,
        isBlocked: true,
      },
    });
  }

  /**
   * Handle failed login attempts
   */
  @OnEvent('auth.login_failed')
  async handleFailedLogin(payload: { userId?: string; ipAddress: string; email: string }) {
    const key = `failed_login:${payload.ipAddress}`;
    const count = await this.cache.incr(key);

    if (count === 1) {
      await this.cache.expire(key, 15 * 60); // 15 minutes window
    }

    if (count >= this.THRESHOLDS.FAILED_LOGINS) {
      await this.auditService.logSecurity(
        'BRUTE_FORCE_ATTEMPT',
        `${count} failed login attempts`,
        {
          metadata: { ipAddress: payload.ipAddress, email: payload.email },
          riskScore: 60,
          severity: 'WARNING',
        },
      );

      // Temporarily block the IP
      if (count >= this.THRESHOLDS.FAILED_LOGINS * 2) {
        await this.blockIp(payload.ipAddress, 60 * 60); // 1 hour block
      }
    }
  }
}
```

**14.4 Session Security Service:**

```typescript
// core/security/session-security.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { EncryptionService } from './encryption.service';
import * as crypto from 'crypto';

interface SessionFingerprint {
  userAgent: string;
  acceptLanguage: string;
  screenResolution?: string;
  timezone?: string;
}

@Injectable()
export class SessionSecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  /**
   * Create session fingerprint for comparison
   */
  createFingerprint(data: SessionFingerprint): string {
    const normalized = [
      data.userAgent || '',
      data.acceptLanguage || '',
      data.screenResolution || '',
      data.timezone || '',
    ].join('|');

    return this.encryption.hash(normalized);
  }

  /**
   * Validate session hasn't been hijacked
   */
  async validateSession(
    sessionId: string,
    currentFingerprint: SessionFingerprint,
  ): Promise<{ valid: boolean; reason?: string }> {
    const session = await this.prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return { valid: false, reason: 'Session not found' };
    }

    if (session.expiresAt < new Date()) {
      return { valid: false, reason: 'Session expired' };
    }

    // Compare fingerprints
    const storedFingerprint = (session as any).fingerprint;
    if (storedFingerprint) {
      const currentFp = this.createFingerprint(currentFingerprint);
      if (storedFingerprint !== currentFp) {
        return { valid: false, reason: 'Session fingerprint mismatch' };
      }
    }

    return { valid: true };
  }

  /**
   * Revoke all sessions for a user (security measure)
   */
  async revokeAllSessions(userId: string, exceptSessionId?: string): Promise<number> {
    const where: any = { userId };
    if (exceptSessionId) {
      where.id = { not: exceptSessionId };
    }

    const result = await this.prisma.userSession.deleteMany({ where });
    return result.count;
  }

  /**
   * Check if device is trusted
   */
  async isDeviceTrusted(userId: string, fingerprint: string): Promise<boolean> {
    const trustedDevice = await this.prisma.userSession.findFirst({
      where: {
        userId,
        fingerprint,
        expiresAt: { gt: new Date() },
      },
    });

    return !!trustedDevice;
  }
}
```

**14.5 Security Guard with Threat Detection:**

```typescript
// core/security/guards/security.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ThreatDetectionService } from '../threat-detection.service';

@Injectable()
export class SecurityGuard implements CanActivate {
  constructor(
    private readonly threatDetection: ThreatDetectionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const analysis = await this.threatDetection.analyzeRequest({
      ipAddress: this.getClientIp(request),
      userId: request.user?.sub,
      userAgent: request.headers['user-agent'],
      path: request.path,
      method: request.method,
      body: request.body,
    });

    if (analysis.blocked) {
      throw new ForbiddenException({
        message: 'Request blocked for security reasons',
        code: 'SECURITY_BLOCKED',
        riskScore: analysis.riskScore,
      });
    }

    // Attach risk score to request for logging
    request.securityRiskScore = analysis.riskScore;
    request.securityIndicators = analysis.indicators;

    return true;
  }

  private getClientIp(request: any): string {
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      return Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    }
    return request.ip || 'unknown';
  }
}
```

**14.6 CSRF Protection:**

```typescript
// core/security/csrf.service.ts
import { Injectable } from '@nestjs/common';
import { EncryptionService } from './encryption.service';

@Injectable()
export class CsrfService {
  private readonly TOKEN_VALIDITY = 60 * 60 * 1000; // 1 hour

  constructor(private readonly encryption: EncryptionService) {}

  /**
   * Generate CSRF token for a session
   */
  generateToken(sessionId: string): string {
    const timestamp = Date.now();
    const data = `${sessionId}:${timestamp}`;
    const signature = this.encryption.hash(data);

    return Buffer.from(`${data}:${signature}`).toString('base64');
  }

  /**
   * Validate CSRF token
   */
  validateToken(token: string, sessionId: string): boolean {
    try {
      const decoded = Buffer.from(token, 'base64').toString();
      const [storedSessionId, timestampStr, signature] = decoded.split(':');

      if (storedSessionId !== sessionId) {
        return false;
      }

      const timestamp = parseInt(timestampStr, 10);
      if (Date.now() - timestamp > this.TOKEN_VALIDITY) {
        return false;
      }

      const expectedSignature = this.encryption.hash(`${storedSessionId}:${timestampStr}`);
      return signature === expectedSignature;
    } catch {
      return false;
    }
  }
}
```

**14.7 Content Security Policy Configuration:**

```typescript
// main.ts - Enhanced security headers
import helmet from 'helmet';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'strict-dynamic'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: ["'self'", process.env.API_URL, 'wss:'],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    dnsPrefetchControl: { allow: false },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  }),
);

// Additional security headers
app.use((req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Feature policy
  res.setHeader(
    'Permissions-Policy',
    'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  );

  // Clear site data on logout
  if (req.path === '/api/auth/logout') {
    res.setHeader('Clear-Site-Data', '"cache", "cookies", "storage"');
  }

  next();
});
```

---

### ADR-015: User Retention & Behavior Analytics

**Decision:** Implement comprehensive user behavior tracking for retention analysis, engagement metrics, and user journey optimization.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    USER RETENTION & BEHAVIOR ANALYTICS                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  TRACKING CATEGORIES:                                                            │
│  ────────────────────                                                            │
│  1. USER LIFECYCLE     - Registration, activation, engagement, churn            │
│  2. SESSION ANALYTICS  - Duration, page views, bounce rate, depth               │
│  3. FEATURE ADOPTION   - Which features used, frequency, completion rates       │
│  4. ENGAGEMENT METRICS - DAU, WAU, MAU, stickiness ratios                       │
│  5. CONVERSION FUNNEL  - Sign-up → Profile → Lead → Booking conversion         │
│  6. RETENTION COHORTS  - Day 1, Day 7, Day 30, Day 90 retention                │
│                                                                                  │
│  DATA FLOW:                                                                      │
│  ──────────                                                                      │
│  User Action → Event Capture → Real-time Processing → Aggregation → Analytics  │
│                     │                                       │                   │
│                     ▼                                       ▼                   │
│              Raw Events DB                          Aggregated Metrics DB       │
│              (Time-series)                          (Pre-computed)              │
│                                                                                  │
│  PRIVACY COMPLIANCE:                                                             │
│  ───────────────────                                                             │
│  • Anonymization options for GDPR compliance                                    │
│  • User consent tracking for analytics                                          │
│  • Data retention policies (raw: 90 days, aggregated: 2 years)                 │
│  • Right to erasure support                                                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**15.1 User Activity Schema:**

```prisma
// prisma/schema.prisma - User Behavior & Retention Models

// ============================================
// USER ACTIVITY TRACKING (analytics schema)
// ============================================

model UserActivity {
  id              String         @id @default(uuid()) @db.Uuid

  // User Reference
  userId          String         @map("user_id") @db.Uuid
  sessionId       String         @map("session_id") @db.Uuid

  // Activity Details
  activityType    ActivityType
  category        String                              // e.g., "navigation", "interaction", "transaction"
  action          String                              // e.g., "click", "view", "submit", "search"
  label           String?                             // Additional context

  // Target Information
  targetType      String?        @map("target_type")  // e.g., "VendorProfile", "Lead", "Event"
  targetId        String?        @map("target_id") @db.Uuid
  targetName      String?        @map("target_name")

  // Page/Route Context
  pageUrl         String?        @map("page_url")
  pagePath        String?        @map("page_path")
  referrer        String?
  utmSource       String?        @map("utm_source")
  utmMedium       String?        @map("utm_medium")
  utmCampaign     String?        @map("utm_campaign")

  // Device & Environment
  deviceType      DeviceType?    @map("device_type")
  browser         String?
  browserVersion  String?        @map("browser_version")
  os              String?
  screenWidth     Int?           @map("screen_width")
  screenHeight    Int?           @map("screen_height")

  // Geo Information
  country         String?
  region          String?
  city            String?
  timezone        String?

  // Timing
  duration        Int?                                // Time spent in milliseconds
  timestamp       DateTime       @default(now())

  // Additional Data
  metadata        Json?                               // Flexible additional data

  @@index([userId])
  @@index([sessionId])
  @@index([activityType])
  @@index([timestamp])
  @@index([category, action])
  @@index([targetType, targetId])

  @@map("user_activities")
  @@schema("analytics")
}

enum ActivityType {
  PAGE_VIEW
  CLICK
  SCROLL
  SEARCH
  FORM_SUBMIT
  FORM_ABANDON
  FEATURE_USE
  CONVERSION
  ERROR
  CUSTOM

  @@schema("analytics")
}

enum DeviceType {
  DESKTOP
  MOBILE
  TABLET

  @@schema("analytics")
}

// User Session Tracking
model UserSession_Analytics {
  id              String         @id @default(uuid()) @db.Uuid
  userId          String         @map("user_id") @db.Uuid

  // Session Info
  startedAt       DateTime       @default(now()) @map("started_at")
  endedAt         DateTime?      @map("ended_at")
  duration        Int?                                // Total session duration in seconds

  // Session Metrics
  pageViews       Int            @default(0) @map("page_views")
  interactions    Int            @default(0)
  conversions     Int            @default(0)
  bounced         Boolean        @default(false)

  // Entry/Exit
  entryPage       String?        @map("entry_page")
  exitPage        String?        @map("exit_page")
  referrer        String?

  // UTM Tracking
  utmSource       String?        @map("utm_source")
  utmMedium       String?        @map("utm_medium")
  utmCampaign     String?        @map("utm_campaign")
  utmTerm         String?        @map("utm_term")
  utmContent      String?        @map("utm_content")

  // Device Info
  deviceType      DeviceType?    @map("device_type")
  browser         String?
  os              String?
  ipAddress       String?        @map("ip_address")

  // Geo
  country         String?
  region          String?
  city            String?

  @@index([userId])
  @@index([startedAt])
  @@index([bounced])

  @@map("user_sessions_analytics")
  @@schema("analytics")
}

// User Lifecycle Events
model UserLifecycleEvent {
  id              String         @id @default(uuid()) @db.Uuid
  userId          String         @map("user_id") @db.Uuid

  eventType       LifecycleEventType @map("event_type")
  occurredAt      DateTime       @default(now()) @map("occurred_at")

  // Context
  metadata        Json?
  source          String?                             // What triggered this event

  @@index([userId])
  @@index([eventType])
  @@index([occurredAt])

  @@map("user_lifecycle_events")
  @@schema("analytics")
}

enum LifecycleEventType {
  // Acquisition
  REGISTERED
  EMAIL_VERIFIED
  PROFILE_COMPLETED

  // Activation
  FIRST_LOGIN
  FIRST_SEARCH
  FIRST_VENDOR_VIEW
  FIRST_INQUIRY_SENT
  FIRST_EVENT_CREATED

  // Engagement Milestones
  REACHED_5_SEARCHES
  REACHED_10_VENDOR_VIEWS
  REACHED_3_INQUIRIES
  SAVED_FIRST_VENDOR
  WROTE_FIRST_REVIEW

  // Retention Signals
  RETURNED_DAY_1
  RETURNED_DAY_7
  RETURNED_DAY_14
  RETURNED_DAY_30

  // Conversion
  BECAME_VENDOR
  FIRST_LEAD_RECEIVED
  FIRST_BOOKING_CONFIRMED

  // Churn Signals
  INACTIVE_7_DAYS
  INACTIVE_14_DAYS
  INACTIVE_30_DAYS
  ACCOUNT_DEACTIVATED

  // Re-engagement
  REACTIVATED

  @@schema("analytics")
}

// Feature Usage Tracking
model FeatureUsage {
  id              String         @id @default(uuid()) @db.Uuid
  userId          String         @map("user_id") @db.Uuid

  featureName     String         @map("feature_name")
  featureCategory String         @map("feature_category")

  // Usage Stats
  usageCount      Int            @default(1) @map("usage_count")
  firstUsedAt     DateTime       @default(now()) @map("first_used_at")
  lastUsedAt      DateTime       @default(now()) @map("last_used_at")

  // Completion Tracking (for multi-step features)
  completedSteps  Int?           @map("completed_steps")
  totalSteps      Int?           @map("total_steps")
  completionRate  Float?         @map("completion_rate")

  @@unique([userId, featureName])
  @@index([userId])
  @@index([featureName])
  @@index([lastUsedAt])

  @@map("feature_usage")
  @@schema("analytics")
}

// Daily User Metrics (Pre-aggregated)
model DailyUserMetrics {
  id              String         @id @default(uuid()) @db.Uuid
  userId          String         @map("user_id") @db.Uuid
  date            DateTime       @db.Date

  // Session Metrics
  sessionsCount   Int            @default(0) @map("sessions_count")
  totalDuration   Int            @default(0) @map("total_duration")  // seconds
  pageViews       Int            @default(0) @map("page_views")

  // Engagement Metrics
  searchesCount   Int            @default(0) @map("searches_count")
  vendorViews     Int            @default(0) @map("vendor_views")
  inquiriesSent   Int            @default(0) @map("inquiries_sent")
  messagesSent    Int            @default(0) @map("messages_sent")

  // Interaction Metrics
  likesGiven      Int            @default(0) @map("likes_given")
  savesMade       Int            @default(0) @map("saves_made")
  reviewsWritten  Int            @default(0) @map("reviews_written")

  // For Vendors
  leadsReceived   Int            @default(0) @map("leads_received")
  profileViews    Int            @default(0) @map("profile_views")
  inquiriesResponded Int         @default(0) @map("inquiries_responded")

  @@unique([userId, date])
  @@index([userId])
  @@index([date])

  @@map("daily_user_metrics")
  @@schema("analytics")
}

// Retention Cohort Data
model RetentionCohort {
  id              String         @id @default(uuid()) @db.Uuid

  cohortDate      DateTime       @db.Date @map("cohort_date")  // Registration date
  cohortSize      Int            @map("cohort_size")

  // Retention by Day
  day1Retained    Int            @default(0) @map("day_1_retained")
  day3Retained    Int            @default(0) @map("day_3_retained")
  day7Retained    Int            @default(0) @map("day_7_retained")
  day14Retained   Int            @default(0) @map("day_14_retained")
  day30Retained   Int            @default(0) @map("day_30_retained")
  day60Retained   Int            @default(0) @map("day_60_retained")
  day90Retained   Int            @default(0) @map("day_90_retained")

  // Calculated Rates (updated daily)
  day1Rate        Float?         @map("day_1_rate")
  day7Rate        Float?         @map("day_7_rate")
  day30Rate       Float?         @map("day_30_rate")
  day90Rate       Float?         @map("day_90_rate")

  // Segmentation
  userType        String?        @map("user_type")  // "planner", "vendor"
  acquisitionChannel String?     @map("acquisition_channel")

  @@unique([cohortDate, userType, acquisitionChannel])
  @@index([cohortDate])

  @@map("retention_cohorts")
  @@schema("analytics")
}

// Conversion Funnel Tracking
model FunnelEvent {
  id              String         @id @default(uuid()) @db.Uuid
  userId          String         @map("user_id") @db.Uuid
  sessionId       String         @map("session_id") @db.Uuid

  funnelName      String         @map("funnel_name")  // e.g., "user_signup", "vendor_inquiry"
  stepNumber      Int            @map("step_number")
  stepName        String         @map("step_name")

  enteredAt       DateTime       @default(now()) @map("entered_at")
  completedAt     DateTime?      @map("completed_at")
  abandonedAt     DateTime?      @map("abandoned_at")

  // Time Tracking
  timeInStep      Int?           @map("time_in_step")  // milliseconds

  // Context
  metadata        Json?

  @@index([userId])
  @@index([funnelName, stepNumber])
  @@index([enteredAt])

  @@map("funnel_events")
  @@schema("analytics")
}

// User Engagement Score
model UserEngagementScore {
  id              String         @id @default(uuid()) @db.Uuid
  userId          String         @unique @map("user_id") @db.Uuid

  // Current Scores (0-100)
  overallScore    Int            @default(0) @map("overall_score")
  recencyScore    Int            @default(0) @map("recency_score")    // How recently active
  frequencyScore  Int            @default(0) @map("frequency_score")  // How often they visit
  depthScore      Int            @default(0) @map("depth_score")      // How deeply they engage
  breadthScore    Int            @default(0) @map("breadth_score")    // How many features used

  // Engagement Level
  engagementLevel EngagementLevel @default(NEW) @map("engagement_level")

  // Churn Prediction
  churnRisk       ChurnRisk      @default(LOW) @map("churn_risk")
  churnProbability Float?        @map("churn_probability")  // 0.0 - 1.0

  // Activity Summary
  lastActiveAt    DateTime?      @map("last_active_at")
  daysActive30    Int            @default(0) @map("days_active_30")  // Active days in last 30
  avgSessionDuration Int         @default(0) @map("avg_session_duration")

  // Timestamps
  calculatedAt    DateTime       @default(now()) @map("calculated_at")
  updatedAt       DateTime       @updatedAt @map("updated_at")

  @@index([engagementLevel])
  @@index([churnRisk])
  @@index([overallScore])

  @@map("user_engagement_scores")
  @@schema("analytics")
}

enum EngagementLevel {
  NEW          // Just registered
  EXPLORING    // Browsing, searching
  ENGAGED      // Regular usage
  POWER_USER   // High engagement
  CHAMPION     // Advocates, high value
  AT_RISK      // Declining engagement
  DORMANT      // No recent activity
  CHURNED      // No activity for extended period

  @@schema("analytics")
}

enum ChurnRisk {
  LOW
  MEDIUM
  HIGH
  CRITICAL

  @@schema("analytics")
}
```

**15.2 Activity Tracking Service:**

```typescript
// core/analytics/activity-tracking.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/database/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DragonflyService } from '@/infrastructure/cache/dragonfly.service';

export interface TrackActivityDto {
  userId: string;
  sessionId: string;
  activityType: ActivityType;
  category: string;
  action: string;
  label?: string;
  targetType?: string;
  targetId?: string;
  targetName?: string;
  pageUrl?: string;
  pagePath?: string;
  referrer?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface SessionContext {
  deviceType?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  screenWidth?: number;
  screenHeight?: number;
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

@Injectable()
export class ActivityTrackingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: DragonflyService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Track a user activity
   */
  async trackActivity(dto: TrackActivityDto, context?: SessionContext): Promise<void> {
    // Store activity
    const activity = await this.prisma.userActivity.create({
      data: {
        ...dto,
        ...context,
        timestamp: new Date(),
      },
    });

    // Update session metrics
    await this.updateSessionMetrics(dto.sessionId, dto.activityType);

    // Update real-time counters in cache
    await this.updateRealTimeCounters(dto.userId, dto.activityType);

    // Emit event for further processing
    this.eventEmitter.emit('activity.tracked', activity);

    // Check for lifecycle milestones
    await this.checkLifecycleMilestones(dto.userId, dto);
  }

  /**
   * Track page view with automatic duration calculation
   */
  async trackPageView(
    userId: string,
    sessionId: string,
    pageUrl: string,
    pagePath: string,
    referrer?: string,
    context?: SessionContext,
  ): Promise<void> {
    // Calculate time on previous page
    const lastPageView = await this.cache.get(`last_page:${sessionId}`);
    let duration: number | undefined;

    if (lastPageView) {
      const lastData = JSON.parse(lastPageView);
      duration = Date.now() - lastData.timestamp;

      // Update previous page view with duration
      if (lastData.activityId) {
        await this.prisma.userActivity.update({
          where: { id: lastData.activityId },
          data: { duration },
        });
      }
    }

    // Track new page view
    const activity = await this.prisma.userActivity.create({
      data: {
        userId,
        sessionId,
        activityType: 'PAGE_VIEW',
        category: 'navigation',
        action: 'page_view',
        pageUrl,
        pagePath,
        referrer,
        ...context,
      },
    });

    // Store for duration calculation
    await this.cache.set(
      `last_page:${sessionId}`,
      JSON.stringify({ activityId: activity.id, timestamp: Date.now() }),
      3600, // 1 hour TTL
    );

    // Update session page views
    await this.incrementSessionMetric(sessionId, 'pageViews');
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(
    userId: string,
    featureName: string,
    featureCategory: string,
    options?: {
      completedSteps?: number;
      totalSteps?: number;
    },
  ): Promise<void> {
    await this.prisma.featureUsage.upsert({
      where: {
        userId_featureName: { userId, featureName },
      },
      create: {
        userId,
        featureName,
        featureCategory,
        completedSteps: options?.completedSteps,
        totalSteps: options?.totalSteps,
        completionRate: options?.totalSteps
          ? (options.completedSteps || 0) / options.totalSteps
          : undefined,
      },
      update: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
        completedSteps: options?.completedSteps,
        completionRate: options?.totalSteps
          ? (options.completedSteps || 0) / options.totalSteps
          : undefined,
      },
    });
  }

  /**
   * Track conversion events
   */
  async trackConversion(
    userId: string,
    sessionId: string,
    conversionType: string,
    value?: number,
    metadata?: Record<string, any>,
  ): Promise<void> {
    await this.trackActivity({
      userId,
      sessionId,
      activityType: 'CONVERSION',
      category: 'conversion',
      action: conversionType,
      metadata: { ...metadata, value },
    });

    await this.incrementSessionMetric(sessionId, 'conversions');

    // Emit for further processing (attribution, etc.)
    this.eventEmitter.emit('conversion.tracked', {
      userId,
      sessionId,
      conversionType,
      value,
      timestamp: new Date(),
    });
  }

  /**
   * Track funnel step
   */
  async trackFunnelStep(
    userId: string,
    sessionId: string,
    funnelName: string,
    stepNumber: number,
    stepName: string,
    completed: boolean = false,
  ): Promise<void> {
    const existing = await this.prisma.funnelEvent.findFirst({
      where: { userId, sessionId, funnelName, stepNumber },
    });

    if (existing) {
      await this.prisma.funnelEvent.update({
        where: { id: existing.id },
        data: {
          completedAt: completed ? new Date() : undefined,
          abandonedAt: !completed ? new Date() : undefined,
          timeInStep: Date.now() - existing.enteredAt.getTime(),
        },
      });
    } else {
      await this.prisma.funnelEvent.create({
        data: {
          userId,
          sessionId,
          funnelName,
          stepNumber,
          stepName,
          completedAt: completed ? new Date() : undefined,
        },
      });
    }
  }

  /**
   * Start a new analytics session
   */
  async startSession(
    userId: string,
    context: SessionContext & { referrer?: string; entryPage?: string },
  ): Promise<string> {
    const session = await this.prisma.userSession_Analytics.create({
      data: {
        userId,
        entryPage: context.entryPage,
        referrer: context.referrer,
        deviceType: context.deviceType as any,
        browser: context.browser,
        os: context.os,
        country: context.country,
        region: context.region,
        city: context.city,
        utmSource: context.utmSource,
        utmMedium: context.utmMedium,
        utmCampaign: context.utmCampaign,
      },
    });

    // Track session start in cache for real-time metrics
    await this.cache.sadd(`active_sessions:${new Date().toISOString().split('T')[0]}`, session.id);

    return session.id;
  }

  /**
   * End an analytics session
   */
  async endSession(sessionId: string, exitPage?: string): Promise<void> {
    const session = await this.prisma.userSession_Analytics.findUnique({
      where: { id: sessionId },
    });

    if (session) {
      const duration = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
      const bounced = session.pageViews <= 1 && duration < 10;

      await this.prisma.userSession_Analytics.update({
        where: { id: sessionId },
        data: {
          endedAt: new Date(),
          duration,
          exitPage,
          bounced,
        },
      });
    }
  }

  /**
   * Check and record lifecycle milestones
   */
  private async checkLifecycleMilestones(
    userId: string,
    activity: TrackActivityDto,
  ): Promise<void> {
    const milestonesToCheck: Array<{
      condition: () => Promise<boolean>;
      eventType: string;
    }> = [
      {
        condition: async () => {
          if (activity.action !== 'search') return false;
          const count = await this.prisma.userActivity.count({
            where: { userId, action: 'search' },
          });
          return count === 1;
        },
        eventType: 'FIRST_SEARCH',
      },
      {
        condition: async () => {
          if (activity.targetType !== 'VendorProfile' || activity.action !== 'view') return false;
          const count = await this.prisma.userActivity.count({
            where: { userId, targetType: 'VendorProfile', action: 'view' },
          });
          return count === 1;
        },
        eventType: 'FIRST_VENDOR_VIEW',
      },
      {
        condition: async () => {
          if (activity.action !== 'search') return false;
          const count = await this.prisma.userActivity.count({
            where: { userId, action: 'search' },
          });
          return count === 5;
        },
        eventType: 'REACHED_5_SEARCHES',
      },
    ];

    for (const milestone of milestonesToCheck) {
      if (await milestone.condition()) {
        await this.recordLifecycleEvent(userId, milestone.eventType as any);
      }
    }
  }

  /**
   * Record a lifecycle event
   */
  async recordLifecycleEvent(
    userId: string,
    eventType: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    // Check if already recorded
    const existing = await this.prisma.userLifecycleEvent.findFirst({
      where: { userId, eventType: eventType as any },
    });

    if (!existing) {
      await this.prisma.userLifecycleEvent.create({
        data: {
          userId,
          eventType: eventType as any,
          metadata,
        },
      });

      this.eventEmitter.emit('lifecycle.event', { userId, eventType, metadata });
    }
  }

  /**
   * Update session metrics
   */
  private async updateSessionMetrics(sessionId: string, activityType: string): Promise<void> {
    const updates: any = { interactions: { increment: 1 } };

    if (activityType === 'PAGE_VIEW') {
      updates.pageViews = { increment: 1 };
    } else if (activityType === 'CONVERSION') {
      updates.conversions = { increment: 1 };
    }

    await this.prisma.userSession_Analytics.update({
      where: { id: sessionId },
      data: updates,
    });
  }

  /**
   * Increment a specific session metric
   */
  private async incrementSessionMetric(sessionId: string, metric: string): Promise<void> {
    await this.prisma.userSession_Analytics.update({
      where: { id: sessionId },
      data: { [metric]: { increment: 1 } },
    });
  }

  /**
   * Update real-time counters
   */
  private async updateRealTimeCounters(userId: string, activityType: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];

    // Track daily active users
    await this.cache.sadd(`dau:${today}`, userId);

    // Track activity type counts
    await this.cache.incr(`activity:${today}:${activityType}`);
  }
}
```

**15.3 Engagement Score Calculator:**

```typescript
// core/analytics/engagement-score.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/core/database/prisma.service';

interface EngagementWeights {
  recency: number;
  frequency: number;
  depth: number;
  breadth: number;
}

@Injectable()
export class EngagementScoreService {
  private readonly weights: EngagementWeights = {
    recency: 0.3,
    frequency: 0.25,
    depth: 0.25,
    breadth: 0.2,
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate engagement score for a user
   */
  async calculateEngagementScore(userId: string): Promise<{
    overallScore: number;
    recencyScore: number;
    frequencyScore: number;
    depthScore: number;
    breadthScore: number;
    engagementLevel: string;
    churnRisk: string;
  }> {
    const [recencyScore, frequencyScore, depthScore, breadthScore] = await Promise.all([
      this.calculateRecencyScore(userId),
      this.calculateFrequencyScore(userId),
      this.calculateDepthScore(userId),
      this.calculateBreadthScore(userId),
    ]);

    const overallScore = Math.round(
      recencyScore * this.weights.recency +
      frequencyScore * this.weights.frequency +
      depthScore * this.weights.depth +
      breadthScore * this.weights.breadth
    );

    const engagementLevel = this.determineEngagementLevel(overallScore, recencyScore);
    const churnRisk = this.assessChurnRisk(overallScore, recencyScore, frequencyScore);

    return {
      overallScore,
      recencyScore,
      frequencyScore,
      depthScore,
      breadthScore,
      engagementLevel,
      churnRisk,
    };
  }

  /**
   * Recency: How recently was the user active?
   */
  private async calculateRecencyScore(userId: string): Promise<number> {
    const lastActivity = await this.prisma.userActivity.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    });

    if (!lastActivity) return 0;

    const daysSinceActive = Math.floor(
      (Date.now() - lastActivity.timestamp.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Score decay: 100 if today, decreasing over 30 days
    if (daysSinceActive === 0) return 100;
    if (daysSinceActive <= 1) return 90;
    if (daysSinceActive <= 3) return 75;
    if (daysSinceActive <= 7) return 60;
    if (daysSinceActive <= 14) return 40;
    if (daysSinceActive <= 30) return 20;
    return 0;
  }

  /**
   * Frequency: How often does the user visit?
   */
  private async calculateFrequencyScore(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await this.prisma.userSession_Analytics.count({
      where: {
        userId,
        startedAt: { gte: thirtyDaysAgo },
      },
    });

    // Score based on sessions in last 30 days
    if (sessions >= 20) return 100;  // Almost daily
    if (sessions >= 12) return 85;   // 3x per week
    if (sessions >= 8) return 70;    // 2x per week
    if (sessions >= 4) return 50;    // Weekly
    if (sessions >= 2) return 30;    // Bi-weekly
    if (sessions >= 1) return 15;    // Monthly
    return 0;
  }

  /**
   * Depth: How deeply does the user engage per session?
   */
  private async calculateDepthScore(userId: string): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sessions = await this.prisma.userSession_Analytics.findMany({
      where: {
        userId,
        startedAt: { gte: thirtyDaysAgo },
      },
      select: {
        duration: true,
        pageViews: true,
        interactions: true,
        conversions: true,
      },
    });

    if (sessions.length === 0) return 0;

    const avgDuration = sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length;
    const avgPageViews = sessions.reduce((sum, s) => sum + s.pageViews, 0) / sessions.length;
    const avgInteractions = sessions.reduce((sum, s) => sum + s.interactions, 0) / sessions.length;
    const hasConversions = sessions.some(s => s.conversions > 0);

    let score = 0;

    // Duration score (max 30 points)
    if (avgDuration >= 600) score += 30;       // 10+ minutes
    else if (avgDuration >= 300) score += 25;  // 5+ minutes
    else if (avgDuration >= 120) score += 15;  // 2+ minutes
    else if (avgDuration >= 60) score += 10;   // 1+ minute
    else score += 5;

    // Page views score (max 30 points)
    if (avgPageViews >= 10) score += 30;
    else if (avgPageViews >= 5) score += 20;
    else if (avgPageViews >= 3) score += 15;
    else score += 5;

    // Interactions score (max 25 points)
    if (avgInteractions >= 15) score += 25;
    else if (avgInteractions >= 10) score += 20;
    else if (avgInteractions >= 5) score += 15;
    else score += 5;

    // Conversion bonus (15 points)
    if (hasConversions) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Breadth: How many different features does the user use?
   */
  private async calculateBreadthScore(userId: string): Promise<number> {
    const featureUsage = await this.prisma.featureUsage.findMany({
      where: { userId },
      select: { featureCategory: true },
    });

    const uniqueCategories = new Set(featureUsage.map(f => f.featureCategory));
    const totalFeatures = featureUsage.length;

    // Score based on feature diversity
    let score = 0;

    // Category diversity (max 50 points)
    score += Math.min(uniqueCategories.size * 10, 50);

    // Total features used (max 50 points)
    score += Math.min(totalFeatures * 5, 50);

    return Math.min(score, 100);
  }

  /**
   * Determine engagement level based on scores
   */
  private determineEngagementLevel(overallScore: number, recencyScore: number): string {
    if (recencyScore === 0) return 'CHURNED';
    if (recencyScore <= 20) return 'DORMANT';
    if (overallScore >= 80) return 'CHAMPION';
    if (overallScore >= 60) return 'POWER_USER';
    if (overallScore >= 40) return 'ENGAGED';
    if (overallScore >= 20) return 'EXPLORING';
    if (recencyScore < 40 && overallScore < 40) return 'AT_RISK';
    return 'NEW';
  }

  /**
   * Assess churn risk
   */
  private assessChurnRisk(
    overallScore: number,
    recencyScore: number,
    frequencyScore: number,
  ): string {
    // High risk indicators
    if (recencyScore <= 20 || (recencyScore <= 40 && frequencyScore <= 20)) {
      return 'CRITICAL';
    }
    if (recencyScore <= 40 || overallScore <= 30) {
      return 'HIGH';
    }
    if (recencyScore <= 60 || overallScore <= 50) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Batch update all user engagement scores (scheduled job)
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async updateAllEngagementScores(): Promise<void> {
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null },
      select: { id: true },
    });

    for (const user of users) {
      try {
        const scores = await this.calculateEngagementScore(user.id);

        await this.prisma.userEngagementScore.upsert({
          where: { userId: user.id },
          create: {
            userId: user.id,
            ...scores,
            calculatedAt: new Date(),
          },
          update: {
            ...scores,
            calculatedAt: new Date(),
          },
        });
      } catch (error) {
        console.error(`Failed to update engagement score for user ${user.id}:`, error);
      }
    }
  }
}
```

**15.4 Retention Analytics Service:**

```typescript
// core/analytics/retention-analytics.service.ts
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/core/database/prisma.service';

@Injectable()
export class RetentionAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get retention metrics for a cohort
   */
  async getCohortRetention(cohortDate: Date, userType?: string) {
    return this.prisma.retentionCohort.findFirst({
      where: {
        cohortDate,
        userType,
      },
    });
  }

  /**
   * Get retention curve data for visualization
   */
  async getRetentionCurve(options: {
    startDate: Date;
    endDate: Date;
    userType?: string;
  }) {
    const cohorts = await this.prisma.retentionCohort.findMany({
      where: {
        cohortDate: {
          gte: options.startDate,
          lte: options.endDate,
        },
        userType: options.userType,
      },
      orderBy: { cohortDate: 'asc' },
    });

    return cohorts.map(cohort => ({
      date: cohort.cohortDate,
      cohortSize: cohort.cohortSize,
      retention: {
        day1: cohort.day1Rate,
        day7: cohort.day7Rate,
        day30: cohort.day30Rate,
        day90: cohort.day90Rate,
      },
    }));
  }

  /**
   * Calculate and store daily retention cohort data
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async calculateDailyRetention(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate retention for cohorts at different intervals
    const intervals = [1, 3, 7, 14, 30, 60, 90];

    for (const days of intervals) {
      const cohortDate = new Date(today);
      cohortDate.setDate(cohortDate.getDate() - days);

      await this.updateCohortRetention(cohortDate, days);
    }
  }

  /**
   * Update retention data for a specific cohort
   */
  private async updateCohortRetention(cohortDate: Date, daysAgo: number): Promise<void> {
    const cohortEndDate = new Date(cohortDate);
    cohortEndDate.setDate(cohortEndDate.getDate() + 1);

    // Get users who registered on the cohort date
    const cohortUsers = await this.prisma.user.findMany({
      where: {
        createdAt: {
          gte: cohortDate,
          lt: cohortEndDate,
        },
        deletedAt: null,
      },
      select: { id: true },
    });

    const cohortSize = cohortUsers.length;
    if (cohortSize === 0) return;

    const userIds = cohortUsers.map(u => u.id);

    // Calculate retention for each day interval
    const retentionData = await this.calculateRetentionRates(userIds, cohortDate);

    // Upsert cohort data
    await this.prisma.retentionCohort.upsert({
      where: {
        cohortDate_userType_acquisitionChannel: {
          cohortDate,
          userType: null as any,
          acquisitionChannel: null as any,
        },
      },
      create: {
        cohortDate,
        cohortSize,
        ...retentionData,
      },
      update: {
        cohortSize,
        ...retentionData,
      },
    });
  }

  /**
   * Calculate retention rates for different day intervals
   */
  private async calculateRetentionRates(
    userIds: string[],
    cohortDate: Date,
  ): Promise<{
    day1Retained: number;
    day3Retained: number;
    day7Retained: number;
    day14Retained: number;
    day30Retained: number;
    day60Retained: number;
    day90Retained: number;
    day1Rate: number;
    day7Rate: number;
    day30Rate: number;
    day90Rate: number;
  }> {
    const cohortSize = userIds.length;
    const intervals = [1, 3, 7, 14, 30, 60, 90];
    const retention: Record<string, number> = {};

    for (const days of intervals) {
      const targetDate = new Date(cohortDate);
      targetDate.setDate(targetDate.getDate() + days);

      const targetEndDate = new Date(targetDate);
      targetEndDate.setDate(targetEndDate.getDate() + 1);

      // Count users who were active on target day
      const activeUsers = await this.prisma.userActivity.groupBy({
        by: ['userId'],
        where: {
          userId: { in: userIds },
          timestamp: {
            gte: targetDate,
            lt: targetEndDate,
          },
        },
      });

      retention[`day${days}Retained`] = activeUsers.length;
    }

    return {
      day1Retained: retention.day1Retained || 0,
      day3Retained: retention.day3Retained || 0,
      day7Retained: retention.day7Retained || 0,
      day14Retained: retention.day14Retained || 0,
      day30Retained: retention.day30Retained || 0,
      day60Retained: retention.day60Retained || 0,
      day90Retained: retention.day90Retained || 0,
      day1Rate: cohortSize ? (retention.day1Retained || 0) / cohortSize : 0,
      day7Rate: cohortSize ? (retention.day7Retained || 0) / cohortSize : 0,
      day30Rate: cohortSize ? (retention.day30Retained || 0) / cohortSize : 0,
      day90Rate: cohortSize ? (retention.day90Retained || 0) / cohortSize : 0,
    };
  }

  /**
   * Get users at risk of churning
   */
  async getChurnRiskUsers(riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'HIGH') {
    return this.prisma.userEngagementScore.findMany({
      where: {
        churnRisk: { in: riskLevel === 'CRITICAL' ? ['CRITICAL'] : ['CRITICAL', 'HIGH'] },
      },
      orderBy: { overallScore: 'asc' },
      take: 100,
    });
  }

  /**
   * Get daily/weekly/monthly active users
   */
  async getActiveUserMetrics(date: Date = new Date()) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - 7);

    const monthStart = new Date(date);
    monthStart.setDate(monthStart.getDate() - 30);

    const [dau, wau, mau] = await Promise.all([
      this.prisma.userActivity.groupBy({
        by: ['userId'],
        where: { timestamp: { gte: dayStart } },
      }),
      this.prisma.userActivity.groupBy({
        by: ['userId'],
        where: { timestamp: { gte: weekStart } },
      }),
      this.prisma.userActivity.groupBy({
        by: ['userId'],
        where: { timestamp: { gte: monthStart } },
      }),
    ]);

    return {
      dau: dau.length,
      wau: wau.length,
      mau: mau.length,
      stickiness: {
        dauWau: wau.length ? (dau.length / wau.length) * 100 : 0,
        dauMau: mau.length ? (dau.length / mau.length) * 100 : 0,
        wauMau: mau.length ? (wau.length / mau.length) * 100 : 0,
      },
    };
  }
}
```

**15.5 Analytics Query API:**

```typescript
// api/admin-gateway/controllers/analytics.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/core/auth/guards/roles.guard';
import { Roles } from '@/core/auth/decorators/roles.decorator';
import { RetentionAnalyticsService } from '@/core/analytics/retention-analytics.service';
import { EngagementScoreService } from '@/core/analytics/engagement-score.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN_SYSTEM', 'OPERATIONAL_ADMIN')
export class AnalyticsController {
  constructor(
    private readonly retentionService: RetentionAnalyticsService,
    private readonly engagementService: EngagementScoreService,
  ) {}

  @Get('active-users')
  async getActiveUsers() {
    return this.retentionService.getActiveUserMetrics();
  }

  @Get('retention-curve')
  async getRetentionCurve(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('userType') userType?: string,
  ) {
    return this.retentionService.getRetentionCurve({
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      userType,
    });
  }

  @Get('churn-risk')
  async getChurnRiskUsers(@Query('level') level: 'CRITICAL' | 'HIGH' | 'MEDIUM' = 'HIGH') {
    return this.retentionService.getChurnRiskUsers(level);
  }

  @Get('engagement-distribution')
  async getEngagementDistribution() {
    const distribution = await this.prisma.userEngagementScore.groupBy({
      by: ['engagementLevel'],
      _count: true,
    });

    return distribution.map(d => ({
      level: d.engagementLevel,
      count: d._count,
    }));
  }

  @Get('funnel/:funnelName')
  async getFunnelAnalysis(@Param('funnelName') funnelName: string) {
    const steps = await this.prisma.funnelEvent.groupBy({
      by: ['stepNumber', 'stepName'],
      where: { funnelName },
      _count: { _all: true },
      _avg: { timeInStep: true },
    });

    const entered = steps.reduce((max, s) => Math.max(max, s._count._all), 0);

    return steps
      .sort((a, b) => a.stepNumber - b.stepNumber)
      .map((step, index, arr) => ({
        step: step.stepNumber,
        name: step.stepName,
        users: step._count._all,
        conversionRate: entered ? (step._count._all / entered) * 100 : 0,
        dropOff: index > 0 ? arr[index - 1]._count._all - step._count._all : 0,
        avgTimeInStep: step._avg.timeInStep,
      }));
  }
}
```

**15.6 Frontend Activity Tracking (Client-Side):**

```typescript
// Frontend: utils/analytics.ts
class AnalyticsTracker {
  private sessionId: string | null = null;
  private userId: string | null = null;
  private queue: any[] = [];
  private flushInterval: number = 5000;

  async init(userId: string) {
    this.userId = userId;

    // Start session
    const response = await fetch('/api/analytics/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referrer: document.referrer,
        entryPage: window.location.pathname,
        ...this.getDeviceInfo(),
        ...this.getUtmParams(),
      }),
    });

    const { sessionId } = await response.json();
    this.sessionId = sessionId;

    // Set up auto-flush
    setInterval(() => this.flush(), this.flushInterval);

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.endSession();
      }
    });

    // Track before unload
    window.addEventListener('beforeunload', () => {
      this.endSession();
    });
  }

  trackPageView(pagePath: string) {
    this.queue.push({
      type: 'pageview',
      pagePath,
      pageUrl: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now(),
    });
  }

  trackEvent(category: string, action: string, label?: string, metadata?: any) {
    this.queue.push({
      type: 'event',
      category,
      action,
      label,
      metadata,
      timestamp: Date.now(),
    });
  }

  trackFeatureUsage(featureName: string, featureCategory: string) {
    this.queue.push({
      type: 'feature',
      featureName,
      featureCategory,
      timestamp: Date.now(),
    });
  }

  trackFunnelStep(funnelName: string, stepNumber: number, stepName: string, completed: boolean) {
    this.queue.push({
      type: 'funnel',
      funnelName,
      stepNumber,
      stepName,
      completed,
      timestamp: Date.now(),
    });
  }

  private async flush() {
    if (this.queue.length === 0 || !this.sessionId) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await fetch('/api/analytics/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: this.sessionId,
          userId: this.userId,
          events,
        }),
      });
    } catch (error) {
      // Re-queue events on failure
      this.queue.unshift(...events);
    }
  }

  private async endSession() {
    await this.flush();

    if (this.sessionId) {
      navigator.sendBeacon('/api/analytics/session/end', JSON.stringify({
        sessionId: this.sessionId,
        exitPage: window.location.pathname,
      }));
    }
  }

  private getDeviceInfo() {
    return {
      deviceType: this.detectDeviceType(),
      browser: this.detectBrowser(),
      os: this.detectOS(),
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  private getUtmParams() {
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
      utmTerm: params.get('utm_term'),
      utmContent: params.get('utm_content'),
    };
  }

  private detectDeviceType(): string {
    const ua = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(ua)) return 'TABLET';
    if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'MOBILE';
    return 'DESKTOP';
  }

  private detectBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }

  private detectOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'MacOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Other';
  }
}

export const analytics = new AnalyticsTracker();
```

---

## Part 7: Risk Mitigation & Trade-offs

### Known Trade-offs

| Decision | Trade-off | Mitigation |
|----------|-----------|------------|
| Modular Monolith | Harder to scale individual modules | Designed with explicit seams; can extract hot paths first |
| Eventual Consistency (CQRS) | Read models may be stale | Short TTLs; UI shows "updating..." indicators |
| Dragonfly over Redis | Less mature ecosystem | Compatible with Redis clients; fallback to Redis if needed |
| PostgreSQL Partitioning | Adds complexity | Implement in Phase 6; start with indexes |
| Multi-schema Prisma | Migration complexity | Dedicated migration scripts per schema |

### Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Search index out of sync | Medium | High | Reconciliation job every 6 hours |
| Cache stampede | Low | High | Implement cache locks with Redlock |
| Database connection exhaustion | Medium | Critical | PgBouncer + connection pooling |
| Media upload failures | Medium | Medium | Retry queue + status tracking |

---

## Part 8: Success Metrics

### Phase 0-1 Milestones
- [ ] Docker environment boots in < 60s
- [ ] Prisma migrations run successfully
- [ ] Auth flow works end-to-end
- [ ] First vendor profile created via API

### Phase 2-3 Milestones
- [ ] Lead creation < 100ms (p95)
- [ ] Search returns results < 50ms
- [ ] Cache hit ratio > 80%

### Production Readiness
- [ ] Handle 1000 concurrent users
- [ ] API p99 latency < 200ms
- [ ] Zero downtime deployments
- [ ] Automated backup/restore tested

---

## Appendix: Quick Reference

### Module Dependencies

```
core/database ──▶ ALL MODULES
core/auth ──▶ api/*-gateway
core/cqrs ──▶ domain/*

domain/catalog ──▶ infrastructure/search, infrastructure/cache
domain/interaction ──▶ infrastructure/jobs, infrastructure/cache
domain/planning ──▶ infrastructure/cache
domain/operations ──▶ infrastructure/storage, infrastructure/jobs

infrastructure/* ──▶ core/database
```

### Command Cheatsheet

```bash
# Start development environment
docker-compose up -d

# Run Prisma migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start NestJS in dev mode
npm run start:dev

# Run tests
npm run test
npm run test:e2e

# Build for production
npm run build
```

---

## Part 9: API Design Principles (Simplified & Clean)

### ADR-015: Simplified Gateway Architecture

**Decision:** Reduce from 7 gateways to 3 gateways for clarity and maintainability.

```
SIMPLIFIED GATEWAY STRUCTURE:
┌─────────────────────┬──────────────────┬────────────────┬─────────────────────────┐
│ Gateway             │ Base Path        │ Auth           │ Who Uses It             │
├─────────────────────┼──────────────────┼────────────────┼─────────────────────────┤
│ admin-gateway       │ /api/admin/*     │ JWT + RBAC     │ All internal staff      │
│ app-gateway         │ /api/v1/*        │ JWT + Session  │ Vendors + Users         │
│ public-gateway      │ /api/public/*    │ API Key/None   │ Anonymous/Webhooks      │
└─────────────────────┴──────────────────┴────────────────┴─────────────────────────┘

Role-based access is handled at the route/controller level, NOT gateway level.
```

**Rationale:**
- Simpler mental model for developers
- Easier to maintain and document
- Role checks happen via guards, not separate gateways
- Reduces code duplication

### ADR-016: Standardized API Response Format

**Decision:** All API responses follow a consistent structure.

```typescript
// core/common/interfaces/api-response.interface.ts

// Success Response
interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Error Response
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;        // e.g., "VALIDATION_ERROR", "NOT_FOUND"
    message: string;     // Human-readable message
    details?: any[];     // Validation errors or additional info
  };
}

// Example Success:
{
  "success": true,
  "data": {
    "id": "123",
    "businessName": "Elegant Events"
  }
}

// Example Error:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      { "field": "email", "message": "Email is required" }
    ]
  }
}

// Example Paginated:
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### ADR-017: Clean RESTful API Routes

**Decision:** Use intuitive, resource-based routes with consistent naming.

```
SIMPLIFIED ROUTE STRUCTURE:

# Authentication (Public)
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password

# Vendors (Discovery - Public/Auth)
GET    /api/v1/vendors                    # List/Search vendors
GET    /api/v1/vendors/:slug              # Get vendor by slug
GET    /api/v1/vendors/:id/portfolio      # Get vendor portfolio
GET    /api/v1/vendors/:id/services       # Get vendor services
GET    /api/v1/vendors/:id/reviews        # Get vendor reviews

# My Vendor Profile (Vendor Auth Required)
GET    /api/v1/me/vendor                  # Get my vendor profile
PUT    /api/v1/me/vendor                  # Update my vendor profile
POST   /api/v1/me/vendor/portfolio        # Add portfolio item
DELETE /api/v1/me/vendor/portfolio/:id    # Remove portfolio item
GET    /api/v1/me/vendor/leads            # Get my leads
GET    /api/v1/me/vendor/analytics        # Get my analytics

# Events (User Auth Required)
GET    /api/v1/me/events                  # My events
POST   /api/v1/me/events                  # Create event
GET    /api/v1/me/events/:id              # Get event details
PUT    /api/v1/me/events/:id              # Update event
DELETE /api/v1/me/events/:id              # Delete event

# Leads (Auth Required)
POST   /api/v1/leads                      # Create lead/inquiry
GET    /api/v1/leads/:id                  # Get lead details
PUT    /api/v1/leads/:id/status           # Update lead status
POST   /api/v1/leads/:id/messages         # Send message
GET    /api/v1/leads/:id/messages         # Get conversation

# Admin Routes (Admin Auth Required)
GET    /api/admin/users                   # List users
GET    /api/admin/vendors/pending         # Pending verifications
PUT    /api/admin/vendors/:id/verify      # Verify vendor
GET    /api/admin/analytics               # Platform analytics
```

### ADR-018: Clean Controller Pattern

**Decision:** Controllers should be thin and focused.

```typescript
// modules/vendors/vendors.controller.ts
import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { VendorsService } from './vendors.service';
import { SearchVendorsDto, VendorResponseDto } from './dto';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('Vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendors: VendorsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Search vendors' })
  search(@Query() query: SearchVendorsDto) {
    return this.vendors.search(query);
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get vendor by slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.vendors.findBySlug(slug);
  }
}
```

### ADR-019: Clean Service Pattern

**Decision:** Services contain business logic, directly use Prisma (no repository layer for simple cases).

```typescript
// modules/vendors/vendors.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { SearchVendorsDto, CreateVendorDto } from './dto';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: SearchVendorsDto) {
    const { page = 1, limit = 20, category, city, q } = query;
    const skip = (page - 1) * limit;

    const where = {
      status: 'ACTIVE',
      ...(category && { category: { slug: category } }),
      ...(city && { address: { city: { id: city } } }),
      ...(q && { businessName: { contains: q, mode: 'insensitive' } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.vendorProfile.findMany({
        where,
        skip,
        take: limit,
        include: { category: true, address: { include: { city: true } } },
        orderBy: { avgRating: 'desc' },
      }),
      this.prisma.vendorProfile.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBySlug(slug: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({
      where: { slug },
      include: {
        category: true,
        address: { include: { city: { include: { state: true } } } },
        services: { where: { isActive: true } },
        businessHours: true,
      },
    });

    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }

    return vendor;
  }
}
```

### ADR-020: Simple DTO Pattern

**Decision:** Use class-validator with clear, concise DTOs.

```typescript
// modules/vendors/dto/search-vendors.dto.ts
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchVendorsDto {
  @ApiPropertyOptional({ description: 'Search term' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ description: 'Category slug' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'City ID' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
```

### ADR-021: Global Response Interceptor

**Decision:** Automatically wrap all responses in standard format.

```typescript
// common/interceptors/response.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // If already wrapped, return as-is
        if (data?.success !== undefined) return data;

        // Check for pagination meta
        if (data?.data && data?.meta) {
          return { success: true, ...data };
        }

        return { success: true, data };
      }),
    );
  }
}
```

### ADR-022: Standardized Error Codes

**Decision:** Use consistent error codes across the API.

```typescript
// common/constants/error-codes.ts
export const ErrorCodes = {
  // Authentication (1xxx)
  INVALID_CREDENTIALS: 'AUTH_1001',
  TOKEN_EXPIRED: 'AUTH_1002',
  TOKEN_INVALID: 'AUTH_1003',
  UNAUTHORIZED: 'AUTH_1004',
  FORBIDDEN: 'AUTH_1005',

  // Validation (2xxx)
  VALIDATION_ERROR: 'VAL_2001',
  INVALID_FORMAT: 'VAL_2002',
  MISSING_FIELD: 'VAL_2003',

  // Resources (3xxx)
  NOT_FOUND: 'RES_3001',
  ALREADY_EXISTS: 'RES_3002',
  CONFLICT: 'RES_3003',

  // Business Logic (4xxx)
  VENDOR_NOT_VERIFIED: 'BIZ_4001',
  LEAD_ALREADY_RESPONDED: 'BIZ_4002',
  EVENT_DATE_PASSED: 'BIZ_4003',

  // Server (5xxx)
  INTERNAL_ERROR: 'SRV_5001',
  SERVICE_UNAVAILABLE: 'SRV_5002',
} as const;
```

### ADR-023: API Versioning Strategy

**Decision:** Use URL-based versioning with graceful deprecation.

```typescript
// main.ts
app.setGlobalPrefix('api');
app.enableVersioning({
  type: VersioningType.URI,
  defaultVersion: '1',
});

// Routes become:
// /api/v1/vendors
// /api/v1/auth/login

// When v2 is needed:
// @Controller({ path: 'vendors', version: '2' })
```

### Summary: Clean API Principles

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CLEAN API DESIGN PRINCIPLES                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. SIMPLICITY OVER COMPLEXITY                                                   │
│     • 3 gateways instead of 7                                                   │
│     • Flat folder structure                                                      │
│     • Direct Prisma access (no repository layer for simple CRUD)               │
│                                                                                  │
│  2. CONSISTENCY                                                                  │
│     • Standard response format for ALL endpoints                                │
│     • Consistent error codes                                                     │
│     • Predictable route naming                                                   │
│                                                                                  │
│  3. DISCOVERABILITY                                                              │
│     • OpenAPI/Swagger documentation                                              │
│     • Self-descriptive endpoints                                                 │
│     • Clear HTTP status codes                                                    │
│                                                                                  │
│  4. PERFORMANCE                                                                  │
│     • Pagination on all list endpoints                                          │
│     • Selective field loading (includes)                                        │
│     • Caching at service level                                                   │
│                                                                                  │
│  5. DEVELOPER EXPERIENCE                                                         │
│     • Clear error messages                                                       │
│     • Helpful validation feedback                                                │
│     • Intuitive resource paths (/me/vendor vs /vendors/:id)                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Part 5: Frontend Architecture

### 5.1 Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND TECHNOLOGY STACK                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Framework:         Next.js 15 (App Router)                                     │
│  Language:          TypeScript 5.x                                               │
│  Styling:           Tailwind CSS 4.0                                             │
│  UI Components:     shadcn/ui (Radix UI primitives)                             │
│  State Management:  Zustand + TanStack Query (React Query)                      │
│  Forms:             React Hook Form + Zod validation                            │
│  Icons:             Lucide React                                                 │
│  Charts:            Recharts                                                     │
│  Tables:            TanStack Table                                               │
│  Animations:        Framer Motion                                                │
│  Date Handling:     date-fns                                                     │
│  HTTP Client:       Axios + Custom API Client                                   │
│  Real-time:         Socket.io Client                                             │
│  Testing:           Vitest + Playwright                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Multi-App Architecture

```
App Routing Strategy:
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│  The frontend uses Next.js App Router with Route Groups for multi-portal       │
│  architecture. Each portal serves different user roles with isolated layouts.  │
│                                                                                  │
│  Route Groups:                                                                   │
│  ├── (admin)     → Internal staff dashboards (Ops, Marketing, Sales, Admin)    │
│  ├── (business)  → Vendor/Business portal                                       │
│  ├── (user)      → End-user/Planner portal                                      │
│  └── (public)    → Public pages (landing, discovery, auth)                      │
│                                                                                  │
│  Domain Mapping (Production):                                                    │
│  ├── admin.omnicassion.com      → (admin) route group                           │
│  ├── business.omnicassion.com   → (business) route group                        │
│  ├── app.omnicassion.com        → (user) route group                            │
│  └── omnicassion.com            → (public) route group                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Frontend Folder Structure (Detailed)

```
frontend/
├── .husky/                           # Git hooks
│   ├── pre-commit
│   └── commit-msg
│
├── public/                           # Static assets
│   ├── images/
│   │   ├── logo.svg
│   │   ├── logo-dark.svg
│   │   ├── og-image.png
│   │   └── placeholder/
│   │       ├── vendor.png
│   │       ├── event.png
│   │       └── avatar.png
│   ├── fonts/
│   └── icons/
│       ├── favicon.ico
│       ├── apple-touch-icon.png
│       └── manifest.json
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root layout (providers, fonts)
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   ├── globals.css               # Tailwind directives + CSS variables
│   │   │
│   │   ├── (public)/                 # Public Route Group (No Auth Required)
│   │   │   ├── layout.tsx            # Public layout (navbar, footer)
│   │   │   ├── page.tsx              # Landing page
│   │   │   │
│   │   │   ├── vendors/              # Vendor Discovery
│   │   │   │   ├── page.tsx          # Browse/search vendors
│   │   │   │   ├── [slug]/
│   │   │   │   │   ├── page.tsx      # Vendor profile page
│   │   │   │   │   └── loading.tsx
│   │   │   │   └── category/
│   │   │   │       └── [category]/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── blog/                 # Blog/Content
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── about/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── contact/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── guest/                # Guest Portal (QR Code Access)
│   │   │   │   ├── [eventCode]/
│   │   │   │   │   ├── page.tsx      # Guest landing
│   │   │   │   │   ├── upload/
│   │   │   │   │   │   └── page.tsx  # Photo upload
│   │   │   │   │   └── rsvp/
│   │   │   │   │       └── page.tsx  # RSVP form
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   └── (auth)/               # Auth Pages (Nested Route Group)
│   │   │       ├── layout.tsx        # Centered auth layout
│   │   │       ├── login/
│   │   │       │   └── page.tsx
│   │   │       ├── register/
│   │   │       │   └── page.tsx
│   │   │       ├── forgot-password/
│   │   │       │   └── page.tsx
│   │   │       ├── reset-password/
│   │   │       │   └── page.tsx
│   │   │       ├── verify-email/
│   │   │       │   └── page.tsx
│   │   │       └── onboarding/       # Post-registration setup
│   │   │           ├── user/
│   │   │           │   └── page.tsx
│   │   │           └── vendor/
│   │   │               └── page.tsx
│   │   │
│   │   ├── (user)/                   # User/Planner Route Group (Auth Required)
│   │   │   ├── layout.tsx            # User dashboard layout (sidebar, header)
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx          # User home dashboard
│   │   │   │   └── loading.tsx
│   │   │   │
│   │   │   ├── events/               # User's Events
│   │   │   │   ├── page.tsx          # List user's events
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # Create new event
│   │   │   │   └── [eventId]/
│   │   │   │       ├── page.tsx      # Event overview
│   │   │   │       ├── layout.tsx    # Event-specific layout with tabs
│   │   │   │       │
│   │   │   │       ├── checklist/    # Planning Suite
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── guestlist/
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── budget/
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── timeline/
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── vendors/      # Event vendor shortlist
│   │   │   │       │   └── page.tsx
│   │   │   │       ├── memories/     # Event memories/gallery
│   │   │   │       │   └── page.tsx
│   │   │   │       └── settings/
│   │   │   │           └── page.tsx
│   │   │   │
│   │   │   ├── wishlists/            # Vendor Wishlists/Boards
│   │   │   │   ├── page.tsx
│   │   │   │   └── [boardId]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── inquiries/            # Messages/Leads with Vendors
│   │   │   │   ├── page.tsx
│   │   │   │   └── [leadId]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── reviews/              # User's submitted reviews
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── settings/             # Account Settings
│   │   │       ├── page.tsx
│   │   │       ├── profile/
│   │   │       │   └── page.tsx
│   │   │       ├── notifications/
│   │   │       │   └── page.tsx
│   │   │       └── security/
│   │   │           └── page.tsx
│   │   │
│   │   ├── (business)/               # Vendor/Business Route Group (Auth + BUSINESS_ADMIN)
│   │   │   ├── layout.tsx            # Vendor dashboard layout
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx          # Vendor home dashboard
│   │   │   │   └── loading.tsx
│   │   │   │
│   │   │   ├── profile/              # Vendor Profile Management
│   │   │   │   ├── page.tsx          # View/edit profile
│   │   │   │   ├── preview/
│   │   │   │   │   └── page.tsx      # Preview public profile
│   │   │   │   └── verification/
│   │   │   │       └── page.tsx      # KYC status & documents
│   │   │   │
│   │   │   ├── portfolio/            # Media Management
│   │   │   │   ├── page.tsx
│   │   │   │   └── [portfolioId]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── services/             # Service & Pricing Management
│   │   │   │   ├── page.tsx
│   │   │   │   └── [serviceId]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── leads/                # Lead/Inquiry Management
│   │   │   │   ├── page.tsx
│   │   │   │   └── [leadId]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── calendar/             # Availability Calendar
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── agreements/           # Vendor Agreements (from Ops)
│   │   │   │   ├── page.tsx
│   │   │   │   └── [agreementId]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── tasks/                # Assigned Operational Tasks
│   │   │   │   ├── page.tsx
│   │   │   │   └── [taskId]/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── reviews/              # Reviews Management
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── analytics/            # Vendor Analytics
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   └── settings/             # Business Settings
│   │   │       ├── page.tsx
│   │   │       ├── team/             # Team members (future)
│   │   │       │   └── page.tsx
│   │   │       ├── billing/
│   │   │       │   └── page.tsx
│   │   │       └── notifications/
│   │   │           └── page.tsx
│   │   │
│   │   ├── (admin)/                  # Admin Route Group (Auth + Staff Roles)
│   │   │   ├── layout.tsx            # Admin layout (sidebar, header, role-switch)
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # Admin overview dashboard
│   │   │   │
│   │   │   ├── ops/                  # Operations Module (OPERATIONAL_*)
│   │   │   │   ├── layout.tsx        # Ops sub-layout
│   │   │   │   │
│   │   │   │   ├── events/           # Active Events Management
│   │   │   │   │   ├── page.tsx      # Events list/calendar view
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx  # Create direct booking event
│   │   │   │   │   └── [eventId]/
│   │   │   │   │       ├── page.tsx  # Event detail view
│   │   │   │   │       ├── requirements/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       ├── agreements/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       ├── tasks/
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       └── invoices/
│   │   │   │   │           └── page.tsx
│   │   │   │   │
│   │   │   │   ├── leads/            # CRM Leads (for conversion)
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [leadId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── tasks/            # Task Management
│   │   │   │   │   ├── page.tsx      # My tasks / Team tasks
│   │   │   │   │   └── [taskId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── vendors/          # Vendor Management
│   │   │   │   │   ├── page.tsx      # Internal vendor database
│   │   │   │   │   └── [vendorId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── kyc/              # KYC Verification Queue
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [kycId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── disputes/         # Dispute Management
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [disputeId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── support/          # Support Tickets
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [ticketId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   └── reports/          # Ops Reports & Analytics
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── marketing/            # Marketing Module (MARKETING_*)
│   │   │   │   ├── layout.tsx
│   │   │   │   │
│   │   │   │   ├── campaigns/
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [campaignId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── content/          # Blog/Content Management
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── new/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── [contentId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── media/            # Media Library
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── promotions/       # Featured Vendors, Ads
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   └── categories/       # Category Management
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── sales/                # Sales Module (SALES_MANAGER)
│   │   │   │   ├── layout.tsx
│   │   │   │   │
│   │   │   │   ├── leads/            # Sales Leads
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [leadId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── acquisitions/     # Vendor Acquisitions
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── partnerships/
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   └── reports/
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   ├── system/               # System Admin (ADMIN_SYSTEM)
│   │   │   │   ├── layout.tsx
│   │   │   │   │
│   │   │   │   ├── users/            # User Management
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [userId]/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── roles/            # Role & Permission Management
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── config/           # System Configuration
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   ├── audit/            # Audit Logs
│   │   │   │   │   └── page.tsx
│   │   │   │   │
│   │   │   │   └── health/           # System Health & Monitoring
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── settings/             # Admin Account Settings
│   │   │       └── page.tsx
│   │   │
│   │   └── api/                      # API Routes (if needed for BFF pattern)
│   │       ├── auth/
│   │       │   └── [...nextauth]/
│   │       │       └── route.ts
│   │       ├── upload/
│   │       │   └── route.ts
│   │       └── revalidate/
│   │           └── route.ts
│   │
│   ├── components/                   # Shared Components
│   │   ├── ui/                       # shadcn/ui components (auto-generated)
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── date-picker.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── data-table.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── form.tsx
│   │   │   ├── label.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── tooltip.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── command.tsx
│   │   │   ├── combobox.tsx
│   │   │   └── ...
│   │   │
│   │   ├── common/                   # Common/Shared Components
│   │   │   ├── logo.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   ├── language-switcher.tsx
│   │   │   ├── loading-spinner.tsx
│   │   │   ├── empty-state.tsx
│   │   │   ├── error-boundary.tsx
│   │   │   ├── confirm-dialog.tsx
│   │   │   ├── image-upload.tsx
│   │   │   ├── file-upload.tsx
│   │   │   ├── rich-text-editor.tsx
│   │   │   ├── search-input.tsx
│   │   │   ├── filter-panel.tsx
│   │   │   ├── sort-dropdown.tsx
│   │   │   ├── pagination-controls.tsx
│   │   │   ├── breadcrumbs.tsx
│   │   │   ├── page-header.tsx
│   │   │   ├── stat-card.tsx
│   │   │   ├── status-badge.tsx
│   │   │   ├── avatar-group.tsx
│   │   │   ├── user-menu.tsx
│   │   │   ├── notifications-dropdown.tsx
│   │   │   └── copy-button.tsx
│   │   │
│   │   ├── layouts/                  # Layout Components
│   │   │   ├── public/
│   │   │   │   ├── navbar.tsx
│   │   │   │   ├── footer.tsx
│   │   │   │   └── mobile-nav.tsx
│   │   │   │
│   │   │   ├── dashboard/
│   │   │   │   ├── sidebar.tsx
│   │   │   │   ├── header.tsx
│   │   │   │   ├── sidebar-nav.tsx
│   │   │   │   ├── mobile-sidebar.tsx
│   │   │   │   └── command-menu.tsx
│   │   │   │
│   │   │   ├── admin/
│   │   │   │   ├── admin-sidebar.tsx
│   │   │   │   ├── admin-header.tsx
│   │   │   │   ├── role-switcher.tsx
│   │   │   │   └── admin-nav-items.tsx
│   │   │   │
│   │   │   └── auth/
│   │   │       └── auth-layout.tsx
│   │   │
│   │   ├── forms/                    # Form Components
│   │   │   ├── auth/
│   │   │   │   ├── login-form.tsx
│   │   │   │   ├── register-form.tsx
│   │   │   │   ├── forgot-password-form.tsx
│   │   │   │   └── reset-password-form.tsx
│   │   │   │
│   │   │   ├── event/
│   │   │   │   ├── create-event-form.tsx
│   │   │   │   ├── event-details-form.tsx
│   │   │   │   ├── guest-form.tsx
│   │   │   │   ├── budget-item-form.tsx
│   │   │   │   └── checklist-item-form.tsx
│   │   │   │
│   │   │   ├── vendor/
│   │   │   │   ├── vendor-profile-form.tsx
│   │   │   │   ├── service-form.tsx
│   │   │   │   ├── pricing-form.tsx
│   │   │   │   └── kyc-form.tsx
│   │   │   │
│   │   │   └── inquiry/
│   │   │       ├── inquiry-form.tsx
│   │   │       └── message-form.tsx
│   │   │
│   │   └── features/                 # Feature-Specific Components
│   │       ├── vendors/
│   │       │   ├── vendor-card.tsx
│   │       │   ├── vendor-grid.tsx
│   │       │   ├── vendor-list.tsx
│   │       │   ├── vendor-filters.tsx
│   │       │   ├── vendor-search.tsx
│   │       │   ├── portfolio-gallery.tsx
│   │       │   ├── pricing-table.tsx
│   │       │   ├── review-list.tsx
│   │       │   ├── review-summary.tsx
│   │       │   └── availability-calendar.tsx
│   │       │
│   │       ├── events/
│   │       │   ├── event-card.tsx
│   │       │   ├── event-list.tsx
│   │       │   ├── event-calendar.tsx
│   │       │   ├── checklist-view.tsx
│   │       │   ├── guestlist-table.tsx
│   │       │   ├── budget-tracker.tsx
│   │       │   ├── timeline-view.tsx
│   │       │   └── vendor-shortlist.tsx
│   │       │
│   │       ├── leads/
│   │       │   ├── lead-card.tsx
│   │       │   ├── lead-list.tsx
│   │       │   ├── lead-detail.tsx
│   │       │   ├── message-thread.tsx
│   │       │   └── lead-status-badge.tsx
│   │       │
│   │       ├── ops/
│   │       │   ├── active-event-card.tsx
│   │       │   ├── requirement-sheet.tsx
│   │       │   ├── agreement-card.tsx
│   │       │   ├── task-board.tsx
│   │       │   ├── task-card.tsx
│   │       │   ├── invoice-preview.tsx
│   │       │   └── ops-calendar.tsx
│   │       │
│   │       ├── analytics/
│   │       │   ├── stats-grid.tsx
│   │       │   ├── line-chart.tsx
│   │       │   ├── bar-chart.tsx
│   │       │   ├── pie-chart.tsx
│   │       │   ├── metrics-card.tsx
│   │       │   └── date-range-picker.tsx
│   │       │
│   │       └── notifications/
│   │           ├── notification-item.tsx
│   │           ├── notification-list.tsx
│   │           └── notification-toast.tsx
│   │
│   ├── hooks/                        # Custom React Hooks
│   │   ├── use-auth.ts
│   │   ├── use-user.ts
│   │   ├── use-permissions.ts
│   │   ├── use-theme.ts
│   │   ├── use-mobile.ts
│   │   ├── use-media-query.ts
│   │   ├── use-debounce.ts
│   │   ├── use-throttle.ts
│   │   ├── use-local-storage.ts
│   │   ├── use-session-storage.ts
│   │   ├── use-copy-to-clipboard.ts
│   │   ├── use-infinite-scroll.ts
│   │   ├── use-intersection-observer.ts
│   │   ├── use-websocket.ts
│   │   ├── use-notifications.ts
│   │   │
│   │   └── queries/                  # TanStack Query Hooks
│   │       ├── use-vendors.ts
│   │       ├── use-vendor.ts
│   │       ├── use-events.ts
│   │       ├── use-event.ts
│   │       ├── use-leads.ts
│   │       ├── use-categories.ts
│   │       ├── use-reviews.ts
│   │       ├── use-notifications.ts
│   │       ├── use-analytics.ts
│   │       └── ...
│   │
│   ├── lib/                          # Utility Libraries
│   │   ├── api/                      # API Client
│   │   │   ├── client.ts             # Axios instance with interceptors
│   │   │   ├── endpoints.ts          # API endpoint constants
│   │   │   │
│   │   │   ├── services/             # API Service Functions
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── user.service.ts
│   │   │   │   ├── vendor.service.ts
│   │   │   │   ├── event.service.ts
│   │   │   │   ├── lead.service.ts
│   │   │   │   ├── planning.service.ts
│   │   │   │   ├── ops.service.ts
│   │   │   │   ├── analytics.service.ts
│   │   │   │   └── upload.service.ts
│   │   │   │
│   │   │   └── types/                # API Response Types
│   │   │       ├── auth.types.ts
│   │   │       ├── user.types.ts
│   │   │       ├── vendor.types.ts
│   │   │       ├── event.types.ts
│   │   │       ├── lead.types.ts
│   │   │       ├── common.types.ts
│   │   │       └── ...
│   │   │
│   │   ├── utils/                    # Utility Functions
│   │   │   ├── cn.ts                 # Class name merger (clsx + tailwind-merge)
│   │   │   ├── format.ts             # Date, currency, number formatting
│   │   │   ├── validation.ts         # Zod schemas
│   │   │   ├── constants.ts          # App constants
│   │   │   ├── routes.ts             # Route path helpers
│   │   │   ├── storage.ts            # LocalStorage helpers
│   │   │   ├── url.ts                # URL helpers
│   │   │   └── permissions.ts        # Permission checking utilities
│   │   │
│   │   ├── auth/                     # Auth Utilities
│   │   │   ├── auth-options.ts       # NextAuth config (if using)
│   │   │   ├── session.ts
│   │   │   └── tokens.ts
│   │   │
│   │   └── websocket/                # WebSocket Client
│   │       ├── socket-client.ts
│   │       └── events.ts
│   │
│   ├── store/                        # Zustand State Management
│   │   ├── index.ts                  # Store exports
│   │   ├── auth-store.ts             # Auth state
│   │   ├── user-store.ts             # User preferences
│   │   ├── theme-store.ts            # Theme state
│   │   ├── sidebar-store.ts          # Sidebar state
│   │   ├── notification-store.ts     # Notifications
│   │   └── filter-store.ts           # Global filters
│   │
│   ├── providers/                    # React Context Providers
│   │   ├── index.tsx                 # Combined providers wrapper
│   │   ├── query-provider.tsx        # TanStack Query provider
│   │   ├── theme-provider.tsx
│   │   ├── auth-provider.tsx
│   │   ├── toast-provider.tsx
│   │   └── websocket-provider.tsx
│   │
│   ├── styles/                       # Additional Styles
│   │   ├── themes/
│   │   │   ├── light.css             # Light theme CSS variables
│   │   │   ├── dark.css              # Dark theme CSS variables
│   │   │   └── variables.css         # Base CSS variables
│   │   │
│   │   └── components/               # Component-specific styles (if needed)
│   │       └── editor.css
│   │
│   ├── config/                       # Configuration Files
│   │   ├── site.ts                   # Site metadata
│   │   ├── navigation.ts             # Navigation menus
│   │   ├── dashboard-nav.ts          # Dashboard navigation items
│   │   ├── admin-nav.ts              # Admin navigation items
│   │   └── permissions.ts            # Role-permission mappings
│   │
│   └── types/                        # TypeScript Types
│       ├── index.ts
│       ├── auth.ts
│       ├── user.ts
│       ├── vendor.ts
│       ├── event.ts
│       ├── lead.ts
│       ├── planning.ts
│       ├── operations.ts
│       └── common.ts
│
├── prisma/                           # Prisma (if using for type generation)
│   └── schema.prisma                 # (Optional) Copy from backend for types
│
├── .env.local                        # Local environment variables
├── .env.example                      # Example env file
├── .eslintrc.json                    # ESLint configuration
├── .prettierrc                       # Prettier configuration
├── components.json                   # shadcn/ui configuration
├── next.config.ts                    # Next.js configuration
├── tailwind.config.ts                # Tailwind CSS configuration
├── postcss.config.js                 # PostCSS configuration
├── tsconfig.json                     # TypeScript configuration
├── package.json
└── README.md
```

### 5.4 Tailwind CSS 4 & Theme Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // Custom brand colors
        brand: {
          50: 'hsl(var(--brand-50))',
          100: 'hsl(var(--brand-100))',
          200: 'hsl(var(--brand-200))',
          300: 'hsl(var(--brand-300))',
          400: 'hsl(var(--brand-400))',
          500: 'hsl(var(--brand-500))',
          600: 'hsl(var(--brand-600))',
          700: 'hsl(var(--brand-700))',
          800: 'hsl(var(--brand-800))',
          900: 'hsl(var(--brand-900))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-in-from-top': {
          from: { transform: 'translateY(-10px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-in': 'slide-in-from-top 0.3s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
  ],
};

export default config;
```

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;

    /* Brand colors */
    --brand-50: 340 100% 97%;
    --brand-100: 340 96% 93%;
    --brand-200: 340 94% 86%;
    --brand-300: 340 90% 76%;
    --brand-400: 340 85% 63%;
    --brand-500: 340 82% 52%;    /* Primary brand color */
    --brand-600: 340 84% 44%;
    --brand-700: 340 83% 37%;
    --brand-800: 340 79% 31%;
    --brand-900: 340 75% 26%;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
```

### 5.5 Role-Based Navigation Configuration

```typescript
// src/config/navigation.ts
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  Settings,
  Star,
  Heart,
  CheckSquare,
  DollarSign,
  Clock,
  Store,
  Briefcase,
  Image,
  BarChart3,
  FileCheck,
  AlertTriangle,
  Headphones,
  Megaphone,
  FileText,
  TrendingUp,
  UserCog,
  Shield,
  Activity,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  children?: NavItem[];
  roles?: string[];  // Required roles to see this item
}

// User Dashboard Navigation
export const userNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'My Events',
    href: '/events',
    icon: Calendar,
  },
  {
    title: 'Wishlists',
    href: '/wishlists',
    icon: Heart,
  },
  {
    title: 'Inquiries',
    href: '/inquiries',
    icon: MessageSquare,
  },
  {
    title: 'Reviews',
    href: '/reviews',
    icon: Star,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

// Business/Vendor Dashboard Navigation
export const businessNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Profile',
    href: '/profile',
    icon: Store,
  },
  {
    title: 'Portfolio',
    href: '/portfolio',
    icon: Image,
  },
  {
    title: 'Services',
    href: '/services',
    icon: Briefcase,
  },
  {
    title: 'Leads',
    href: '/leads',
    icon: MessageSquare,
  },
  {
    title: 'Calendar',
    href: '/calendar',
    icon: Calendar,
  },
  {
    title: 'Agreements',
    href: '/agreements',
    icon: FileCheck,
  },
  {
    title: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
  },
  {
    title: 'Reviews',
    href: '/reviews',
    icon: Star,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

// Admin Dashboard Navigation
export const adminNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  // Operations Section
  {
    title: 'Operations',
    href: '/ops',
    icon: Briefcase,
    roles: ['OPERATIONAL_ADMIN', 'OPERATIONAL_MANAGER', 'OPERATIONAL_ASSISTANT'],
    children: [
      { title: 'Active Events', href: '/ops/events', icon: Calendar },
      { title: 'Leads', href: '/ops/leads', icon: Users },
      { title: 'Tasks', href: '/ops/tasks', icon: CheckSquare },
      { title: 'Vendors', href: '/ops/vendors', icon: Store },
      { title: 'KYC Queue', href: '/ops/kyc', icon: FileCheck },
      { title: 'Disputes', href: '/ops/disputes', icon: AlertTriangle },
      { title: 'Support', href: '/ops/support', icon: Headphones },
      { title: 'Reports', href: '/ops/reports', icon: BarChart3 },
    ],
  },
  // Marketing Section
  {
    title: 'Marketing',
    href: '/marketing',
    icon: Megaphone,
    roles: ['MARKETING_SERVICES_ADMIN', 'CONTENT_WRITER', 'MULTI_MEDIA_MANAGER'],
    children: [
      { title: 'Campaigns', href: '/marketing/campaigns', icon: Megaphone },
      { title: 'Content', href: '/marketing/content', icon: FileText },
      { title: 'Media Library', href: '/marketing/media', icon: Image },
      { title: 'Promotions', href: '/marketing/promotions', icon: Star },
      { title: 'Categories', href: '/marketing/categories', icon: Settings },
    ],
  },
  // Sales Section
  {
    title: 'Sales',
    href: '/sales',
    icon: TrendingUp,
    roles: ['SALES_MANAGER'],
    children: [
      { title: 'Leads', href: '/sales/leads', icon: Users },
      { title: 'Acquisitions', href: '/sales/acquisitions', icon: Store },
      { title: 'Partnerships', href: '/sales/partnerships', icon: Briefcase },
      { title: 'Reports', href: '/sales/reports', icon: BarChart3 },
    ],
  },
  // System Admin Section
  {
    title: 'System',
    href: '/system',
    icon: Shield,
    roles: ['ADMIN_SYSTEM'],
    children: [
      { title: 'Users', href: '/system/users', icon: Users },
      { title: 'Roles', href: '/system/roles', icon: UserCog },
      { title: 'Configuration', href: '/system/config', icon: Settings },
      { title: 'Audit Logs', href: '/system/audit', icon: FileText },
      { title: 'Health', href: '/system/health', icon: Activity },
    ],
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];
```

### 5.6 shadcn/ui Configuration

```json
// components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

---

**Document Status:** Draft - Pending Approval
**Next Action:** Review and approve to begin Phase 0 implementation
