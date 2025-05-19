"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, Clock, CheckCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type StatsData = {
  totalCandidats: number
  totalOffres: number
  totalEntretiens: number
  totalRecruteurs: number
}

type RecruteurStatsData = {
  totalMesCandidats: number
  totalMesOffres: number
  totalMesEntretiens: number
  entretiensPending: number
}

interface StatsCardsProps {
  isAdmin?: boolean
}

export function StatsCards({ isAdmin = false }: StatsCardsProps) {
  const [stats, setStats] = useState<StatsData | RecruteurStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchStats = async () => {
    try {
      setError(false)
      const token = sessionStorage.getItem("token")
      if (!token) {
        console.error("Aucun token trouvé")
        setError(true)
        setLoading(false)
        return
      }

      const endpoint = isAdmin ? "http://127.0.0.1:8000/api/admin/stats" : "http://127.0.0.1:8000/api/recruteur/stats"

      try {
        const response = await fetch(endpoint, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`)
        }

        const data = await response.json()
        setStats(data)
      } catch (fetchError) {
        console.error("Erreur lors de la récupération des statistiques:", fetchError)
        setError(true)

        // Définir des données par défaut pour éviter les erreurs d'affichage
        if (!isAdmin) {
          setStats({
            totalMesCandidats: 0,
            totalMesOffres: 0,
            totalMesEntretiens: 0,
            entretiensPending: 0,
          })
        } else {
          setStats({
            totalCandidats: 0,
            totalOffres: 0,
            totalEntretiens: 0,
            totalRecruteurs: 0,
          })
        }
      }
    } catch (error) {
      console.error("Erreur générale:", error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [isAdmin])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="overflow-hidden border border-blue-100 dark:border-blue-900 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{error ? "Erreur de chargement" : "Chargement..."}</CardTitle>
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!stats) return null

  const cardConfigs = [
    {
      title: isAdmin ? "Total Candidats" : "Mes Candidats",
      value: isAdmin ? (stats as StatsData).totalCandidats : (stats as RecruteurStatsData).totalMesCandidats,
      description: isAdmin ? "Candidats enregistrés" : "Candidats pour vos offres",
      icon: Users,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: isAdmin ? "Offres Actives" : "Mes Offres",
      value: isAdmin ? (stats as StatsData).totalOffres : (stats as RecruteurStatsData).totalMesOffres,
      description: "Offres publiées",
      icon: Briefcase,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: isAdmin ? "Entretiens" : "Mes Entretiens",
      value: isAdmin ? (stats as StatsData).totalEntretiens : (stats as RecruteurStatsData).totalMesEntretiens,
      description: "Entretiens planifiés",
      icon: Clock,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: isAdmin ? "Recruteurs" : "En Attente",
      value: isAdmin ? (stats as StatsData).totalRecruteurs : (stats as RecruteurStatsData).entretiensPending,
      description: isAdmin ? "Recruteurs actifs" : "Entretiens en attente",
      icon: CheckCircle,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cardConfigs.map((config, index) => (
        <Card
          key={index}
          className="overflow-hidden border border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-shadow"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
            <config.icon className={`h-5 w-5 text-blue-600 dark:text-blue-400`} />
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{config.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{config.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
