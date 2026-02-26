'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FunnelChart, type FunnelAnalysis } from './FunnelChart';
import { TrendingDown, TrendingUp, Filter } from 'lucide-react';
import { subDays } from 'date-fns';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/endpoints';

/**
 * Funnel definition from backend
 */
interface FunnelDefinition {
  name: string;
  displayName: string;
  description: string;
  steps: Array<{
    index: number;
    name: string;
    displayName: string;
  }>;
}

/**
 * Fetch available funnels
 */
async function fetchFunnels(): Promise<FunnelDefinition[]> {
  const { data } = await apiClient.get(API_ENDPOINTS.ADMIN.INSIGHTS.FUNNELS);
  // Handle both direct array response and wrapped response
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object' && Array.isArray(data.data)) {
    return data.data;
  }
  console.error('Unexpected funnels response format:', data);
  return [];
}

/**
 * Fetch funnel analysis
 */
async function fetchFunnelAnalysis(
  funnelName: string,
  startDate: Date,
  endDate: Date,
): Promise<FunnelAnalysis | null> {
  try {
    const { data } = await apiClient.get(
      API_ENDPOINTS.ADMIN.INSIGHTS.FUNNEL_ANALYSIS(funnelName),
      {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      }
    );
    // Handle wrapped response
    if (data && typeof data === 'object' && data.data) {
      return data.data;
    }
    return data;
  } catch (error) {
    console.error('Error fetching funnel analysis:', error);
    return null;
  }
}

/**
 * Fetch top drop-off points
 */
async function fetchTopDropoffs(
  startDate: Date,
  endDate: Date,
  limit: number = 10,
): Promise<
  Array<{
    funnelName: string;
    stepIndex: number;
    stepName: string;
    dropoffRate: number;
    affectedSessions: number;
  }>
> {
  try {
    const { data } = await apiClient.get(`${API_ENDPOINTS.ADMIN.INSIGHTS.FUNNELS}/dropoffs`, {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: limit.toString(),
      },
    });
    // Handle wrapped response
    if (Array.isArray(data)) {
      return data;
    }
    if (data && typeof data === 'object' && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching top dropoffs:', error);
    return [];
  }
}

/**
 * Date range selector
 */
function DateRangeSelector({
  value,
  onChange,
}: {
  value: { startDate: Date; endDate: Date };
  onChange: (value: { startDate: Date; endDate: Date }) => void;
}) {
  const presets = [
    { label: 'Last 7 Days', days: 7 },
    { label: 'Last 30 Days', days: 30 },
    { label: 'Last 90 Days', days: 90 },
  ];

  return (
    <div className="flex gap-2">
      {presets.map((preset) => (
        <button
          key={preset.days}
          onClick={() =>
            onChange({
              startDate: subDays(new Date(), preset.days),
              endDate: new Date(),
            })
          }
          className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Drop-off highlights component
 */
function DropoffHighlights({
  startDate,
  endDate,
}: {
  startDate: Date;
  endDate: Date;
}) {
  const { data: dropoffs, isLoading } = useQuery({
    queryKey: ['funnel-dropoffs', startDate, endDate],
    queryFn: () => fetchTopDropoffs(startDate, endDate, 5),
  });

  if (isLoading) {
    return <Skeleton className="h-48" />;
  }

  if (!dropoffs || dropoffs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Top Drop-off Points
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No drop-off data available for this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-red-500" />
          Top Drop-off Points
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Highest drop-off rates across all funnels
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {dropoffs.map((dropoff, index) => {
            const isHigh = dropoff.dropoffRate > 50;
            return (
              <div
                key={`${dropoff.funnelName}-${dropoff.stepIndex}`}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                      isHigh
                        ? 'bg-red-100 text-red-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {dropoff.funnelName.replace(/_/g, ' ')} - {dropoff.stepName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dropoff.affectedSessions.toLocaleString()} sessions affected
                    </p>
                  </div>
                </div>
                <Badge variant={isHigh ? 'destructive' : 'secondary'}>
                  {dropoff.dropoffRate.toFixed(1)}% drop-off
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Funnel Dashboard Component
 */
export function FunnelDashboard() {
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 30),
    endDate: new Date(),
  });

  // Fetch available funnels
  const { data: funnels, isLoading: funnelsLoading } = useQuery({
    queryKey: ['funnels'],
    queryFn: fetchFunnels,
  });

  // Ensure funnels is always an array
  const safeFunnels = Array.isArray(funnels) ? funnels : [];

  if (funnelsLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!safeFunnels || safeFunnels.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No funnels configured. Contact support to set up conversion tracking.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Conversion Funnels</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Analyze user journey and identify optimization opportunities
          </p>
        </div>
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      {/* Drop-off Highlights */}
      <DropoffHighlights startDate={dateRange.startDate} endDate={dateRange.endDate} />

      {/* Funnel Tabs */}
      <Tabs defaultValue={safeFunnels[0]?.name} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
          {safeFunnels.map((funnel) => (
            <TabsTrigger key={funnel.name} value={funnel.name}>
              {funnel.displayName}
            </TabsTrigger>
          ))}
        </TabsList>

        {safeFunnels.map((funnel) => (
          <TabsContent key={funnel.name} value={funnel.name}>
            <FunnelContent
              funnelName={funnel.name}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

/**
 * Individual funnel content
 */
function FunnelContent({
  funnelName,
  startDate,
  endDate,
}: {
  funnelName: string;
  startDate: Date;
  endDate: Date;
}) {
  const { data: analysis, isLoading } = useQuery({
    queryKey: ['funnel-analysis', funnelName, startDate, endDate],
    queryFn: () => fetchFunnelAnalysis(funnelName, startDate, endDate),
  });

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!analysis) {
    return (
      <Card>
        <CardContent className="flex h-48 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No data available for this funnel in the selected date range.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Funnel Chart */}
      <FunnelChart
        data={analysis}
        showDropoffRates={true}
        highlightDropoffs={true}
      />

      {/* Insights Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Best Performing Step */}
            {analysis.steps.length > 0 && (
              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Best Performing Step
                </h4>
                <p className="mt-2 text-lg font-semibold">
                  {
                    [...analysis.steps].sort(
                      (a, b) => b.conversionRate - a.conversionRate,
                    )[0].displayName
                  }
                </p>
                <p className="text-sm text-muted-foreground">
                  {[...analysis.steps]
                    .sort((a, b) => b.conversionRate - a.conversionRate)[0]
                    .conversionRate.toFixed(1)}
                  % continue to next step
                </p>
              </div>
            )}

            {/* Biggest Drop-off */}
            {analysis.steps.length > 0 && (
              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Biggest Drop-off
                </h4>
                <p className="mt-2 text-lg font-semibold">
                  {
                    [...analysis.steps].sort(
                      (a, b) => a.conversionRate - b.conversionRate,
                    )[0].displayName
                  }
                </p>
                <p className="text-sm text-red-600">
                  {(
                    100 -
                    [...analysis.steps].sort(
                      (a, b) => a.conversionRate - b.conversionRate,
                    )[0].conversionRate
                  ).toFixed(1)}
                  % drop-off rate
                </p>
              </div>
            )}

            {/* Completion Time */}
            {analysis.averageTimeToComplete && (
              <div className="rounded-lg border p-4">
                <h4 className="text-sm font-medium text-muted-foreground">
                  Average Time to Complete
                </h4>
                <p className="mt-2 text-lg font-semibold">
                  {formatDuration(analysis.averageTimeToComplete)}
                </p>
                <p className="text-sm text-muted-foreground">For successful conversions</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Format duration helper
 */
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${Math.floor(seconds % 60)}s`;
  return `${Math.floor(seconds)}s`;
}

export default FunnelDashboard;
