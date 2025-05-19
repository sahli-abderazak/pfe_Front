"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
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

// Custom colors for charts
const COLORS = ["#4f46e5", "#8b5cf6", "#ec4899", "#f43f5e", "#f97316", "#eab308"]
const RADIAN = Math.PI / 180
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? "start" : "end"} dominantBaseline="central">
      {`${name}: ${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function CandidateStats() {
  const [candidatesByDepartment, setCandidatesByDepartment] = useState<any[]>([])
  const [candidatesByExperience, setCandidatesByExperience] = useState<any[]>([])
  const [candidatesByEducation, setCandidatesByEducation] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token")

        // Fetch candidates by department
        const deptResponse = await fetch("http://localhost:8000/api/stats/candidates-by-department", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Fetch candidates by experience
        const expResponse = await fetch("http://localhost:8000/api/stats/candidates-by-experience", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Fetch candidates by education
        const eduResponse = await fetch("http://localhost:8000/api/stats/candidates-by-education", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (deptResponse.ok && expResponse.ok && eduResponse.ok) {
          const deptData = await deptResponse.json()
          const expData = await expResponse.json()
          const eduData = await eduResponse.json()

          setCandidatesByDepartment(deptData)
          setCandidatesByExperience(expData)
          setCandidatesByEducation(eduData)
        } else {
          console.error("Failed to fetch candidate statistics")
          // Use sample data for demonstration
          setCandidatesByDepartment([
            { name: "Informatique", value: 12 },
            { name: "Finance", value: 5 },
            { name: "Marketing", value: 8 },
            { name: "Ressources Humaines", value: 4 },
            { name: "Design", value: 6 },
          ])

          setCandidatesByExperience([
            { name: "Sans expérience", value: 8 },
            { name: "1-2 ans", value: 15 },
            { name: "3-5 ans", value: 12 },
            { name: "5+ ans", value: 7 },
          ])

          setCandidatesByEducation([
            { name: "BAC", value: 3 },
            { name: "BAC+2", value: 8 },
            { name: "BAC+3", value: 14 },
            { name: "BAC+4", value: 6 },
            { name: "BAC+5", value: 11 },
          ])
        }
      } catch (error) {
        console.error("Error fetching candidate statistics:", error)
        // Use sample data for demonstration
        setCandidatesByDepartment([
          { name: "Informatique", value: 12 },
          { name: "Finance", value: 5 },
          { name: "Marketing", value: 8 },
          { name: "Ressources Humaines", value: 4 },
          { name: "Design", value: 6 },
        ])

        setCandidatesByExperience([
          { name: "Sans expérience", value: 8 },
          { name: "1-2 ans", value: 15 },
          { name: "3-5 ans", value: 12 },
          { name: "5+ ans", value: 7 },
        ])

        setCandidatesByEducation([
          { name: "BAC", value: 3 },
          { name: "BAC+2", value: 8 },
          { name: "BAC+3", value: 14 },
          { name: "BAC+4", value: 6 },
          { name: "BAC+5", value: 11 },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Statistiques des Candidats</CardTitle>
        <CardDescription>
          Analyse détaillée des candidats par département, expérience et niveau d'études
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="department">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="department">Par Département</TabsTrigger>
            <TabsTrigger value="experience">Par Expérience</TabsTrigger>
            <TabsTrigger value="education">Par Niveau d'Études</TabsTrigger>
          </TabsList>

          <TabsContent value="department" className="mt-4">
            {loading ? (
              <div className="flex justify-center items-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={candidatesByDepartment} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Nombre de candidats" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          <TabsContent value="experience" className="mt-4">
            {loading ? (
              <div className="flex justify-center items-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={candidatesByExperience}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                  >
                    {candidatesByExperience.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </TabsContent>

          <TabsContent value="education" className="mt-4">
            {loading ? (
              <div className="flex justify-center items-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={candidatesByEducation} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Nombre de candidats" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
