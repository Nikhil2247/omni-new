'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

/**
 * Funnel step data
 */
export interface FunnelStepData {
  stepIndex: number;
  stepName: string;
  displayName: string;
  totalUsers: number;
  completions: number;
  dropoffs: number;
  conversionRate: number;
  overallConversionRate: number;
}

/**
 * Funnel analysis result
 */
export interface FunnelAnalysis {
  funnelName: string;
  displayName: string;
  description: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  totalSessions: number;
  completedSessions: number;
  overallConversionRate: number;
  steps: FunnelStepData[];
  averageTimeToComplete?: number;
}

/**
 * Funnel Chart Props
 */
export interface FunnelChartProps {
  data: FunnelAnalysis;
  className?: string;
  showDropoffRates?: boolean;
  highlightDropoffs?: boolean;
}

/**
 * Format number with commas
 */
function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Format percentage
 */
function formatPercentage(num: number): string {
  return `${num.toFixed(1)}%`;
}

/**
 * Format time duration
 */
function formatDuration(seconds?: number): string {
  if (!seconds) return 'N/A';

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${Math.floor(seconds % 60)}s`;
  return `${Math.floor(seconds)}s`;
}

/**
 * Funnel Chart Component
 *
 * Visualizes conversion funnel data with step-by-step breakdown
 */
export function FunnelChart({
  data,
  className = '',
  showDropoffRates = true,
  highlightDropoffs = true,
}: FunnelChartProps) {
  const maxWidth = 100; // Percentage
  const minWidth = 20; // Minimum bar width for visibility

  // Safe defaults
  const displayName = data?.displayName || 'Funnel';
  const description = data?.description || '';
  const totalSessions = data?.totalSessions || 0;
  const completedSessions = data?.completedSessions || 0;
  const overallConversionRate = data?.overallConversionRate || 0;
  const steps = data?.steps || [];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{displayName}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Sessions:</span>{' '}
            <span className="font-semibold">{formatNumber(totalSessions)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Completed:</span>{' '}
            <span className="font-semibold">{formatNumber(completedSessions)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Overall Conversion:</span>{' '}
            <span className="font-semibold text-green-600">
              {formatPercentage(overallConversionRate)}
            </span>
          </div>
          {data?.averageTimeToComplete && (
            <div>
              <span className="text-muted-foreground">Avg. Time:</span>{' '}
              <span className="font-semibold">{formatDuration(data.averageTimeToComplete)}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {steps.map((step, index) => {
            const barWidth = step.totalUsers > 0
              ? Math.max(
                  minWidth,
                  (step.overallConversionRate / 100) * maxWidth,
                )
              : minWidth;

            const dropoffRate = 100 - step.conversionRate;
            const isHighDropoff = highlightDropoffs && dropoffRate > 30;

            return (
              <div key={step.stepIndex} className="space-y-2">
                {/* Step Header */}
                <div className="flex items-baseline justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      Step {step.stepIndex + 1}
                    </span>
                    <span className="font-semibold">{step.displayName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span>
                      <span className="text-muted-foreground">Users:</span>{' '}
                      <span className="font-semibold">{formatNumber(step.totalUsers)}</span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Rate:</span>{' '}
                      <span className="font-semibold">
                        {formatPercentage(step.overallConversionRate)}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Funnel Bar */}
                <div className="relative h-12 w-full bg-gray-100 rounded-lg overflow-hidden">
                  <div
                    className={`absolute left-0 top-0 h-full rounded-lg transition-all ${
                      isHighDropoff
                        ? 'bg-gradient-to-r from-red-400 to-red-500'
                        : 'bg-gradient-to-r from-blue-400 to-blue-600'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  >
                    <div className="flex h-full items-center justify-end pr-3">
                      <span className="text-white font-semibold text-sm">
                        {formatPercentage(step.overallConversionRate)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Drop-off Information */}
                {showDropoffRates && index < steps.length - 1 && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {step.conversionRate < 100 && (
                        <>
                          <span className={isHighDropoff ? 'text-red-600 font-medium' : ''}>
                            {formatNumber(step.dropoffs)} dropped off
                          </span>
                          <span className="mx-1">•</span>
                          <span className={isHighDropoff ? 'text-red-600 font-medium' : ''}>
                            {formatPercentage(dropoffRate)} drop-off rate
                          </span>
                        </>
                      )}
                    </span>
                    <span>
                      {formatPercentage(step.conversionRate)} continue to next step
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-8 pt-6 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(totalSessions)}
              </div>
              <div className="text-sm text-muted-foreground">Started</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(completedSessions)}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {formatPercentage(overallConversionRate)}
              </div>
              <div className="text-sm text-muted-foreground">Conversion Rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FunnelChart;
