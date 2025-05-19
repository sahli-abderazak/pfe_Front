"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend, LabelList } from "recharts"
import { MapPin, Users } from 'lucide-react'

type CandidatesByDepartment = {
  departement: string
  total: number
}

export function CandidatesByDepartment() {
  const [data, setData] = useState<CandidatesByDepartment[]>([])
  const [loading, setLoading] = useState(true)
  const [sortedData, setSortedData] = useState<{ name: string; value: number; fill: string }[]>([])
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "original">("original")

  // Palette de couleurs plus calme et professionnelle
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token")
        const response = await fetch("http://localhost:8000/api/admin/candidats-par-departement", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const responseData = await response.json()
          setData(responseData)

          // Format data for chart with colors
          const formattedData = responseData.map((item: CandidatesByDepartment, index: number) => ({
            name: item.departement,
            value: item.total,
            fill: COLORS[index % COLORS.length],
          }))

          setSortedData(formattedData)
        } else {
          console.error("Failed to fetch candidates by department")
        }
      } catch (error) {
        console.error("Error fetching candidates by department:", error)
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
      setSortedData([
        ...sortedData.sort(
          (a, b) =>
            data.findIndex((item) => item.departement === a.name) -
            data.findIndex((item) => item.departement === b.name),
        ),
      ])
    } else if (order === "asc") {
      setSortedData([...sortedData].sort((a, b) => a.value - b.value))
    } else {
      setSortedData([...sortedData].sort((a, b) => b.value - a.value))
    }
  }

  // Calculate total candidates
  const totalCandidates = sortedData.reduce((sum, item) => sum + item.value, 0)

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4" style={{ color: payload[0].payload.fill }} />
            <p className="font-medium text-gray-900">{label}</p>
          </div>
          <p className="text-gray-900 text-lg font-medium">{payload[0].value} candidats</p>
          <p className="text-xs text-gray-500 mt-1">
            {Math.round((payload[0].value / totalCandidates) * 100)}% du total
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-2">
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium text-gray-900">Candidats par Département</CardTitle>
            <CardDescription className="text-sm text-gray-500">Répartition géographique des candidats</CardDescription>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => sortData("original")}
              className={`px-2 py-1 text-xs rounded ${
                sortOrder === "original" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Original
            </button>
            <button
              onClick={() => sortData("asc")}
              className={`px-2 py-1 text-xs rounded ${
                sortOrder === "asc" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Croissant
            </button>
            <button
              onClick={() => sortData("desc")}
              className={`px-2 py-1 text-xs rounded ${
                sortOrder === "desc" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Décroissant
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        ) : (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sortedData} layout="vertical" margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="rgba(0,0,0,0.06)" />
                <XAxis
                  type="number"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={90}
                  tick={{ fontSize: 12, fill: "#64748b" }}
                  axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: "12px" }} />
                <Bar
                  dataKey="value"
                  name="Candidats"
                  radius={[0, 4, 4, 0]}
                >
                  <LabelList
                    dataKey="value"
                    position="right"
                    fill="#64748b"
                    fontSize={12}
                    fontWeight={500}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {!loading && sortedData.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Total Candidats</p>
                <p className="text-xl font-bold text-gray-900">{totalCandidates}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Département Principal</p>
              <p className="text-xl font-bold text-gray-900">
                {sortedData.length > 0 ? sortedData.sort((a, b) => b.value - a.value)[0].name : "N/A"}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-700">Départements</p>
              <p className="text-xl font-bold text-gray-900">{sortedData.length}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}