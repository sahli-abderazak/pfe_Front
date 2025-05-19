"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart1"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, LabelList } from "recharts"

type CandidatesByLevel = {
  name: string
  value: number
}

export function CandidatesByLevel() {
  const [data, setData] = useState<CandidatesByLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [sortedData, setSortedData] = useState<CandidatesByLevel[]>([])
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "original">("original")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token")
        const response = await fetch("http://localhost:8000/api/admin/candidats-par-niveau", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const responseData = await response.json()
          setData(responseData)
          setSortedData(responseData)
        } else {
          console.error("Failed to fetch candidates by education level")
          // Sample data
          const sampleData = [
            { name: "Bac", value: 35 },
            { name: "Bac+2", value: 68 },
            { name: "Bac+3", value: 82 },
            { name: "Bac+5", value: 95 },
            { name: "Doctorat", value: 25 },
          ]
          setData(sampleData)
          setSortedData(sampleData)
        }
      } catch (error) {
        console.error("Error fetching candidates by education level:", error)
        // Sample data
        const sampleData = [
          { name: "Bac", value: 35 },
          { name: "Bac+2", value: 68 },
          { name: "Bac+3", value: 82 },
          { name: "Bac+5", value: 95 },
          { name: "Doctorat", value: 25 },
        ]
        setData(sampleData)
        setSortedData(sampleData)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Sort data function
  const sortData = (order: "asc" | "desc" | "original") => {
    setSortOrder(order)
    if (order === "original") {
      setSortedData([...data])
    } else if (order === "asc") {
      setSortedData([...data].sort((a, b) => a.value - b.value))
    } else {
      setSortedData([...data].sort((a, b) => b.value - a.value))
    }
  }

  // Calculate total for percentages
  const total = sortedData.reduce((sum, item) => sum + item.value, 0)

  // Enhanced data with percentage
  const enhancedData = sortedData.map((item) => ({
    ...item,
    percentage: total > 0 ? Math.round((item.value / total) * 100) : 0,
  }))

  // Custom tooltip content
  const CustomTooltipContent = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-4">
          <p className="font-bold text-foreground">{label}</p>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: "hsl(262, 80%, 50%)" }}></div>
            <p className="text-foreground">
              <span className="font-medium">Candidats:</span> {payload[0].value}
            </p>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            <span>{payload[0].payload.percentage}% du total</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold">Candidats par Niveau d'Études</CardTitle>
            <CardDescription className="text-muted-foreground">
              Répartition des candidats selon leur niveau d'études
            </CardDescription>
          </div>
          <div className="flex space-x-2 self-end sm:self-auto">
            <button
              onClick={() => sortData("original")}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                sortOrder === "original"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              Original
            </button>
            <button
              onClick={() => sortData("asc")}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                sortOrder === "asc"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              Croissant
            </button>
            <button
              onClick={() => sortData("desc")}
              className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                sortOrder === "desc"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground"
              }`}
            >
              Décroissant
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="flex justify-center items-center h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <ChartContainer
            config={{
              candidats: {
                label: "Candidats",
                color: "hsl(262, 80%, 50%)",
              },
            }}
            className="h-[400px] w-full mt-4"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={enhancedData} margin={{ top: 20, right: 30, left: 20, bottom: 30 }} barSize={50}>
                <defs>
                  <linearGradient id="colorCandidats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(262, 80%, 50%)" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="hsl(262, 80%, 50%)" stopOpacity={0.7} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "var(--foreground)", fontWeight: 500 }}
                  axisLine={{ stroke: "rgba(0,0,0,0.2)" }}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fill: "var(--foreground)" }}
                  axisLine={{ stroke: "rgba(0,0,0,0.2)" }}
                  tickLine={false}
                  dx={-10}
                />
                <ChartTooltip content={<CustomTooltipContent />} />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{ paddingTop: "10px" }}
                  iconType="circle"
                  iconSize={10}
                />
                <Bar dataKey="value" name="Candidats" fill="url(#colorCandidats)" radius={[6, 6, 0, 0]}>
                  <LabelList
                    dataKey="value"
                    position="top"
                    fill="var(--foreground)"
                    style={{ fontWeight: "bold", fontSize: "12px" }}
                    offset={10}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}

export default CandidatesByLevel