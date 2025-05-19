"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts"
import { useState, useEffect } from "react"

export function JobOfferStats() {
  const [offersByDepartment, setOffersByDepartment] = useState<any[]>([])
  const [applicationTrends, setApplicationTrends] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token")

        // Fetch offers by department
        const deptResponse = await fetch("http://localhost:8000/api/stats/offers-by-department", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Fetch application trends
        const trendsResponse = await fetch("http://localhost:8000/api/stats/application-trends", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (deptResponse.ok && trendsResponse.ok) {
          const deptData = await deptResponse.json()
          const trendsData = await trendsResponse.json()

          setOffersByDepartment(deptData)
          setApplicationTrends(trendsData)
        } else {
          console.error("Failed to fetch job offer statistics")
          // Use sample data for demonstration
          setOffersByDepartment([
            { name: "Informatique", value: 8 },
            { name: "Finance", value: 3 },
            { name: "Marketing", value: 5 },
            { name: "Ressources Humaines", value: 2 },
            { name: "Design", value: 4 },
          ])

          setApplicationTrends([
            { date: "Janvier", applications: 12 },
            { date: "Février", applications: 19 },
            { date: "Mars", applications: 25 },
            { date: "Avril", applications: 32 },
            { date: "Mai", applications: 45 },
          ])
        }
      } catch (error) {
        console.error("Error fetching job offer statistics:", error)
        // Use sample data for demonstration
        setOffersByDepartment([
          { name: "Informatique", value: 8 },
          { name: "Finance", value: 3 },
          { name: "Marketing", value: 5 },
          { name: "Ressources Humaines", value: 2 },
          { name: "Design", value: 4 },
        ])

        setApplicationTrends([
          { date: "Janvier", applications: 12 },
          { date: "Février", applications: 19 },
          { date: "Mars", applications: 25 },
          { date: "Avril", applications: 32 },
          { date: "Mai", applications: 45 },
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
          <CardTitle>Offres par Département</CardTitle>
          <CardDescription>Répartition des offres d'emploi par département</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={offersByDepartment} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Nombre d'offres" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tendance des Candidatures</CardTitle>
          <CardDescription>Évolution des candidatures sur les 5 derniers mois</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={applicationTrends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="applications"
                  name="Candidatures"
                  stroke="#8b5cf6"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
