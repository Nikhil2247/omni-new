'use client'

import { Cell, Pie, PieChart, Label, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface DonutChartDataItem {
  name: string
  value: number
  color?: string
}

export interface DonutChartProps {
  data: DonutChartDataItem[]
  title?: string
  description?: string
  centerLabel?: string
  centerValue?: string | number
  height?: number
  innerRadius?: number
  outerRadius?: number
  className?: string
  showLegend?: boolean
}

const defaultColors = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--muted-foreground))',
]

export function DonutChart({
  data,
  title,
  description,
  centerLabel,
  centerValue,
  height = 200,
  innerRadius = 60,
  outerRadius = 80,
  className,
  showLegend = true,
}: DonutChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Check if there's valid data
  const hasValidData = data.length > 0 && total > 0

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
    <div style={{ width: '100%', height }} className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number, name: string) => [
              `${value} (${Math.round((value / total) * 100)}%)`,
              name
            ]}
          />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            strokeWidth={2}
            stroke="hsl(var(--background))"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || defaultColors[index % defaultColors.length]}
              />
            ))}
            {(centerLabel || centerValue) && (
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-2xl font-bold"
                        >
                          {centerValue}
                        </tspan>
                        {centerLabel && (
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 20}
                            className="fill-muted-foreground text-xs"
                          >
                            {centerLabel}
                          </tspan>
                        )}
                      </text>
                    )
                  }
                }}
              />
            )}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  )

  // Legend component
  const legend = showLegend && (
    <div className="flex flex-wrap justify-center gap-4 pt-4">
      {data.map((item, index) => (
        <div key={item.name} className="flex items-center gap-2 text-sm">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: item.color || defaultColors[index % defaultColors.length] }}
          />
          <span className="text-muted-foreground">{item.name}</span>
          <span className="font-medium">{item.value}</span>
        </div>
      ))}
    </div>
  )

  if (title) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent className="pt-0">
          {chartContent}
          {legend}
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      {chartContent}
      {legend}
    </div>
  )
}
