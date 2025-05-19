"use client"
import { useEffect, useState } from "react"

export function WelcomeBanner() {
  const [companyName, setCompanyName] = useState("Recruteur")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/api/users/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${sessionStorage.getItem("token")}`,
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.nom_societe) {
            setCompanyName(data.nom_societe)
          }
        } else {
          console.error("Error response:", await response.text())
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [])

  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 via-blue-500 to-blue-600 p-8 text-white shadow-lg">
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Bienvenue, {companyName} ! 👋</h1>
            <p className="text-blue-50 ">
              Suivez l'évolution de vos candidatures et gérez vos offres d'emploi. Consultez les entretiens à venir.
            </p>
          </div>
        </div>
      </div>
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-indigo-500 opacity-20 blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-blue-500 opacity-20 blur-3xl" />
      <div className="absolute top-1/2 left-1/3 transform -translate-y-1/2 h-32 w-32 rounded-full bg-indigo-400 opacity-10 blur-2xl" />
    </div>
  )
}
