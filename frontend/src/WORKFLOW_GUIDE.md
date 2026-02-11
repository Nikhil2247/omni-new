# Frontend Workflow Guide
## Omnicassion - How Everything Works Together

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Data Flow Diagram](#2-data-flow-diagram)
3. [Folder Structure & Responsibilities](#3-folder-structure--responsibilities)
4. [State Management Strategy](#4-state-management-strategy)
5. [API Integration Patterns](#5-api-integration-patterns)
6. [Component Hierarchy](#6-component-hierarchy)
7. [Authentication Flow](#7-authentication-flow)
8. [Route Groups & Layouts](#8-route-groups--layouts)
9. [Real-time Updates (WebSocket)](#9-real-time-updates-websocket)
10. [Form Handling Patterns](#10-form-handling-patterns)
11. [Error Handling](#11-error-handling)
12. [Best Practices](#12-best-practices)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│   │   (public)  │    │   (user)    │    │ (business)  │    │   (admin)   │     │
│   │  Landing,   │    │  Planner    │    │   Vendor    │    │    Staff    │     │
│   │  Auth, SEO  │    │  Dashboard  │    │  Dashboard  │    │  Dashboard  │     │
│   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘     │
│          │                  │                  │                  │             │
│          └──────────────────┴──────────────────┴──────────────────┘             │
│                                      │                                           │
│                          ┌───────────▼───────────┐                              │
│                          │      Components       │                              │
│                          │  (UI + Features)      │                              │
│                          └───────────┬───────────┘                              │
│                                      │                                           │
│          ┌───────────────────────────┼───────────────────────────┐              │
│          │                           │                           │              │
│          ▼                           ▼                           ▼              │
│   ┌─────────────┐           ┌─────────────┐            ┌─────────────┐         │
│   │   Zustand   │           │  TanStack   │            │    Hooks    │         │
│   │   Stores    │           │    Query    │            │  (Custom)   │         │
│   │(Client State)│          │(Server State)│           │             │         │
│   └─────────────┘           └──────┬──────┘            └─────────────┘         │
│                                    │                                            │
│                          ┌─────────▼─────────┐                                  │
│                          │    API Client     │                                  │
│                          │     (Axios)       │                                  │
│                          └─────────┬─────────┘                                  │
│                                    │                                            │
└────────────────────────────────────┼────────────────────────────────────────────┘
                                     │
                                     ▼
                    ┌────────────────────────────────┐
                    │         BACKEND API            │
                    │   (NestJS + PostgreSQL)        │
                    │                                │
                    │  /api/admin/*    (Admin)       │
                    │  /api/ops/*      (Operations)  │
                    │  /api/business/* (Vendors)     │
                    │  /api/user/*     (Planners)    │
                    │  /api/public/*   (Anonymous)   │
                    └────────────────────────────────┘
```

---

## 2. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  USER ACTION (Click, Submit, Navigate)                                          │
│       │                                                                          │
│       ▼                                                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                         COMPONENT LAYER                                  │    │
│  │  • Receives user input                                                   │    │
│  │  • Calls hooks (useQuery, useMutation, useStore)                        │    │
│  │  • Renders UI based on state                                            │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│       │                           │                           │                  │
│       ▼                           ▼                           ▼                  │
│  ┌───────────┐            ┌───────────────┐           ┌───────────────┐         │
│  │  Zustand  │            │ TanStack Query│           │  React Hook   │         │
│  │  Store    │            │               │           │     Form      │         │
│  │           │            │  useQuery()   │           │               │         │
│  │ • Auth    │            │  useMutation()│           │  • Validation │         │
│  │ • Sidebar │            │               │           │  • Submit     │         │
│  │ • Filters │            │  Manages:     │           │               │         │
│  │           │            │  • Caching    │           └───────┬───────┘         │
│  │ Immediate │            │  • Background │                   │                  │
│  │ UI State  │            │    Refetch    │                   │                  │
│  └───────────┘            │  • Stale Data │                   │                  │
│                           │  • Retries    │                   │                  │
│                           └───────┬───────┘                   │                  │
│                                   │                           │                  │
│                                   ▼                           ▼                  │
│                           ┌─────────────────────────────────────┐               │
│                           │           API CLIENT                 │               │
│                           │                                      │               │
│                           │  • Adds Authorization header         │               │
│                           │  • Handles token refresh             │               │
│                           │  • Transforms request/response       │               │
│                           │  • Error interception                │               │
│                           └──────────────┬──────────────────────┘               │
│                                          │                                       │
│                                          ▼                                       │
│                           ┌─────────────────────────────────────┐               │
│                           │         HTTP REQUEST                 │               │
│                           │    POST /api/user/events             │               │
│                           │    Authorization: Bearer <token>     │               │
│                           └──────────────┬──────────────────────┘               │
│                                          │                                       │
└──────────────────────────────────────────┼───────────────────────────────────────┘
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │   BACKEND   │
                                    │    API      │
                                    └─────────────┘
```

---

## 3. Folder Structure & Responsibilities

```
src/
│
├── app/                          # NEXT.JS APP ROUTER
│   │                             # Handles routing, layouts, pages
│   │
│   ├── (public)/                 # PUBLIC PAGES - No auth required
│   │   │                         # Landing, vendors, blog, auth
│   │   │
│   │   ├── layout.tsx            # Public layout (navbar + footer)
│   │   ├── page.tsx              # Landing page (/)
│   │   ├── vendors/              # Vendor discovery
│   │   └── (auth)/               # Auth pages (login, register, etc.)
│   │
│   ├── (user)/                   # USER PORTAL - Requires USER role
│   │   │                         # Event planning, wishlists, inquiries
│   │   │
│   │   ├── layout.tsx            # Dashboard layout (sidebar + header)
│   │   ├── dashboard/            # User home
│   │   └── events/               # User's events with planning tools
│   │
│   ├── (business)/               # VENDOR PORTAL - Requires BUSINESS_ADMIN role
│   │   │                         # Profile, portfolio, leads, tasks
│   │   │
│   │   ├── layout.tsx            # Vendor dashboard layout
│   │   ├── dashboard/            # Vendor home
│   │   └── leads/                # Lead management
│   │
│   └── (admin)/                  # ADMIN PORTAL - Requires staff roles
│       │                         # Ops, Marketing, Sales, System
│       │
│       ├── layout.tsx            # Admin layout with role-based nav
│       ├── ops/                  # Operations (OPERATIONAL_* roles)
│       ├── marketing/            # Marketing (MARKETING_* roles)
│       ├── sales/                # Sales (SALES_MANAGER role)
│       └── system/               # System admin (ADMIN_SYSTEM role)
│
├── components/                   # REUSABLE COMPONENTS
│   │
│   ├── ui/                       # SHADCN/UI PRIMITIVES
│   │   │                         # Button, Input, Dialog, etc.
│   │   │                         # Auto-generated via `npx shadcn add`
│   │   └── button.tsx
│   │
│   ├── common/                   # SHARED COMPONENTS
│   │   │                         # Used across all portals
│   │   │
│   │   ├── logo.tsx              # App logo
│   │   ├── loading-spinner.tsx   # Loading states
│   │   ├── empty-state.tsx       # Empty data states
│   │   ├── page-header.tsx       # Page titles with breadcrumbs
│   │   └── confirm-dialog.tsx    # Confirmation modals
│   │
│   ├── layouts/                  # LAYOUT COMPONENTS
│   │   │                         # Headers, sidebars, navigation
│   │   │
│   │   ├── public/               # Public site navigation
│   │   ├── dashboard/            # User/Business dashboard shell
│   │   └── admin/                # Admin dashboard shell
│   │
│   ├── forms/                    # FORM COMPONENTS
│   │   │                         # Reusable form patterns
│   │   │
│   │   ├── auth/                 # Login, register forms
│   │   ├── event/                # Event creation/edit forms
│   │   └── vendor/               # Vendor profile forms
│   │
│   └── features/                 # FEATURE COMPONENTS
│       │                         # Domain-specific components
│       │
│       ├── vendors/              # Vendor cards, grids, filters
│       ├── events/               # Event cards, calendar views
│       ├── leads/                # Lead lists, message threads
│       └── analytics/            # Charts, stat cards
│
├── hooks/                        # CUSTOM REACT HOOKS
│   │
│   ├── use-auth.ts               # Authentication helpers
│   ├── use-mobile.ts             # Responsive detection
│   ├── use-debounce.ts           # Input debouncing
│   │
│   └── queries/                  # TANSTACK QUERY HOOKS
│       │                         # Server state management
│       │
│       ├── use-vendors.ts        # Vendor queries & mutations
│       ├── use-events.ts         # Event queries & mutations
│       └── use-leads.ts          # Lead queries & mutations
│
├── lib/                          # UTILITY LIBRARIES
│   │
│   ├── api/                      # API LAYER
│   │   │
│   │   ├── client.ts             # Axios instance with interceptors
│   │   ├── endpoints.ts          # API route constants
│   │   │
│   │   ├── services/             # API SERVICE FUNCTIONS
│   │   │   │                     # Organized by domain
│   │   │   │
│   │   │   ├── auth.service.ts   # Login, register, refresh
│   │   │   ├── vendor.service.ts # Vendor CRUD operations
│   │   │   └── event.service.ts  # Event CRUD operations
│   │   │
│   │   └── types/                # API RESPONSE TYPES
│   │       │
│   │       ├── auth.types.ts     # Auth DTOs
│   │       └── vendor.types.ts   # Vendor DTOs
│   │
│   ├── utils/                    # UTILITY FUNCTIONS
│   │   │
│   │   ├── cn.ts                 # Tailwind class merger
│   │   ├── format.ts             # Date/currency formatting
│   │   └── validation.ts         # Zod schemas
│   │
│   └── websocket/                # WEBSOCKET CLIENT
│       │
│       ├── socket-client.ts      # Socket.io connection
│       └── events.ts             # Event type constants
│
├── store/                        # ZUSTAND STORES (Client State)
│   │
│   ├── index.ts                  # Store exports
│   ├── auth-store.ts             # Auth state (token, user)
│   ├── sidebar-store.ts          # UI state (open/collapsed)
│   └── filter-store.ts           # Global filter state
│
├── providers/                    # REACT PROVIDERS
│   │
│   ├── index.tsx                 # Combined provider wrapper
│   ├── query-provider.tsx        # TanStack Query setup
│   └── theme-provider.tsx        # Dark/light mode
│
├── config/                       # CONFIGURATION
│   │
│   ├── site.ts                   # Site metadata
│   ├── navigation.ts             # Nav menu definitions
│   └── permissions.ts            # Role-permission maps
│
└── types/                        # TYPESCRIPT TYPES
    │
    ├── index.ts                  # Common types
    ├── auth.ts                   # Auth types
    └── vendor.ts                 # Vendor types
```

---

## 4. State Management Strategy

### Two Types of State

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         STATE MANAGEMENT STRATEGY                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────┐    ┌─────────────────────────────────┐     │
│  │         SERVER STATE            │    │         CLIENT STATE            │     │
│  │       (TanStack Query)          │    │          (Zustand)              │     │
│  ├─────────────────────────────────┤    ├─────────────────────────────────┤     │
│  │                                 │    │                                 │     │
│  │  • Vendors                      │    │  • Auth (token, user)           │     │
│  │  • Events                       │    │  • Sidebar (open/collapsed)     │     │
│  │  • Leads                        │    │  • Theme (light/dark)           │     │
│  │  • Reviews                      │    │  • Filters (search, sort)       │     │
│  │  • User Profile                 │    │  • Modal states                 │     │
│  │  • KYC Status                   │    │  • Form drafts                  │     │
│  │  • Analytics                    │    │                                 │     │
│  │                                 │    │                                 │     │
│  │  Characteristics:               │    │  Characteristics:               │     │
│  │  • Fetched from backend         │    │  • UI-only, no backend          │     │
│  │  • Cached with TTL              │    │  • Instant updates              │     │
│  │  • Shared across components     │    │  • Persisted to localStorage    │     │
│  │  • Auto background refresh      │    │  • Synchronous                  │     │
│  │                                 │    │                                 │     │
│  └─────────────────────────────────┘    └─────────────────────────────────┘     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### TanStack Query Usage

```typescript
// hooks/queries/use-vendors.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorService } from '@/lib/api/services/vendor.service';

// Query Keys - Consistent naming for cache management
export const vendorKeys = {
  all: ['vendors'] as const,
  lists: () => [...vendorKeys.all, 'list'] as const,
  list: (filters: VendorFilters) => [...vendorKeys.lists(), filters] as const,
  details: () => [...vendorKeys.all, 'detail'] as const,
  detail: (id: string) => [...vendorKeys.details(), id] as const,
};

// Fetch vendors list
export function useVendors(filters: VendorFilters) {
  return useQuery({
    queryKey: vendorKeys.list(filters),
    queryFn: () => vendorService.getAll(filters),
    staleTime: 15 * 60 * 1000,  // 15 minutes (from caching strategy)
  });
}

// Fetch single vendor
export function useVendor(id: string) {
  return useQuery({
    queryKey: vendorKeys.detail(id),
    queryFn: () => vendorService.getById(id),
    staleTime: 15 * 60 * 1000,
    enabled: !!id,  // Only fetch if id exists
  });
}

// Update vendor mutation
export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateVendorDto }) =>
      vendorService.update(id, data),
    onSuccess: (data, variables) => {
      // Update the specific vendor in cache
      queryClient.setQueryData(vendorKeys.detail(variables.id), data);
      // Invalidate lists to refetch
      queryClient.invalidateQueries({ queryKey: vendorKeys.lists() });
    },
  });
}
```

### Zustand Usage

```typescript
// store/auth-store.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  // State
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;

  // Actions
  setCredentials: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      accessToken: null,
      user: null,
      isAuthenticated: false,

      // Actions
      setCredentials: (token, user) =>
        set({ accessToken: token, user, isAuthenticated: true }),

      logout: () =>
        set({ accessToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // localStorage key
    }
  )
);
```

### Using Both Together

```typescript
// components/features/vendors/vendor-list.tsx

'use client';

import { useVendors } from '@/hooks/queries/use-vendors';
import { useFilterStore } from '@/store/filter-store';
import { useAuthStore } from '@/store/auth-store';

export function VendorList() {
  // Client state (Zustand) - instant, UI-only
  const { search, category, sortBy } = useFilterStore();
  const { isAuthenticated } = useAuthStore();

  // Server state (TanStack Query) - cached, async
  const { data, isLoading, error } = useVendors({
    search,
    category,
    sortBy,
    page: 1,
    limit: 20,
  });

  if (isLoading) return <VendorSkeleton />;
  if (error) return <ErrorState error={error} />;
  if (!data?.data.length) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {data.data.map((vendor) => (
        <VendorCard
          key={vendor.id}
          vendor={vendor}
          showInquiryButton={isAuthenticated}
        />
      ))}
    </div>
  );
}
```

---

## 5. API Integration Patterns

### API Client Setup

```typescript
// lib/api/client.ts

import axios from 'axios';
import { useAuthStore } from '@/store/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt token refresh
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });

        // Update store with new token
        useAuthStore.getState().setCredentials(data.accessToken, data.user);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

### Service Layer Pattern

```typescript
// lib/api/services/vendor.service.ts

import { apiClient } from '../client';
import type {
  Vendor,
  VendorFilters,
  CreateVendorDto,
  UpdateVendorDto,
  PaginatedResponse,
} from '../types/vendor.types';

export const vendorService = {
  // GET /api/public/vendors
  getAll: async (filters: VendorFilters): Promise<PaginatedResponse<Vendor>> => {
    const { data } = await apiClient.get('/public/vendors', { params: filters });
    return data;
  },

  // GET /api/public/vendors/:slug
  getBySlug: async (slug: string): Promise<Vendor> => {
    const { data } = await apiClient.get(`/public/vendors/${slug}`);
    return data;
  },

  // GET /api/business/profile (own profile)
  getMyProfile: async (): Promise<Vendor> => {
    const { data } = await apiClient.get('/business/profile');
    return data;
  },

  // PUT /api/business/profile
  updateMyProfile: async (dto: UpdateVendorDto): Promise<Vendor> => {
    const { data } = await apiClient.put('/business/profile', dto);
    return data;
  },

  // POST /api/business/portfolio/media (multipart)
  uploadMedia: async (portfolioId: string, files: File[]): Promise<void> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    await apiClient.post(`/business/portfolio/${portfolioId}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
```

### API Endpoints Organization

```typescript
// lib/api/endpoints.ts

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },

  // Public Gateway
  PUBLIC: {
    VENDORS: '/public/vendors',
    VENDOR: (slug: string) => `/public/vendors/${slug}`,
    CATEGORIES: '/public/categories',
    DISCOVERY: '/public/discovery',
  },

  // User Gateway
  USER: {
    PROFILE: '/user/account',
    EVENTS: '/user/events',
    EVENT: (id: string) => `/user/events/${id}`,
    WISHLISTS: '/user/wishlists',
    INQUIRIES: '/user/interactions',
  },

  // Business Gateway
  BUSINESS: {
    PROFILE: '/business/profile',
    PORTFOLIO: '/business/portfolio',
    SERVICES: '/business/services',
    AGREEMENTS: '/business/agreements',
    TASKS: '/business/tasks',
  },

  // Ops Gateway
  OPS: {
    EVENTS: '/ops/active-events',
    LEADS: '/ops/leads',
    KYC: '/ops/kyc',
    DISPUTES: '/ops/disputes',
    TASKS: '/ops/operational-tasks',
  },
};
```

---

## 6. Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          COMPONENT HIERARCHY                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Page Component (app/(user)/events/[eventId]/page.tsx)                          │
│  └── Fetches initial data, handles route params                                 │
│       │                                                                          │
│       ▼                                                                          │
│  Layout Component (layouts/dashboard/sidebar.tsx)                               │
│  └── Navigation, header, sidebar shell                                          │
│       │                                                                          │
│       ▼                                                                          │
│  Feature Component (features/events/event-detail.tsx)                           │
│  └── Domain logic, data fetching hooks, orchestration                           │
│       │                                                                          │
│       ├─────────────────────────────────────────────────┐                       │
│       │                                                 │                       │
│       ▼                                                 ▼                       │
│  Form Component                                   Display Component             │
│  (forms/event/event-details-form.tsx)            (features/events/event-card)  │
│  └── React Hook Form, validation                 └── Pure presentation          │
│       │                                                 │                       │
│       ▼                                                 ▼                       │
│  UI Components (components/ui/*)                                                │
│  └── Button, Input, Card, Dialog - shadcn/ui primitives                        │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Component Types & Responsibilities

```typescript
// 1. PAGE COMPONENT - Route entry point
// app/(user)/events/[eventId]/page.tsx

import { EventDetail } from '@/components/features/events/event-detail';

interface PageProps {
  params: { eventId: string };
}

export default function EventPage({ params }: PageProps) {
  return <EventDetail eventId={params.eventId} />;
}


// 2. FEATURE COMPONENT - Domain logic & data
// components/features/events/event-detail.tsx

'use client';

import { useEvent, useUpdateEvent } from '@/hooks/queries/use-events';
import { EventDetailsForm } from '@/components/forms/event/event-details-form';
import { PageHeader } from '@/components/common/page-header';

interface EventDetailProps {
  eventId: string;
}

export function EventDetail({ eventId }: EventDetailProps) {
  const { data: event, isLoading } = useEvent(eventId);
  const updateMutation = useUpdateEvent();

  if (isLoading) return <EventDetailSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        title={event.name}
        description={`${event.eventType} • ${formatDate(event.eventDate)}`}
      />

      <EventDetailsForm
        event={event}
        onSubmit={(data) => updateMutation.mutate({ id: eventId, data })}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}


// 3. FORM COMPONENT - Form logic & validation
// components/forms/event/event-details-form.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { eventSchema, type EventFormData } from '@/lib/utils/validation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormField, FormItem, FormLabel } from '@/components/ui/form';

interface EventDetailsFormProps {
  event?: Event;
  onSubmit: (data: EventFormData) => void;
  isSubmitting?: boolean;
}

export function EventDetailsForm({
  event,
  onSubmit,
  isSubmitting,
}: EventDetailsFormProps) {
  const form = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: event?.name ?? '',
      eventDate: event?.eventDate ?? '',
      venue: event?.venue ?? '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name</FormLabel>
              <Input placeholder="My Wedding" {...field} />
            </FormItem>
          )}
        />

        {/* More fields... */}

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  );
}


// 4. UI COMPONENT - Pure presentation
// components/ui/button.tsx (shadcn/ui - auto-generated)

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium...',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground...',
        destructive: 'bg-destructive text-destructive-foreground...',
        outline: 'border border-input bg-background...',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
  }
);

export function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

---

## 7. Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          AUTHENTICATION FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  1. LOGIN FLOW                                                                   │
│  ─────────────                                                                   │
│                                                                                  │
│  User submits credentials                                                        │
│       │                                                                          │
│       ▼                                                                          │
│  ┌─────────────────────┐     POST /auth/login      ┌─────────────────────┐      │
│  │   Login Form        │ ─────────────────────────▶│      Backend        │      │
│  │   (email, password) │                           │                     │      │
│  └─────────────────────┘                           └──────────┬──────────┘      │
│                                                               │                  │
│                                                               ▼                  │
│                                                    { accessToken, user }         │
│                                                               │                  │
│       ┌───────────────────────────────────────────────────────┘                  │
│       │                                                                          │
│       ▼                                                                          │
│  ┌─────────────────────┐                                                        │
│  │   Zustand Store     │  useAuthStore.setCredentials(token, user)              │
│  │   (auth-store.ts)   │                                                        │
│  └──────────┬──────────┘                                                        │
│             │                                                                    │
│             ▼                                                                    │
│  ┌─────────────────────┐                                                        │
│  │   localStorage      │  Persisted via zustand/persist middleware              │
│  │   "auth-storage"    │                                                        │
│  └──────────┬──────────┘                                                        │
│             │                                                                    │
│             ▼                                                                    │
│  ┌─────────────────────┐                                                        │
│  │   Redirect to       │  router.push('/dashboard')                             │
│  │   Dashboard         │                                                        │
│  └─────────────────────┘                                                        │
│                                                                                  │
│                                                                                  │
│  2. PROTECTED ROUTE CHECK                                                        │
│  ────────────────────────                                                        │
│                                                                                  │
│  User navigates to /dashboard                                                    │
│       │                                                                          │
│       ▼                                                                          │
│  ┌─────────────────────┐                                                        │
│  │  Layout Component   │  Check useAuthStore().isAuthenticated                  │
│  │  (user)/layout.tsx  │                                                        │
│  └──────────┬──────────┘                                                        │
│             │                                                                    │
│     ┌───────┴───────┐                                                           │
│     │               │                                                           │
│     ▼               ▼                                                           │
│  Authenticated   Not Authenticated                                              │
│     │               │                                                           │
│     ▼               ▼                                                           │
│  Render Page    Redirect to /login                                              │
│                                                                                  │
│                                                                                  │
│  3. API REQUEST WITH TOKEN                                                       │
│  ─────────────────────────                                                       │
│                                                                                  │
│  Component calls API                                                             │
│       │                                                                          │
│       ▼                                                                          │
│  ┌─────────────────────┐                                                        │
│  │  Axios Interceptor  │  Reads token from useAuthStore.getState()              │
│  │  (request)          │  Adds: Authorization: Bearer <token>                   │
│  └──────────┬──────────┘                                                        │
│             │                                                                    │
│             ▼                                                                    │
│  ┌─────────────────────┐                                                        │
│  │  Backend validates  │                                                        │
│  │  JWT token          │                                                        │
│  └─────────────────────┘                                                        │
│                                                                                  │
│                                                                                  │
│  4. TOKEN REFRESH (401 Error)                                                    │
│  ────────────────────────────                                                    │
│                                                                                  │
│  API returns 401 Unauthorized                                                    │
│       │                                                                          │
│       ▼                                                                          │
│  ┌─────────────────────┐                                                        │
│  │  Axios Interceptor  │  POST /auth/refresh (with httpOnly cookie)             │
│  │  (response)         │                                                        │
│  └──────────┬──────────┘                                                        │
│             │                                                                    │
│     ┌───────┴───────┐                                                           │
│     │               │                                                           │
│     ▼               ▼                                                           │
│  Success         Failure                                                        │
│     │               │                                                           │
│     ▼               ▼                                                           │
│  Update store    Logout & redirect                                              │
│  Retry request   to /login                                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Auth Implementation

```typescript
// app/(user)/layout.tsx - Protected Layout

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { DashboardLayout } from '@/components/layouts/dashboard';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/dashboard');
    }
  }, [isAuthenticated, router]);

  // Don't render until auth check completes
  if (!isAuthenticated) {
    return null; // Or loading spinner
  }

  // Check role for this portal
  if (user?.role !== 'USER' && user?.role !== 'BUSINESS_ADMIN') {
    router.push('/unauthorized');
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
```

```typescript
// hooks/use-auth.ts - Auth Hook

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { authService } from '@/lib/api/services/auth.service';
import { toast } from 'sonner';

export function useLogin() {
  const router = useRouter();
  const setCredentials = useAuthStore((state) => state.setCredentials);

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setCredentials(data.accessToken, data.user);
      toast.success('Welcome back!');

      // Redirect based on role
      switch (data.user.role) {
        case 'ADMIN_SYSTEM':
        case 'OPERATIONAL_ADMIN':
        case 'OPERATIONAL_MANAGER':
          router.push('/ops/dashboard');
          break;
        case 'BUSINESS_ADMIN':
          router.push('/dashboard'); // Business portal
          break;
        default:
          router.push('/dashboard'); // User portal
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const logout = useAuthStore((state) => state.logout);

  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      // Clear auth state
      logout();
      // Clear all cached data
      queryClient.clear();
      // Redirect to home
      router.push('/');
    },
  });
}
```

---

## 8. Route Groups & Layouts

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         ROUTE GROUPS & LAYOUTS                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Next.js App Router uses Route Groups (parentheses) to organize routes          │
│  without affecting the URL structure.                                            │
│                                                                                  │
│  URL: /vendors/photography                                                       │
│  File: app/(public)/vendors/category/[category]/page.tsx                        │
│                                                                                  │
│  URL: /dashboard                                                                 │
│  File: app/(user)/dashboard/page.tsx                                            │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  LAYOUT HIERARCHY                                                                │
│                                                                                  │
│  app/                                                                            │
│  ├── layout.tsx              ─── ROOT LAYOUT (Providers, Fonts)                 │
│  │                               Applied to ALL routes                          │
│  │                                                                              │
│  ├── (public)/                                                                  │
│  │   ├── layout.tsx          ─── PUBLIC LAYOUT (Navbar, Footer)                │
│  │   │                           Applied to: /, /vendors, /blog, /login        │
│  │   │                                                                          │
│  │   └── (auth)/                                                                │
│  │       └── layout.tsx      ─── AUTH LAYOUT (Centered card)                   │
│  │                               Applied to: /login, /register                  │
│  │                                                                              │
│  ├── (user)/                                                                    │
│  │   ├── layout.tsx          ─── USER DASHBOARD LAYOUT                         │
│  │   │                           Sidebar + Header + Auth guard                 │
│  │   │                                                                          │
│  │   └── events/[eventId]/                                                      │
│  │       └── layout.tsx      ─── EVENT LAYOUT (Tabs navigation)                │
│  │                               For checklist, guestlist, budget, etc.        │
│  │                                                                              │
│  ├── (business)/                                                                │
│  │   └── layout.tsx          ─── VENDOR DASHBOARD LAYOUT                       │
│  │                               Sidebar + Header + Role guard                 │
│  │                                                                              │
│  └── (admin)/                                                                   │
│      ├── layout.tsx          ─── ADMIN LAYOUT (Role-based nav)                 │
│      │                                                                          │
│      ├── ops/                                                                   │
│      │   └── layout.tsx      ─── OPS SUB-LAYOUT                                │
│      │                                                                          │
│      └── marketing/                                                             │
│          └── layout.tsx      ─── MARKETING SUB-LAYOUT                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Layout Implementation Examples

```typescript
// app/layout.tsx - Root Layout

import { Inter } from 'next/font/google';
import { Providers } from '@/providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```typescript
// app/(public)/layout.tsx - Public Layout

import { Navbar } from '@/components/layouts/public/navbar';
import { Footer } from '@/components/layouts/public/footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

```typescript
// app/(user)/layout.tsx - User Dashboard Layout

'use client';

import { useAuthStore } from '@/store/auth-store';
import { useSidebarStore } from '@/store/sidebar-store';
import { Sidebar } from '@/components/layouts/dashboard/sidebar';
import { Header } from '@/components/layouts/dashboard/header';
import { userNavItems } from '@/config/navigation';
import { redirect } from 'next/navigation';

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAuthStore();
  const { isCollapsed } = useSidebarStore();

  if (!isAuthenticated) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen">
      <Sidebar items={userNavItems} isCollapsed={isCollapsed} />
      <div className={cn(
        'transition-all duration-300',
        isCollapsed ? 'ml-16' : 'ml-64'
      )}>
        <Header user={user} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

```typescript
// app/(admin)/layout.tsx - Admin Layout with Role-Based Nav

'use client';

import { useAuthStore } from '@/store/auth-store';
import { AdminSidebar } from '@/components/layouts/admin/admin-sidebar';
import { AdminHeader } from '@/components/layouts/admin/admin-header';
import { adminNavItems } from '@/config/navigation';
import { filterNavByRole } from '@/lib/utils/permissions';
import { redirect } from 'next/navigation';

const ADMIN_ROLES = [
  'ADMIN_SYSTEM',
  'OPERATIONAL_ADMIN',
  'OPERATIONAL_MANAGER',
  'OPERATIONAL_ASSISTANT',
  'MARKETING_SERVICES_ADMIN',
  'CONTENT_WRITER',
  'MULTI_MEDIA_MANAGER',
  'SALES_MANAGER',
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    redirect('/login');
  }

  if (!user || !ADMIN_ROLES.includes(user.role)) {
    redirect('/unauthorized');
  }

  // Filter navigation items based on user's role
  const filteredNav = filterNavByRole(adminNavItems, user.role);

  return (
    <div className="min-h-screen bg-muted/30">
      <AdminSidebar items={filteredNav} />
      <div className="ml-64">
        <AdminHeader user={user} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
```

---

## 9. Real-time Updates (WebSocket)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         WEBSOCKET INTEGRATION                                    │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  WebSocket is used for:                                                          │
│  • Real-time notifications                                                       │
│  • Live messaging (lead conversations)                                           │
│  • Task status updates                                                           │
│  • Event updates                                                                 │
│                                                                                  │
│  ┌─────────────┐          ┌─────────────┐          ┌─────────────┐             │
│  │   Browser   │◀────────▶│  WebSocket  │◀────────▶│   Backend   │             │
│  │             │  Socket  │   Server    │          │   Events    │             │
│  └─────────────┘   .io    └─────────────┘          └─────────────┘             │
│                                                                                  │
│  Events:                                                                         │
│  • notification:new      → Show toast, update bell icon                         │
│  • message:new           → Update chat UI, play sound                           │
│  • lead:status_changed   → Update lead card status                              │
│  • task:assigned         → Show notification, refresh task list                 │
│  • vendor:agreement_sent → Notify vendor of new agreement                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### WebSocket Implementation

```typescript
// lib/websocket/socket-client.ts

import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/auth-store';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) {
    return socket;
  }

  const token = useAuthStore.getState().accessToken;

  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', (reason) => {
    console.log('WebSocket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('WebSocket connection error:', error);
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

```typescript
// lib/websocket/events.ts

export const WS_EVENTS = {
  // Notifications
  NOTIFICATION_NEW: 'notification:new',
  NOTIFICATION_READ: 'notification:read',

  // Messaging
  MESSAGE_NEW: 'message:new',
  MESSAGE_READ: 'message:read',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',

  // Leads
  LEAD_STATUS_CHANGED: 'lead:status_changed',
  LEAD_NEW: 'lead:new',

  // Tasks
  TASK_ASSIGNED: 'task:assigned',
  TASK_STATUS_CHANGED: 'task:status_changed',

  // Agreements
  AGREEMENT_SENT: 'vendor:agreement_sent',
  AGREEMENT_RESPONDED: 'vendor:agreement_responded',
} as const;
```

```typescript
// providers/websocket-provider.tsx

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, disconnectSocket, getSocket } from '@/lib/websocket/socket-client';
import { WS_EVENTS } from '@/lib/websocket/events';
import { useAuthStore } from '@/store/auth-store';
import { toast } from 'sonner';

const WebSocketContext = createContext<Socket | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const { isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      setSocket(null);
      return;
    }

    const ws = connectSocket();
    setSocket(ws);

    // Handle notifications
    ws.on(WS_EVENTS.NOTIFICATION_NEW, (notification) => {
      toast(notification.title, {
        description: notification.message,
      });
      // Invalidate notifications query to refetch
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    // Handle new messages
    ws.on(WS_EVENTS.MESSAGE_NEW, (message) => {
      // Invalidate the specific lead's messages
      queryClient.invalidateQueries({
        queryKey: ['lead', message.leadId, 'messages'],
      });
    });

    // Handle lead status changes
    ws.on(WS_EVENTS.LEAD_STATUS_CHANGED, (data) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', data.leadId] });
    });

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, queryClient]);

  return (
    <WebSocketContext.Provider value={socket}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}
```

```typescript
// hooks/use-notifications.ts - Using WebSocket with TanStack Query

import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/providers/websocket-provider';
import { notificationService } from '@/lib/api/services/notification.service';
import { WS_EVENTS } from '@/lib/websocket/events';

export function useNotifications() {
  const socket = useWebSocket();

  return useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getAll,
    // WebSocket handles real-time updates, so we can use longer stale time
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarkNotificationRead() {
  const socket = useWebSocket();

  return (notificationId: string) => {
    // Emit to server
    socket?.emit(WS_EVENTS.NOTIFICATION_READ, { notificationId });
  };
}
```

---

## 10. Form Handling Patterns

```typescript
// lib/utils/validation.ts - Zod Schemas

import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const eventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(100),
  eventType: z.enum(['WEDDING', 'BIRTHDAY', 'CORPORATE', 'OTHER']),
  eventDate: z.string().refine((date) => new Date(date) > new Date(), {
    message: 'Event date must be in the future',
  }),
  venue: z.string().optional(),
  budget: z.number().min(0).optional(),
  guestCount: z.number().min(1).optional(),
});

export const vendorProfileSchema = z.object({
  businessName: z.string().min(2).max(100),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  category: z.string().min(1, 'Category is required'),
  city: z.string().min(1, 'City is required'),
  minPrice: z.number().min(0),
  maxPrice: z.number().min(0),
}).refine((data) => data.maxPrice >= data.minPrice, {
  message: 'Max price must be greater than min price',
  path: ['maxPrice'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type EventFormData = z.infer<typeof eventSchema>;
export type VendorProfileFormData = z.infer<typeof vendorProfileSchema>;
```

```typescript
// components/forms/auth/login-form.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/utils/validation';
import { useLogin } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

export function LoginForm() {
  const loginMutation = useLogin();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>
    </Form>
  );
}
```

---

## 11. Error Handling

```typescript
// lib/api/types/common.types.ts

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// Error codes from backend
export const ERROR_CODES = {
  // Validation
  VALIDATION_FAILED: 'VAL_1001',
  INVALID_FORMAT: 'VAL_1002',

  // Auth
  INVALID_CREDENTIALS: 'AUTH_2001',
  TOKEN_EXPIRED: 'AUTH_2002',
  UNAUTHORIZED: 'AUTH_2003',
  FORBIDDEN: 'AUTH_2004',

  // Resource
  NOT_FOUND: 'RES_3001',
  ALREADY_EXISTS: 'RES_3002',

  // Business Logic
  VENDOR_NOT_VERIFIED: 'BIZ_4001',
  EVENT_DATE_PASSED: 'BIZ_4003',

  // Server
  INTERNAL_ERROR: 'SRV_5001',
} as const;
```

```typescript
// components/common/error-boundary.tsx

'use client';

import { Component, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={() => this.setState({ hasError: false })}>
              Try again
            </Button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

```typescript
// hooks/queries/use-vendors.ts - Error Handling in Queries

import { useQuery } from '@tanstack/react-query';
import { vendorService } from '@/lib/api/services/vendor.service';
import { toast } from 'sonner';
import { ERROR_CODES } from '@/lib/api/types/common.types';

export function useVendor(slug: string) {
  return useQuery({
    queryKey: ['vendor', slug],
    queryFn: () => vendorService.getBySlug(slug),
    retry: (failureCount, error) => {
      // Don't retry on 404
      if (error.response?.status === 404) return false;
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
    // Handle errors globally via query client, or per-query
    meta: {
      errorMessage: 'Failed to load vendor profile',
    },
  });
}

// In QueryProvider - Global error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
    },
    mutations: {
      onError: (error) => {
        const code = error.response?.data?.error?.code;
        const message = error.response?.data?.error?.message;

        switch (code) {
          case ERROR_CODES.UNAUTHORIZED:
            toast.error('Please log in to continue');
            break;
          case ERROR_CODES.FORBIDDEN:
            toast.error('You do not have permission for this action');
            break;
          case ERROR_CODES.VALIDATION_FAILED:
            toast.error(message || 'Please check your input');
            break;
          default:
            toast.error(message || 'Something went wrong');
        }
      },
    },
  },
});
```

---

## 12. Best Practices

### File Naming Conventions

```
Components:   PascalCase      → VendorCard.tsx, LoginForm.tsx
Hooks:        camelCase       → useVendors.ts, useAuth.ts
Stores:       kebab-case      → auth-store.ts, filter-store.ts
Services:     kebab-case      → vendor.service.ts, auth.service.ts
Types:        kebab-case      → vendor.types.ts, common.types.ts
Utils:        kebab-case      → format.ts, validation.ts
```

### Import Order

```typescript
// 1. React/Next imports
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party imports
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

// 3. Internal imports - absolute paths
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { vendorService } from '@/lib/api/services/vendor.service';

// 4. Types
import type { Vendor } from '@/types/vendor';

// 5. Styles (if any)
import './styles.css';
```

### Component Structure

```typescript
// components/features/vendors/vendor-card.tsx

'use client'; // Only if needed (uses hooks, event handlers)

// Imports...

// Types for this component
interface VendorCardProps {
  vendor: Vendor;
  onInquiry?: () => void;
  showActions?: boolean;
}

// Component
export function VendorCard({
  vendor,
  onInquiry,
  showActions = true,
}: VendorCardProps) {
  // 1. Hooks (stores, router, etc.)
  const { isAuthenticated } = useAuthStore();

  // 2. Local state
  const [isHovered, setIsHovered] = useState(false);

  // 3. Derived values
  const priceRange = formatPriceRange(vendor.minPrice, vendor.maxPrice);

  // 4. Effects
  useEffect(() => {
    // ...
  }, []);

  // 5. Event handlers
  const handleClick = () => {
    // ...
  };

  // 6. Render
  return (
    <Card onMouseEnter={() => setIsHovered(true)}>
      {/* ... */}
    </Card>
  );
}
```

### Query Key Conventions

```typescript
// Consistent query key structure for cache management

export const queryKeys = {
  // Entity-based keys
  vendors: {
    all: ['vendors'] as const,
    lists: () => [...queryKeys.vendors.all, 'list'] as const,
    list: (filters: Filters) => [...queryKeys.vendors.lists(), filters] as const,
    details: () => [...queryKeys.vendors.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.vendors.details(), id] as const,
  },

  events: {
    all: ['events'] as const,
    lists: () => [...queryKeys.events.all, 'list'] as const,
    list: (filters: Filters) => [...queryKeys.events.lists(), filters] as const,
    detail: (id: string) => [...queryKeys.events.all, 'detail', id] as const,
    // Nested resources
    checklist: (eventId: string) => [...queryKeys.events.detail(eventId), 'checklist'] as const,
    guests: (eventId: string) => [...queryKeys.events.detail(eventId), 'guests'] as const,
  },
};

// Usage
queryClient.invalidateQueries({ queryKey: queryKeys.vendors.lists() }); // Invalidate all vendor lists
queryClient.invalidateQueries({ queryKey: queryKeys.vendors.detail('123') }); // Invalidate specific vendor
```

### Performance Tips

```typescript
// 1. Use React.memo for expensive renders
export const VendorCard = memo(function VendorCard({ vendor }: Props) {
  // ...
});

// 2. Use useMemo for expensive calculations
const sortedVendors = useMemo(
  () => vendors.sort((a, b) => a.rating - b.rating),
  [vendors]
);

// 3. Use useCallback for stable function references
const handleSubmit = useCallback((data: FormData) => {
  mutation.mutate(data);
}, [mutation]);

// 4. Lazy load heavy components
const RichTextEditor = dynamic(
  () => import('@/components/common/rich-text-editor'),
  { loading: () => <Skeleton className="h-40" /> }
);

// 5. Use Suspense for data loading
<Suspense fallback={<VendorListSkeleton />}>
  <VendorList />
</Suspense>

// 6. Prefetch data on hover
<Link
  href={`/vendors/${vendor.slug}`}
  onMouseEnter={() => {
    queryClient.prefetchQuery({
      queryKey: ['vendor', vendor.slug],
      queryFn: () => vendorService.getBySlug(vendor.slug),
    });
  }}
>
  View Profile
</Link>
```

---

## Quick Reference: Data Flow Summary

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   USER ACTION                                                                │
│        │                                                                     │
│        ▼                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  COMPONENT calls hook:                                               │   │
│   │                                                                      │   │
│   │  • useVendors(filters)     →  TanStack Query  →  API  →  Cache     │   │
│   │  • useSidebarStore()       →  Zustand         →  Instant update    │   │
│   │  • useForm()               →  React Hook Form →  Local state       │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│        │                                                                     │
│        ▼                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  RE-RENDER with new data                                             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│                                                                              │
│   WEBSOCKET EVENT                                                            │
│        │                                                                     │
│        ▼                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  WebSocketProvider receives event                                    │   │
│   │        │                                                             │   │
│   │        ▼                                                             │   │
│   │  queryClient.invalidateQueries()  →  Refetch  →  UI Update         │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

**Last Updated:** January 2025
**Version:** 1.0
