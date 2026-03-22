"use client";

import { ThemeProvider } from "./theme-provider";
import { QueryProvider } from "./query-provider";
import { WebSocketProvider } from "./websocket-provider";
import { AnalyticsProvider } from "./analytics-provider";
import { FeatureProvider } from "./feature-provider";
import { Toaster } from "@/components/ui/sonner";
import { MaintenanceGuard } from "@/components/common/maintenance-guard";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <FeatureProvider>
          <WebSocketProvider>
            <MaintenanceGuard>
              <AnalyticsProvider />
              {children}
            </MaintenanceGuard>
            <Toaster />
          </WebSocketProvider>
        </FeatureProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
