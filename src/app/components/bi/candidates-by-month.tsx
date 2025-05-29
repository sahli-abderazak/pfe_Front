"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type CandidatesByMonth = {
  name: string
  Candidats: number
}

export function CandidatesByMonth() {
  const [data, setData] = useState<CandidatesByMonth[]>([])
  const [loading, setLoading] = useState(true)
  const [trend, setTrend] = useState<{ direction: "up" | "down" | "stable"; percentage: number }>({
    direction: "stable",
    percentage: 0,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token")
        const response = await fetch("http://localhost:8000/api/admin/candidats-par-mois", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const responseData = await response.json()
          setData(responseData)

          // Calculate trend (last month vs previous month)
          const lastTwoMonths = responseData.slice(-2)
          if (lastTwoMonths.length === 2) {
            const currentMonth = lastTwoMonths[1].Candidats
            const previousMonth = lastTwoMonths[0].Candidats
            const percentageChange = previousMonth !== 0 ? ((currentMonth - previousMonth) / previousMonth) * 100 : 0

            setTrend({
              direction: percentageChange > 0 ? "up" : percentageChange < 0 ? "down" : "stable",
              percentage: Math.abs(Math.round(percentageChange)),
            })
          }
        } else {
          console.error("Failed to fetch candidates by month")
        }
      } catch (error) {
        console.error("Error fetching candidates by month:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate min and max values for better Y-axis scaling
  const minValue = data.length > 0 ? Math.min(...data.map((item) => item.Candidats)) * 0.8 : 0
  const maxValue = data.length > 0 ? Math.max(...data.map((item) => item.Candidats)) * 1.2 : 100

  // Calculate total candidates
  const totalCandidates = data.reduce((sum, item) => sum + item.Candidats, 0)

  // Calculate average per month
  const averagePerMonth = data.length > 0 ? Math.round(totalCandidates / data.length) : 0

  // Add previous month data for comparison in tooltip
  const enhancedData = data.map((item, index) => ({
    ...item,
    previousMonth: index > 0 ? data[index - 1].Candidats : null,
  }))

  // Custom tooltip content
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const currentValue = payload[0].value
      const previousValue = payload[0].payload.previousMonth
      const change = previousValue !== null ? currentValue - previousValue : null
      const percentChange =
        previousValue !== null && previousValue !== 0 ? Math.round((change! / previousValue) * 100) : null

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <p className="font-medium text-gray-900">{label}</p>
          </div>
          <p className="text-gray-900 text-lg font-medium">{currentValue} candidats</p>

          {previousValue !== null && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="flex items-center gap-1 text-sm">
                <span className="text-gray-500">Mois précédent:</span>
                <span className="font-medium text-gray-700">{previousValue}</span>
              </div>

              {change !== null && (
                <div className="flex items-center gap-1 text-sm mt-1">
                  <span className="text-gray-500">Évolution:</span>
                  <span className={change > 0 ? "text-emerald-600" : change < 0 ? "text-slate-500" : "text-gray-500"}>
                    {change > 0 ? "+" : ""}
                    {change}
                    {percentChange !== null && ` (${percentChange > 0 ? "+" : ""}${percentChange}%)`}
                  </span>
                  {change > 0 ? (
                    <TrendingUp className="h-3 w-3 text-emerald-600" />
                  ) : change < 0 ? (
                    <TrendingDown className="h-3 w-3 text-slate-500" />
                  ) : (
                    <Minus className="h-3 w-3 text-gray-500" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-medium text-gray-900">Candidats par Mois</CardTitle>
          <CardDescription className="text-sm text-gray-500">Évolution mensuelle des inscriptions</CardDescription>
        </div>
        {!loading && data.length > 0 && (
          <Badge
            className={`flex items-center gap-1 ${
              trend.direction === "up"
                ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                : trend.direction === "down"
                  ? "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  : "bg-gray-50 text-gray-700 hover:bg-gray-100"
            }`}
          >
            {trend.direction === "up" ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : trend.direction === "down" ? (
              <TrendingDown className="h-3 w-3 mr-1" />
            ) : (
              <Minus className="h-3 w-3 mr-1" />
            )}
            {trend.percentage}% {trend.direction === "up" ? "hausse" : trend.direction === "down" ? "baisse" : "stable"}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : data.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        ) : (
          <>
            <ChartContainer
              config={{
                Candidats: {
                  label: "Candidats",
                  color: "hsl(213, 94%, 68%)",
                },
              }}
              className="h-[280px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={enhancedData} margin={{ top: 20, right: 20, left: 20, bottom: 10 }}>
                  <defs>
                    <linearGradient id="colorCandidats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                  />
                  <YAxis
                    domain={[minValue, maxValue]}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                    tickFormatter={(value) => Math.round(value).toString()}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
                  <Area
                    type="monotone"
                    dataKey="Candidats"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorCandidats)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Moyenne Mensuelle</p>
                <p className="text-xl font-bold text-gray-900">{averagePerMonth}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium text-gray-700">Mois le Plus Actif</p>
                <p className="text-xl font-bold text-gray-900">
                  {data.length > 0
                    ? data.reduce((max, item) => (item.Candidats > max.Candidats ? item : max), data[0]).name
                    : "N/A"}
                </p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
