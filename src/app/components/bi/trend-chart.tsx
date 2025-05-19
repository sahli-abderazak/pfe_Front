"use client"

import { useState, useEffect } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type TrendData = {
  name: string
  value: number
}

type ChartData = {
  totalCandidats: number
  totalOffres: number
  candidatsTendance: TrendData[]
  offresTendance: TrendData[]
}

// Composant personnalisé pour le tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-md rounded-md border border-gray-200">
        <p className="font-medium text-gray-800">{`${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center mt-1">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
            <span className="text-gray-700">{entry.name}: </span>
            <span className="font-medium ml-1">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function TrendChart() {
  const [period, setPeriod] = useState<"day" | "week" | "month" | "year">("day")
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const [data, setData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [yearlyData, setYearlyData] = useState<any[]>([])

  // Générer les années pour le sélecteur et l'affichage annuel
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 11 }, (_, i) => (currentYear - 5 + i).toString())

  // Mapper les périodes frontend vers les périodes backend
  const periodMapping = {
    day: "month", // Jour par jour dans un mois
    week: "week", // Semaine (Lun-Dim)
    month: "year", // Mois dans une année
    year: "multi-year", // Plusieurs années
  }

  // Fonction pour récupérer les données annuelles
  const fetchYearlyData = async () => {
    try {
      setLoading(true)
      setError(null)

      const token = sessionStorage.getItem("token")
      if (!token) {
        setError("Non authentifié")
        setLoading(false)
        return
      }

      // Récupérer les données pour chaque année
      const yearlyDataPromises = years.map(async (year) => {
        const url = `http://127.0.0.1:8000/api/recruteur/stats-chart?period=year&annee=${year}`

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`)
        }

        const data = await response.json()

        // Calculer le total des candidats et offres pour l'année
        const totalCandidats = data.candidatsTendance.reduce((sum: number, item: TrendData) => sum + item.value, 0)
        const totalOffres = data.offresTendance.reduce((sum: number, item: TrendData) => sum + item.value, 0)

        return {
          name: year,
          Candidats: totalCandidats,
          Offres: totalOffres,
        }
      })

      const results = await Promise.all(yearlyDataPromises)
      setYearlyData(results)
      setLoading(false)
    } catch (err) {
      console.error("Erreur lors de la récupération des données annuelles:", err)
      setError("Impossible de charger les données annuelles")
      setLoading(false)
    }
  }

  useEffect(() => {
    if (period === "year") {
      fetchYearlyData()
    } else {
      const fetchData = async () => {
        try {
          setLoading(true)
          setError(null)

          const token = sessionStorage.getItem("token")
          if (!token) {
            setError("Non authentifié")
            setLoading(false)
            return
          }

          // Construire l'URL avec les paramètres appropriés
          let url = `http://127.0.0.1:8000/api/recruteur/stats-chart?period=${periodMapping[period]}`

          // Ajouter l'année si nécessaire
          if (period === "month" || period === "day") {
            url += `&annee=${selectedYear}`
          }

          const response = await fetch(url, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`)
          }

          const chartData = await response.json()
          setData(chartData)
        } catch (err) {
          console.error("Erreur lors de la récupération des données:", err)
          setError("Impossible de charger les données")
        } finally {
          setLoading(false)
        }
      }

      fetchData()
    }
  }, [period, selectedYear])

  // Préparer les données pour le graphique
  const prepareChartData = () => {
    if (period === "year") {
      return yearlyData
    }

    if (!data) return []

    return data.candidatsTendance.map((item, index) => ({
      name: item.name,
      Candidats: item.value,
      Offres: data.offresTendance[index]?.value || 0,
    }))
  }

  const chartData = prepareChartData()

  // Titres selon la période
  const getTitles = () => {
    switch (period) {
      case "day":
        return {
          title: `Tendances journalières de ce moins - ${selectedYear}`,
          description: "Évolution des candidats et offres par jour",
        }
      case "week":
        return {
          title: "Tendances sur 7 jours",
          description: "Évolution des candidats et offres par semaine",
        }
      case "month":
        return {
          title: `Tendances mensuelles de cette année - ${selectedYear}`,
          description: "Évolution des candidats et offres par mois",
        }
      case "year":
        return {
          title: "Tendances annuelles",
          description: "Évolution des candidats et offres par année",
        }
    }
  }

  const titles = getTitles()

  // Afficher le sélecteur d'année si on est en mode mois ou jour
  const showYearSelector = period === "month" || period === "day"

  return (
    <Card className="w-full border-none shadow-none bg-white rounded-lg">
      <CardHeader className="px-5 pt-5 pb-0 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-gray-800">{titles.title}</CardTitle>
          <CardDescription className="text-sm text-gray-600">{titles.description}</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          {showYearSelector && (
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px] h-7 text-xs">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year} className="text-xs">
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <div className="flex space-x-1">
            <Button
              variant={period === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("day")}
              className={`text-xs px-3 py-1 h-7 rounded-md ${
                period === "day" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-200"
              }`}
            >
              Jour
            </Button>
            <Button
              variant={period === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("week")}
              className={`text-xs px-3 py-1 h-7 rounded-md ${
                period === "week" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-200"
              }`}
            >
              Semaine
            </Button>
            <Button
              variant={period === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("month")}
              className={`text-xs px-3 py-1 h-7 rounded-md ${
                period === "month" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-200"
              }`}
            >
              Mois
            </Button>
            <Button
              variant={period === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("year")}
              className={`text-xs px-3 py-1 h-7 rounded-md ${
                period === "year" ? "bg-blue-600 hover:bg-blue-700" : "border-gray-200"
              }`}
            >
              Année
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        {loading ? (
          <div className="flex justify-center items-center h-[250px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center h-[250px] text-red-500">{error}</div>
        ) : (
          <div className="h-[250px] mt-5">
            <div className="flex justify-center mb-4 text-sm">
              <div className="flex items-center mr-6">
                <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                <span>Candidats</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-cyan-500 mr-2"></div>
                <span>Offres</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12, fill: "#666" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  tick={{ fontSize: 12, fill: "#666" }}
                  domain={[0, "dataMax + 3"]}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ stroke: "#ddd", strokeWidth: 1, strokeDasharray: "3 3" }}
                  wrapperStyle={{ outline: "none" }}
                />
                <Line
                  type="monotone"
                  dataKey="Candidats"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#2563eb", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#2563eb", strokeWidth: 0 }}
                  name="Candidats"
                />
                <Line
                  type="monotone"
                  dataKey="Offres"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 4, fill: "#06b6d4", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#06b6d4", strokeWidth: 0 }}
                  name="Offres"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
