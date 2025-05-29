"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartTooltip } from "@/components/ui/chart1"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Sector } from "recharts"
import { MapPin } from 'lucide-react'

type OffersByDepartment = {
  name: string
  value: number
}

// Palette de couleurs plus calme et professionnelle avec des tons de bleu
const COLORS = [
  "#0ea5e9", // sky-500
  "#3b82f6", // blue-500
  "#6366f1", // indigo-500
  "#8b5cf6", // violet-500
  "#a3a3a3", // neutral-400
  "#64748b", // slate-500
  "#0284c7", // sky-600
  "#1d4ed8", // blue-700
]

export function OffersByDepartment() {
  const [data, setData] = useState<OffersByDepartment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token")
        const response = await fetch("http://localhost:8000/api/admin/offres-par-departement", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const responseData = await response.json()
          setData(responseData)
        } else {
          console.error("Failed to fetch offers by department")
          // Sample data
          setData([
            { name: "Paris", value: 18 },
            { name: "Lyon", value: 12 },
            { name: "Marseille", value: 10 },
            { name: "Bordeaux", value: 8 },
            { name: "Lille", value: 7 },
            { name: "Toulouse", value: 6 },
          ])
        }
      } catch (error) {
        console.error("Error fetching offers by department:", error)
        // Sample data
        setData([
          { name: "Paris", value: 18 },
          { name: "Lyon", value: 12 },
          { name: "Marseille", value: 10 },
          { name: "Bordeaux", value: 8 },
          { name: "Lille", value: 7 },
          { name: "Toulouse", value: 6 },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.value, 0)

  // Custom active shape for better hover effect
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props

    return (
      <g>
        <text x={cx} y={cy - 30} dy={8} textAnchor="middle" fill="#64748b" className="text-sm font-medium">
          {payload.name}
        </text>
        <text x={cx} y={cy} textAnchor="middle" fill="#0f172a" className="text-xl font-bold">
          {value}
        </text>
        <text x={cx} y={cy + 30} textAnchor="middle" fill="#64748b" className="text-xs">
          {`${(percent * 100).toFixed(0)}%`}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 6}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    )
  }

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index)
  }

  const onPieLeave = () => {
    setActiveIndex(undefined)
  }

  // Custom tooltip content
  const CustomTooltipContent = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" style={{ color: payload[0].payload.fill }} />
            <p className="font-medium text-gray-900">{payload[0].name}</p>
          </div>
          <div className="mt-2">
            <p className="text-gray-900">
              <span className="font-medium">Offres:</span> {payload[0].value}
            </p>
            <p className="text-xs text-gray-500">{Math.round((payload[0].value / total) * 100)}% du total</p>
          </div>
        </div>
      )
    }
    return null
  }

  // Enhanced data with fill color and percentage
  const enhancedData = data.map((item, index) => ({
    ...item,
    fill: COLORS[index % COLORS.length],
    percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }))

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-gray-900">Offres par Département</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Répartition des Offres par Département
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={enhancedData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={1}
                  dataKey="value"
                  nameKey="name"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                >
                  {enhancedData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="#fff" strokeWidth={1} />
                  ))}
                </Pie>
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }}
                />
                <ChartTooltip content={<CustomTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-1 text-xs">
          {enhancedData.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-1 p-1.5 rounded"
              style={{ backgroundColor: `${item.fill}10` }}
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.fill }}></div>
              <span className="truncate text-gray-700" title={item.name}>
                {item.name}
              </span>
              <span className="ml-auto font-medium text-gray-900">{item.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}