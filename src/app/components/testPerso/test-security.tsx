"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Shield } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface TestSecurityProps {
  onViolation?: (type: string, count: number) => void
  maxViolations?: number
  children: React.ReactNode
  candidatId: number
  offreId: number
}

export default function TestSecurity({
  onViolation,
  maxViolations = 2,
  children,
  candidatId,
  offreId,
}: TestSecurityProps) {
  const [violations, setViolations] = useState<{ type: string; timestamp: number }[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [warningMessage, setWarningMessage] = useState("")
  const [cheatingDetected, setCheatingDetected] = useState(false)
  const [fullscreenAttempted, setFullscreenAttempted] = useState(false)

  // Group violations by type and count them
  const violationCounts = violations.reduce(
    (acc, violation) => {
      acc[violation.type] = (acc[violation.type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const hasExceededMaxViolations = Object.values(violationCounts).some((count) => count >= maxViolations)

  // Fonction pour enregistrer un score de triche
  const handleCheatingDetected = async () => {
    // Éviter d'appeler l'API plusieurs fois
    if (cheatingDetected) return

    setCheatingDetected(true)

    try {
      // Nettoyer le localStorage pour ce test
      const testIdPattern = `test_${candidatId}_${offreId}`
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(`personality_test_${testIdPattern}`)) {
          localStorage.removeItem(key)
          console.log(`Test supprimé du localStorage: ${key}`)
        }
      })

      const response = await fetch("http://127.0.0.1:8000/api/store-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidat_id: candidatId,
          offre_id: offreId,
          questions: [],
          answers: [],
          status: "tricher",
        }),
      })

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`)
      }

      const data = await response.json()
      console.log("Réponse du serveur:", data)
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du score de triche :", error)
    }
  }

  useEffect(() => {
    // Vérifier si le candidat a triché et enregistrer un score de zéro
    if (hasExceededMaxViolations && !cheatingDetected) {
      handleCheatingDetected()
    }
  }, [hasExceededMaxViolations, cheatingDetected])

  useEffect(() => {
    // Prevent copy, paste, cut
    const preventCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault()
      recordViolation("clipboard")
      showTemporaryWarning("Copier-coller n'est pas autorisé pendant ce test.")
    }

    // Prevent right-click context menu
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      recordViolation("contextmenu")
      showTemporaryWarning("Le menu contextuel n'est pas autorisé pendant ce test.")
    }

    // Prevent keyboard shortcuts
    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      // Prevent Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+P, F12, Alt+Tab
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "x" || e.key === "p")) ||
        e.key === "F12" ||
        e.key === "PrintScreen" ||
        (e.altKey && e.key === "Tab")
      ) {
        e.preventDefault()
        recordViolation("keyboard")
        showTemporaryWarning("Les raccourcis clavier ne sont pas autorisés pendant ce test.")
      }
    }

    // Track tab visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        recordViolation("tabswitch")
        // This will show when they return to the tab
        showTemporaryWarning("Vous avez quitté l'onglet du test. Cela sera signalé.")
      }
    }

    // Track window focus
    const handleWindowBlur = () => {
      recordViolation("windowblur")
      showTemporaryWarning("Vous avez quitté la fenêtre du test. Cela sera signalé.")
    }

    // Handle fullscreen change
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false)
        recordViolation("fullscreen")
        showTemporaryWarning("Vous avez quitté le mode plein écran. Cela sera signalé.")
      } else {
        setIsFullscreen(true)
      }
    }

    // Add all event listeners
    document.addEventListener("copy", preventCopyPaste)
    document.addEventListener("paste", preventCopyPaste)
    document.addEventListener("cut", preventCopyPaste)
    document.addEventListener("contextmenu", preventContextMenu)
    document.addEventListener("keydown", preventKeyboardShortcuts)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    window.addEventListener("blur", handleWindowBlur)

    // Cleanup
    return () => {
      document.removeEventListener("copy", preventCopyPaste)
      document.removeEventListener("paste", preventCopyPaste)
      document.removeEventListener("cut", preventCopyPaste)
      document.removeEventListener("contextmenu", preventContextMenu)
      document.removeEventListener("keydown", preventKeyboardShortcuts)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      window.removeEventListener("blur", handleWindowBlur)

      // Exit fullscreen on component unmount
      if (document.fullscreenElement) {
        document.exitFullscreen().catch((err) => console.error(err))
      }
    }
  }, [])

  // Request fullscreen mode with user interaction
  const requestFullscreenMode = () => {
    try {
      setFullscreenAttempted(true)

      // Utiliser une promesse pour gérer les erreurs de manière asynchrone
      const requestPromise = document.documentElement.requestFullscreen()

      // Gérer les erreurs potentielles
      requestPromise
        .then(() => {
          setIsFullscreen(true)
          console.log("Mode plein écran activé avec succès")
        })
        .catch((err) => {
          console.error("Erreur lors de la demande de plein écran:", err)
          // Afficher un message d'erreur à l'utilisateur
          showTemporaryWarning(
            "Impossible d'activer le mode plein écran. Veuillez autoriser cette fonctionnalité dans votre navigateur.",
          )

          // Enregistrer comme violation
          recordViolation("fullscreen_denied")
        })
    } catch (error) {
      console.error("Exception lors de la demande de plein écran:", error)
      showTemporaryWarning("Votre navigateur ne prend pas en charge le mode plein écran requis pour ce test.")
    }
  }

  // Record a security violation
  const recordViolation = (type: string) => {
    const newViolation = { type, timestamp: Date.now() }
    setViolations((prev) => [...prev, newViolation])

    // Calculate the count for this specific violation type
    const typeCount = violations.filter((v) => v.type === type).length + 1

    // Call the onViolation callback if provided
    if (onViolation) {
      onViolation(type, typeCount)
    }
  }

  // Show a temporary warning message
  const showTemporaryWarning = (message: string) => {
    setWarningMessage(message)
    setShowWarning(true)
    setTimeout(() => {
      setShowWarning(false)
    }, 5000)
  }

  // Fonction pour afficher le message de triche détectée
  const renderCheatingDetectedMessage = () => {
    return (
      <div className="w-full max-w-3xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-red-200">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 sm:p-6 flex flex-col items-center justify-center text-white">
            <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-white relative z-10" />
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-center">Test bloqué : Triche détectée</h2>
            <p className="text-white/80 text-center mt-2 text-sm sm:text-base">Vous n'êtes pas autorisé à repasser ce test</p>
          </div>

          <div className="p-4 sm:p-6">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Nous avons détecté des comportements suspects lors de votre tentative. Pour des raisons de sécurité et
                d'équité, vous ne pouvez plus continuer ce test.
              </AlertDescription>
            </Alert>

           

            <div className="flex justify-center">
              <Button
                onClick={() => window.history.back()}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 w-full sm:w-auto"
              >
                Retour aux offres d'emploi
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="test-security-container">
      {showWarning && (
        <div className="fixed inset-0 flex items-start justify-center pt-[15%] z-[9999] pointer-events-none px-4">
          <div className="animate-bounce-in">
            <Alert
              variant="destructive"
              className="test-security-warning shadow-lg border-2 border-red-500 bg-red-50 max-w-md w-full pointer-events-auto"
            >
              <div className="flex items-start gap-3">
                <div className="bg-red-100 p-2 rounded-full flex-shrink-0">
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-red-700 mb-1">Attention !</h3>
                  <AlertDescription className="text-red-700 font-medium text-sm sm:text-base">{warningMessage}</AlertDescription>
                  <p className="text-red-600 text-xs sm:text-sm mt-2">
                    Cette action est considérée comme une tentative de triche et sera signalée.
                  </p>
                </div>
              </div>
            </Alert>
          </div>
        </div>
      )}

      {/* Si trop de violations, on affiche le message de triche */}
      {hasExceededMaxViolations ? (
        renderCheatingDetectedMessage()
      ) : (
        <>
          {/* Si pas en plein écran et pas trop de violations, on affiche la demande de plein écran */}
          {!isFullscreen && (
            <div className="fullscreen-prompt fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4 text-center">
              <div className="bg-white p-4 sm:p-6 rounded-lg max-w-md w-full">
                <h3 className="text-lg sm:text-xl font-bold mb-4">Mode plein écran requis</h3>
                <p className="mb-4 text-sm sm:text-base text-gray-600">
                  Pour assurer l'intégrité du test, veuillez passer en mode plein écran en cliquant sur le bouton
                  ci-dessous.
                </p>
                <button
                  onClick={requestFullscreenMode}
                  className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  Passer en plein écran
                </button>

                {fullscreenAttempted && <div></div>}
              </div>
            </div>
          )}

          {/* Contenu normal du test */}
          {children}
        </>
      )}
    </div>
  )
}