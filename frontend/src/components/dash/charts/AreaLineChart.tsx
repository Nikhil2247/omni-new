'use client'

import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface AreaLineChartDataKey {
  key: string
  label: string
  color: string
}

export interface AreaLineChartProps {
  data: Array<Record<string, string | number>>
  dataKeys: AreaLineChartDataKey[]
  xAxisKey?: string
  title?: string
  description?: string
  height?: number
  showLegend?: boolean
  gradientFill?: boolean
  showGrid?: boolean
  className?: string
}

export function AreaLineChart({
  data,
  dataKeys,
  xAxisKey = 'date',
  title,
  description,
  height = 300,
  showLegend = true,
  gradientFill = true,
  showGrid = true,
  className,
}: AreaLineChartProps) {
  // Check if there's valid data
  const hasValidData = data.length > 0 && dataKeys.some(({ key }) =>
    data.some(item => typeof item[key] === 'number' && item[key] > 0)
  )

  if (!hasValidData) {
    if (title) {
      return (
        <Card className={className}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
              No data available
            </div>
          </CardContent>
        </Card>
      )
    }
    return (
      <div className="flex items-center justify-center text-muted-foreground" style={{ height }}>
        No data available
      </div>
    )
  }

  const chartContent = (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {dataKeys.map(({ key, color }) => (
              <linearGradient key={key} id={`gradient-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                <stop offset="100%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--muted)" />}
          <XAxis
            dataKey={xAxisKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => {
              if (typeof value === 'string' && value.includes('-')) {
                const date = new Date(value)
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }
              return value
            }}
            fontSize={12}
            tick={{ fill: 'var(--muted-foreground)' }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
              if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
              return value
            }}
            fontSize={12}
            tick={{ fill: 'var(--muted-foreground)' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ fontWeight: 600, marginBottom: '4px' }}
          />
          {dataKeys.map(({ key, color, label }) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              name={label}
              stroke={color}
              strokeWidth={2}
              fill={gradientFill ? `url(#gradient-${key})` : color}
              fillOpacity={gradientFill ? 1 : 0.1}
            />
          ))}
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry) => {
                const dataKey = dataKeys.find(dk => dk.key === entry.dataKey)
                return <span style={{ color: 'var(--foreground)', fontSize: '12px' }}>{dataKey?.label || value}</span>
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )

  if (title) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent className="pt-0">{chartContent}</CardContent>
      </Card>
    )
  }

  return chartContent
}
