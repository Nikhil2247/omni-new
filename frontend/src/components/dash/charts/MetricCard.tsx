'use client'

import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface MetricCardProps {
  title: string
  value: number | string
  change?: number
  changeLabel?: string
  trend?: number[]
  icon?: React.ElementType
  variant?: 'default' | 'gradient'
  className?: string
  valueFormatter?: (value: number | string) => string
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel = 'vs last period',
  trend,
  icon: Icon,
  variant = 'default',
  className,
  valueFormatter = (v) => String(v),
}: MetricCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral = change === 0

  // Build sparkline data
  const sparklineData = trend?.map((v, i) => ({ value: v, index: i })) || []

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all hover:shadow-sm',
        variant === 'gradient' && 'bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5',
        className
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight">
              {typeof value === 'number' ? valueFormatter(value) : value}
            </p>

            {change !== undefined && (
              <div className="mt-2 flex items-center gap-1">
                {isPositive && (
                  <TrendingUp className="h-4 w-4 text-success" />
                )}
                {isNegative && (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                {isNeutral && (
                  <Minus className="h-4 w-4 text-muted-foreground" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    isPositive && 'text-success',
                    isNegative && 'text-destructive',
                    isNeutral && 'text-muted-foreground'
                  )}
                >
                  {isPositive && '+'}
                  {change.toFixed(1)}%
                </span>
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-2">
            {Icon && (
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl',
                  variant === 'gradient'
                    ? 'bg-primary/20'
                    : 'bg-muted'
                )}
              >
                <Icon
                  className={cn(
                    'h-5 w-5',
                    variant === 'gradient'
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  )}
                />
              </div>
            )}

            {sparklineData.length > 0 && (
              <div className="h-10 w-20">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sparklineData}>
                    <defs>
                      <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor={isPositive ? 'var(--chart-2)' : isNegative ? 'var(--destructive)' : 'var(--muted-foreground)'}
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="100%"
                          stopColor={isPositive ? 'var(--chart-2)' : isNegative ? 'var(--destructive)' : 'var(--muted-foreground)'}
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={isPositive ? 'var(--success)' : isNegative ? 'var(--destructive)' : 'var(--muted-foreground)'}
                      strokeWidth={1.5}
                      fill="url(#sparklineGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
