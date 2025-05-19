import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function WelcomeBanner() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-indigo-600 via-blue-500 to-blue-600 p-8 text-white shadow-lg">
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">Bienvenue, Admin ! 👋</h1>
            <p className="text-blue-50 max-w-xl">
              Consultez les dernières mises à jour et gérez vos tâches.
            </p>
          </div>
          <a href="rapport">
            <Button
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-blue-50 font-medium shadow-md transition-all"
            >
              Voir le rapport Annuel
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </div>
      </div>
      {/* Éléments décoratifs */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-indigo-500 opacity-20 blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-16 -ml-16 h-64 w-64 rounded-full bg-blue-500 opacity-20 blur-3xl" />
      <div className="absolute top-1/2 left-1/3 transform -translate-y-1/2 h-32 w-32 rounded-full bg-indigo-400 opacity-10 blur-2xl" />
    </div>
  )
}