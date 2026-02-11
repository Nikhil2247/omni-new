# Omnicassion V2.0 - Backend Workflow Guide

> **Architecture**: Modular Monolith with Microservices-Ready Seams
> **Framework**: NestJS with Prisma ORM
> **Target Scale**: 100k+ DAU, High Concurrency

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Module Organization](#2-module-organization)
3. [Request Lifecycle](#3-request-lifecycle)
4. [API Gateway Pattern](#4-api-gateway-pattern)
5. [Domain Layer Workflows](#5-domain-layer-workflows)
6. [Event-Driven Architecture](#6-event-driven-architecture)
7. [Authentication & Authorization Flow](#7-authentication--authorization-flow)
8. [Infrastructure Services](#8-infrastructure-services)
9. [Real-Time Communication](#9-real-time-communication)
10. [Background Job Processing](#10-background-job-processing)
11. [Data Flow Diagrams](#11-data-flow-diagrams)
12. [Cross-Cutting Concerns](#12-cross-cutting-concerns)
13. [Module Dependency Map](#13-module-dependency-map)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│         (Web App / Mobile App / Admin Dashboard / Vendor Portal)            │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API GATEWAY LAYER                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  Admin   │ │   User   │ │ Business │ │   Ops    │ │Marketing │          │
│  │ Gateway  │ │ Gateway  │ │ Gateway  │ │ Gateway  │ │ Gateway  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐                                                  │
│  │  Sales   │ │  Public  │  ◄── Route by URL prefix & Role                 │
│  │ Gateway  │ │ Gateway  │                                                  │
│  └──────────┘ └──────────┘                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CORE LAYER                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │   Auth   │ │  Common  │ │ Database │ │  Events  │ │  Lookup  │          │
│  │  Module  │ │  Module  │ │  Module  │ │  Module  │ │  Module  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             DOMAIN LAYER                                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Catalog  │ │  Leads   │ │ Planning │ │Operations│ │ Content  │          │
│  │  Domain  │ │  Domain  │ │  Domain  │ │  Domain  │ │  Domain  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          INFRASTRUCTURE LAYER                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  Cache   │ │   Jobs   │ │  Search  │ │ Storage  │ │WebSockets│          │
│  │(Dragonfly│ │ (BullMQ) │ │(Meili)   │ │ (MinIO)  │ │(Socket.io│          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐                                                  │
│  │Notificat-│ │Resilience│                                                  │
│  │  ions    │ │ (Circuit)│                                                  │
│  └──────────┘ └──────────┘                                                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     PostgreSQL (Multi-Schema)                        │    │
│  │  public │ catalog │ interaction │ planning │ operations │ content   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Module Organization

### 2.1 Folder Structure Pattern

```
src/
├── api/                    # API Gateway Layer (Controllers)
│   ├── admin-gateway/      # System administration
│   ├── user-gateway/       # End-user/planner features
│   ├── business-gateway/   # Vendor/business features
│   ├── ops-gateway/        # Operations team features
│   ├── marketing-gateway/  # Marketing features
│   ├── sales-gateway/      # Sales CRM features
│   └── public-gateway/     # Unauthenticated endpoints
│
├── core/                   # Cross-Cutting Concerns
│   ├── auth/               # Authentication & Authorization
│   ├── common/             # Shared utilities & helpers
│   ├── database/           # Prisma service & repositories
│   ├── events/             # Event bus & handlers
│   └── lookup/             # Reference data services
│
├── domain/                 # Business Logic Layer
│   ├── catalog/            # Vendor catalog domain
│   ├── leads/              # Lead management domain
│   ├── planning/           # Event planning domain
│   ├── operations/         # Operations execution domain
│   └── content/            # Blog/SEO content domain
│
└── infrastructure/         # Technical Services
    ├── cache/              # Caching (Dragonfly)
    ├── jobs/               # Job queues (BullMQ)
    ├── notifications/      # Email/SMS services
    ├── search/             # Search indexing (Meilisearch)
    ├── storage/            # File storage (MinIO)
    ├── websockets/         # Real-time communication
    └── resilience/         # Circuit breakers, retries
```

### 2.2 Module Import Hierarchy

```
                              AppModule
                                  │
         ┌────────────┬──────────┼──────────┬────────────┐
         ▼            ▼          ▼          ▼            ▼
    API Gateways   Core      Domain    Infrastructure  Config
         │        Modules    Modules      Modules
         │            │          │            │
         └────────────┴──────────┴────────────┘
                      │
              Shared Dependencies:
              - DatabaseModule (PrismaService)
              - AuthModule (Guards, Decorators)
              - CommonModule (Pipes, Filters)
              - EventsModule (EventEmitter2)
```

---

## 3. Request Lifecycle

### 3.1 Complete Request Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REQUEST LIFECYCLE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  HTTP Request
       │
       ▼
┌──────────────┐
│   Middleware │ ◄── helmet, cors, compression, rate-limiting
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    Guards    │ ◄── JwtAuthGuard → RolesGuard → TenantGuard
└──────┬───────┘
       │ (Unauthorized? → 401/403)
       ▼
┌──────────────┐
│ Interceptors │ ◄── LoggingInterceptor → CacheInterceptor → TransformInterceptor
└──────┬───────┘
       │ (Pre-controller logic)
       ▼
┌──────────────┐
│    Pipes     │ ◄── ValidationPipe (class-validator/class-transformer)
└──────┬───────┘
       │ (Invalid? → 400 Bad Request)
       ▼
┌──────────────┐
│  Controller  │ ◄── Route handler, DTO extraction, Response shaping
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Service    │ ◄── Business logic, domain rules, orchestration
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Repository  │ ◄── Data access abstraction, query building
└──────┬───────┘
       │
       ▼
┌──────────────┐
│PrismaService │ ◄── ORM queries, transactions, connection pooling
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Database   │ ◄── PostgreSQL execution
└──────┬───────┘
       │
       ▼
  (Response bubbles back up through interceptors)
       │
       ▼
┌──────────────┐
│Exception     │ ◄── HttpExceptionFilter, PrismaExceptionFilter
│Filters       │     (Catches errors, formats response)
└──────┬───────┘
       │
       ▼
  HTTP Response (JSON)
```

### 3.2 Example: Create Event Request

```typescript
// 1. Request hits User Gateway
POST /api/user/events
Authorization: Bearer <jwt_token>
Body: { name: "Wedding", eventTypeId: "...", date: "2025-06-15" }

// 2. Guard Chain
JwtAuthGuard.canActivate()      → Validates JWT, extracts user
RolesGuard.canActivate()        → Checks user has 'PLANNER' role

// 3. Interceptor Chain (Pre)
LoggingInterceptor.intercept()  → Logs request details
CacheInterceptor.intercept()    → Checks cache (skip for POST)

// 4. Validation Pipe
ValidationPipe.transform()      → Validates CreateEventDto

// 5. Controller
@Post()
async createEvent(@Body() dto: CreateEventDto, @CurrentUser() user: User) {
  return this.eventService.create(dto, user.id);
}

// 6. Service Layer
async create(dto: CreateEventDto, userId: string): Promise<Event> {
  // Business logic
  const event = await this.eventRepository.create({ ...dto, userId });

  // Emit domain event
  this.eventEmitter.emit('event.created', new EventCreatedEvent(event));

  return event;
}

// 7. Repository Layer
async create(data: CreateEventData): Promise<Event> {
  return this.prisma.event.create({ data });
}

// 8. Event Handlers (Async)
@OnEvent('event.created')
async handleEventCreated(event: EventCreatedEvent) {
  // Index in Meilisearch
  await this.searchService.indexEvent(event.data);

  // Send notification
  await this.notificationQueue.add('event-created', event.data);
}

// 9. Response
{
  "id": "uuid",
  "name": "Wedding",
  "status": "PLANNING",
  "createdAt": "2025-01-11T..."
}
```

---

## 4. API Gateway Pattern

### 4.1 Gateway Responsibilities

| Gateway | URL Prefix | Role Access | Purpose |
|---------|-----------|-------------|---------|
| **admin-gateway** | `/api/admin` | ADMIN_SYSTEM | User management, system config, audit logs |
| **user-gateway** | `/api/user` | PLANNER, USER | Event planning, discovery, personal features |
| **business-gateway** | `/api/business` | VENDOR, BUSINESS_ADMIN | Profile, services, leads, analytics |
| **ops-gateway** | `/api/ops` | OPS_ADMIN, OPS_MANAGER, OPS_ASSISTANT | KYC, disputes, event execution |
| **marketing-gateway** | `/api/marketing` | MARKETING_ADMIN | Campaigns, content, promotions |
| **sales-gateway** | `/api/sales` | SALES_ADMIN, SALES_REP | Lead management, acquisitions |
| **public-gateway** | `/api/public` | (None - Public) | Health checks, discovery, webhooks, RSVP |

### 4.2 Gateway → Domain Service Mapping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      GATEWAY TO SERVICE MAPPING                              │
└─────────────────────────────────────────────────────────────────────────────┘

USER-GATEWAY                           DOMAIN SERVICES
├── events.controller        ────────► planning/event.service
├── checklists.controller    ────────► planning/checklist.service
├── guestlist.controller     ────────► planning/guestlist.service
├── budget.controller        ────────► planning/budget.service
├── timeline.controller      ────────► planning/timeline.service
├── wishlists.controller     ────────► planning/wishlist.service
├── memories.controller      ────────► planning/event-memory.service
├── event-vendors.controller ────────► planning/event-vendor.service
├── discovery.controller     ────────► catalog/vendor-profile.service
├── interactions.controller  ────────► leads/lead.service, message.service
└── account.controller       ────────► core/auth.service

BUSINESS-GATEWAY                       DOMAIN SERVICES
├── profile.controller       ────────► catalog/vendor-profile.service
├── portfolio.controller     ────────► catalog/portfolio.service
├── services.controller      ────────► catalog/service.service
├── leads.controller         ────────► leads/lead.service
├── analytics.controller     ────────► catalog/vendor-profile.service
├── calendar.controller      ────────► planning/timeline.service
├── reviews.controller       ────────► (reviews domain - TBD)
├── agreements.controller    ────────► operations/vendor-agreement.service
└── tasks.controller         ────────► operations/operational-task.service

OPS-GATEWAY                            DOMAIN SERVICES
├── active-events.controller  ───────► operations/active-event.service
├── lead-conversion.controller ──────► operations/lead-conversion.service
├── requirements.controller   ───────► operations/requirement-sheet.service
├── vendor-agreements.controller ────► operations/vendor-agreement.service
├── invoices.controller       ───────► operations/provisional-invoice.service
├── operational-tasks.controller ────► operations/operational-task.service
├── task-attachments.controller ─────► operations/task-attachment.service
├── ops-dashboard.controller  ───────► operations/ops-dashboard.service
├── kyc.controller            ───────► operations/kyc-verification.service
├── disputes.controller       ───────► operations/dispute.service
├── moderation.controller     ───────► operations/moderation.service
├── vendors.controller        ───────► catalog/vendor-profile.service
└── support.controller        ───────► (support domain - TBD)

PUBLIC-GATEWAY                         DOMAIN SERVICES
├── discovery.controller      ───────► catalog/vendor-profile.service
├── health.controller         ───────► (health check)
├── webhooks.controller       ───────► (webhook handlers)
├── guest-upload.controller   ───────► planning/event-memory.service
└── rsvp.controller           ───────► planning/guestlist.service
```

---

## 5. Domain Layer Workflows

### 5.1 Planning Domain - Event Creation Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PLANNING DOMAIN - EVENT WORKFLOW                          │
└─────────────────────────────────────────────────────────────────────────────┘

User creates event
       │
       ▼
┌──────────────────┐
│  event.service   │
│    .create()     │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────────────┐
│ Event  │ │ EventEmitter   │
│ saved  │ │ .emit('event.  │
│ to DB  │ │  created')     │
└────────┘ └───────┬────────┘
                   │
         ┌─────────┴─────────┬─────────────────┐
         │                   │                 │
         ▼                   ▼                 ▼
┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐
│ Auto-create     │ │ Index event  │ │ Send welcome    │
│ default         │ │ in search    │ │ notification    │
│ Checklist,      │ │ (Meilisearch)│ │ (BullMQ queue)  │
│ Budget,         │ │              │ │                 │
│ Guestlist       │ │              │ │                 │
└─────────────────┘ └──────────────┘ └─────────────────┘

// event.listener.ts
@OnEvent('event.created')
async handleEventCreated(event: EventCreatedEvent) {
  // Create default planning components
  await this.checklistService.createDefault(event.id);
  await this.budgetService.createDefault(event.id);
  await this.guestlistService.create(event.id);

  // Async tasks
  await this.searchIndexer.indexEvent(event);
  await this.notificationQueue.add('welcome-email', { eventId: event.id });
}
```

### 5.2 Operations Domain - Lead Conversion Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              OPERATIONS DOMAIN - LEAD CONVERSION WORKFLOW                    │
└─────────────────────────────────────────────────────────────────────────────┘

Digital Lead (User clicks "Get Quote")
       │
       ▼
┌──────────────────────┐
│   Lead created in    │
│   interaction.leads  │
│   Status: NEW        │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│  Ops Admin reviews   │
│  lead in CRM         │
│  (ops-gateway)       │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    LEAD CONVERSION                                │
│  lead-conversion.service.convertToActiveEvent(leadId)            │
└──────────┬───────────────────────────────────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
┌─────────┐  ┌─────────────────────────────────┐
│ Update  │  │ Create ActiveEvent              │
│ Lead    │  │ - origin: DIGITAL_LEAD          │
│ status  │  │ - convertedFromLeadId: leadId   │
│ to WON  │  │ - status: NEW                   │
└─────────┘  └─────────────┬───────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ EventEmitter.emit(     │
              │ 'active-event.created')│
              └────────────┬───────────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
    ┌─────────────┐ ┌──────────┐ ┌──────────────┐
    │ Notify Ops  │ │ Create   │ │ Log to       │
    │ Manager via │ │ initial  │ │ AuditLog     │
    │ WebSocket   │ │ EventNote│ │              │
    └─────────────┘ └──────────┘ └──────────────┘
```

### 5.3 Operations Domain - Event Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│              OPERATIONS DOMAIN - EVENT EXECUTION WORKFLOW                    │
└─────────────────────────────────────────────────────────────────────────────┘

                    ActiveEvent (status: NEW)
                              │
                              ▼
                  ┌───────────────────────┐
                  │ Ops Admin assigns     │
                  │ Ops Manager           │
                  │ → status: ASSIGNED    │
                  └───────────┬───────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ Ops Manager creates   │
                  │ RequirementSheet      │
                  │ with RequirementItems │
                  │ → status: REQS_SET    │
                  └───────────┬───────────┘
                              │
           ┌──────────────────┼──────────────────┐
           │                  │                  │
           ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│ Requirement:    │ │ Requirement:    │ │ Requirement:    │
│ "Photographer"  │ │ "Decorator"     │ │ "Caterer"       │
│ status: PENDING │ │ status: PENDING │ │ status: PENDING │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
                             ▼
                  ┌───────────────────────┐
                  │ Ops Manager sources   │
                  │ vendors for each req  │
                  │ → status: SOURCING    │
                  └───────────┬───────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ Create VendorAgreement│
                  │ for selected vendors  │
                  │ Send to vendor portal │
                  └───────────┬───────────┘
                              │
                              ▼
                  ┌───────────────────────┐
                  │ Vendor accepts/declines│
                  │ agreement via business │
                  │ gateway                │
                  └───────────┬───────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
           ┌──────────────┐    ┌──────────────┐
           │   ACCEPTED   │    │   DECLINED   │
           │ Lock contract│    │ Find another │
           │ Generate     │    │ vendor       │
           │ invoice      │    │              │
           └──────┬───────┘    └──────────────┘
                  │
                  ▼
       ┌───────────────────────┐
       │ All contracts locked  │
       │ → status: CONTRACTS_  │
       │          LOCKED       │
       └───────────┬───────────┘
                   │
                   ▼
       ┌───────────────────────┐
       │ Create OperationalTasks│
       │ - Collection tasks    │
       │ - Setup tasks         │
       │ - Verification tasks  │
       │ Assign to Ops Asst    │
       │ or Vendors            │
       └───────────┬───────────┘
                   │
                   ▼
       ┌───────────────────────┐
       │ → status: EXECUTION   │
       │ (Event day)           │
       │ Tasks submitted with  │
       │ proof photos          │
       │ Manager reviews/      │
       │ approves              │
       └───────────┬───────────┘
                   │
                   ▼
       ┌───────────────────────┐
       │ → status: COMPLETED   │
       │ Final billing         │
       │ feedback collection   │
       └───────────────────────┘
```

### 5.4 Catalog Domain - Vendor Discovery Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  CATALOG DOMAIN - VENDOR DISCOVERY                           │
└─────────────────────────────────────────────────────────────────────────────┘

User searches for vendors
         │
         ▼
┌────────────────────────────────────┐
│ GET /api/user/discovery/vendors    │
│ ?category=photography&city=NYC     │
└────────────────┬───────────────────┘
                 │
         ┌───────┴───────┐
         │               │
         ▼               ▼
┌─────────────────┐ ┌─────────────────┐
│ Check Cache     │ │ Query           │
│ (Dragonfly)     │ │ Meilisearch     │
│                 │ │ (full-text)     │
└────────┬────────┘ └────────┬────────┘
         │                   │
         │ (Cache miss)      │
         │                   │
         ▼                   ▼
┌─────────────────────────────────────┐
│ vendor-profile.service.search()    │
│ - Filter by category, location     │
│ - Sort by rating, relevance        │
│ - Pagination                       │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ vendor-profile.repository.find()   │
│ - Prisma query with joins          │
│ - Include: services, portfolio     │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│ Cache result (TTL: 5 min)          │
│ Return paginated vendor list       │
└─────────────────────────────────────┘
```

---

## 6. Event-Driven Architecture

### 6.1 Event Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EVENT-DRIVEN ARCHITECTURE                               │
└─────────────────────────────────────────────────────────────────────────────┘

    Service emits event
           │
           ▼
┌───────────────────────┐
│   EventEmitter2       │  (NestJS @nestjs/event-emitter)
│   .emit('event.name', │
│         payload)      │
└───────────┬───────────┘
            │
            │ (Synchronous dispatch to all listeners)
            │
     ┌──────┴──────┬──────────────┬─────────────────┐
     │             │              │                 │
     ▼             ▼              ▼                 ▼
┌─────────┐ ┌───────────┐ ┌────────────┐ ┌─────────────────┐
│ Domain  │ │ Cache     │ │ Search     │ │ Notification    │
│ Listener│ │ Handler   │ │ Handler    │ │ Handler         │
│         │ │           │ │            │ │                 │
│ Related │ │ Invalidate│ │ Update     │ │ Queue async     │
│ business│ │ affected  │ │ search     │ │ notification    │
│ logic   │ │ cache keys│ │ index      │ │ job             │
└─────────┘ └───────────┘ └────────────┘ └─────────────────┘
```

### 6.2 Domain Events Catalog

```typescript
// ============================================================================
// PLANNING DOMAIN EVENTS
// ============================================================================

// Event Lifecycle
'event.created'           → Create defaults (checklist, budget, guestlist)
'event.updated'           → Update search index, invalidate cache
'event.deleted'           → Cleanup related data, remove from search
'event.status-changed'    → Trigger status-specific workflows

// Checklist Events
'checklist.item-completed' → Update progress, check all-complete trigger
'checklist.all-completed'  → Send notification, update event progress

// Budget Events
'budget.item-added'        → Recalculate totals
'budget.item-paid'         → Update payment status, notify vendor
'budget.exceeded'          → Alert user

// Guestlist Events
'guest.rsvp-updated'       → Update counts, send confirmation
'guestlist.imported'       → Process batch, send invitations

// ============================================================================
// OPERATIONS DOMAIN EVENTS
// ============================================================================

// Active Event Lifecycle
'active-event.created'     → Notify ops team, create audit log
'active-event.assigned'    → Notify manager via WebSocket
'active-event.status-changed' → Trigger workflow transitions

// Vendor Agreement Events
'agreement.sent'           → Start expiry countdown
'agreement.accepted'       → Generate invoice, update requirement status
'agreement.declined'       → Notify manager, reopen sourcing

// Task Events
'task.assigned'            → Notify assignee (user or vendor)
'task.submitted'           → Notify manager for review
'task.approved'            → Mark complete, trigger next task
'task.rejected'            → Notify assignee with feedback

// ============================================================================
// CATALOG DOMAIN EVENTS
// ============================================================================

'vendor.profile-updated'   → Update search index, invalidate cache
'vendor.verified'          → Update status, send congratulations
'portfolio.media-added'    → Process thumbnails, update portfolio
'service.pricing-changed'  → Notify subscribed users

// ============================================================================
// LEADS DOMAIN EVENTS
// ============================================================================

'lead.created'             → Notify vendor, start response timer
'lead.status-changed'      → Update analytics, trigger CRM automation
'lead.converted'           → Create ActiveEvent (if ops involved)
'message.sent'             → Real-time WebSocket push
```

### 6.3 Event Handler Implementation

```typescript
// core/events/handlers/cache-invalidation.handler.ts

@Injectable()
export class CacheInvalidationHandler {
  constructor(private readonly cacheService: DragonflyService) {}

  @OnEvent('vendor.profile-updated')
  async handleVendorUpdated(event: VendorUpdatedEvent) {
    const keys = [
      `vendor:${event.vendorId}`,
      `vendor:${event.vendorId}:services`,
      `vendor:${event.vendorId}:portfolio`,
      `discovery:category:${event.categoryId}:*`,
    ];
    await this.cacheService.deleteMany(keys);
  }

  @OnEvent('event.updated')
  async handleEventUpdated(event: EventUpdatedEvent) {
    await this.cacheService.delete(`event:${event.eventId}`);
    await this.cacheService.delete(`user:${event.userId}:events`);
  }
}

// core/events/handlers/search-index.handler.ts

@Injectable()
export class SearchIndexHandler {
  constructor(private readonly searchService: MeilisearchService) {}

  @OnEvent('vendor.profile-updated')
  async handleVendorUpdated(event: VendorUpdatedEvent) {
    await this.searchService.updateDocument('vendors', event.vendor);
  }

  @OnEvent('event.created')
  async handleEventCreated(event: EventCreatedEvent) {
    await this.searchService.addDocument('events', event.event);
  }

  @OnEvent('vendor.deleted')
  async handleVendorDeleted(event: VendorDeletedEvent) {
    await this.searchService.deleteDocument('vendors', event.vendorId);
  }
}
```

---

## 7. Authentication & Authorization Flow

### 7.1 JWT Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       JWT AUTHENTICATION FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

                                LOGIN
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ POST /api/public/auth/login                                 │
│ Body: { email, password }                                   │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ auth.service.validateUser(email, password)                  │
│ - Find user by email                                        │
│ - Verify password hash (bcrypt)                             │
│ - Check user status (ACTIVE)                                │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                           ┌──────┴──────┐
                           │             │
                           ▼             ▼
                    ┌───────────┐ ┌───────────┐
                    │  VALID    │ │  INVALID  │
                    └─────┬─────┘ └─────┬─────┘
                          │             │
                          │             ▼
                          │      401 Unauthorized
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ token.service.generateTokens(user)                          │
│                                                             │
│ Access Token (15 min):                                      │
│ {                                                           │
│   sub: userId,                                              │
│   email: user.email,                                        │
│   roles: ['PLANNER', 'VENDOR'],                             │
│   iat, exp                                                  │
│ }                                                           │
│                                                             │
│ Refresh Token (7 days):                                     │
│ - Stored in user_sessions table                             │
│ - Hashed for security                                       │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Response:                                                   │
│ {                                                           │
│   accessToken: "eyJhbG...",                                 │
│   refreshToken: "eyJhbG...",                                │
│   expiresIn: 900,                                           │
│   user: { id, email, firstName, roles }                     │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘


                          PROTECTED REQUEST
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ GET /api/user/events                                        │
│ Authorization: Bearer <access_token>                        │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│ JwtAuthGuard.canActivate()                                  │
│ - Extract token from header                                 │
│ - Verify JWT signature                                      │
│ - Check expiration                                          │
│ - Attach user to request                                    │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                           ┌──────┴──────┐
                           │             │
                           ▼             ▼
                    ┌───────────┐ ┌───────────┐
                    │  VALID    │ │  INVALID  │
                    └─────┬─────┘ └─────┬─────┘
                          │             │
                          │             ▼
                          │      401 Unauthorized
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ RolesGuard.canActivate()                                    │
│ - Get required roles from @Roles() decorator                │
│ - Check if user has any required role                       │
│ - Supports role hierarchy                                   │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                           ┌──────┴──────┐
                           │             │
                           ▼             ▼
                    ┌───────────┐ ┌───────────┐
                    │ AUTHORIZED│ │UNAUTHORIZED│
                    └─────┬─────┘ └─────┬─────┘
                          │             │
                          │             ▼
                          │      403 Forbidden
                          │
                          ▼
                   Continue to controller
```

### 7.2 Role Hierarchy & Permissions

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ROLE HIERARCHY                                      │
└─────────────────────────────────────────────────────────────────────────────┘

                        ADMIN_SYSTEM (Level 100)
                              │
                              │ inherits all permissions
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
    ADMIN_CATALOG      ADMIN_CONTENT       ADMIN_SUPPORT
    (Level 80)         (Level 80)          (Level 80)
          │                   │                   │
          └───────────────────┼───────────────────┘
                              │
                              ▼
    ┌─────────────────────────┼─────────────────────────┐
    │                         │                         │
    ▼                         ▼                         ▼
OPS_ADMIN              MARKETING_ADMIN            SALES_ADMIN
(Level 70)             (Level 70)                 (Level 70)
    │                         │                         │
    ▼                         │                         │
OPS_MANAGER                   │                         ▼
(Level 60)                    │                    SALES_REP
    │                         │                    (Level 50)
    ▼                         │
OPS_ASSISTANT                 │
(Level 50)                    │
                              │
                              │
    ──────────────────────────┼──────────────────────────
                              │
                              ▼
              BUSINESS_ADMIN / VENDOR (Level 30)
                              │
                              ▼
                    PLANNER / USER (Level 10)


// Permission Check Example
@Roles('OPS_MANAGER', 'OPS_ADMIN', 'ADMIN_SYSTEM')
@Get('active-events')
async getActiveEvents() {
  // OPS_ADMIN and ADMIN_SYSTEM can access due to hierarchy
}
```

### 7.3 Guard Chain Implementation

```typescript
// Controller with full guard chain
@Controller('ops/active-events')
@UseGuards(JwtAuthGuard, RolesGuard, TenantGuard)
export class ActiveEventsController {

  @Get()
  @Roles('OPS_ADMIN', 'OPS_MANAGER', 'OPS_ASSISTANT')
  async findAll(@CurrentUser() user: User) {
    // JwtAuthGuard: Validated JWT, attached user to request
    // RolesGuard: Verified user has one of the required roles
    // TenantGuard: Ensured data isolation (if multi-tenant)
    return this.activeEventService.findAllForUser(user);
  }

  @Post(':id/assign')
  @Roles('OPS_ADMIN') // Only Ops Admin can assign
  async assignManager(
    @Param('id') id: string,
    @Body() dto: AssignManagerDto,
    @CurrentUser() user: User
  ) {
    return this.activeEventService.assignManager(id, dto, user.id);
  }
}
```

---

## 8. Infrastructure Services

### 8.1 Caching Strategy (Dragonfly)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CACHING STRATEGIES                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ CACHE-ASIDE (Default)                                                        │
│ Used for: Vendor profiles, Categories, Service types                         │
│                                                                              │
│   Request ──► Check Cache ──► HIT ──► Return cached data                    │
│                    │                                                         │
│                   MISS                                                       │
│                    │                                                         │
│                    ▼                                                         │
│              Query Database ──► Store in Cache ──► Return data              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ READ-THROUGH                                                                 │
│ Used for: Search results, Discovery listings                                 │
│                                                                              │
│   Request ──► CacheService.get(key, fetchFn) ──► HIT ──► Return             │
│                         │                                                    │
│                        MISS                                                  │
│                         │                                                    │
│                         ▼                                                    │
│              Execute fetchFn() ──► Auto-store ──► Return                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ WRITE-THROUGH                                                                │
│ Used for: Session data, Real-time metrics                                    │
│                                                                              │
│   Write ──► Update Cache ──► Update Database (async)                        │
│                   │                                                          │
│                   ▼                                                          │
│             Return immediately                                               │
└─────────────────────────────────────────────────────────────────────────────┘

// Cache key patterns
vendor:{vendorId}                    → VendorProfile
vendor:{vendorId}:services           → Vendor services list
vendor:{vendorId}:portfolio          → Portfolio with media
discovery:category:{categoryId}:p{page} → Paginated discovery results
event:{eventId}                      → Event details
user:{userId}:events                 → User's events list
lookup:categories                    → All categories (long TTL)
lookup:event-types                   → All event types (long TTL)
session:{sessionId}                  → User session data
```

### 8.2 Search Indexing (Meilisearch)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SEARCH INDEXING FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────┘

                    Data Change (Create/Update/Delete)
                                  │
                                  ▼
                    ┌────────────────────────┐
                    │   Domain Service       │
                    │   emits event          │
                    └───────────┬────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │ SearchIndexHandler     │
                    │ @OnEvent('...')        │
                    └───────────┬────────────┘
                                │
                    ┌───────────┴───────────┐
                    │                       │
                    ▼                       ▼
            ┌──────────────┐        ┌──────────────┐
            │ Immediate    │        │ Queue Job    │
            │ (small docs) │        │ (large/batch)│
            └──────┬───────┘        └──────┬───────┘
                   │                       │
                   ▼                       ▼
            ┌────────────────────────────────────┐
            │        MeilisearchService          │
            │  .addDocument() / .updateDocument()│
            │  .deleteDocument() / .batchUpdate()│
            └────────────────────────────────────┘
                                │
                                ▼
                    ┌────────────────────────┐
                    │    Meilisearch Index   │
                    │    - vendors           │
                    │    - events            │
                    │    - blog_posts        │
                    └────────────────────────┘

// Index Schemas
vendors: {
  id, businessName, slug, categoryName, description, tagline,
  cityName, stateName, countryName,
  tags[], serviceNames[], priceRange,
  status, rating, reviewCount, viewCount
}

events: {
  id, name, eventTypeName, date, venueName,
  cityName, status, guestCount, userId
}
```

### 8.3 File Storage (MinIO)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FILE UPLOAD FLOW                                      │
└─────────────────────────────────────────────────────────────────────────────┘

    Client uploads file
            │
            ▼
┌───────────────────────────────────────────┐
│ POST /api/business/portfolio/upload       │
│ multipart/form-data                       │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│ upload.service.uploadFile(file, options)  │
│ - Validate file type, size                │
│ - Generate unique filename                │
│ - Determine bucket                        │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│ minio.service.putObject(bucket, key, file)│
│ - Upload to MinIO                         │
│ - Set content-type, metadata              │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│ Queue media processing job                │
│ - Generate thumbnails                     │
│ - Extract metadata (dimensions, duration) │
│ - Optimize for web                        │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│ cdn.service.generateUrl(key)              │
│ - Return CDN URL for serving              │
│ - Signed URL if private                   │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│ Response: { url, thumbnailUrl, cdnUrl }   │
└───────────────────────────────────────────┘

// Bucket Structure
omnicassion-media/
├── portfolios/
│   └── {vendorId}/
│       ├── originals/
│       └── thumbnails/
├── events/
│   └── {eventId}/
│       ├── memories/
│       └── guest-uploads/
├── kyc-documents/
│   └── {vendorId}/
├── task-attachments/
│   └── {taskId}/
└── avatars/
    └── {userId}/
```

---

## 9. Real-Time Communication

### 9.1 WebSocket Gateway Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      WEBSOCKET ARCHITECTURE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    Client connects
          │
          ▼
┌───────────────────────────────────────────┐
│ WebSocket Handshake                       │
│ ws://api.omnicassion.com/socket.io        │
│ Query: { token: <jwt_access_token> }      │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│ handleConnection(socket)                  │
│ - Validate JWT from query                 │
│ - Extract user from token                 │
│ - Join user-specific room: user:{userId}  │
│ - Join role-based room: role:{roleName}   │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│ Connected & Authenticated                 │
│                                           │
│ Rooms joined:                             │
│ - user:123                                │
│ - role:OPS_MANAGER                        │
│ - event:456 (if viewing specific event)   │
└───────────────────────────────────────────┘


                    SERVER-SIDE EVENTS
                          │
                          ▼
┌───────────────────────────────────────────┐
│ Domain event occurs                       │
│ e.g., 'task.assigned'                     │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│ NotificationGateway.sendToUser(           │
│   userId: '123',                          │
│   event: 'task:assigned',                 │
│   payload: { taskId, title, ... }         │
│ )                                         │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
┌───────────────────────────────────────────┐
│ server.to('user:123').emit(               │
│   'task:assigned',                        │
│   payload                                 │
│ )                                         │
└─────────────────────┬─────────────────────┘
                      │
                      ▼
              Client receives event
```

### 9.2 WebSocket Events Catalog

```typescript
// NOTIFICATION GATEWAY EVENTS (notification.gateway.ts)

// Server → Client Events
'notification:new'           // New notification
'notification:read'          // Notification marked as read
'notification:batch'         // Multiple notifications

// CLIENT EVENTS (Subscribable)
// User-specific room: user:{userId}
'task:assigned'              // Task assigned to user
'task:status-changed'        // Task status updated
'lead:new'                   // New lead received (for vendors)
'lead:message'               // New message in lead conversation
'event:status-changed'       // Event status changed
'agreement:response'         // Vendor agreement accepted/declined

// Role-based room: role:{roleName}
'ops:new-event'              // New ActiveEvent created
'ops:urgent-task'            // Urgent task needs attention
'admin:system-alert'         // System-wide alerts


// MESSAGING GATEWAY EVENTS (messaging.gateway.ts)

// Client → Server
'message:send'               // Send message in conversation
'message:typing'             // User is typing indicator
'message:read'               // Mark messages as read
'conversation:join'          // Join conversation room
'conversation:leave'         // Leave conversation room

// Server → Client
'message:new'                // New message received
'message:typing'             // Other user is typing
'message:delivered'          // Message delivered confirmation
'message:read-receipt'       // Message read by recipient
```

---

## 10. Background Job Processing

### 10.1 Job Queue Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      JOB QUEUE ARCHITECTURE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

         Service triggers job
                │
                ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                           BullMQ Queues                                       │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │   email    │  │   media    │  │   search   │  │notification│             │
│  │   queue    │  │   queue    │  │   queue    │  │   queue    │             │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘             │
└────────┼───────────────┼───────────────┼───────────────┼────────────────────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│    Email     │  │    Media     │  │   Search     │  │ Notification │
│  Processor   │  │  Processor   │  │  Processor   │  │  Processor   │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │                 │
       ▼                 ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   SMTP/SES   │  │    MinIO     │  │  Meilisearch │  │   Firebase   │
│   Provider   │  │  + FFmpeg    │  │    Index     │  │  Push / SMS  │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### 10.2 Job Types & Processors

```typescript
// EMAIL QUEUE
interface EmailJob {
  type: 'welcome' | 'lead-notification' | 'password-reset' | 'event-reminder';
  to: string;
  templateId: string;
  data: Record<string, any>;
}

@Processor('email')
export class EmailProcessor {
  @Process('welcome')
  async handleWelcomeEmail(job: Job<EmailJob>) {
    const { to, data } = job.data;
    await this.emailService.sendTemplate('welcome', to, data);
  }

  @Process('lead-notification')
  async handleLeadNotification(job: Job<EmailJob>) {
    // Send email to vendor about new lead
  }
}

// MEDIA QUEUE
interface MediaJob {
  type: 'thumbnail' | 'optimize' | 'transcode';
  sourceKey: string;
  destinationKey: string;
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  };
}

@Processor('media')
export class MediaProcessor {
  @Process('thumbnail')
  async generateThumbnail(job: Job<MediaJob>) {
    const { sourceKey, destinationKey, options } = job.data;
    // Download from MinIO → Process with Sharp → Upload thumbnail
  }

  @Process('transcode')
  async transcodeVideo(job: Job<MediaJob>) {
    // Download → FFmpeg transcode → Upload optimized video
  }
}

// SEARCH SYNC QUEUE
interface SearchSyncJob {
  type: 'index' | 'update' | 'delete' | 'bulk-reindex';
  index: 'vendors' | 'events' | 'blog_posts';
  documents?: any[];
  documentId?: string;
}

@Processor('search-sync')
export class SearchSyncProcessor {
  @Process('bulk-reindex')
  async bulkReindex(job: Job<SearchSyncJob>) {
    const { index } = job.data;
    // Fetch all documents from DB → Batch index to Meilisearch
  }
}

// NOTIFICATION QUEUE
interface NotificationJob {
  type: 'push' | 'sms' | 'in-app';
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Processor('notification')
export class NotificationProcessor {
  @Process('push')
  async sendPushNotification(job: Job<NotificationJob>) {
    // Send via Firebase Cloud Messaging
  }

  @Process('in-app')
  async createInAppNotification(job: Job<NotificationJob>) {
    // Save to notifications table + emit WebSocket event
  }
}
```

### 10.3 Job Scheduling Examples

```typescript
// Triggered by domain events
@OnEvent('lead.created')
async handleLeadCreated(event: LeadCreatedEvent) {
  // Immediate notification to vendor
  await this.notificationQueue.add('in-app', {
    userId: event.vendorUserId,
    title: 'New Lead Received',
    body: `${event.plannerName} is interested in your services`,
    data: { leadId: event.leadId }
  });

  // Email notification
  await this.emailQueue.add('lead-notification', {
    to: event.vendorEmail,
    templateId: 'new-lead',
    data: { ...event }
  });
}

// Triggered by file upload
async uploadPortfolioMedia(file: Express.Multer.File, vendorId: string) {
  // Upload original
  const key = await this.minioService.putObject('portfolios', file);

  // Queue thumbnail generation
  await this.mediaQueue.add('thumbnail', {
    sourceKey: key,
    destinationKey: key.replace('originals/', 'thumbnails/'),
    options: { width: 400, height: 300, quality: 80 }
  });

  return { url: this.cdnService.getUrl(key) };
}

// Scheduled jobs (cron)
@Cron('0 9 * * *') // Every day at 9 AM
async sendEventReminders() {
  const upcomingEvents = await this.eventService.findUpcoming(days: 7);

  for (const event of upcomingEvents) {
    await this.emailQueue.add('event-reminder', {
      to: event.user.email,
      templateId: 'event-reminder-7day',
      data: { eventName: event.name, eventDate: event.date }
    });
  }
}
```

---

## 11. Data Flow Diagrams

### 11.1 User Event Planning Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    USER EVENT PLANNING - COMPLETE FLOW                       │
└─────────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │    USER      │
                              │  (Planner)   │
                              └──────┬───────┘
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          │                          │                          │
          ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  Create Event   │      │  Browse Vendors │      │ Manage Planning │
│                 │      │                 │      │                 │
│ POST /events    │      │ GET /discovery  │      │ PUT /checklists │
│                 │      │ /vendors        │      │ PUT /guestlist  │
│                 │      │                 │      │ PUT /budget     │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ event.service   │      │vendor-profile   │      │ checklist.svc   │
│ .create()       │      │ .service.search │      │ guestlist.svc   │
│                 │      │                 │      │ budget.svc      │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│ Event saved     │      │ Meilisearch     │      │ Items updated   │
│ + Auto-create   │      │ query + filter  │      │ + Events emit   │
│ defaults        │      │                 │      │                 │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │                        ▼                        │
         │               ┌─────────────────┐               │
         │               │ User shortlists │               │
         │               │ vendor          │               │
         │               │                 │               │
         │               │ POST /event-    │               │
         │               │ vendors         │               │
         │               └────────┬────────┘               │
         │                        │                        │
         │                        ▼                        │
         │               ┌─────────────────┐               │
         │               │ User sends      │               │
         │               │ inquiry (Lead)  │               │
         │               │                 │               │
         │               │ POST /leads     │               │
         │               └────────┬────────┘               │
         │                        │                        │
         │                        ▼                        │
         │               ┌─────────────────┐               │
         │               │ lead.service    │               │
         │               │ .create()       │               │
         │               │                 │               │
         │               │ → Notify vendor │               │
         │               │ → WebSocket     │               │
         │               │ → Email queue   │               │
         │               └─────────────────┘               │
         │                                                 │
         └────────────────────────┬────────────────────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │ Event complete  │
                         │ workflow        │
                         │                 │
                         │ - Vendors hired │
                         │ - Guests RSVP'd │
                         │ - Budget tracked│
                         │ - Timeline set  │
                         └─────────────────┘
```

### 11.2 Operations Event Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  OPERATIONS TEAM - EVENT EXECUTION FLOW                      │
└─────────────────────────────────────────────────────────────────────────────┘

       ORIGIN A                                    ORIGIN B
  ┌─────────────────┐                       ┌─────────────────┐
  │  Digital Lead   │                       │  Direct Booking │
  │  (User inquiry) │                       │  (Walk-in/Call) │
  └────────┬────────┘                       └────────┬────────┘
           │                                         │
           ▼                                         ▼
  ┌─────────────────┐                       ┌─────────────────┐
  │ Lead in CRM     │                       │ Ops Admin       │
  │ (Sales gateway) │                       │ creates event   │
  └────────┬────────┘                       └────────┬────────┘
           │                                         │
           ▼                                         │
  ┌─────────────────┐                                │
  │ Ops Admin       │                                │
  │ converts lead   │                                │
  └────────┬────────┘                                │
           │                                         │
           └────────────────────┬────────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  ActiveEvent    │
                       │  Created        │
                       │  Status: NEW    │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Assign Ops      │
                       │ Manager         │
                       │ Status: ASSIGNED│
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Create Req.     │
                       │ Sheet           │
                       │ (List needed    │
                       │  vendors)       │
                       └────────┬────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
           ▼                    ▼                    ▼
  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
  │ Req: Photog.    │  │ Req: Decorator  │  │ Req: Caterer    │
  │                 │  │                 │  │                 │
  │ Source vendors  │  │ Source vendors  │  │ Source vendors  │
  │ Send agreements │  │ Send agreements │  │ Send agreements │
  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
           │                    │                    │
           └────────────────────┼────────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Vendors accept/ │
                       │ decline via     │
                       │ Business Portal │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ All Contracts   │
                       │ Locked          │
                       │ Invoices        │
                       │ Generated       │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Create Ops      │
                       │ Tasks           │
                       │ - Collections   │
                       │ - Setup         │
                       │ - Verification  │
                       └────────┬────────┘
                                │
           ┌────────────────────┼────────────────────┐
           │                    │                    │
           ▼                    ▼                    ▼
  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
  │ Assign to       │  │ Assign to       │  │ Assign to       │
  │ Ops Assistant   │  │ Ops Assistant   │  │ Vendor directly │
  │                 │  │                 │  │                 │
  │ Collect decor   │  │ Verify setup    │  │ Confirm arrival │
  │ items           │  │ at venue        │  │                 │
  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
           │                    │                    │
           ▼                    ▼                    ▼
  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
  │ Submit with     │  │ Submit with     │  │ Submit with     │
  │ photo proof     │  │ photo proof     │  │ confirmation    │
  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
           │                    │                    │
           └────────────────────┼────────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Manager reviews │
                       │ & approves      │
                       │ tasks           │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ EVENT DAY       │
                       │ Status:         │
                       │ EXECUTION       │
                       └────────┬────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Post-Event      │
                       │ - Final billing │
                       │ - Feedback      │
                       │ Status:         │
                       │ COMPLETED       │
                       └─────────────────┘
```

---

## 12. Cross-Cutting Concerns

### 12.1 Exception Handling

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EXCEPTION HANDLING FLOW                                │
└─────────────────────────────────────────────────────────────────────────────┘

         Exception thrown
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Exception Filters                                    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ PrismaExceptionFilter                                                │    │
│  │ - Catches Prisma client errors                                       │    │
│  │ - P2002 (Unique constraint) → 409 Conflict                          │    │
│  │ - P2025 (Record not found) → 404 Not Found                          │    │
│  │ - P2003 (Foreign key constraint) → 400 Bad Request                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                               │
│                              ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ HttpExceptionFilter                                                  │    │
│  │ - Catches all HTTP exceptions                                        │    │
│  │ - Formats consistent error response                                  │    │
│  │ - Logs error details                                                 │    │
│  │                                                                      │    │
│  │ Response format:                                                     │    │
│  │ {                                                                    │    │
│  │   statusCode: 400,                                                   │    │
│  │   message: "Validation failed",                                      │    │
│  │   error: "Bad Request",                                              │    │
│  │   timestamp: "2025-01-11T...",                                       │    │
│  │   path: "/api/user/events"                                           │    │
│  │ }                                                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Logging & Monitoring

```typescript
// LoggingInterceptor - Request/Response logging
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;
    const startTime = Date.now();

    // Log request
    this.logger.log({
      type: 'REQUEST',
      method,
      url,
      userId: user?.id,
      body: this.sanitize(body) // Remove sensitive data
    });

    return next.handle().pipe(
      tap((response) => {
        // Log response
        this.logger.log({
          type: 'RESPONSE',
          method,
          url,
          statusCode: context.switchToHttp().getResponse().statusCode,
          duration: `${Date.now() - startTime}ms`
        });
      }),
      catchError((error) => {
        // Log error
        this.logger.error({
          type: 'ERROR',
          method,
          url,
          error: error.message,
          stack: error.stack,
          duration: `${Date.now() - startTime}ms`
        });
        throw error;
      })
    );
  }
}
```

### 12.3 Validation Pipeline

```typescript
// Global validation pipe configuration
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Strip non-whitelisted properties
    forbidNonWhitelisted: true, // Throw error for extra properties
    transform: true,           // Auto-transform to DTO class
    transformOptions: {
      enableImplicitConversion: true // Convert types automatically
    },
    exceptionFactory: (errors) => {
      // Custom error formatting
      const messages = errors.map(error => ({
        field: error.property,
        errors: Object.values(error.constraints || {})
      }));
      return new BadRequestException({
        message: 'Validation failed',
        errors: messages
      });
    }
  })
);

// Example DTO with validation
export class CreateEventDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @IsUUID()
  eventTypeId: string;

  @IsOptional()
  @IsDateString()
  @MinDate(new Date())
  date?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  guestCount?: number;
}
```

---

## 13. Module Dependency Map

### 13.1 Complete Module Import Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       MODULE DEPENDENCY GRAPH                                │
└─────────────────────────────────────────────────────────────────────────────┘

                              AppModule
                                  │
    ┌─────────────────────────────┼─────────────────────────────┐
    │                             │                             │
    ▼                             ▼                             ▼
┌─────────┐               ┌─────────────┐              ┌──────────────┐
│ Config  │               │    Core     │              │Infrastructure│
│ Module  │               │   Modules   │              │   Modules    │
└─────────┘               └──────┬──────┘              └──────┬───────┘
                                 │                            │
         ┌───────────────────────┼─────────────────────┐      │
         │           │           │          │          │      │
         ▼           ▼           ▼          ▼          ▼      │
    ┌────────┐ ┌─────────┐ ┌─────────┐ ┌────────┐ ┌────────┐  │
    │  Auth  │ │ Common  │ │Database │ │ Events │ │ Lookup │  │
    │ Module │ │ Module  │ │ Module  │ │ Module │ │ Module │  │
    └───┬────┘ └────┬────┘ └────┬────┘ └───┬────┘ └───┬────┘  │
        │          │           │          │          │       │
        │          │           │          │          │       │
        └──────────┴───────────┴──────────┴──────────┴───────┘
                                    │
                          ┌────────┴────────┐
                          │                 │
                          ▼                 ▼
                   ┌─────────────┐   ┌──────────────┐
                   │   Domain    │   │     API      │
                   │   Modules   │   │   Gateways   │
                   └──────┬──────┘   └──────┬───────┘
                          │                 │
    ┌─────────────────────┼─────────────────┼─────────────────────────────┐
    │         │           │          │      │          │          │       │
    ▼         ▼           ▼          ▼      ▼          ▼          ▼       ▼
┌────────┐┌────────┐┌─────────┐┌─────────┐┌─────────┐┌─────────┐┌────────┐┌─────────┐
│Catalog ││ Leads  ││Planning ││Operations││ Content ││  Admin  ││  User  ││Business │
│ Module ││ Module ││ Module  ││  Module  ││ Module  ││ Gateway ││Gateway ││ Gateway │
└────────┘└────────┘└─────────┘└─────────┘└─────────┘└─────────┘└────────┘└─────────┘
     │         │          │          │         │
     └─────────┴──────────┴──────────┴─────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │ Infrastructure Layer  │
              │                       │
              │ ┌───────┐ ┌────────┐  │
              │ │ Cache │ │  Jobs  │  │
              │ └───────┘ └────────┘  │
              │ ┌───────┐ ┌────────┐  │
              │ │Search │ │Storage │  │
              │ └───────┘ └────────┘  │
              │ ┌───────────────────┐ │
              │ │    WebSockets     │ │
              │ └───────────────────┘ │
              └───────────────────────┘
```

### 13.2 Service Dependency Injection

```typescript
// Example: PlanningModule showing internal dependencies

@Module({
  imports: [
    DatabaseModule,        // PrismaService
    EventsModule,          // EventEmitter2
    CacheModule,           // DragonflyService
    SearchModule,          // MeilisearchService
    StorageModule,         // MinioService, UploadService
    NotificationsModule,   // EmailService
    JobsModule,            // Queue injection
  ],
  providers: [
    // Repositories (data access)
    EventRepository,
    ChecklistRepository,
    GuestlistRepository,
    BudgetRepository,
    TimelineRepository,
    WishlistRepository,
    EventVendorRepository,

    // Services (business logic)
    EventService,
    ChecklistService,
    ChecklistItemService,
    GuestlistService,
    GuestService,
    BudgetService,
    BudgetItemService,
    TimelineService,
    WishlistService,
    EventVendorService,
    EventMemoryService,

    // Event listeners
    EventListener,
  ],
  exports: [
    // Export services for use in gateway controllers
    EventService,
    ChecklistService,
    GuestlistService,
    BudgetService,
    TimelineService,
    WishlistService,
    EventVendorService,
    EventMemoryService,
  ],
})
export class PlanningModule {}

// Gateway Module importing domain modules

@Module({
  imports: [
    AuthModule,           // Guards, decorators
    PlanningModule,       // Planning services
    CatalogModule,        // Catalog services (for discovery)
    LeadsModule,          // Lead services (for interactions)
  ],
  controllers: [
    EventsController,
    ChecklistsController,
    GuestlistController,
    BudgetController,
    TimelineController,
    WishlistsController,
    MemoriesController,
    EventVendorsController,
    DiscoveryController,
    InteractionsController,
    AccountController,
  ],
})
export class UserGatewayModule {}
```

---

## Quick Reference

### API Endpoint Patterns

| Pattern | Example | Description |
|---------|---------|-------------|
| `GET /api/{gateway}/{resource}` | `GET /api/user/events` | List resources |
| `GET /api/{gateway}/{resource}/:id` | `GET /api/user/events/123` | Get single resource |
| `POST /api/{gateway}/{resource}` | `POST /api/user/events` | Create resource |
| `PUT /api/{gateway}/{resource}/:id` | `PUT /api/user/events/123` | Full update |
| `PATCH /api/{gateway}/{resource}/:id` | `PATCH /api/user/events/123` | Partial update |
| `DELETE /api/{gateway}/{resource}/:id` | `DELETE /api/user/events/123` | Delete resource |

### Event Naming Convention

```
{domain}.{entity}.{action}

Examples:
- event.created
- event.updated
- checklist.item-completed
- lead.status-changed
- vendor.profile-updated
- agreement.accepted
- task.submitted
```

### Cache Key Patterns

```
{entity}:{id}                    → Single entity
{entity}:{id}:{relation}         → Entity with relation
{context}:{filter}:p{page}       → Paginated list
lookup:{type}                    → Reference data
session:{id}                     → Session data
```

---

## Summary

This backend follows a **layered architecture** with clear separation of concerns:

1. **API Gateways** - Route requests to appropriate domain services based on user role
2. **Core Modules** - Provide cross-cutting functionality (auth, database, events)
3. **Domain Modules** - Encapsulate business logic by bounded context
4. **Infrastructure Modules** - Handle technical concerns (cache, search, storage, queues)

**Key Patterns Used:**
- Gateway Pattern for API segmentation
- Repository Pattern for data access
- Event-Driven Architecture for async operations
- Guard Chain for authentication/authorization
- Interceptor Pattern for cross-cutting concerns
- Strategy Pattern for caching and auth mechanisms

**Trigger Points:**
- HTTP Requests → Controllers → Services → Repositories → Database
- Domain Events → Event Listeners → Async Handlers → Infrastructure Services
- Scheduled Jobs → Cron Triggers → Job Processors → External Services
- WebSocket Connections → Gateway Events → Real-time Push

This architecture supports the target scale of 100k+ DAU through caching, async processing, and the ability to extract microservices when needed.
