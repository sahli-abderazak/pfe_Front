"use client"

import * as React from "react"
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"

const ChartContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("h-[350px] w-full", className)} {...props} />,
)
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = React.forwardRef<React.ElementRef<typeof Tooltip>, React.ComponentPropsWithoutRef<typeof Tooltip>>(
  ({ className, ...props }, ref) => (
    <Tooltip
      ref={ref}
      content={({ active, payload }) => {
        if (active && payload && payload.length) {
          return (
            <div className="rounded-lg border bg-background p-2 shadow-sm">
              <div className="grid grid-cols-2 gap-2">
                {payload.map((entry) => (
                  <div key={entry.name} className="flex flex-col">
                    <span className="text-[0.70rem] uppercase text-muted-foreground">{entry.name}</span>
                    <span className="font-bold text-muted-foreground">{entry.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        return null
      }}
      {...props}
    />
  ),
)
ChartTooltip.displayName = "ChartTooltip"

const ChartLabel = React.forwardRef<React.ElementRef<"text">, React.ComponentPropsWithoutRef<"text">>(
  ({ className, ...props }, ref) => (
    <text ref={ref} className={cn("fill-muted-foreground text-sm font-medium", className)} {...props} />
  ),
)
ChartLabel.displayName = "ChartLabel"

// BarChart
interface BarChartProps {
  data: any[]
  index: string
  categories: string[]
  colors?: string[]
  valueFormatter?: (value: number) => string
  yAxisWidth?: number
  showAnimation?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  showLegend?: boolean
  showGridLines?: boolean
  startEndOnly?: boolean
  className?: string
}

function BarChart({
  data,
  index,
  categories,
  colors = ["#2563eb", "#e11d48"],
  valueFormatter = (value: number) => value.toString(),
  yAxisWidth = 56,
  showAnimation = true,
  showXAxis = true,
  showYAxis = true,
  showLegend = true,
  showGridLines = true,
  startEndOnly = false,
  className,
}: BarChartProps) {
  const formatter = (value: number) => valueFormatter(value)

  const customTicks = startEndOnly ? (data.length > 1 ? [0, data.length - 1] : [0]) : undefined

  return (
    <ChartContainer className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{
            top: 16,
            right: 16,
            bottom: 16,
            left: 16,
          }}
        >
          {showGridLines && (
            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} className="stroke-muted" />
          )}
          {showXAxis && (
            <XAxis
              dataKey={index}
              tick={{ transform: "translate(0, 6)" }}
              ticks={customTicks}
              className="text-xs text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
          )}
          {showYAxis && (
            <YAxis
              width={yAxisWidth}
              tickFormatter={formatter}
              className="text-xs text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {payload[0].payload[index]}
                        </span>
                      </div>
                      {payload.map((entry) => (
                        <div key={entry.name} className="flex flex-col">
                          <span
                            className="text-[0.70rem] uppercase text-muted-foreground"
                            style={{ color: entry.color }}
                          >
                            {entry.name}
                          </span>
                          <span className="font-bold" style={{ color: entry.color }}>
                            {valueFormatter(entry.value as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }

              return null
            }}
          />
          {showLegend && (
            <Legend
              content={({ payload }) => {
                if (payload && payload.length) {
                  return (
                    <div className="flex justify-center gap-8">
                      {payload.map((entry, index) => (
                        <div key={`item-${index}`} className="flex items-center gap-1">
                          <div className="rounded-sm px-2 py-0.5" style={{ backgroundColor: entry.color }} />
                          <span className="text-xs text-muted-foreground">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
          )}
          {categories.map((category, index) => (
            <Bar
              key={category}
              dataKey={category}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
              isAnimationActive={showAnimation}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// LineChart
interface LineChartProps {
  data: any[]
  index: string
  categories: string[]
  colors?: string[]
  valueFormatter?: (value: number) => string
  yAxisWidth?: number
  showAnimation?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  showLegend?: boolean
  showGridLines?: boolean
  startEndOnly?: boolean
  className?: string
}

function LineChart({
  data,
  index,
  categories,
  colors = ["#2563eb", "#e11d48"],
  valueFormatter = (value: number) => value.toString(),
  yAxisWidth = 56,
  showAnimation = true,
  showXAxis = true,
  showYAxis = true,
  showLegend = true,
  showGridLines = true,
  startEndOnly = false,
  className,
}: LineChartProps) {
  const formatter = (value: number) => valueFormatter(value)

  const customTicks = startEndOnly ? (data.length > 1 ? [0, data.length - 1] : [0]) : undefined

  return (
    <ChartContainer className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{
            top: 16,
            right: 16,
            bottom: 16,
            left: 16,
          }}
        >
          {showGridLines && (
            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} className="stroke-muted" />
          )}
          {showXAxis && (
            <XAxis
              dataKey={index}
              tick={{ transform: "translate(0, 6)" }}
              ticks={customTicks}
              className="text-xs text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
          )}
          {showYAxis && (
            <YAxis
              width={yAxisWidth}
              tickFormatter={formatter}
              className="text-xs text-muted-foreground"
              tickLine={false}
              axisLine={false}
            />
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {payload[0].payload[index]}
                        </span>
                      </div>
                      {payload.map((entry) => (
                        <div key={entry.name} className="flex flex-col">
                          <span
                            className="text-[0.70rem] uppercase text-muted-foreground"
                            style={{ color: entry.color }}
                          >
                            {entry.name}
                          </span>
                          <span className="font-bold" style={{ color: entry.color }}>
                            {valueFormatter(entry.value as number)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }

              return null
            }}
          />
          {showLegend && (
            <Legend
              content={({ payload }) => {
                if (payload && payload.length) {
                  return (
                    <div className="flex justify-center gap-8">
                      {payload.map((entry, index) => (
                        <div key={`item-${index}`} className="flex items-center gap-1">
                          <div className="rounded-sm px-2 py-0.5" style={{ backgroundColor: entry.color }} />
                          <span className="text-xs text-muted-foreground">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
          )}
          {categories.map((category, index) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              activeDot={{ r: 6 }}
              isAnimationActive={showAnimation}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// DonutChart
interface DonutChartProps {
  data: any[]
  index: string
  category: string
  colors?: string[]
  valueFormatter?: (value: number) => string
  showAnimation?: boolean
  showLabel?: boolean
  showLegend?: boolean
  className?: string
}

function DonutChart({
  data,
  index,
  category,
  colors = ["#2563eb", "#e11d48", "#f59e0b", "#10b981", "#8b5cf6"],
  valueFormatter = (value: number) => value.toString(),
  showAnimation = true,
  showLabel = true,
  showLegend = true,
  className,
}: DonutChartProps) {
  return (
    <ChartContainer className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey={category}
            nameKey={index}
            cx="50%"
            cy="50%"
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={2}
            isAnimationActive={showAnimation}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                className="stroke-background hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">{payload[0].name}</span>
                      <span className="font-bold" style={{ color: payload[0].color }}>
                        {valueFormatter(payload[0].value as number)}
                      </span>
                    </div>
                  </div>
                )
              }

              return null
            }}
          />
          {showLegend && (
            <Legend
              content={({ payload }) => {
                if (payload && payload.length) {
                  return (
                    <div className="flex flex-wrap justify-center gap-4">
                      {payload.map((entry, index) => (
                        <div key={`item-${index}`} className="flex items-center gap-1">
                          <div className="rounded-sm px-2 py-0.5" style={{ backgroundColor: entry.color }} />
                          <span className="text-xs text-muted-foreground">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// PieChart
interface PieChartProps {
  data: any[]
  index: string
  category: string
  colors?: string[]
  valueFormatter?: (value: number) => string
  showAnimation?: boolean
  showLabel?: boolean
  showLegend?: boolean
  className?: string
}

function PieChart({
  data,
  index,
  category,
  colors = ["#2563eb", "#e11d48", "#f59e0b", "#10b981", "#8b5cf6"],
  valueFormatter = (value: number) => value.toString(),
  showAnimation = true,
  showLabel = true,
  showLegend = true,
  className,
}: PieChartProps) {
  return (
    <ChartContainer className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey={category}
            nameKey={index}
            cx="50%"
            cy="50%"
            outerRadius="80%"
            isAnimationActive={showAnimation}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                className="stroke-background hover:opacity-80"
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="flex flex-col">
                      <span className="text-[0.70rem] uppercase text-muted-foreground">{payload[0].name}</span>
                      <span className="font-bold" style={{ color: payload[0].color }}>
                        {valueFormatter(payload[0].value as number)}
                      </span>
                    </div>
                  </div>
                )
              }

              return null
            }}
          />
          {showLegend && (
            <Legend
              content={({ payload }) => {
                if (payload && payload.length) {
                  return (
                    <div className="flex flex-wrap justify-center gap-4">
                      {payload.map((entry, index) => (
                        <div key={`item-${index}`} className="flex items-center gap-1">
                          <div className="rounded-sm px-2 py-0.5" style={{ backgroundColor: entry.color }} />
                          <span className="text-xs text-muted-foreground">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

export { BarChart, LineChart, DonutChart, PieChart, ChartContainer, ChartTooltip, ChartLabel }