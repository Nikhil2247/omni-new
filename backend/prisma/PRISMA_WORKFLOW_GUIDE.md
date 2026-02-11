# Omnicassion V2.0 - Prisma Schema Workflow Guide

> A comprehensive guide explaining how all database models connect and work together with real-life examples.

---

## Table of Contents

1. [Schema Overview](#1-schema-overview)
2. [Entity Relationship Diagram](#2-entity-relationship-diagram)
3. [Public Schema - Identity & RBAC](#3-public-schema---identity--rbac)
4. [Catalog Schema - Vendor Marketplace](#4-catalog-schema---vendor-marketplace)
5. [Interaction Schema - Lead Management](#5-interaction-schema---lead-management)
6. [Planning Schema - User Event Planning](#6-planning-schema---user-event-planning)
7. [Operations Schema - Internal Operations](#7-operations-schema---internal-operations)
8. [Content Schema - Blog & SEO](#8-content-schema---blog--seo)
9. [Complete User Journeys](#9-complete-user-journeys)
10. [Model Quick Reference](#10-model-quick-reference)

---

## 1. Schema Overview

The Omnicassion database is organized into **6 PostgreSQL schemas**, each handling a specific domain:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   PUBLIC     │    │   CATALOG    │    │ INTERACTION  │                   │
│  │              │    │              │    │              │                   │
│  │ • User       │───▶│ • Category   │───▶│ • Lead       │                   │
│  │ • Role       │    │ • Vendor     │    │ • Message    │                   │
│  │ • Address    │    │ • Service    │    │              │                   │
│  │ • Location   │    │ • Portfolio  │    │              │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│         │                   │                   │                            │
│         │                   │                   │                            │
│         ▼                   ▼                   ▼                            │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   PLANNING   │    │  OPERATIONS  │    │   CONTENT    │                   │
│  │              │    │              │    │              │                   │
│  │ • Event      │───▶│ • ActiveEvent│    │ • BlogPost   │                   │
│  │ • Checklist  │    │ • VendorKYC  │    │ • BlogTag    │                   │
│  │ • Guestlist  │    │ • Agreement  │    │              │                   │
│  │ • Budget     │    │ • Task       │    │              │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Entity Relationship Diagram

### 2.1 Core Relationships Overview

```
                                    ┌─────────────┐
                                    │    User     │
                                    │  (public)   │
                                    └──────┬──────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              │                            │                            │
              ▼                            ▼                            ▼
     ┌────────────────┐          ┌────────────────┐          ┌────────────────┐
     │ UserRoleAssign │          │ VendorProfile  │          │     Event      │
     │   (public)     │          │   (catalog)    │          │   (planning)   │
     └────────────────┘          └───────┬────────┘          └───────┬────────┘
                                         │                           │
         ┌───────────────────────────────┼───────────────────────────┤
         │              │                │               │           │
         ▼              ▼                ▼               ▼           ▼
   ┌──────────┐  ┌──────────┐    ┌──────────┐    ┌──────────┐ ┌──────────┐
   │ Portfolio│  │ Service  │    │   Lead   │    │ Checklist│ │ Guestlist│
   │(catalog) │  │(catalog) │    │(interact)│    │(planning)│ │(planning)│
   └──────────┘  └──────────┘    └──────────┘    └──────────┘ └──────────┘
```

---

## 3. Public Schema - Identity & RBAC

### 3.1 User Model

**Purpose:** Core user account for everyone on the platform.

**Real-Life Example:**
> Sarah signs up to plan her wedding. She becomes a `User` with status `PENDING`. After email verification, her status changes to `ACTIVE`. Later, she also registers as a vendor (photographer), getting a `VendorProfile` linked to her user.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER MODEL                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User                                                                        │
│  ├── id: uuid                                                                │
│  ├── email: "sarah@example.com"                                              │
│  ├── firstName: "Sarah"                                                      │
│  ├── lastName: "Johnson"                                                     │
│  ├── status: ACTIVE                                                          │
│  │                                                                           │
│  │   RELATIONS                                                               │
│  ├──────────────────────────────────────────────────────────────────────────┤
│  │                                                                           │
│  ├── userRoles[]      → What permissions does Sarah have?                   │
│  │   └── UserRoleAssignment { role: "PLANNER" }                             │
│  │   └── UserRoleAssignment { role: "VENDOR" }                              │
│  │                                                                           │
│  ├── vendorProfile?   → Sarah's photography business                        │
│  │   └── VendorProfile { businessName: "Sarah's Photography" }              │
│  │                                                                           │
│  ├── events[]         → Events Sarah is planning                            │
│  │   └── Event { name: "My Wedding" }                                       │
│  │                                                                           │
│  ├── leads[]          → Inquiries Sarah sent to vendors                     │
│  │   └── Lead { vendor: "Elegant Catering", status: "NEW" }                 │
│  │                                                                           │
│  └── sessions[]       → Active login sessions                               │
│      └── UserSession { device: "iPhone 15", ip: "192.168.1.1" }             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Role Hierarchy

**Real-Life Example:**
> The company has different staff roles. An `OPS_ADMIN` can access everything an `OPS_MANAGER` can, plus additional admin features. The role hierarchy ensures proper permission inheritance.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ROLE HIERARCHY                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                        ADMIN_SYSTEM (Level 100)                              │
│                               │                                              │
│                 ┌─────────────┼─────────────┐                               │
│                 │             │             │                               │
│                 ▼             ▼             ▼                               │
│          OPS_ADMIN      MARKETING_ADMIN  SALES_ADMIN                        │
│          (Level 70)      (Level 70)      (Level 70)                         │
│                │                                                             │
│                ▼                                                             │
│          OPS_MANAGER                                                         │
│          (Level 60)                                                          │
│                │                                                             │
│                ▼                                                             │
│          OPS_ASSISTANT                                                       │
│          (Level 50)                                                          │
│                                                                              │
│  ────────────────────────────────────────────────────────────────────────   │
│                                                                              │
│          VENDOR / BUSINESS_ADMIN (Level 30)                                  │
│                                                                              │
│          PLANNER / USER (Level 10)                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 Location Models

**Purpose:** Normalized address system for vendors and events.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOCATION HIERARCHY                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Country                                                                     │
│  └── name: "United States", code: "USA", code2: "US"                        │
│      │                                                                       │
│      └── State[]                                                             │
│          └── name: "California", code: "CA"                                  │
│              │                                                               │
│              └── City[]                                                      │
│                  └── name: "Los Angeles"                                     │
│                      │                                                       │
│                      └── Address[]                                           │
│                          └── addressLine1: "123 Wedding Blvd"                │
│                              postalCode: "90001"                             │
│                              latitude: 34.0522                               │
│                              longitude: -118.2437                            │
│                                                                              │
│  USED BY:                                                                    │
│  • VendorProfile.addressId → Where is the vendor located?                   │
│  • Event.addressId → Where is the event happening?                          │
│  • ServiceArea.cityId → Which cities does vendor serve?                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Catalog Schema - Vendor Marketplace

### 4.1 Category & ServiceType

**Real-Life Example:**
> "Photography" is a Category. Under it, there are ServiceTypes like "Wedding Photography", "Portrait Photography", "Event Coverage". Vendors select their category and offer services matching these types.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CATEGORY → SERVICE TYPE HIERARCHY                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Category: "Photography"                                                     │
│  ├── slug: "photography"                                                     │
│  ├── icon: "camera"                                                          │
│  │                                                                           │
│  └── serviceTypes[]                                                          │
│      ├── ServiceType: "Wedding Photography"                                  │
│      ├── ServiceType: "Portrait Photography"                                 │
│      ├── ServiceType: "Event Coverage"                                       │
│      └── ServiceType: "Product Photography"                                  │
│                                                                              │
│  Category: "Catering"                                                        │
│  ├── slug: "catering"                                                        │
│  │                                                                           │
│  └── serviceTypes[]                                                          │
│      ├── ServiceType: "Full-Service Catering"                                │
│      ├── ServiceType: "Buffet Style"                                         │
│      └── ServiceType: "Dessert & Cake"                                       │
│                                                                              │
│  Subcategories (self-referencing):                                           │
│  Category: "Venues"                                                          │
│  └── children[]                                                              │
│      ├── Category: "Indoor Venues"                                           │
│      ├── Category: "Outdoor Venues"                                          │
│      └── Category: "Beach Venues"                                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 VendorProfile & Related Models

**Real-Life Example:**
> John owns "Elegant Moments Photography". He creates a VendorProfile, adds his business hours, uploads portfolio photos, lists his services with pricing, and specifies he serves Los Angeles and surrounding cities.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     VENDOR PROFILE - COMPLETE PICTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  VendorProfile                                                               │
│  ├── businessName: "Elegant Moments Photography"                             │
│  ├── slug: "elegant-moments-photography"                                     │
│  ├── tagline: "Capturing your special moments"                               │
│  ├── status: ACTIVE                                                          │
│  ├── leadCount: 47                                                           │
│  ├── viewCount: 1,234                                                        │
│  │                                                                           │
│  ├── user ──────────────────────────────────────────────────────────────────┤
│  │   └── User { email: "john@elegantmoments.com" }                          │
│  │                                                                           │
│  ├── category ──────────────────────────────────────────────────────────────┤
│  │   └── Category { name: "Photography" }                                   │
│  │                                                                           │
│  ├── address ───────────────────────────────────────────────────────────────┤
│  │   └── Address { city: "Los Angeles", state: "CA" }                       │
│  │                                                                           │
│  ├── businessHours[] ───────────────────────────────────────────────────────┤
│  │   ├── { dayOfWeek: 1, openTime: "09:00", closeTime: "18:00" }  Mon       │
│  │   ├── { dayOfWeek: 2, openTime: "09:00", closeTime: "18:00" }  Tue       │
│  │   └── { dayOfWeek: 0, isClosed: true }                          Sun      │
│  │                                                                           │
│  ├── portfolios[] ──────────────────────────────────────────────────────────┤
│  │   └── Portfolio: "Wedding Gallery"                                       │
│  │       └── mediaItems[]                                                    │
│  │           ├── MediaItem { url: "wedding1.jpg", type: IMAGE }             │
│  │           ├── MediaItem { url: "wedding2.jpg", type: IMAGE }             │
│  │           └── MediaItem { url: "highlights.mp4", type: VIDEO }           │
│  │                                                                           │
│  ├── services[] ────────────────────────────────────────────────────────────┤
│  │   └── Service: "Full Day Wedding Coverage"                               │
│  │       ├── pricingType: TIERED                                             │
│  │       └── pricingTiers[]                                                  │
│  │           ├── PricingTier { name: "Basic", price: $2,500 }               │
│  │           ├── PricingTier { name: "Premium", price: $4,500 }             │
│  │           └── PricingTier { name: "Platinum", price: $7,500 }            │
│  │                                                                           │
│  ├── tags[] ────────────────────────────────────────────────────────────────┤
│  │   ├── VendorTag → Tag { name: "outdoor-weddings" }                       │
│  │   ├── VendorTag → Tag { name: "candid-photography" }                     │
│  │   └── VendorTag → Tag { name: "drone-shots" }                            │
│  │                                                                           │
│  ├── serviceAreas[] ────────────────────────────────────────────────────────┤
│  │   ├── ServiceArea { city: "Los Angeles", additionalFee: null }           │
│  │   ├── ServiceArea { city: "Santa Monica", additionalFee: null }          │
│  │   └── ServiceArea { city: "San Diego", additionalFee: $200 }             │
│  │                                                                           │
│  ├── leads[] ───────────────────────────────────────────────────────────────┤
│  │   └── Lead { planner: "Sarah", status: NEW }                             │
│  │                                                                           │
│  └── kyc ───────────────────────────────────────────────────────────────────┤
│      └── VendorKYC { status: APPROVED, legalName: "John Smith Photography" }│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Service & Pricing Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SERVICE PRICING WORKFLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PRICING TYPES:                                                              │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ FIXED                                                                 │   │
│  │ "Passport Photos - $50"                                               │   │
│  │ → Single price, no tiers needed                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ RANGE                                                                 │   │
│  │ "Wedding Photography - $2,000 - $8,000"                               │   │
│  │ → Shows price range, details on contact                               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ STARTING_AT                                                           │   │
│  │ "Event Coverage - Starting at $500"                                   │   │
│  │ → Shows minimum price                                                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ TIERED                                                                │   │
│  │ "Full Day Coverage"                                                   │   │
│  │ ├── Basic Package: $2,500 (6 hours)                                   │   │
│  │ ├── Premium Package: $4,500 (10 hours + album)                        │   │
│  │ └── Platinum Package: $7,500 (full day + video)                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ CONTACT_FOR_QUOTE                                                     │   │
│  │ "Custom Event Package"                                                │   │
│  │ → No price shown, user must inquire                                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Interaction Schema - Lead Management

### 5.1 Lead Lifecycle

**Real-Life Example:**
> Sarah is planning her wedding and finds "Elegant Moments Photography" on the platform. She clicks "Get Quote" and fills out details about her wedding date, guest count, and budget. This creates a Lead. John (the vendor) receives a notification, responds, and the lead status changes. Eventually, Sarah books John, and the lead is marked as WON.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LEAD LIFECYCLE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  USER ACTION                        LEAD STATUS                              │
│  ──────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  Sarah clicks "Get Quote"     →     NEW                                      │
│  on vendor profile                  │                                        │
│                                     │ (Vendor sees in dashboard)             │
│                                     ▼                                        │
│  John reads & responds        →     CONTACTED                                │
│  to Sarah's inquiry                 │                                        │
│                                     │ (Conversation started)                 │
│                                     ▼                                        │
│  John qualifies Sarah         →     QUALIFIED                                │
│  (budget, date works)               │                                        │
│                                     │                                        │
│                                     ▼                                        │
│  John sends quote/proposal    →     PROPOSAL_SENT                            │
│                                     │                                        │
│                                     ├────────────────┐                       │
│                                     ▼                ▼                       │
│  Sarah negotiates             →  NEGOTIATING    Sarah declines               │
│                                     │                │                       │
│                                     │                ▼                       │
│                                     │              LOST                      │
│                                     ▼                                        │
│  Sarah books John!            →     WON                                      │
│                                                                              │
│                                                                              │
│  DATA FLOW:                                                                  │
│  ──────────────────────────────────────────────────────────────────────────  │
│                                                                              │
│  Lead                                                                        │
│  ├── vendorProfile → "Elegant Moments Photography"                          │
│  ├── planner → User { Sarah }                                               │
│  ├── event → Event { "Sarah's Wedding" }  (optional link)                   │
│  ├── eventDate: "2025-06-15"                                                 │
│  ├── eventType: "Wedding"                                                    │
│  ├── guestCount: 150                                                         │
│  ├── budget: $5,000                                                          │
│  ├── initialMessage: "Hi, I love your portfolio..."                         │
│  │                                                                           │
│  ├── messages[]                                                              │
│  │   ├── Message { sender: Sarah, content: "Hi, I love..." }                │
│  │   ├── Message { sender: John, content: "Thank you! I'd love..." }        │
│  │   └── Message { sender: Sarah, content: "Great! Can we discuss..." }     │
│  │                                                                           │
│  └── statusHistory[]                                                         │
│      ├── LeadStatusHistory { from: null, to: NEW }                          │
│      ├── LeadStatusHistory { from: NEW, to: CONTACTED }                     │
│      └── LeadStatusHistory { from: CONTACTED, to: WON }                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Planning Schema - User Event Planning

### 6.1 Event & Planning Tools

**Real-Life Example:**
> Sarah creates her wedding event. The system automatically creates a default Checklist, Guestlist, and Budget. She adds vendors to her shortlist, manages her guest RSVPs, and tracks expenses.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       EVENT & PLANNING ECOSYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Event: "Sarah & Mike's Wedding"                                             │
│  ├── eventType → EventType { name: "Wedding" }                              │
│  ├── date: "2025-06-15"                                                      │
│  ├── venueName: "Sunset Gardens"                                             │
│  ├── guestCount: 150                                                         │
│  ├── status: PLANNING                                                        │
│  │                                                                           │
│  │  ┌─────────────────────────────────────────────────────────────────┐     │
│  │  │                        CHECKLISTS                                │     │
│  │  ├─────────────────────────────────────────────────────────────────┤     │
│  │  │                                                                  │     │
│  │  │  Checklist: "Venue & Catering"                                   │     │
│  │  │  ├── ChecklistItem: "Book venue" ✓ COMPLETED                     │     │
│  │  │  ├── ChecklistItem: "Finalize menu" □ due: 2025-03-01            │     │
│  │  │  └── ChecklistItem: "Cake tasting" □ due: 2025-04-15             │     │
│  │  │                                                                  │     │
│  │  │  Checklist: "Photography & Video"                                │     │
│  │  │  ├── ChecklistItem: "Book photographer" ✓ COMPLETED              │     │
│  │  │  ├── ChecklistItem: "Engagement shoot" □ due: 2025-02-20         │     │
│  │  │  └── ChecklistItem: "Shot list discussion" □                     │     │
│  │  │                                                                  │     │
│  │  └─────────────────────────────────────────────────────────────────┘     │
│  │                                                                           │
│  │  ┌─────────────────────────────────────────────────────────────────┐     │
│  │  │                        GUESTLIST                                 │     │
│  │  ├─────────────────────────────────────────────────────────────────┤     │
│  │  │                                                                  │     │
│  │  │  Guestlist (1 per event)                                         │     │
│  │  │  └── guests[]                                                    │     │
│  │  │      ├── Guest: "John Smith" - ATTENDING, +1, Table 5            │     │
│  │  │      ├── Guest: "Jane Doe" - ATTENDING, Vegetarian               │     │
│  │  │      ├── Guest: "Bob Wilson" - PENDING, +2                       │     │
│  │  │      └── Guest: "Alice Brown" - NOT_ATTENDING                    │     │
│  │  │                                                                  │     │
│  │  │  Summary: 87 Attending, 12 Pending, 8 Declined                   │     │
│  │  │                                                                  │     │
│  │  └─────────────────────────────────────────────────────────────────┘     │
│  │                                                                           │
│  │  ┌─────────────────────────────────────────────────────────────────┐     │
│  │  │                          BUDGET                                  │     │
│  │  ├─────────────────────────────────────────────────────────────────┤     │
│  │  │                                                                  │     │
│  │  │  Budget (1 per event)                                            │     │
│  │  │  ├── totalBudget: $35,000                                        │     │
│  │  │  └── items[]                                                     │     │
│  │  │      ├── BudgetItem: "Venue" - Est: $8,000, Actual: $7,500 ✓    │     │
│  │  │      ├── BudgetItem: "Catering" - Est: $12,000, Actual: -        │     │
│  │  │      ├── BudgetItem: "Photography" - Est: $4,500, Actual: $4,500 ✓│    │
│  │  │      ├── BudgetItem: "Flowers" - Est: $2,500, Actual: -          │     │
│  │  │      └── BudgetItem: "DJ" - Est: $1,500, Actual: $1,200 ✓       │     │
│  │  │                                                                  │     │
│  │  │  Total Spent: $13,200 / $35,000 (37.7%)                          │     │
│  │  │                                                                  │     │
│  │  └─────────────────────────────────────────────────────────────────┘     │
│  │                                                                           │
│  │  ┌─────────────────────────────────────────────────────────────────┐     │
│  │  │                       EVENT VENDORS                              │     │
│  │  ├─────────────────────────────────────────────────────────────────┤     │
│  │  │                                                                  │     │
│  │  │  EventVendor: Elegant Moments Photography                        │     │
│  │  │  ├── status: BOOKED                                              │     │
│  │  │  ├── contractAmount: $4,500                                      │     │
│  │  │  └── depositPaid: $1,500                                         │     │
│  │  │                                                                  │     │
│  │  │  EventVendor: Sunset Catering                                    │     │
│  │  │  ├── status: CONTACTED (inquiry sent)                            │     │
│  │  │  └── notes: "Waiting for menu options"                           │     │
│  │  │                                                                  │     │
│  │  │  EventVendor: Bloom Florists                                     │     │
│  │  │  └── status: SHORTLISTED                                         │     │
│  │  │                                                                  │     │
│  │  └─────────────────────────────────────────────────────────────────┘     │
│  │                                                                           │
│  │  ┌─────────────────────────────────────────────────────────────────┐     │
│  │  │                        TIMELINE                                  │     │
│  │  ├─────────────────────────────────────────────────────────────────┤     │
│  │  │                                                                  │     │
│  │  │  Timeline: "Wedding Day Schedule"                                │     │
│  │  │  ├── 10:00 AM - Bride prep starts (Hair & Makeup)                │     │
│  │  │  ├── 02:00 PM - First look photos                                │     │
│  │  │  ├── 04:00 PM - Ceremony begins                                  │     │
│  │  │  ├── 05:00 PM - Cocktail hour                                    │     │
│  │  │  ├── 06:00 PM - Reception & dinner                               │     │
│  │  │  └── 11:00 PM - Last dance & departure                           │     │
│  │  │                                                                  │     │
│  │  └─────────────────────────────────────────────────────────────────┘     │
│  │                                                                           │
│  └── eventMemory ───────────────────────────────────────────────────────────┤
│      └── EventMemory { qrCode: "ABC123", allowUploads: true }               │
│          └── uploads[]                                                       │
│              ├── GuestUpload { uploaderName: "Uncle Bob", type: IMAGE }     │
│              └── GuestUpload { uploaderName: "Aunt Mary", type: VIDEO }     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Wishlist Feature

**Real-Life Example:**
> Before making final decisions, Sarah saves vendors she likes to wishlists. She has boards like "Top Photographers", "Backup Caterers", etc.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            WISHLISTS                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User: Sarah                                                                 │
│  └── wishlists[]                                                             │
│                                                                              │
│      Wishlist: "Top Photographers" ⭐ (default)                              │
│      ├── WishlistItem → "Elegant Moments Photography"                       │
│      │   └── notes: "Love their candid style"                               │
│      ├── WishlistItem → "Captured Dreams Studio"                            │
│      │   └── notes: "Great drone shots"                                     │
│      └── WishlistItem → "Timeless Photos Co"                                │
│                                                                              │
│      Wishlist: "Backup Caterers"                                             │
│      ├── WishlistItem → "Gourmet Delights"                                  │
│      └── WishlistItem → "Farm to Table Catering"                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6.3 Event Memory (Guest Photo Upload)

**Real-Life Example:**
> At the wedding, a QR code is displayed. Guests scan it with their phones and can upload photos/videos without needing to log in. The couple can review and approve uploads to their wedding gallery.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      EVENT MEMORY - GUEST UPLOAD FLOW                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                           ┌──────────────┐                                   │
│                           │    QR CODE   │                                   │
│                           │   [ABC123]   │                                   │
│                           └──────┬───────┘                                   │
│                                  │                                           │
│                    Guest scans with phone                                    │
│                                  │                                           │
│                                  ▼                                           │
│                     ┌────────────────────────┐                               │
│                     │  Upload Portal (Public)│                               │
│                     │  No login required     │                               │
│                     │                        │                               │
│                     │  Name: Uncle Bob       │                               │
│                     │  Photo: [wedding.jpg]  │                               │
│                     │  Caption: "Beautiful!" │                               │
│                     └───────────┬────────────┘                               │
│                                 │                                            │
│                                 ▼                                            │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                          GuestUpload                                   │  │
│  │  ├── eventMemoryId → EventMemory (links to Event)                     │  │
│  │  ├── uploaderName: "Uncle Bob"                                        │  │
│  │  ├── uploaderEmail: null (optional)                                   │  │
│  │  ├── mediaUrl: "s3://bucket/uploads/wedding123.jpg"                   │  │
│  │  ├── mediaType: IMAGE                                                 │  │
│  │  ├── caption: "Beautiful ceremony!"                                   │  │
│  │  └── status: PENDING (if requireApproval=true) or APPROVED            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                 │                                            │
│                    If moderation enabled                                     │
│                                 │                                            │
│                                 ▼                                            │
│                     ┌────────────────────────┐                               │
│                     │  Couple reviews in app │                               │
│                     │  ✓ Approve │ ✗ Reject  │                               │
│                     └────────────────────────┘                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Operations Schema - Internal Operations

### 7.1 Vendor KYC (Know Your Customer)

**Real-Life Example:**
> John (photographer) wants to receive payments through the platform. He must complete KYC verification by uploading his business license, tax certificate, and ID. The ops team reviews and approves.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KYC VERIFICATION FLOW                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  VendorProfile: "Elegant Moments Photography"                                │
│        │                                                                     │
│        └── kyc                                                               │
│            │                                                                 │
│            ▼                                                                 │
│  VendorKYC                                                                   │
│  ├── legalName: "John Smith Photography LLC"                                 │
│  ├── businessType: "LLC"                                                     │
│  ├── taxId: "XX-XXXXXXX"                                                     │
│  ├── status: UNDER_REVIEW                                                    │
│  │                                                                           │
│  └── documents[]                                                             │
│      ├── KYCDocument                                                         │
│      │   ├── type: BUSINESS_LICENSE                                          │
│      │   ├── url: "s3://kyc/license.pdf"                                     │
│      │   └── status: VERIFIED ✓                                              │
│      │                                                                       │
│      ├── KYCDocument                                                         │
│      │   ├── type: TAX_CERTIFICATE                                           │
│      │   ├── url: "s3://kyc/tax.pdf"                                         │
│      │   └── status: VERIFIED ✓                                              │
│      │                                                                       │
│      └── KYCDocument                                                         │
│          ├── type: ID_DOCUMENT                                               │
│          ├── url: "s3://kyc/id.pdf"                                          │
│          └── status: PENDING (under review)                                  │
│                                                                              │
│  STATUS FLOW:                                                                │
│  PENDING → SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Dispute Management

**Real-Life Example:**
> A customer complains that a vendor didn't show up to their event. An ops staff member creates a Dispute, investigates, and resolves it.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DISPUTE LIFECYCLE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Dispute                                                                     │
│  ├── vendorProfileId → "XYZ Catering"                                       │
│  ├── reporterId → User { "Sarah" }                                          │
│  ├── type: NO_SHOW                                                           │
│  ├── description: "Caterer did not show up to my wedding..."                │
│  ├── status: OPEN → INVESTIGATING → RESOLVED                                │
│  ├── resolution: "Full refund issued. Vendor suspended."                    │
│  └── resolvedBy → User { "Ops Admin Mike" }                                 │
│                                                                              │
│  DISPUTE TYPES:                                                              │
│  • SERVICE_QUALITY - Service not as described                               │
│  • PRICING - Billing/pricing issues                                         │
│  • NO_SHOW - Vendor didn't show up                                          │
│  • HARASSMENT - Inappropriate behavior                                      │
│  • FRAUD - Fraudulent activity                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.3 Operational Event Workflow (Dual-Origin)

**Real-Life Example:**
> **Origin A:** Sarah browsed the website, clicked "Get Quote" → Lead created → Ops Admin converts to ActiveEvent.
> **Origin B:** VIP client calls the office → Ops Admin directly creates ActiveEvent without a digital lead.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    OPERATIONAL EVENT - DUAL ORIGIN                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│       ORIGIN A: Digital Lead                  ORIGIN B: Direct Booking       │
│       ────────────────────                    ─────────────────────────      │
│                                                                              │
│       User clicks "Get Quote"                 Walk-in / Phone call           │
│              │                                         │                     │
│              ▼                                         │                     │
│         Lead (CRM)                                     │                     │
│              │                                         │                     │
│              ▼                                         │                     │
│       Ops Admin sees lead                              │                     │
│       in dashboard                                     │                     │
│              │                                         │                     │
│              ▼                                         ▼                     │
│       ┌─────────────────────────────────────────────────────┐               │
│       │              Ops Admin converts/creates              │               │
│       └──────────────────────────┬──────────────────────────┘               │
│                                  │                                           │
│                                  ▼                                           │
│                       ┌───────────────────┐                                  │
│                       │    ActiveEvent    │                                  │
│                       │   status: NEW     │                                  │
│                       │   origin: *       │                                  │
│                       └─────────┬─────────┘                                  │
│                                 │                                            │
│                    Ops Admin assigns manager                                 │
│                                 │                                            │
│                                 ▼                                            │
│                       ┌───────────────────┐                                  │
│                       │    ActiveEvent    │                                  │
│                       │  status: ASSIGNED │                                  │
│                       │  opsManagerId: X  │                                  │
│                       └─────────┬─────────┘                                  │
│                                 │                                            │
│                    Manager creates requirements                              │
│                                 │                                            │
│                                 ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      RequirementSheet                                 │   │
│  │  └── items[]                                                          │   │
│  │      ├── RequirementItem: "1 Photographer" - status: PENDING          │   │
│  │      ├── RequirementItem: "1 Decorator" - status: PENDING             │   │
│  │      └── RequirementItem: "Catering for 150" - status: PENDING        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                 │                                            │
│                    Manager sources vendors                                   │
│                                 │                                            │
│                                 ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      VendorAgreement                                  │   │
│  │  ├── requirementItem → "1 Photographer"                               │   │
│  │  ├── vendorProfile → "Elegant Moments Photography"                    │   │
│  │  ├── agreedAmount: $4,500                                             │   │
│  │  ├── status: DRAFT → SENT → ACCEPTED → CONTRACT_LOCKED               │   │
│  │  │                                                                    │   │
│  │  └── invoice                                                          │   │
│  │      └── ProvisionalInvoice { amount: $4,500, status: PENDING }       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                 │                                            │
│                 All contracts locked                                         │
│                                 │                                            │
│                                 ▼                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     OperationalTask(s)                                │   │
│  │                                                                       │   │
│  │  Task: "Collect decoration items"                                     │   │
│  │  ├── assignedTo: Ops Assistant                                        │   │
│  │  ├── priority: HIGH                                                   │   │
│  │  ├── dueDate: 2025-06-14 (day before event)                           │   │
│  │  └── status: PENDING → ASSIGNED → SUBMITTED → APPROVED               │   │
│  │                                                                       │   │
│  │  Task: "Verify photographer arrival"                                  │   │
│  │  ├── assignedTo: Vendor (Elegant Moments)                             │   │
│  │  ├── priority: URGENT                                                 │   │
│  │  └── status: PENDING                                                  │   │
│  │                                                                       │   │
│  │  attachments[]                                                        │   │
│  │  └── TaskAttachment { type: IMAGE, url: "proof-photo.jpg" }           │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                 │                                            │
│                          EVENT DAY                                           │
│                                 │                                            │
│                                 ▼                                            │
│                       ┌───────────────────┐                                  │
│                       │    ActiveEvent    │                                  │
│                       │  status: COMPLETED│                                  │
│                       └───────────────────┘                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7.4 Operations Team Roles

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OPERATIONS TEAM ROLES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  OPS_ADMIN                                                                   │
│  ├── Creates ActiveEvents (from leads or direct)                            │
│  ├── Assigns Ops Managers to events                                         │
│  ├── Reviews KYC verifications                                              │
│  ├── Handles disputes                                                       │
│  └── Full visibility into all events                                        │
│                                                                              │
│  OPS_MANAGER                                                                 │
│  ├── Creates RequirementSheets for assigned events                          │
│  ├── Sources and negotiates with vendors                                    │
│  ├── Creates and manages VendorAgreements                                   │
│  ├── Assigns OperationalTasks to assistants/vendors                         │
│  ├── Reviews and approves task submissions                                  │
│  └── Manages event execution day-of                                         │
│                                                                              │
│  OPS_ASSISTANT                                                               │
│  ├── Executes assigned tasks (collection, setup, verification)              │
│  ├── Uploads proof photos/attachments                                       │
│  ├── Submits tasks for manager review                                       │
│  └── Limited to tasks assigned to them                                      │
│                                                                              │
│  BUSINESS_ADMIN (Vendor side)                                                │
│  ├── Receives VendorAgreements via business portal                          │
│  ├── Accepts/declines agreements                                            │
│  ├── Completes assigned tasks (if any)                                      │
│  └── Uploads proof of work                                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Content Schema - Blog & SEO

### 8.1 Blog Post Structure

**Real-Life Example:**
> The marketing team writes blog posts like "Top 10 Wedding Venues in Los Angeles" to drive organic traffic. Posts are categorized, tagged for SEO, and can spotlight vendors.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BLOG POST STRUCTURE                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  BlogPost                                                                    │
│  ├── title: "Top 10 Wedding Photographers in Los Angeles"                   │
│  ├── slug: "top-10-wedding-photographers-los-angeles"                       │
│  ├── excerpt: "Discover the best wedding photographers..."                  │
│  ├── content: "<full markdown/html content>"                                │
│  │                                                                           │
│  │  SEO Fields                                                               │
│  ├── metaTitle: "Best LA Wedding Photographers 2025"                        │
│  ├── metaDescription: "Find the perfect photographer..."                    │
│  ├── focusKeyword: "wedding photographers los angeles"                      │
│  ├── keywords: ["wedding", "photography", "los angeles"]                    │
│  │                                                                           │
│  │  Media                                                                    │
│  ├── featuredImage: "https://cdn.../hero.jpg"                               │
│  ├── ogImage: "https://cdn.../social-share.jpg"                             │
│  │                                                                           │
│  │  Publishing                                                               │
│  ├── status: PUBLISHED                                                       │
│  ├── publishedAt: "2025-01-10"                                               │
│  ├── viewCount: 2,547                                                        │
│  ├── readingTime: 8 (minutes)                                                │
│  │                                                                           │
│  │  Relations                                                                │
│  ├── author → User { "Marketing Manager Sarah" }                            │
│  ├── category → BlogCategory { "Wedding Planning" }                         │
│  ├── tags[]                                                                  │
│  │   ├── BlogPostTag → BlogTag { "photography" }                            │
│  │   ├── BlogPostTag → BlogTag { "los-angeles" }                            │
│  │   └── BlogPostTag → BlogTag { "wedding-tips" }                           │
│  │                                                                           │
│  └── vendorId → VendorProfile { "Elegant Moments" }  (Vendor Spotlight)     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. Complete User Journeys

### 9.1 Journey: Planner Books a Vendor

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                   JOURNEY: PLANNER BOOKS A VENDOR                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Sarah signs up                                                           │
│     └── Creates: User (status: PENDING → ACTIVE after verification)         │
│                                                                              │
│  2. Sarah creates her wedding event                                          │
│     └── Creates: Event { name: "My Wedding", eventType: "Wedding" }         │
│     └── Auto-creates: Checklist (default), Guestlist, Budget                │
│                                                                              │
│  3. Sarah browses vendors                                                    │
│     └── Searches: VendorProfile (via Meilisearch)                           │
│     └── Filters by: Category, City, Tags, Price Range                       │
│                                                                              │
│  4. Sarah saves vendors to wishlist                                          │
│     └── Creates: WishlistItem → Wishlist → User                             │
│                                                                              │
│  5. Sarah sends inquiry to vendor                                            │
│     └── Creates: Lead { vendor: "X", planner: Sarah, event: "My Wedding" }  │
│     └── Creates: Message { "Hi, I'm interested..." }                        │
│                                                                              │
│  6. Vendor John responds                                                     │
│     └── Updates: Lead { status: NEW → CONTACTED }                           │
│     └── Creates: Message { "Thank you for reaching out..." }                │
│     └── Creates: LeadStatusHistory { from: NEW, to: CONTACTED }             │
│                                                                              │
│  7. John sends proposal                                                      │
│     └── Updates: Lead { status: PROPOSAL_SENT }                             │
│                                                                              │
│  8. Sarah books John                                                         │
│     └── Updates: Lead { status: WON }                                       │
│     └── Creates: EventVendor { event: "My Wedding", vendor: John,           │
│                                status: BOOKED, contractAmount: $4,500 }     │
│     └── Updates: BudgetItem { "Photography", actualCost: $4,500 }           │
│                                                                              │
│  9. Sarah manages her event                                                  │
│     └── Updates: ChecklistItem { "Book photographer", isCompleted: true }   │
│     └── Updates: Guest { rsvpStatus: ATTENDING }                            │
│     └── Creates: Timeline { "Wedding Day Schedule" }                        │
│                                                                              │
│  10. Event day - guests upload photos                                        │
│      └── GuestUpload → EventMemory → Event                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 Journey: Ops Team Executes Event

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  JOURNEY: OPS TEAM EXECUTES EVENT                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Lead comes in (or direct booking)                                        │
│     └── Lead { vendor: "platform", status: NEW }                            │
│     └── OR: Direct phone call to office                                     │
│                                                                              │
│  2. Ops Admin reviews and converts                                           │
│     └── Creates: ActiveEvent { origin: DIGITAL_LEAD or DIRECT_BOOKING }    │
│     └── Updates: Lead { status: WON, convertedAt: now }                     │
│     └── Creates: EventNote { "Converted from lead #123" }                   │
│                                                                              │
│  3. Ops Admin assigns manager                                                │
│     └── Updates: ActiveEvent { opsManagerId: "Mike", status: ASSIGNED }    │
│     └── Notification: Mike receives assignment via WebSocket                │
│                                                                              │
│  4. Manager creates requirements                                             │
│     └── Creates: RequirementSheet { activeEventId: X }                      │
│     └── Creates: RequirementItem { "1 Photographer", status: PENDING }      │
│     └── Creates: RequirementItem { "1 Decorator", status: PENDING }         │
│     └── Creates: RequirementItem { "Catering 150 pax", status: PENDING }    │
│     └── Updates: ActiveEvent { status: REQUIREMENTS_SET }                   │
│                                                                              │
│  5. Manager sources vendors                                                  │
│     └── Updates: RequirementItem { status: SOURCING }                       │
│     └── Contacts vendors, negotiates pricing                                │
│                                                                              │
│  6. Manager creates agreements                                               │
│     └── Creates: VendorAgreement {                                          │
│                    requirementItemId: X,                                    │
│                    vendorProfileId: "Elegant Moments",                      │
│                    agreedAmount: $4,500,                                    │
│                    status: DRAFT                                            │
│                  }                                                          │
│     └── Updates: VendorAgreement { status: SENT }                           │
│     └── Vendor receives agreement in business portal                        │
│                                                                              │
│  7. Vendor accepts agreement                                                 │
│     └── Updates: VendorAgreement { status: ACCEPTED }                       │
│     └── Updates: RequirementItem { status: VENDOR_SELECTED }                │
│                                                                              │
│  8. Manager locks contract                                                   │
│     └── Updates: VendorAgreement { status: CONTRACT_LOCKED }                │
│     └── Creates: ProvisionalInvoice { amount: $4,500, status: PENDING }     │
│     └── Updates: RequirementItem { status: CONTRACTED }                     │
│                                                                              │
│  9. All contracts locked                                                     │
│     └── Updates: ActiveEvent { status: CONTRACTS_LOCKED }                   │
│                                                                              │
│  10. Manager creates execution tasks                                         │
│      └── Creates: OperationalTask { "Collect decor items",                  │
│                                     assignedTo: "Ops Assistant Tom",        │
│                                     dueDate: "2025-06-14" }                 │
│      └── Creates: OperationalTask { "Verify photographer arrival",         │
│                                     assignedTo: Vendor,                     │
│                                     dueDate: "2025-06-15 02:00 PM" }        │
│                                                                              │
│  11. Assistants/Vendors execute tasks                                        │
│      └── Updates: OperationalTask { status: IN_PROGRESS }                   │
│      └── Creates: TaskAttachment { type: IMAGE, url: "proof.jpg" }          │
│      └── Updates: OperationalTask { status: SUBMITTED }                     │
│                                                                              │
│  12. Manager reviews and approves                                            │
│      └── Updates: OperationalTask { status: APPROVED, reviewedBy: "Mike" }  │
│                                                                              │
│  13. Event day execution                                                     │
│      └── Updates: ActiveEvent { status: EXECUTION }                         │
│      └── All tasks marked COMPLETED                                         │
│                                                                              │
│  14. Post-event completion                                                   │
│      └── Updates: ActiveEvent { status: COMPLETED, completedAt: now }       │
│      └── Updates: ProvisionalInvoice { status: PAID }                       │
│      └── Updates: VendorAgreement { status: COMPLETED }                     │
│      └── Creates: AuditLog { action: "EVENT_COMPLETED", entityId: X }       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Model Quick Reference

### 10.1 All Models by Schema

| Schema | Model | Purpose | Key Relations |
|--------|-------|---------|---------------|
| **public** | User | Core user account | → Roles, VendorProfile, Events, Leads |
| | Role | Permission definitions | → Users, Parent/Child roles |
| | UserRoleAssignment | User-Role junction | User ↔ Role |
| | UserSession | Login session tracking | → User |
| | Country | Country reference | → States |
| | State | State/Province reference | → Country, Cities |
| | City | City reference | → State, Addresses |
| | Address | Physical location | → City, VendorProfiles, Events |
| **catalog** | Category | Vendor categories | → Vendors, ServiceTypes |
| | ServiceType | Service sub-categories | → Category, Services |
| | VendorProfile | Business profile | → User, Category, Address, everything |
| | BusinessHour | Operating hours | → VendorProfile |
| | Tag | Searchable tags | → VendorTag |
| | VendorTag | Vendor-Tag junction | VendorProfile ↔ Tag |
| | ServiceArea | Service locations | → VendorProfile |
| | Portfolio | Work samples collection | → VendorProfile, MediaItems |
| | MediaItem | Portfolio photos/videos | → Portfolio |
| | Service | Service offerings | → VendorProfile, ServiceType, PricingTiers |
| | PricingTier | Package pricing | → Service |
| **interaction** | Lead | User inquiry to vendor | → VendorProfile, User, Event, Messages |
| | LeadStatusHistory | Lead status audit | → Lead |
| | Message | Conversation messages | → Lead |
| **planning** | EventType | Event type definitions | → Events, ChecklistTemplates |
| | ChecklistTemplate | Pre-built task templates | → EventType |
| | Event | User's event | → User, EventType, Address, everything |
| | EventVendor | Event-Vendor booking | → Event |
| | Checklist | Task list container | → Event, ChecklistItems |
| | ChecklistItem | Individual task | → Checklist |
| | Guestlist | Guest container | → Event, Guests |
| | Guest | Individual guest | → Guestlist |
| | Budget | Budget container | → Event, BudgetItems |
| | BudgetItem | Expense line item | → Budget |
| | Timeline | Event schedule | → Event |
| | Wishlist | Saved vendors board | → User, WishlistItems |
| | WishlistItem | Saved vendor | → Wishlist |
| | EventMemory | QR code & upload settings | → Event, GuestUploads |
| | GuestUpload | Guest-uploaded media | → EventMemory |
| **operations** | VendorKYC | Vendor verification | → VendorProfile, KYCDocuments |
| | KYCDocument | Verification documents | → VendorKYC |
| | Dispute | User complaints | → VendorProfile |
| | AuditLog | System audit trail | - |
| | ActiveEvent | Ops-managed event | → RequirementSheet, Agreements, Tasks |
| | EventNote | Internal notes | → ActiveEvent |
| | RequirementSheet | Requirements list | → ActiveEvent, RequirementItems |
| | RequirementItem | Individual requirement | → RequirementSheet, VendorAgreement |
| | VendorAgreement | Vendor contract | → ActiveEvent, RequirementItem, Invoice |
| | ProvisionalInvoice | Invoice for agreement | → VendorAgreement |
| | OperationalTask | Execution task | → ActiveEvent, TaskAttachments |
| | TaskAttachment | Task proof uploads | → OperationalTask |
| **content** | BlogPost | Blog article | → Author, Category, Tags |
| | BlogCategory | Post categories | → BlogPosts |
| | BlogTag | Post tags | → BlogPostTags |
| | BlogPostTag | Post-Tag junction | BlogPost ↔ BlogTag |

### 10.2 Key Enum Values

| Enum | Values | Used By |
|------|--------|---------|
| UserStatus | PENDING, ACTIVE, SUSPENDED, DELETED | User |
| VendorStatus | DRAFT, PENDING_REVIEW, ACTIVE, SUSPENDED, ARCHIVED | VendorProfile |
| LeadStatus | NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATING, WON, LOST, ARCHIVED | Lead |
| EventStatus | PLANNING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED | Event |
| EventVendorStatus | SHORTLISTED, CONTACTED, BOOKED, CONFIRMED, CANCELLED | EventVendor |
| RSVPStatus | PENDING, ATTENDING, NOT_ATTENDING, MAYBE | Guest |
| ActiveEventStatus | NEW, ASSIGNED, REQUIREMENTS_SET, VENDOR_SOURCING, CONTRACTS_LOCKED, EXECUTION, COMPLETED, CANCELLED | ActiveEvent |
| RequirementStatus | PENDING, SOURCING, VENDOR_SELECTED, CONTRACTED, FULFILLED | RequirementItem |
| AgreementStatus | DRAFT, SENT, ACCEPTED, DECLINED, CONTRACT_LOCKED, COMPLETED, CANCELLED | VendorAgreement |
| OperationalTaskStatus | PENDING, ASSIGNED, IN_PROGRESS, SUBMITTED, APPROVED, REJECTED, COMPLETED, CANCELLED | OperationalTask |
| KYCStatus | PENDING, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, EXPIRED | VendorKYC |
| BlogStatus | DRAFT, PUBLISHED, ARCHIVED | BlogPost |

---

## Summary

This schema supports a complete event planning ecosystem:

1. **Users** can be planners, vendors, or internal staff
2. **Planners** create events, manage checklists/guests/budgets, and book vendors
3. **Vendors** showcase services, receive leads, and communicate with planners
4. **Operations team** handles lead conversion, vendor agreements, and event execution
5. **Marketing** publishes SEO-optimized content
6. **The system** maintains audit trails, handles disputes, and verifies vendors

Every model is connected through foreign keys and relations, enabling complex queries and ensuring data integrity across the platform.
