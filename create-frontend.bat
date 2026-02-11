@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Omnicassion Frontend Setup Script
echo  Next.js 15 + Tailwind CSS 4 + shadcn/ui
echo ========================================
echo.

:: Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js 18+ first.
    pause
    exit /b 1
)

:: Check Node version
for /f "tokens=1" %%i in ('node -v') do set NODE_VERSION=%%i
echo Node.js version: %NODE_VERSION%

:: Set the frontend directory name
set FRONTEND_DIR=frontend

:: Check if directory already exists
if exist "%FRONTEND_DIR%" (
    echo WARNING: '%FRONTEND_DIR%' directory already exists.
    set /p OVERWRITE="Do you want to delete it and start fresh? (y/n): "
    if /i "!OVERWRITE!"=="y" (
        rmdir /s /q "%FRONTEND_DIR%"
    ) else (
        echo Aborting setup.
        pause
        exit /b 0
    )
)

echo.
echo [1/8] Creating Next.js project with TypeScript...
call npx create-next-app@latest %FRONTEND_DIR% --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm

cd %FRONTEND_DIR%

echo.
echo [2/8] Installing additional dependencies...
call npm install zustand @tanstack/react-query @tanstack/react-table axios date-fns zod react-hook-form @hookform/resolvers lucide-react framer-motion recharts socket.io-client class-variance-authority clsx tailwind-merge tailwindcss-animate @tailwindcss/typography next-themes

echo.
echo [3/8] Installing dev dependencies...
call npm install -D @types/node vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom playwright prettier prettier-plugin-tailwindcss

echo.
echo [4/8] Initializing shadcn/ui...
call npx shadcn@latest init -y

echo.
echo [5/8] Installing shadcn/ui components...
call npx shadcn@latest add button input label card dialog dropdown-menu sheet tabs badge avatar calendar toast sonner skeleton separator form textarea checkbox radio-group switch slider progress alert alert-dialog tooltip popover command select scroll-area table pagination accordion collapsible menubar navigation-menu context-menu hover-card aspect-ratio

echo.
echo [6/8] Creating folder structure...

:: Create public route group directories
mkdir src\app\(public) 2>nul
mkdir src\app\(public)\(auth)\login 2>nul
mkdir src\app\(public)\(auth)\register 2>nul
mkdir src\app\(public)\(auth)\forgot-password 2>nul
mkdir src\app\(public)\(auth)\reset-password 2>nul
mkdir src\app\(public)\(auth)\verify-email 2>nul
mkdir src\app\(public)\(auth)\onboarding\user 2>nul
mkdir src\app\(public)\(auth)\onboarding\vendor 2>nul
mkdir src\app\(public)\vendors\[slug] 2>nul
mkdir src\app\(public)\vendors\category\[category] 2>nul
mkdir src\app\(public)\blog\[slug] 2>nul
mkdir src\app\(public)\about 2>nul
mkdir src\app\(public)\contact 2>nul
mkdir src\app\(public)\pricing 2>nul
mkdir src\app\(public)\guest\[eventCode]\upload 2>nul
mkdir src\app\(public)\guest\[eventCode]\rsvp 2>nul

:: Create user route group directories
mkdir src\app\(user)\dashboard 2>nul
mkdir src\app\(user)\events\new 2>nul
mkdir src\app\(user)\events\[eventId]\checklist 2>nul
mkdir src\app\(user)\events\[eventId]\guestlist 2>nul
mkdir src\app\(user)\events\[eventId]\budget 2>nul
mkdir src\app\(user)\events\[eventId]\timeline 2>nul
mkdir src\app\(user)\events\[eventId]\vendors 2>nul
mkdir src\app\(user)\events\[eventId]\memories 2>nul
mkdir src\app\(user)\events\[eventId]\settings 2>nul
mkdir src\app\(user)\wishlists\[boardId] 2>nul
mkdir src\app\(user)\inquiries\[leadId] 2>nul
mkdir src\app\(user)\reviews 2>nul
mkdir src\app\(user)\settings\profile 2>nul
mkdir src\app\(user)\settings\notifications 2>nul
mkdir src\app\(user)\settings\security 2>nul

:: Create business route group directories
mkdir src\app\(business)\dashboard 2>nul
mkdir src\app\(business)\profile\preview 2>nul
mkdir src\app\(business)\profile\verification 2>nul
mkdir src\app\(business)\portfolio\[portfolioId] 2>nul
mkdir src\app\(business)\services\[serviceId] 2>nul
mkdir src\app\(business)\leads\[leadId] 2>nul
mkdir src\app\(business)\calendar 2>nul
mkdir src\app\(business)\agreements\[agreementId] 2>nul
mkdir src\app\(business)\tasks\[taskId] 2>nul
mkdir src\app\(business)\reviews 2>nul
mkdir src\app\(business)\analytics 2>nul
mkdir src\app\(business)\settings\team 2>nul
mkdir src\app\(business)\settings\billing 2>nul
mkdir src\app\(business)\settings\notifications 2>nul

:: Create admin route group directories
mkdir src\app\(admin)\dashboard 2>nul
mkdir src\app\(admin)\ops\events\new 2>nul
mkdir src\app\(admin)\ops\events\[eventId]\requirements 2>nul
mkdir src\app\(admin)\ops\events\[eventId]\agreements 2>nul
mkdir src\app\(admin)\ops\events\[eventId]\tasks 2>nul
mkdir src\app\(admin)\ops\events\[eventId]\invoices 2>nul
mkdir src\app\(admin)\ops\leads\[leadId] 2>nul
mkdir src\app\(admin)\ops\tasks\[taskId] 2>nul
mkdir src\app\(admin)\ops\vendors\[vendorId] 2>nul
mkdir src\app\(admin)\ops\kyc\[kycId] 2>nul
mkdir src\app\(admin)\ops\disputes\[disputeId] 2>nul
mkdir src\app\(admin)\ops\support\[ticketId] 2>nul
mkdir src\app\(admin)\ops\reports 2>nul
mkdir src\app\(admin)\marketing\campaigns\[campaignId] 2>nul
mkdir src\app\(admin)\marketing\content\new 2>nul
mkdir src\app\(admin)\marketing\content\[contentId] 2>nul
mkdir src\app\(admin)\marketing\media 2>nul
mkdir src\app\(admin)\marketing\promotions 2>nul
mkdir src\app\(admin)\marketing\categories 2>nul
mkdir src\app\(admin)\sales\leads\[leadId] 2>nul
mkdir src\app\(admin)\sales\acquisitions 2>nul
mkdir src\app\(admin)\sales\partnerships 2>nul
mkdir src\app\(admin)\sales\reports 2>nul
mkdir src\app\(admin)\system\users\[userId] 2>nul
mkdir src\app\(admin)\system\roles 2>nul
mkdir src\app\(admin)\system\config 2>nul
mkdir src\app\(admin)\system\audit 2>nul
mkdir src\app\(admin)\system\health 2>nul
mkdir src\app\(admin)\settings 2>nul

:: Create API route directories
mkdir src\app\api\auth\[...nextauth] 2>nul
mkdir src\app\api\upload 2>nul
mkdir src\app\api\revalidate 2>nul

:: Create component directories
mkdir src\components\common 2>nul
mkdir src\components\layouts\public 2>nul
mkdir src\components\layouts\dashboard 2>nul
mkdir src\components\layouts\admin 2>nul
mkdir src\components\layouts\auth 2>nul
mkdir src\components\forms\auth 2>nul
mkdir src\components\forms\event 2>nul
mkdir src\components\forms\vendor 2>nul
mkdir src\components\forms\inquiry 2>nul
mkdir src\components\features\vendors 2>nul
mkdir src\components\features\events 2>nul
mkdir src\components\features\leads 2>nul
mkdir src\components\features\ops 2>nul
mkdir src\components\features\analytics 2>nul
mkdir src\components\features\notifications 2>nul

:: Create hooks directories
mkdir src\hooks\queries 2>nul

:: Create lib directories
mkdir src\lib\api\services 2>nul
mkdir src\lib\api\types 2>nul
mkdir src\lib\utils 2>nul
mkdir src\lib\auth 2>nul
mkdir src\lib\websocket 2>nul

:: Create other directories
mkdir src\store 2>nul
mkdir src\providers 2>nul
mkdir src\styles\themes 2>nul
mkdir src\styles\components 2>nul
mkdir src\config 2>nul
mkdir src\types 2>nul

:: Create public asset directories
mkdir public\images\placeholder 2>nul
mkdir public\fonts 2>nul
mkdir public\icons 2>nul

echo.
echo [7/8] Creating base files...

:: Create cn utility
(
echo import { clsx, type ClassValue } from "clsx";
echo import { twMerge } from "tailwind-merge";
echo.
echo export function cn^(...inputs: ClassValue[]^) {
echo   return twMerge^(clsx^(inputs^)^);
echo }
) > src\lib\utils.ts

:: Create .env.example
(
echo # API Configuration
echo NEXT_PUBLIC_API_URL=http://localhost:3001/api
echo NEXT_PUBLIC_WS_URL=ws://localhost:3001
echo.
echo # Auth
echo NEXTAUTH_URL=http://localhost:3000
echo NEXTAUTH_SECRET=your-secret-here-change-in-production
echo.
echo # Public
echo NEXT_PUBLIC_APP_NAME=Omnicassion
echo NEXT_PUBLIC_APP_URL=http://localhost:3000
) > .env.example

:: Create .env.local from example
copy .env.example .env.local >nul

:: Create site config
(
echo export const siteConfig = {
echo   name: "Omnicassion",
echo   description: "Your ultimate event planning platform",
echo   url: process.env.NEXT_PUBLIC_APP_URL ^|^| "http://localhost:3000",
echo   ogImage: "/images/og-image.png",
echo   links: {
echo     twitter: "https://twitter.com/omnicassion",
echo     github: "https://github.com/omnicassion",
echo   },
echo };
) > src\config\site.ts

:: Create theme provider
(
echo "use client";
echo.
echo import * as React from "react";
echo import { ThemeProvider as NextThemesProvider } from "next-themes";
echo import { type ThemeProviderProps } from "next-themes/dist/types";
echo.
echo export function ThemeProvider^({ children, ...props }: ThemeProviderProps^) {
echo   return ^<NextThemesProvider {...props}^>{children}^</NextThemesProvider^>;
echo }
) > src\providers\theme-provider.tsx

:: Create query provider
(
echo "use client";
echo.
echo import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
echo import { ReactQueryDevtools } from "@tanstack/react-query/devtools";
echo import { useState } from "react";
echo.
echo export function QueryProvider^({ children }: { children: React.ReactNode }^) {
echo   const [queryClient] = useState^(
echo     ^(^) =^>
echo       new QueryClient^({
echo         defaultOptions: {
echo           queries: {
echo             staleTime: 60 * 1000,
echo             refetchOnWindowFocus: false,
echo           },
echo         },
echo       }^)
echo   ^);
echo.
echo   return ^(
echo     ^<QueryClientProvider client={queryClient}^>
echo       {children}
echo       ^<ReactQueryDevtools initialIsOpen={false} /^>
echo     ^</QueryClientProvider^>
echo   ^);
echo }
) > src\providers\query-provider.tsx

:: Create Zustand auth store
(
echo import { create } from "zustand";
echo import { persist } from "zustand/middleware";
echo.
echo interface User {
echo   id: string;
echo   email: string;
echo   firstName: string;
echo   lastName: string;
echo   role: string;
echo }
echo.
echo interface AuthState {
echo   accessToken: string ^| null;
echo   user: User ^| null;
echo   isAuthenticated: boolean;
echo   setCredentials: ^(token: string, user: User^) =^> void;
echo   logout: ^(^) =^> void;
echo }
echo.
echo export const useAuthStore = create^<AuthState^>^(^)^(
echo   persist^(
echo     ^(set^) =^> ^({
echo       accessToken: null,
echo       user: null,
echo       isAuthenticated: false,
echo       setCredentials: ^(token, user^) =^>
echo         set^({ accessToken: token, user, isAuthenticated: true }^),
echo       logout: ^(^) =^>
echo         set^({ accessToken: null, user: null, isAuthenticated: false }^),
echo     }^),
echo     { name: "auth-storage" }
echo   ^)
echo ^);
) > src\store\auth-store.ts

:: Create Zustand sidebar store
(
echo import { create } from "zustand";
echo.
echo interface SidebarState {
echo   isOpen: boolean;
echo   isCollapsed: boolean;
echo   toggle: ^(^) =^> void;
echo   toggleCollapse: ^(^) =^> void;
echo   setOpen: ^(open: boolean^) =^> void;
echo }
echo.
echo export const useSidebarStore = create^<SidebarState^>^(^)^(^(set^) =^> ^({
echo   isOpen: true,
echo   isCollapsed: false,
echo   toggle: ^(^) =^> set^(^(state^) =^> ^({ isOpen: !state.isOpen }^)^),
echo   toggleCollapse: ^(^) =^> set^(^(state^) =^> ^({ isCollapsed: !state.isCollapsed }^)^),
echo   setOpen: ^(open^) =^> set^({ isOpen: open }^),
echo }^)^);
) > src\store\sidebar-store.ts

:: Create Zustand filter store
(
echo import { create } from "zustand";
echo.
echo interface FilterState {
echo   search: string;
echo   category: string ^| null;
echo   sortBy: string;
echo   setSearch: ^(search: string^) =^> void;
echo   setCategory: ^(category: string ^| null^) =^> void;
echo   setSortBy: ^(sortBy: string^) =^> void;
echo   reset: ^(^) =^> void;
echo }
echo.
echo export const useFilterStore = create^<FilterState^>^(^)^(^(set^) =^> ^({
echo   search: "",
echo   category: null,
echo   sortBy: "relevance",
echo   setSearch: ^(search^) =^> set^({ search }^),
echo   setCategory: ^(category^) =^> set^({ category }^),
echo   setSortBy: ^(sortBy^) =^> set^({ sortBy }^),
echo   reset: ^(^) =^> set^({ search: "", category: null, sortBy: "relevance" }^),
echo }^)^);
) > src\store\filter-store.ts

:: Create store index
(
echo export { useAuthStore } from "./auth-store";
echo export { useSidebarStore } from "./sidebar-store";
echo export { useFilterStore } from "./filter-store";
) > src\store\index.ts

:: Create providers index
(
echo "use client";
echo.
echo import { ThemeProvider } from "./theme-provider";
echo import { QueryProvider } from "./query-provider";
echo import { Toaster } from "@/components/ui/sonner";
echo.
echo export function Providers^({ children }: { children: React.ReactNode }^) {
echo   return ^(
echo     ^<QueryProvider^>
echo       ^<ThemeProvider
echo         attribute="class"
echo         defaultTheme="system"
echo         enableSystem
echo         disableTransitionOnChange
echo       ^>
echo         {children}
echo         ^<Toaster /^>
echo       ^</ThemeProvider^>
echo     ^</QueryProvider^>
echo   ^);
echo }
) > src\providers\index.tsx

:: Create API client
(
echo import axios from "axios";
echo.
echo const API_URL = process.env.NEXT_PUBLIC_API_URL ^|^| "http://localhost:3001/api";
echo.
echo export const apiClient = axios.create^({
echo   baseURL: API_URL,
echo   headers: {
echo     "Content-Type": "application/json",
echo   },
echo   withCredentials: true,
echo }^);
echo.
echo // Request interceptor - add auth token
echo apiClient.interceptors.request.use^(
echo   ^(config^) =^> {
echo     const token = typeof window !== "undefined"
echo       ? localStorage.getItem^("accessToken"^)
echo       : null;
echo     if ^(token^) {
echo       config.headers.Authorization = `Bearer ${token}`;
echo     }
echo     return config;
echo   },
echo   ^(error^) =^> Promise.reject^(error^)
echo ^);
echo.
echo // Response interceptor - handle errors
echo apiClient.interceptors.response.use^(
echo   ^(response^) =^> response,
echo   async ^(error^) =^> {
echo     if ^(error.response?.status === 401^) {
echo       if ^(typeof window !== "undefined"^) {
echo         localStorage.removeItem^("accessToken"^);
echo         window.location.href = "/login";
echo       }
echo     }
echo     return Promise.reject^(error^);
echo   }
echo ^);
) > src\lib\api\client.ts

:: Create types index
(
echo // Common types
echo export interface PaginatedResponse^<T^> {
echo   data: T[];
echo   meta: {
echo     total: number;
echo     page: number;
echo     limit: number;
echo     totalPages: number;
echo   };
echo }
echo.
echo export interface ApiResponse^<T^> {
echo   success: boolean;
echo   data: T;
echo   message?: string;
echo }
echo.
echo export interface ApiError {
echo   success: false;
echo   error: {
echo     code: string;
echo     message: string;
echo     details?: Record^<string, string[]^>;
echo   };
echo }
echo.
echo export type UserRole =
echo   ^| "ADMIN_SYSTEM"
echo   ^| "OPERATIONAL_ADMIN"
echo   ^| "OPERATIONAL_MANAGER"
echo   ^| "OPERATIONAL_ASSISTANT"
echo   ^| "MARKETING_SERVICES_ADMIN"
echo   ^| "CONTENT_WRITER"
echo   ^| "MULTI_MEDIA_MANAGER"
echo   ^| "SALES_MANAGER"
echo   ^| "BUSINESS_ADMIN"
echo   ^| "USER";
echo.
echo export interface User {
echo   id: string;
echo   email: string;
echo   firstName: string;
echo   lastName: string;
echo   role: UserRole;
echo   avatar?: string;
echo   createdAt: string;
echo   updatedAt: string;
echo }
) > src\types\index.ts

:: Create useDebounce hook
(
echo import { useState, useEffect } from "react";
echo.
echo export function useDebounce^<T^>^(value: T, delay: number^): T {
echo   const [debouncedValue, setDebouncedValue] = useState^<T^>^(value^);
echo.
echo   useEffect^(^(^) =^> {
echo     const handler = setTimeout^(^(^) =^> {
echo       setDebouncedValue^(value^);
echo     }, delay^);
echo.
echo     return ^(^) =^> {
echo       clearTimeout^(handler^);
echo     };
echo   }, [value, delay]^);
echo.
echo   return debouncedValue;
echo }
) > src\hooks\use-debounce.ts

:: Create useMobile hook
(
echo import { useState, useEffect } from "react";
echo.
echo export function useMediaQuery^(query: string^): boolean {
echo   const [matches, setMatches] = useState^(false^);
echo.
echo   useEffect^(^(^) =^> {
echo     const media = window.matchMedia^(query^);
echo     if ^(media.matches !== matches^) {
echo       setMatches^(media.matches^);
echo     }
echo     const listener = ^(^) =^> setMatches^(media.matches^);
echo     media.addEventListener^("change", listener^);
echo     return ^(^) =^> media.removeEventListener^("change", listener^);
echo   }, [matches, query]^);
echo.
echo   return matches;
echo }
echo.
echo export function useMobile^(^) {
echo   return useMediaQuery^("^(max-width: 768px^)"^);
echo }
) > src\hooks\use-mobile.ts

:: Create placeholder layout files
(
echo export default function PublicLayout^({
echo   children,
echo }: {
echo   children: React.ReactNode;
echo }^) {
echo   return ^<^>{children}^</^>;
echo }
) > src\app\(public)\layout.tsx

(
echo export default function UserLayout^({
echo   children,
echo }: {
echo   children: React.ReactNode;
echo }^) {
echo   return ^<^>{children}^</^>;
echo }
) > src\app\(user)\layout.tsx

(
echo export default function BusinessLayout^({
echo   children,
echo }: {
echo   children: React.ReactNode;
echo }^) {
echo   return ^<^>{children}^</^>;
echo }
) > src\app\(business)\layout.tsx

(
echo export default function AdminLayout^({
echo   children,
echo }: {
echo   children: React.ReactNode;
echo }^) {
echo   return ^<^>{children}^</^>;
echo }
) > src\app\(admin)\layout.tsx

:: Create public landing page
(
echo export default function HomePage^(^) {
echo   return ^(
echo     ^<main className="flex min-h-screen flex-col items-center justify-center p-24"^>
echo       ^<h1 className="text-4xl font-bold"^>Welcome to Omnicassion^</h1^>
echo       ^<p className="mt-4 text-muted-foreground"^>
echo         Your ultimate event planning platform
echo       ^</p^>
echo     ^</main^>
echo   ^);
echo }
) > src\app\(public)\page.tsx

:: Update root layout with providers
(
echo import type { Metadata } from "next";
echo import { Inter } from "next/font/google";
echo import "./globals.css";
echo import { Providers } from "@/providers";
echo.
echo const inter = Inter^({
echo   subsets: ["latin"],
echo   variable: "--font-sans"
echo }^);
echo.
echo export const metadata: Metadata = {
echo   title: "Omnicassion - Event Planning Platform",
echo   description: "Your ultimate event planning ecosystem",
echo };
echo.
echo export default function RootLayout^({
echo   children,
echo }: {
echo   children: React.ReactNode;
echo }^) {
echo   return ^(
echo     ^<html lang="en" suppressHydrationWarning^>
echo       ^<body className={`${inter.variable} font-sans antialiased`}^>
echo         ^<Providers^>{children}^</Providers^>
echo       ^</body^>
echo     ^</html^>
echo   ^);
echo }
) > src\app\layout.tsx

:: Create globals.css with theme variables
(
echo @tailwind base;
echo @tailwind components;
echo @tailwind utilities;
echo.
echo @layer base {
echo   :root {
echo     --background: 0 0%% 100%%;
echo     --foreground: 222.2 84%% 4.9%%;
echo     --card: 0 0%% 100%%;
echo     --card-foreground: 222.2 84%% 4.9%%;
echo     --popover: 0 0%% 100%%;
echo     --popover-foreground: 222.2 84%% 4.9%%;
echo     --primary: 222.2 47.4%% 11.2%%;
echo     --primary-foreground: 210 40%% 98%%;
echo     --secondary: 210 40%% 96.1%%;
echo     --secondary-foreground: 222.2 47.4%% 11.2%%;
echo     --muted: 210 40%% 96.1%%;
echo     --muted-foreground: 215.4 16.3%% 46.9%%;
echo     --accent: 210 40%% 96.1%%;
echo     --accent-foreground: 222.2 47.4%% 11.2%%;
echo     --destructive: 0 84.2%% 60.2%%;
echo     --destructive-foreground: 210 40%% 98%%;
echo     --border: 214.3 31.8%% 91.4%%;
echo     --input: 214.3 31.8%% 91.4%%;
echo     --ring: 222.2 84%% 4.9%%;
echo     --radius: 0.5rem;
echo     --brand-50: 340 100%% 97%%;
echo     --brand-100: 340 96%% 93%%;
echo     --brand-200: 340 94%% 86%%;
echo     --brand-300: 340 90%% 76%%;
echo     --brand-400: 340 85%% 63%%;
echo     --brand-500: 340 82%% 52%%;
echo     --brand-600: 340 84%% 44%%;
echo     --brand-700: 340 83%% 37%%;
echo     --brand-800: 340 79%% 31%%;
echo     --brand-900: 340 75%% 26%%;
echo   }
echo.
echo   .dark {
echo     --background: 222.2 84%% 4.9%%;
echo     --foreground: 210 40%% 98%%;
echo     --card: 222.2 84%% 4.9%%;
echo     --card-foreground: 210 40%% 98%%;
echo     --popover: 222.2 84%% 4.9%%;
echo     --popover-foreground: 210 40%% 98%%;
echo     --primary: 210 40%% 98%%;
echo     --primary-foreground: 222.2 47.4%% 11.2%%;
echo     --secondary: 217.2 32.6%% 17.5%%;
echo     --secondary-foreground: 210 40%% 98%%;
echo     --muted: 217.2 32.6%% 17.5%%;
echo     --muted-foreground: 215 20.2%% 65.1%%;
echo     --accent: 217.2 32.6%% 17.5%%;
echo     --accent-foreground: 210 40%% 98%%;
echo     --destructive: 0 62.8%% 30.6%%;
echo     --destructive-foreground: 210 40%% 98%%;
echo     --border: 217.2 32.6%% 17.5%%;
echo     --input: 217.2 32.6%% 17.5%%;
echo     --ring: 212.7 26.8%% 83.9%%;
echo   }
echo }
echo.
echo @layer base {
echo   * {
echo     @apply border-border;
echo   }
echo   body {
echo     @apply bg-background text-foreground;
echo     font-feature-settings: "rlig" 1, "calt" 1;
echo   }
echo }
) > src\app\globals.css

:: Create .prettierrc
(
echo {
echo   "semi": true,
echo   "singleQuote": false,
echo   "tabWidth": 2,
echo   "trailingComma": "es5",
echo   "printWidth": 100,
echo   "plugins": ["prettier-plugin-tailwindcss"]
echo }
) > .prettierrc

echo.
echo [8/8] Setup complete!
echo.
echo ========================================
echo  Frontend project created successfully!
echo ========================================
echo.
echo Next steps:
echo   1. cd %FRONTEND_DIR%
echo   2. Update .env.local with your configuration
echo   3. npm run dev
echo.
echo Useful commands:
echo   npm run dev                          - Start development server
echo   npm run build                        - Build for production
echo   npm run lint                         - Run ESLint
echo   npx shadcn@latest add [component]    - Add more shadcn components
echo.
echo Project structure created:
echo   - (public)   : Public pages (landing, vendors, auth)
echo   - (user)     : User/Planner dashboard
echo   - (business) : Vendor/Business dashboard
echo   - (admin)    : Admin dashboards (ops, marketing, sales, system)
echo.

cd ..
pause
