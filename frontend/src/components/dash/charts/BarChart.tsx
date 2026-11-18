'use client'

import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface BarChartDataItem {
  name: string
  value: number
  fill?: string
}

export interface BarChartProps {
  data: BarChartDataItem[]
  layout?: 'horizontal' | 'vertical'
  title?: string
  description?: string
  height?: number
  barColor?: string
  showGrid?: boolean
  className?: string
  valueFormatter?: (value: number) => string
}

const defaultColors = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function BarChart({
  data,
  layout = 'vertical',
  title,
  description,
  height = 300,
  barColor,
  showGrid = false,
  className,
  valueFormatter = (v) => v.toLocaleString(),
}: BarChartProps) {
  // Filter out items with 0 values for cleaner display, but keep at least the data
  const chartData = data.length > 0 ? data : []

  // If no data or all zeros, show a placeholder message
  const hasValidData = chartData.some(item => item.value > 0)

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
        <RechartsBarChart
          data={chartData}
          layout={layout}
          margin={layout === 'horizontal'
            ? { top: 10, right: 10, left: 10, bottom: 20 }
            : { top: 10, right: 30, left: 10, bottom: 10 }
          }
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}

          {layout === 'horizontal' ? (
            <>
              <XAxis
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                tick={{ fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => valueFormatter(value)}
                fontSize={12}
                tick={{ fill: 'var(--muted-foreground)' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill || barColor || defaultColors[index % defaultColors.length]}
                  />
                ))}
              </Bar>
            </>
          ) : (
            <>
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => valueFormatter(value)}
                fontSize={12}
                tick={{ fill: 'var(--muted-foreground)' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={80}
                fontSize={12}
                tick={{ fill: 'var(--muted-foreground)' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.fill || barColor || defaultColors[index % defaultColors.length]}
                  />
                ))}
              </Bar>
            </>
          )}

          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            cursor={{ fill: 'var(--muted)', opacity: 0.3 }}
            formatter={(value: number) => [valueFormatter(value), 'Value']}
          />
        </RechartsBarChart>
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
