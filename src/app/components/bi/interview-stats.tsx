"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { useState, useEffect } from "react"

const STATUS_COLORS = {
  pending: "#eab308",
  completed: "#22c55e",
  cancelled: "#ef4444",
}

export function InterviewStats() {
  const [interviewsByStatus, setInterviewsByStatus] = useState<any[]>([])
  const [interviewTrends, setInterviewTrends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token")

        // Fetch interviews by status
        const statusResponse = await fetch("http://localhost:8000/api/recruteur/mes-entretiens", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Fetch interview trends
        const trendsResponse = await fetch("http://localhost:8000/api/stats/interview-trends", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (statusResponse.ok && trendsResponse.ok) {
          const statusData = await statusResponse.json()
          const trendsData = await trendsResponse.json()

          setInterviewsByStatus(statusData)
          setInterviewTrends(trendsData)
        } else {
          console.error("Failed to fetch interview statistics")
          // Use sample data for demonstration
          setInterviewsByStatus([
            { name: "En attente", value: 8, color: STATUS_COLORS.pending },
            { name: "Terminés", value: 12, color: STATUS_COLORS.completed },
            { name: "Annulés", value: 3, color: STATUS_COLORS.cancelled },
          ])

          setInterviewTrends([
            { date: "01/05", pending: 2, completed: 1, cancelled: 0 },
            { date: "02/05", pending: 3, completed: 2, cancelled: 1 },
            { date: "03/05", pending: 4, completed: 3, cancelled: 0 },
            { date: "04/05", pending: 5, completed: 4, cancelled: 1 },
            { date: "05/05", pending: 8, completed: 5, cancelled: 2 },
          ])
        }
      } catch (error) {
        console.error("Error fetching interview statistics:", error)
        // Use sample data for demonstration
        setInterviewsByStatus([
          { name: "En attente", value: 8, color: STATUS_COLORS.pending },
          { name: "Terminés", value: 12, color: STATUS_COLORS.completed },
          { name: "Annulés", value: 3, color: STATUS_COLORS.cancelled },
        ])

        setInterviewTrends([
          { date: "01/05", pending: 2, completed: 1, cancelled: 0 },
          { date: "02/05", pending: 3, completed: 2, cancelled: 1 },
          { date: "03/05", pending: 4, completed: 3, cancelled: 0 },
          { date: "04/05", pending: 5, completed: 4, cancelled: 1 },
          { date: "05/05", pending: 8, completed: 5, cancelled: 2 },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Statut des Entretiens</CardTitle>
          <CardDescription>Répartition des entretiens par statut</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={interviewsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {interviewsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tendance des Entretiens</CardTitle>
          <CardDescription>Évolution des entretiens sur les 5 derniers jours</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={interviewTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="pending"
                  name="En attente"
                  stroke={STATUS_COLORS.pending}
                  activeDot={{ r: 8 }}
                />
                <Line type="monotone" dataKey="completed" name="Terminés" stroke={STATUS_COLORS.completed} />
                <Line type="monotone" dataKey="cancelled" name="Annulés" stroke={STATUS_COLORS.cancelled} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
