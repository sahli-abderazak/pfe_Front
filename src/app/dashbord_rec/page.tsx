"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { StatsCards } from "../components/bi/stats-cards"
import { DashboardCharts } from "../components/bi/dashboard-charts"
import { DetailedStats } from "../components/bi/detailed-stats"
import { UpcomingInterviews } from "../components/bi/upcoming-interviews"
import { WelcomeBanner } from "../components/recruteur/welcome-banner_rec"
import { DashboardSidebarRec } from "../components/recruteur/dashboard-sidebar_rec"
import { DashboardHeaderRec } from "../components/recruteur/dashboard-header_rec"
import { TrendChart } from "../components/bi/trend-chart"

export default function RecruiterDashboard() {
  const router = useRouter()
  const [shouldRender, setShouldRender] = useState(false)
  const [profileError, setProfileError] = useState(false)

  useEffect(() => {
    // Vérifier le rôle de l'utilisateur avant de rendre la page
    const checkUserRole = async () => {
      try {
        setProfileError(false)
        const token = sessionStorage.getItem("token")
        if (!token) {
          // Rediriger vers la page de connexion si pas de token
          router.push("/")
          return
        }

        try {
          const response = await fetch("http://127.0.0.1:8000/api/users/profile", {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (!response.ok) {
            if (response.status === 401) {
              // Token expiré ou invalide
              sessionStorage.removeItem("token")
              router.push("/")
              return
            }
            throw new Error(`Erreur HTTP: ${response.status}`)
          }

          const userData = await response.json()

          // Si l'utilisateur est un recruteur, autoriser le rendu de la page
          if (userData.role === "recruteur") {
            setShouldRender(true)
          } else {
            // Si autre rôle, rediriger vers la page d'accueil
            router.push("/dashboard/admin")
          }
        } catch (fetchError) {
          console.error("Erreur lors de la récupération du profil:", fetchError)
          setProfileError(true)
          // Autoriser quand même le rendu de la page en mode dégradé
          setShouldRender(true)
        }
      } catch (error) {
        console.error("Erreur générale:", error)
        setProfileError(true)
        // Autoriser quand même le rendu de la page en mode dégradé
        setShouldRender(true)
      }
    }

    checkUserRole()
  }, [router])

  // Ne rien afficher jusqu'à ce que la vérification soit terminée
  if (!shouldRender) {
    return null
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <DashboardHeaderRec />
      <div className="container mx-auto p-4 md:p-6 lg:p-8 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar - visible on desktop, hidden on mobile (handled by MobileSidebar) */}
          <div className="hidden md:block md:col-span-2 lg:col-span-2">
            <div className="sticky top-20">
              <DashboardSidebarRec />
            </div>
          </div>

          {/* Main Content */}
          <div className="md:col-span-10 lg:col-span-10 space-y-6">
            {/* Welcome Banner */}
            <WelcomeBanner />
            {profileError && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400"
                role="alert"
              >
                <strong className="font-bold">Attention!</strong>
                <span className="block sm:inline">
                  {" "}
                  Impossible de récupérer votre profil complet. Certaines fonctionnalités peuvent être limitées.
                </span>
              </div>
            )}

            {/* Stats Cards - Fixed height and consistent design */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Vue d'ensemble</h2>
              <StatsCards isAdmin={false} />
            </div>

            {/* Tendances Chart - Repositionné comme dans la capture d'écran */}
            <div className="mt-6">
              <TrendChart />
            </div>

            {/* Two Column Layout for Charts and Upcoming Interviews */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
              <div className="lg:col-span-2">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Analyses détaillées</h2>
                <div className="bg-white rounded-lg p-5">
                  <DetailedStats isAdmin={false} />
                </div>
              </div>

              <div className="lg:col-span-1">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Entretiens</h2>
                <div className="bg-white rounded-lg p-5">
                  <UpcomingInterviews />
                </div>
              </div>
            </div>

            {/* Detailed Stats Section */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Statistiques</h2>
              <div className="bg-white rounded-lg p-5">
                <DashboardCharts isAdmin={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
