"use client"

import { useState, useEffect } from "react"
import { BarChart, DonutChart } from "@/components/ui/chart1"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Type pour les données de graphique
type ChartData = {
  name: string
  value: number
}

type LineChartData = {
  name: string
  [key: string]: string | number
}

export function DashboardCharts({ isAdmin = false }) {
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [candidatsParDepartement, setCandidatsParDepartement] = useState<ChartData[]>([])
  const [candidatsParMois, setCandidatsParMois] = useState<LineChartData[]>([])
  const [candidatsParNiveau, setCandidatsParNiveau] = useState<ChartData[]>([])
  const [candidatsParOffre, setCandidatsParOffre] = useState<ChartData[]>([])
  const [candidatsParNiveauExp, setCandidatsParNiveauExp] = useState<ChartData[]>([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  // Fonction pour charger les données
  const loadData = async () => {
    setRefreshing(true)
    setError(false)
    setLoading(true)

    try {
      const token = sessionStorage.getItem("token")
      if (!token) {
        console.error("Aucun token trouvé")
        setError(true)
        setRefreshing(false)
        setLoading(false)
        return
      }

      const prefix = isAdmin ? "admin" : "recruteur"

      // Charger les données depuis les API
      try {
        const deptRes = await fetch(`http://127.0.0.1:8000/api/${prefix}/candidats-par-departementRec`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (deptRes.ok) {
          const deptData = await deptRes.json()
          if (Array.isArray(deptData) && deptData.length > 0) {
            setCandidatsParDepartement(deptData)
          } else {
            setCandidatsParDepartement([])
          }
        } else {
          setCandidatsParDepartement([])
        }
      } catch (e) {
        console.error("Erreur lors du chargement des candidats par département:", e)
        setCandidatsParDepartement([])
      }

      try {
        const moisRes = await fetch(`http://127.0.0.1:8000/api/${prefix}/candidats-par-moisRec`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (moisRes.ok) {
          const moisData = await moisRes.json()
          // Créer un tableau avec tous les mois de l'année
          const tousLesMois = [
            { name: "Jan", Candidats: 0 },
            { name: "Fév", Candidats: 0 },
            { name: "Mar", Candidats: 0 },
            { name: "Avr", Candidats: 0 },
            { name: "Mai", Candidats: 0 },
            { name: "Juin", Candidats: 0 },
            { name: "Juil", Candidats: 0 },
            { name: "Août", Candidats: 0 },
            { name: "Sep", Candidats: 0 },
            { name: "Oct", Candidats: 0 },
            { name: "Nov", Candidats: 0 },
            { name: "Déc", Candidats: 0 },
          ]

          // Mettre à jour avec les données réelles
          if (Array.isArray(moisData) && moisData.length > 0) {
            moisData.forEach((item) => {
              const index = tousLesMois.findIndex((mois) => mois.name === item.name)
              if (index !== -1) {
                tousLesMois[index].Candidats = item.Candidats
              }
            })
            setCandidatsParMois(tousLesMois)
          } else {
            setCandidatsParMois(tousLesMois)
          }
        } else {
          setCandidatsParMois([])
        }
      } catch (e) {
        console.error("Erreur lors du chargement des candidats par mois:", e)
        setCandidatsParMois([])
      }

      // Charger les données de niveau d'expérience
      try {
        const niveauExpRes = await fetch("http://127.0.0.1:8000/api/recruteur/candidats-par-niveauExpRec", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (niveauExpRes.ok) {
          const niveauExpData = await niveauExpRes.json()
          if (Array.isArray(niveauExpData) && niveauExpData.length > 0) {
            setCandidatsParNiveauExp(niveauExpData)
          } else {
            setCandidatsParNiveauExp([])
          }
        } else {
          setCandidatsParNiveauExp([])
        }
      } catch (e) {
        console.error("Erreur lors du chargement des candidats par niveau d'expérience:", e)
        setCandidatsParNiveauExp([])
      }

      // Charger les données de niveau d'études
      try {
        const niveauRes = await fetch("http://127.0.0.1:8000/api/recruteur/candidats-par-niveauRec", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (niveauRes.ok) {
          const niveauData = await niveauRes.json()
          if (Array.isArray(niveauData) && niveauData.length > 0) {
            setCandidatsParNiveau(niveauData)
          } else {
            setCandidatsParNiveau([])
          }
        } else {
          setCandidatsParNiveau([])
        }
      } catch (e) {
        console.error("Erreur lors du chargement des candidats par niveau:", e)
        setCandidatsParNiveau([])
      }

      // Charger les données de candidats par poste
      try {
        const offreRes = await fetch("http://127.0.0.1:8000/api/recruteur/candidats-par-poste", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (offreRes.ok) {
          const offreData = await offreRes.json()
          if (Array.isArray(offreData) && offreData.length > 0) {
            setCandidatsParOffre(offreData)
          } else {
            setCandidatsParOffre([])
          }
        } else {
          setCandidatsParOffre([])
        }
      } catch (e) {
        console.error("Erreur lors du chargement des candidats par offre:", e)
        setCandidatsParOffre([])
      }

      setLastUpdated(new Date())
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error)
      setError(true)
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  // Charger les données au chargement du composant
  useEffect(() => {
    loadData()
  }, [isAdmin])

  const formatLastUpdated = () => {
    return lastUpdated.toLocaleTimeString()
  }

  return (
    <Card className="border-blue-100 dark:border-blue-900 shadow-md overflow-hidden min-h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-blue-100 dark:border-blue-800">
        <CardTitle className="text-lg font-medium">Statistiques des Candidats</CardTitle>
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
        <Tabs defaultValue="departements" className="w-full h-full flex flex-col">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger
              value="departements"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Par Département
            </TabsTrigger>
            {/* modifier tendence par niveauExpérience */}
            <TabsTrigger value="tendances" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Niveau d'Expérience
            </TabsTrigger>
            <TabsTrigger value="niveau" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Niveau d'Études
            </TabsTrigger>
            <TabsTrigger value="postes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              Candidats par Poste
            </TabsTrigger>
          </TabsList>

          <div className="flex-grow">
            <TabsContent value="departements" className="h-full">
              <div className="h-[350px]">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="space-y-4 w-full">
                      <Skeleton className="h-[250px] w-full" />
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-red-500">Erreur lors du chargement des données</p>
                  </div>
                ) : candidatsParDepartement.length > 0 ? (
                  <BarChart
                    data={candidatsParDepartement}
                    index="name"
                    categories={["value"]}
                    colors={["blue"]}
                    valueFormatter={(value) => `${value} candidats`}
                    yAxisWidth={48}
                    className="mt-4"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tendances" className="h-full">
              <div className="h-[350px]">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="space-y-4 w-full">
                      <Skeleton className="h-[250px] w-full" />
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-red-500">Erreur lors du chargement des données</p>
                  </div>
                ) : candidatsParNiveauExp.length > 0 ? (
                  <DonutChart
                    data={candidatsParNiveauExp}
                    index="name"
                    category="value"
                    valueFormatter={(value) => `${value} candidats`}
                    colors={["blue", "purple", "green", "orange", "red"]}
                    className="mt-4"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="niveau" className="h-full">
              <div className="h-[350px]">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="space-y-4 w-full">
                      <Skeleton className="h-[250px] w-full rounded-full mx-auto max-w-[250px]" />
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-red-500">Erreur lors du chargement des données</p>
                  </div>
                ) : candidatsParNiveau.length > 0 ? (
                  <>
                    <div className="mb-2 text-sm text-muted-foreground">
                      {candidatsParNiveau.length} niveaux d'études trouvés
                    </div>
                    <DonutChart
                      data={candidatsParNiveau}
                      index="name"
                      category="value"
                      valueFormatter={(value) => `${value} candidats`}
                      colors={["blue", "purple", "black", "navy", "indigo", "royalblue"]}
                      className="mt-4"
                    />
                  </>
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="postes" className="h-full">
              <div className="h-[350px]">
                {loading ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="space-y-4 w-full">
                      <Skeleton className="h-[250px] w-full" />
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-red-500">Erreur lors du chargement des données</p>
                  </div>
                ) : candidatsParOffre.length > 0 ? (
                  <BarChart
                    data={candidatsParOffre}
                    index="name"
                    categories={["value"]}
                    colors={["indigo"]}
                    valueFormatter={(value) => `${value} candidats`}
                    yAxisWidth={48}
                    className="mt-4"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-muted-foreground">Aucune donnée disponible</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
