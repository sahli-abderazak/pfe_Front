"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DonutChart, LineChart } from "@/components/ui/chart1"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type ChartData = {
  name: string
  value: number
}

interface DetailedStatsProps {
  isAdmin?: boolean
}

export function DetailedStats({ isAdmin = false }: DetailedStatsProps) {
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [entretiensParStatut, setEntretiensParStatut] = useState<ChartData[]>([])
  const [entretiensParJour, setEntretiensParJour] = useState<ChartData[]>([])
  const [error, setError] = useState(false)
  const [loadingStatut, setLoadingStatut] = useState(true)
  const [loadingJour, setLoadingJour] = useState(true)

  // Fonction pour traduire les statuts et assigner les couleurs
  const translateStatutData = (data: ChartData[]) => {
    return data.map((item) => {
      let translatedName = item.name

      switch (item.name) {
        case "pending":
          translatedName = "En attente"
          break
        case "completed":
          translatedName = "Terminés"
          break
        case "cancelled":
          translatedName = "Annulés"
          break
        default:
          translatedName = item.name
      }

      return {
        ...item,
        name: translatedName,
      }
    })
  }

  const loadData = async () => {
    setRefreshing(true)
    setError(false)
    setLoadingStatut(true)
    setLoadingJour(true)

    try {
      const token = sessionStorage.getItem("token")
      if (!token) {
        console.error("Aucun token trouvé")
        setError(true)
        setRefreshing(false)
        setLoadingStatut(false)
        setLoadingJour(false)
        return
      }

      // Charger les données d'entretiens par statut
      try {
        const statutRes = await fetch("http://127.0.0.1:8000/api/recruteur/entretiens-par-statutRec", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (statutRes.ok) {
          const statutData = await statutRes.json()
          if (Array.isArray(statutData)) {
            // Traduire les statuts avant de les stocker
            const translatedData = translateStatutData(statutData)
            setEntretiensParStatut(translatedData)
          } else {
            setEntretiensParStatut([])
          }
        } else {
          console.error(`Erreur HTTP: ${statutRes.status}`)
          setEntretiensParStatut([])
        }
      } catch (e) {
        console.error("Erreur lors du chargement des entretiens par statut:", e)
        setEntretiensParStatut([])
      } finally {
        setLoadingStatut(false)
      }

      // Charger les données d'entretiens par jour
      try {
        const jourRes = await fetch("http://127.0.0.1:8000/api/recruteur/entretiens-par-jour", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (jourRes.ok) {
          const jourData = await jourRes.json()
          if (Array.isArray(jourData)) {
            setEntretiensParJour(jourData)
          } else {
            setEntretiensParJour([])
          }
        } else {
          console.error(`Erreur HTTP: ${jourRes.status}`)
          setEntretiensParJour([])
        }
      } catch (e) {
        console.error("Erreur lors du chargement des entretiens par jour:", e)
        setEntretiensParJour([])
      } finally {
        setLoadingJour(false)
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      setError(true)
      setEntretiensParStatut([])
      setEntretiensParJour([])
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [isAdmin])

  const formatLastUpdated = () => {
    return lastUpdated.toLocaleTimeString()
  }

  const renderNoDataMessage = (message: string) => (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground mb-2">{message}</p>
        <Button variant="outline" size="sm" onClick={loadData} className="mt-2">
          Réessayer
        </Button>
      </div>
    </div>
  )

  return (
    <Card className="border-blue-100 dark:border-blue-900 shadow-md overflow-hidden min-h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-blue-100 dark:border-blue-800">
        <CardTitle className="text-lg font-medium">Statistiques Détaillées</CardTitle>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Dernière mise à jour: {formatLastUpdated()}</span>
          <Button
            onClick={loadData}
            disabled={refreshing}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Rafraîchir
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <Tabs defaultValue="jours" className="w-full h-full flex flex-col">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="jours" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Entretiens de cette Semaine
            </TabsTrigger>
            <TabsTrigger value="statut" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Statut des Entretiens
            </TabsTrigger>
          </TabsList>

          <div className="flex-grow">
            <TabsContent value="statut" className="h-full">
              <div className="h-[350px]">
                {loadingStatut ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="space-y-4 w-full">
                      <Skeleton className="h-[350px] w-full rounded-full mx-auto max-w-[350px]" />
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-red-500">Erreur lors du chargement des données</p>
                  </div>
                ) : entretiensParStatut.length > 0 ? (
                  <DonutChart
                    data={entretiensParStatut}
                    index="name"
                    category="value"
                    valueFormatter={(value) => `${value} entretiens`}
                    colors={["blue", "red", "green", "slate"]}
                    className="mt-4"
                  />
                ) : (
                  renderNoDataMessage("Aucune donnée disponible pour les statuts d'entretiens")
                )}
              </div>
            </TabsContent>

            <TabsContent value="jours" className="h-full">
              <div className="h-[350px]">
                {loadingJour ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="space-y-4 w-full">
                      <Skeleton className="h-[350px] w-full" />
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-red-500">Erreur lors du chargement des données</p>
                  </div>
                ) : entretiensParJour.length > 0 ? (
                  <LineChart
                    data={entretiensParJour}
                    index="name"
                    categories={["value"]}
                    colors={["blue"]}
                    valueFormatter={(value) => `${Math.round(value)} entretiens`}
                    yAxisWidth={48}
                    showGridLines={false}
                    startYAxisFromZero={true}
                    curveType="natural"
                    connectNulls={true}
                    showLegend={false}
                    showXAxis={true}
                    showYAxis={true}
                    className="mt-4"
                  />
                ) : (
                  renderNoDataMessage("Aucun entretien planifié cette semaine")
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
