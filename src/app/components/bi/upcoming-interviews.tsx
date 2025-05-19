"use client"

import { useState, useEffect } from "react"
import { Calendar, Clock, MapPin, Video } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"

type Interview = {
  id: number
  candidat_nom: string
  candidat_prenom: string
  poste: string
  date_heure: string
  type: string
  lien_ou_adresse: string
  status: string
}

export function UpcomingInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchInterviews = async () => {
    try {
      setError(false)
      const token = sessionStorage.getItem("token")
      if (!token) {
        console.error("Aucun token trouvé")
        setError(true)
        setLoading(false)
        return
      }

      try {
        const response = await fetch("http://127.0.0.1:8000/api/recruteur/mes-entretiens", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`)
        }

        const data = await response.json()
        console.log("Données d'entretiens reçues:", data) // Log pour déboguer

        // Prendre les 3 premiers entretiens, sans filtrage
        const upcomingInterviews = data.slice(0, 3)
        setInterviews(upcomingInterviews)
      } catch (fetchError) {
        console.error("Erreur lors de la récupération des entretiens:", fetchError)
        setError(true)
        setInterviews([])
      }
    } catch (error) {
      console.error("Erreur générale:", error)
      setError(true)
      setInterviews([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInterviews()
  }, [])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    } catch (e) {
      console.error("Erreur de formatage de date:", e)
      return dateString
    }
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      console.error("Erreur de formatage d'heure:", e)
      return ""
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge
            variant="outline"
            className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800"
          >
            En attente
          </Badge>
        )
      case "completed":
        return (
          <Badge
            variant="outline"
            className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800"
          >
            Terminé
          </Badge>
        )
      case "cancelled":
        return (
          <Badge
            variant="outline"
            className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800"
          >
            Annulé
          </Badge>
        )
      default:
        return (
          <Badge
            variant="outline"
            className="bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800"
          >
            {status || "Planifié"}
          </Badge>
        )
    }
  }

  return (
    <Card className="border-blue-100 dark:border-blue-900 shadow-md overflow-hidden h-full min-h-[600px] flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between border-b border-blue-100 dark:border-blue-800 pb-3">
        <CardTitle className="text-lg font-medium">Entretiens à venir</CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchInterviews}
          disabled={loading}
          className="border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
        >
          {loading ? "Chargement..." : "Actualiser"}
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-grow flex flex-col">
        {loading ? (
          <div className="flex flex-col gap-4 p-6 flex-grow">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <Skeleton className="h-5 w-40 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                {i < 2 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-8 flex-grow flex items-center justify-center">
            <div>
              <p className="text-red-500 mb-2">Erreur lors de la récupération des entretiens</p>
              <Button
                size="sm"
                onClick={fetchInterviews}
                variant="outline"
                className="mt-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              >
                Réessayer
              </Button>
            </div>
          </div>
        ) : interviews.length > 0 ? (
          <div className="divide-y divide-blue-100 dark:divide-blue-900 flex-grow">
            {interviews.map((interview, index) => (
              <div
                key={interview.id || index}
                className="p-6 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-medium text-blue-700 dark:text-blue-400">
                      {interview.candidat_prenom} {interview.candidat_nom}
                    </h3>
                    <p className="text-sm text-muted-foreground">Postuler pour : {interview.poste}</p>
                  </div>
                  <div>{getStatusBadge(interview.status)}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>{formatDate(interview.date_heure)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>{formatTime(interview.date_heure)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm">
                      {interview.type === "en ligne" ? "Entretien en ligne" : "Entretien présentiel"}
                    </span>
                  </div>
                  {interview.type === "en ligne" && interview.lien_ou_adresse && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/30"
                    >
                      <a
                        href={interview.lien_ou_adresse}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm"
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Rejoindre
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 flex-grow flex items-center justify-center">
            <div>
              <p className="text-muted-foreground">Aucun entretien à venir</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                onClick={fetchInterviews}
              >
                Actualiser
              </Button>
            </div>
          </div>
        )}

        <div className="p-4 text-center mt-auto bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800">
          <Button
            variant="default"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 shadow-sm w-full max-w-xs"
            asChild
          >
            <a href="/entretiens">Voir tous les entretiens</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
