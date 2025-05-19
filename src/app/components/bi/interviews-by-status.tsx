"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Sector } from "recharts"

// Palette de couleurs plus professionnelle
const STATUS_COLORS = {
  pending: "#3b82f6", // blue-500 (au lieu de jaune)
  completed: "#10b981", // emerald-500
  cancelled: "#94a3b8", // slate-400 (moins agressif que le rouge)
}

type InterviewStatus = {
  name: string
  value: number
  color?: string
}

export function InterviewsByStatus() {
  const [interviewsByStatus, setInterviewsByStatus] = useState<InterviewStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token")

        // Fetch interviews by status
        const response = await fetch("http://localhost:8000/api/admin/entretiens-par-statut", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const data = await response.json()

          // Map status names to French and add colors
          const formattedData = data.map((item: InterviewStatus) => {
            let color
            let name

            switch (item.name) {
              case "pending":
                color = STATUS_COLORS.pending
                name = "En attente"
                break
              case "completed":
                color = STATUS_COLORS.completed
                name = "Terminés"
                break
              case "cancelled":
                color = STATUS_COLORS.cancelled
                name = "Annulés"
                break
              default:
                color = "#6366f1"
                name = item.name
            }

            return {
              ...item,
              name,
              color,
            }
          })

          setInterviewsByStatus(formattedData)
        } else {
          console.error("Failed to fetch interview statistics")
          // Use sample data for demonstration
          setInterviewsByStatus([
            { name: "En attente", value: 45, color: STATUS_COLORS.pending },
            { name: "Terminés", value: 68, color: STATUS_COLORS.completed },
            { name: "Annulés", value: 12, color: STATUS_COLORS.cancelled },
          ])
        }
      } catch (error) {
        console.error("Error fetching interview statistics:", error)
        // Use sample data for demonstration
        setInterviewsByStatus([
          { name: "En attente", value: 45, color: STATUS_COLORS.pending },
          { name: "Terminés", value: 68, color: STATUS_COLORS.completed },
          { name: "Annulés", value: 12, color: STATUS_COLORS.cancelled },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const totalInterviews = interviewsByStatus.reduce((sum, item) => sum + item.value, 0)

  // Custom active shape for better hover effect
  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props

    return (
      <g>
        <text x={cx} y={cy - 20} dy={8} textAnchor="middle" fill="#64748b" className="text-sm font-medium">
          {payload.name}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fill="#0f172a" className="text-2xl font-bold">
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

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-gray-900">Entretiens par Statut</CardTitle>
        <CardDescription className="text-sm text-gray-500">
          Répartition globale des entretiens par statut
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
                  data={interviewsByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  onMouseEnter={onPieEnter}
                  onMouseLeave={onPieLeave}
                  paddingAngle={1}
                >
                  {interviewsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={1} />
                  ))}
                </Pie>
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  align="center"
                  wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {interviewsByStatus.map((status, index) => (
            <div key={index} className="flex flex-col p-3 rounded-lg" style={{ backgroundColor: `${status.color}10` }}>
              <span className="text-sm font-medium" style={{ color: status.color }}>
                {status.name}
              </span>
              <span className="text-xl font-bold text-gray-900">{status.value}</span>
              <span className="text-xs text-gray-500">
                {totalInterviews > 0 ? `${Math.round((status.value / totalInterviews) * 100)}%` : "0%"}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}