"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Users, Briefcase, Calendar, Building, TrendingUp, TrendingDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"

type AdminStatsData = {
  totalCandidats: number
  totalOffres: number
  totalEntretiens: number
  totalRecruteurs: number
  candidatsTendance: Array<{ name: string; value: number }>
  offresTendance: Array<{ name: string; value: number }>
  entretiensTendance: Array<{ name: string; value: number }>
  recruteursTendance: Array<{ name: string; value: number }>
}

export function AdminStats() {
  const [stats, setStats] = useState<AdminStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [comparisonData, setComparisonData] = useState({
    candidats: { value: 0, percentage: 0 },
    offres: { value: 0, percentage: 0 },
    entretiens: { value: 0, percentage: 0 },
    recruteurs: { value: 0, percentage: 0 },
  })
  const [selectedPeriod, setSelectedPeriod] = useState<"week" | "month" | "year">("week")
  const [periodTitle, setPeriodTitle] = useState("de cette semaine")

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const token = sessionStorage.getItem("token")

        if (selectedPeriod === "year") {
          // Afficher les statistiques par année de 2025 à 2030
          const years = [2025, 2026, 2027, 2028, 2029, 2030]
          const yearlyData = {
            candidatsTendance: [],
            offresTendance: [],
            entretiensTendance: [],
            recruteursTendance: [],
            totalCandidats: 0,
            totalOffres: 0,
            totalEntretiens: 0,
            totalRecruteurs: 0,
          }

          // Récupérer les données pour chaque année
          for (const year of years) {
            const response = await fetch(`http://localhost:8000/api/admin/stats?period=year&year=${year}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })

            if (response.ok) {
              const data = await response.json()

              // Ajouter l'année à chaque point de données
              yearlyData.candidatsTendance.push({
                name: year.toString(),
                value: data.candidatsTendance.reduce((sum, item) => sum + item.value, 0),
              })

              yearlyData.offresTendance.push({
                name: year.toString(),
                value: data.offresTendance.reduce((sum, item) => sum + item.value, 0),
              })

              yearlyData.entretiensTendance.push({
                name: year.toString(),
                value: data.entretiensTendance.reduce((sum, item) => sum + item.value, 0),
              })

              yearlyData.recruteursTendance.push({
                name: year.toString(),
                value: data.recruteursTendance ? data.recruteursTendance.reduce((sum, item) => sum + item.value, 0) : 0,
              })

              // Utiliser les totaux de l'année la plus récente
              if (year === years[years.length - 1]) {
                yearlyData.totalCandidats = data.totalCandidats
                yearlyData.totalOffres = data.totalOffres
                yearlyData.totalEntretiens = data.totalEntretiens
                yearlyData.totalRecruteurs = data.totalRecruteurs
              }
            }
          }

          setStats(yearlyData)

          // Calculer les changements d'une année à l'autre
          if (yearlyData.candidatsTendance.length >= 2) {
            const lastYear = yearlyData.candidatsTendance[yearlyData.candidatsTendance.length - 1].value
            const previousYear = yearlyData.candidatsTendance[yearlyData.candidatsTendance.length - 2].value

            const calculateYearChange = (current, previous) => {
              const change = current - previous
              const percentage = previous > 0 ? Math.round((change / previous) * 100) : 0
              return { value: change, percentage }
            }

            setComparisonData({
              candidats: calculateYearChange(
                yearlyData.candidatsTendance[yearlyData.candidatsTendance.length - 1].value,
                yearlyData.candidatsTendance[yearlyData.candidatsTendance.length - 2].value,
              ),
              offres: calculateYearChange(
                yearlyData.offresTendance[yearlyData.offresTendance.length - 1].value,
                yearlyData.offresTendance[yearlyData.offresTendance.length - 2].value,
              ),
              entretiens: calculateYearChange(
                yearlyData.entretiensTendance[yearlyData.entretiensTendance.length - 1].value,
                yearlyData.entretiensTendance[yearlyData.entretiensTendance.length - 2].value,
              ),
              recruteurs: calculateYearChange(
                yearlyData.recruteursTendance[yearlyData.recruteursTendance.length - 1].value,
                yearlyData.recruteursTendance[yearlyData.recruteursTendance.length - 2].value,
              ),
            })
          }
        } else if (selectedPeriod === "month") {
          // Afficher tous les mois de l'année
          const currentYear = new Date().getFullYear()
          const response = await fetch(`http://localhost:8000/api/admin/stats?period=month&year=${currentYear}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()

            // Assurer que tous les mois sont présents dans les données
            const allMonths = [
              { name: "Jan", value: 0 },
              { name: "Fév", value: 0 },
              { name: "Mar", value: 0 },
              { name: "Avr", value: 0 },
              { name: "Mai", value: 0 },
              { name: "Juin", value: 0 },
              { name: "Juil", value: 0 },
              { name: "Août", value: 0 },
              { name: "Sep", value: 0 },
              { name: "Oct", value: 0 },
              { name: "Nov", value: 0 },
              { name: "Déc", value: 0 },
            ]

            // Fusionner les données reçues avec tous les mois
            const mergeDataWithAllMonths = (trend) => {
              const dataByName = trend
                ? trend.reduce((acc, item) => {
                    acc[item.name] = item.value
                    return acc
                  }, {})
                : {}

              return allMonths.map((month) => ({
                name: month.name,
                value: dataByName[month.name] || 0,
              }))
            }

            const monthlyData = {
              ...data,
              candidatsTendance: mergeDataWithAllMonths(data.candidatsTendance),
              offresTendance: mergeDataWithAllMonths(data.offresTendance),
              entretiensTendance: mergeDataWithAllMonths(data.entretiensTendance),
              recruteursTendance: mergeDataWithAllMonths(data.recruteursTendance),
            }

            setStats(monthlyData)

            // Calculer les changements d'un mois à l'autre
            const calculateMonthChange = (trend) => {
              const currentMonth = new Date().getMonth()
              const lastMonth = trend[currentMonth].value
              const previousMonth = trend[currentMonth > 0 ? currentMonth - 1 : 11].value

              const change = lastMonth - previousMonth
              const percentage = previousMonth > 0 ? Math.round((change / previousMonth) * 100) : 0

              return { value: change, percentage }
            }

            setComparisonData({
              candidats: calculateMonthChange(monthlyData.candidatsTendance),
              offres: calculateMonthChange(monthlyData.offresTendance),
              entretiens: calculateMonthChange(monthlyData.entretiensTendance),
              recruteurs: calculateMonthChange(monthlyData.recruteursTendance),
            })
          }
        } else {
          // Vue par semaine (comportement par défaut)
          const response = await fetch(`http://localhost:8000/api/admin/stats?period=week`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            setStats(data)

            // Calculer les changements d'une semaine à l'autre
            const calculateWeekChange = (trend) => {
              if (trend.length < 2) return { value: 0, percentage: 0 }

              const lastWeekTotal = trend.reduce((sum, day) => sum + day.value, 0)
              const previousWeekTotal = 0 // Vous devriez récupérer les données de la semaine précédente

              const change = lastWeekTotal - previousWeekTotal
              const percentage = previousWeekTotal > 0 ? Math.round((change / previousWeekTotal) * 100) : 0

              return { value: change, percentage }
            }

            setComparisonData({
              candidats: calculateWeekChange(data.candidatsTendance),
              offres: calculateWeekChange(data.offresTendance),
              entretiens: calculateWeekChange(data.entretiensTendance),
              recruteurs: calculateWeekChange(data.recruteursTendance || []),
            })
          }
        }
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    // Mettre à jour le titre de la période en fonction de la période sélectionnée
    if (selectedPeriod === "week") {
      setPeriodTitle("de cette semaine")
    } else if (selectedPeriod === "month") {
      setPeriodTitle("par mois (année complète)")
    } else {
      setPeriodTitle("par année (2025-2030)")
    }

    fetchStats()
  }, [selectedPeriod])

  // Format the trend data for the chart
  const formatTrendData = () => {
    if (!stats) return []

    if (selectedPeriod === "year") {
      // For year view, use the yearly data directly
      return stats.candidatsTendance.map((item, index) => ({
        name: item.name,
        candidats: item.value,
        offres: stats.offresTendance[index]?.value || 0,
        recruteurs: stats.recruteursTendance[index]?.value || 0,
      }))
    } else {
      // For week and month views, use the existing format
      return stats.candidatsTendance.map((item, index) => ({
        name: item.name,
        candidats: item.value,
        offres: stats.offresTendance[index]?.value || 0,
        recruteurs: stats.recruteursTendance[index]?.value || 0,
      }))
    }
  }

  const trendData = formatTrendData()

  // Helper function to render comparison badge
  const renderComparisonBadge = (data: { value: number; percentage: number }) => {
    // Ne pas afficher le badge si le pourcentage est 0
    if (data.percentage === 0) return null

    const isPositive = data.value >= 0
    return (
      <Badge variant="outline" className={`ml-2 ${isPositive ? "text-blue-600" : "text-slate-600"}`}>
        <span className="flex items-center gap-1">
          {isPositive ? "+" : ""}
          {data.percentage}%{isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        </span>
      </Badge>
    )
  }

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <p className="text-gray-700">
                <span className="font-medium">{entry.name}:</span> {entry.value}
              </p>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="overflow-hidden border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Total Candidats</CardTitle>
          <Users className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className="text-2xl font-bold text-gray-900">{loading ? "..." : stats?.totalCandidats}</div>
            {!loading && stats && renderComparisonBadge(comparisonData.candidats)}
          </div>
          <p className="text-xs text-gray-500">Candidats inscrits sur la plateforme</p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-l-4 border-l-sky-500 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Total Offres</CardTitle>
          <Briefcase className="h-4 w-4 text-sky-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className="text-2xl font-bold text-gray-900">{loading ? "..." : stats?.totalOffres}</div>
            {!loading && stats && renderComparisonBadge(comparisonData.offres)}
          </div>
          <p className="text-xs text-gray-500">Offres d'emploi publiées</p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Total Entretiens</CardTitle>
          <Calendar className="h-4 w-4 text-indigo-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className="text-2xl font-bold text-gray-900">{loading ? "..." : stats?.totalEntretiens}</div>
            {!loading && stats && renderComparisonBadge(comparisonData.entretiens)}
          </div>
          <p className="text-xs text-gray-500">Entretiens programmés</p>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-l-4 border-l-slate-500 shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">Total Recruteurs</CardTitle>
          <Building className="h-4 w-4 text-slate-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center">
            <div className="text-2xl font-bold text-gray-900">{loading ? "..." : stats?.totalRecruteurs}</div>
            {!loading && stats && renderComparisonBadge(comparisonData.recruteurs)}
          </div>
          <p className="text-xs text-gray-500">Recruteurs actifs</p>
        </CardContent>
      </Card>

      <Card className="col-span-full shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-medium text-gray-900">Tendances {periodTitle}</CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Évolution des candidats, offres et recruteurs
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedPeriod("week")}
                className={`px-3 py-1 text-xs rounded-md ${
                  selectedPeriod === "week"
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setSelectedPeriod("month")}
                className={`px-3 py-1 text-xs rounded-md ${
                  selectedPeriod === "month"
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Mois
              </button>
              <button
                onClick={() => setSelectedPeriod("year")}
                className={`px-3 py-1 text-xs rounded-md ${
                  selectedPeriod === "year"
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Année
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading || !stats ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 20, right: 20, left: 20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                  />
                  <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={{ stroke: "rgba(0,0,0,0.1)" }} />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: "#94a3b8", strokeWidth: 1, strokeDasharray: "5 5" }}
                  />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingTop: "10px", fontSize: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="candidats"
                    name="Candidats"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1, fill: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#3b82f6" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="offres"
                    name="Offres"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1, fill: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#0ea5e9" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="recruteurs"
                    name="Recruteurs"
                    stroke="#6b7280"
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 1, fill: "#fff" }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: "#6b7280" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminStats