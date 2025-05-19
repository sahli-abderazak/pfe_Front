"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, CheckCircle2, Home, Shield } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Header from "../../../components/index/header"
import Footer from "../../../components/index/footer"
import PersonalityTest from "../../../components/testPerso/personality-test"
import "../../../components/styles/test-personnalite.css"
import "../../../components/styles/index.css"
import "../../../components/styles/rating.css"

export default function TestPersonnalitePage({
  params,
}: {
  params: Promise<{ candidat: string; offre: string }>
}) {
  // Unwrap the params Promise using React.use()
  const { candidat, offre } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [offreDetails, setOffreDetails] = useState<any>(null)
  const [testCompleted, setTestCompleted] = useState(false)
  const [securityViolations, setSecurityViolations] = useState<Record<string, number>>({})
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  const [ratingMessage, setRatingMessage] = useState<string | null>(null)
  const [alreadyCompletedTest, setAlreadyCompletedTest] = useState(false)
  const [previousScore, setPreviousScore] = useState<number | null>(null)
  const [cheatingDetected, setCheatingDetected] = useState(false)
  const [testStage, setTestStage] = useState<"test" | "timeout">("test")

  // Parse IDs from params, ensuring they're valid numbers
  const candidatId = candidat ? Number.parseInt(candidat, 10) : null
  const offreId = offre ? Number.parseInt(offre, 10) : null

  // Fonction pour afficher le message de triche détectée
  const renderCheatingDetectedMessage = () => {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-red-200">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 flex flex-col items-center justify-center text-white">
            <div className="h-20 w-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center mb-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse"></div>
                <Shield className="h-10 w-10 text-white relative z-10" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center">Test bloqué : Triche détectée</h2>
            <p className="text-white/80 text-center mt-2">Vous n'êtes pas autorisé à repasser ce test</p>
          </div>

          <div className="p-6">
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nous avons détecté des comportements suspects lors de votre précédente tentative. Pour des raisons de
                sécurité et d'équité, vous ne pouvez plus repasser ce test.
              </AlertDescription>
            </Alert>

            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-red-800 mb-2">Pourquoi ce message ?</h3>
              <p className="text-red-700 text-sm">
                Notre système a détecté des tentatives de contournement des règles du test, comme des changements
                d'onglet, des sorties de la fenêtre, des tentatives de copier-coller, ou d'autres actions non autorisées
                pendant l'évaluation.
              </p>
            </div>

            <div className="flex justify-center">
              <Button
                onClick={() => router.push("/jobs")}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                Retour aux offres d'emploi
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Ajouter cette fonction après les imports mais avant le composant
  const clearTestFromLocalStorage = (candidatId: number, offreId: number) => {
    const testIdPattern = `test_${candidatId}_${offreId}`

    // Parcourir tous les éléments du localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(`personality_test_${testIdPattern}`)) {
        localStorage.removeItem(key)
        console.log(`Test supprimé du localStorage: ${key}`)
      }
    })
  }

  // Modifier la fonction useEffect qui vérifie le statut du test pour s'assurer qu'elle fonctionne correctement
  useEffect(() => {
    // Validate IDs
    if (!candidatId || isNaN(candidatId) || !offreId || isNaN(offreId)) {
      setError("Identifiants de candidat ou d'offre invalides")
      setLoading(false)
      return
    }

    // Check if candidate has already completed the test
    const checkTestStatus = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/generateTest`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            candidat_id: candidatId,
            offre_id: offreId,
          }),
        })

        const data = await response.json()
        console.log("Réponse de generateTest:", data)

        // Check if there's an error response indicating the test was already taken
        if (!response.ok && data.error) {
          // Vérifier le statut du test
          if (data.status === "tricher") {
            // Si le statut est "tricher", afficher le message de triche
            setCheatingDetected(true)
            // Clear any saved test data from localStorage
            clearTestFromLocalStorage(Number(candidatId), Number(offreId))
            setLoading(false)
            return
          } else if (data.status === "temps ecoule") {
            // Si le statut est "temps ecoule", afficher le message de temps écoulé
            setTestStage("timeout")
            setTestCompleted(true)
            setLoading(false)
            return
          } else if (data.status === "terminer") {
            // Si le statut est "terminer", afficher le message de test déjà complété
            setAlreadyCompletedTest(true)
            setPreviousScore(data.score)
            setLoading(false)
            return
          }
        }

        // If we get here, the test hasn't been taken yet
        // Fetch job details
        fetchOffreDetails()
      } catch (error) {
        // Fetch job details even if there's an error checking test status
        fetchOffreDetails()
      }
    }

    // Fonction pour récupérer les détails de l'offre
    const fetchOffreDetails = async () => {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/offreDetail/${offreId}`)
        if (!response.ok) {
          throw new Error(`Impossible de récupérer les détails de l'offre: ${response.status}`)
        }
        const data = await response.json()
        setOffreDetails(data)
      } catch (error) {
        console.error("Erreur lors de la récupération des détails de l'offre:", error)
        // Don't set error here, as the test can continue without job details
      } finally {
        setLoading(false)
      }
    }

    // Exécuter la vérification du statut du test en premier
    checkTestStatus()
  }, [candidatId, offreId, candidat, offre])

  // Modifier la fonction handleTestComplete pour nettoyer le localStorage
  const handleTestComplete = () => {
    setTestCompleted(true)

    // Nettoyer le localStorage une fois le test terminé avec succès
    if (candidatId && offreId) {
      clearTestFromLocalStorage(Number(candidatId), Number(offreId))
    }
  }

  // Handle security violations from the test
  const handleSecurityViolation = (type: string, count: number) => {
    setSecurityViolations((prev) => ({
      ...prev,
      [type]: count,
    }))

    // Log violations to console for debugging
    console.log(`Security violation detected: ${type}, count: ${count}`)

    // Si on a trop de violations, on sort du mode plein écran
    if (hasTooManyViolations() && document.fullscreenElement) {
      document.exitFullscreen().catch((err) => console.error("Erreur lors de la sortie du mode plein écran:", err))
    }
  }

  // Modifier la fonction hasTooManyViolations pour limiter à 2 violations par type
  const hasTooManyViolations = () => {
    // Vérifier si un type de violation a atteint ou dépassé 2 occurrences
    return Object.values(securityViolations).some((count) => count >= 2)
  }

  // Ajouter un gestionnaire pour l'événement beforeunload pour enregistrer le score lorsque la fenêtre est fermée
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Enregistrer le score avant que la fenêtre ne se ferme
      if (!testCompleted && !error && !hasTooManyViolations()) {
        // Appeler une fonction pour enregistrer le score en urgence
        saveScoreOnExit()
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [testCompleted, error, securityViolations])

  // Ajouter la fonction pour enregistrer le score en cas de sortie
  const saveScoreOnExit = async () => {
    try {
      // Appel à l'API existante pour enregistrer le score en urgence
      const response = await fetch(`http://127.0.0.1:8000/api/store-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidat_id: candidatId,
          offre_id: offreId,
          score_total: 0, // Score minimal car test abandonné
          questions: [],
          answers: [],
          status: "tricher", // Indiquer que le test a été abandonné (considéré comme triche)
          security_violations: securityViolations,
        }),
        // Utiliser keepalive pour s'assurer que la requête est envoyée même si la page se ferme
        keepalive: true,
      })

      console.log("Score d'urgence enregistré")
    } catch (error) {
      console.error("Erreur lors de l'enregistrement du score d'urgence:", error)
    }
  }

  const handleRatingSubmit = async (score: number) => {
    setSelectedRating(score)
    setRatingMessage(null) // Réinitialiser le message

    try {
      // Ensure we have valid IDs
      const candidatIdNumber = Number(candidatId)
      const offreIdNumber = Number(offreId)

      if (isNaN(candidatIdNumber) || isNaN(offreIdNumber)) {
        console.error("Identifiants de candidat ou d'offre invalides")
        setRatingMessage("Erreur: Identifiants invalides")
        return
      }

      // Call the API to store the rating
      const response = await fetch(`http://127.0.0.1:8000/api/offre-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offre_id: offreIdNumber,
          candidat_id: candidatIdNumber,
          score: score,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Erreur lors de l'enregistrement de l'évaluation:", errorData)

        // Si l'erreur est due à un score déjà existant, on essaie de le mettre à jour
        if (errorData.message && errorData.message.includes("Score déjà enregistré")) {
          await updateExistingRating(score, candidatIdNumber, offreIdNumber)
        } else {
          setRatingMessage("Erreur lors de l'enregistrement de l'évaluation")
        }
        return
      }

      // Show confirmation message
      setRatingSubmitted(true)
      setRatingMessage("Merci pour votre évaluation !")
      console.log("Évaluation enregistrée avec succès")
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'évaluation:", error)
      setRatingMessage("Erreur lors de l'enregistrement de l'évaluation")
    }
  }

  // Fonction pour mettre à jour un score existant
  const updateExistingRating = async (score: number, candidatId: number, offreId: number) => {
    try {
      // Appel à une API pour mettre à jour le score existant
      // Note: Cette API doit être implémentée côté backend
      const response = await fetch(`http://127.0.0.1:8000/api/update-offre-score`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          offre_id: offreId,
          candidat_id: candidatId,
          score: score,
        }),
      })

      if (!response.ok) {
        throw new Error("Impossible de mettre à jour le score")
      }

      // Show confirmation message
      setRatingSubmitted(true)
      setRatingMessage("Votre évaluation a été mise à jour !")
      console.log("Évaluation mise à jour avec succès")
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'évaluation:", error)
      setRatingMessage("Erreur lors de la mise à jour de l'évaluation")
    }
  }

  return (
    <div className="personality-test-page">
      {/* <Header /> */}

      <main className="personality-test-main">
        <div className="personality-test-container">
          {/* Breadcrumb and title */}
          <div className="breadcrumb-container">
            <div className="breadcrumb">
              <Link href="/" className="breadcrumb-link">
                <Home className="breadcrumb-icon" />
                Accueil
              </Link>
              <span className="breadcrumb-separator">/</span>
              <Link href="/jobs" className="breadcrumb-link">
                Offres d'emploi
              </Link>
              <span className="breadcrumb-separator">/</span>
              {offreDetails ? (
                <Link href={`/jobsDetail/${offreId}`} className="breadcrumb-link">
                  {offreDetails.poste}
                </Link>
              ) : (
                <span className="breadcrumb-text">Détail de l'offre</span>
              )}
              <span className="breadcrumb-separator">/</span>
              <span className="breadcrumb-current">Test de personnalité</span>
            </div>

            <div className="page-header">
              <div className="page-title-container">
                <h1 className="page-title">Test de personnalité</h1>
                <p className="page-subtitle">
                  {offreDetails
                    ? `Pour le poste de ${offreDetails.poste} chez ${offreDetails.societe}`
                    : "Évaluez votre compatibilité avec le poste"}
                </p>
              </div>

              <Button variant="outline" size="sm" onClick={() => router.back()} className="back-button">
                <ArrowLeft className="back-button-icon" />
                Retour
              </Button>
            </div>
          </div>

          {cheatingDetected ? (
            renderCheatingDetectedMessage()
          ) : alreadyCompletedTest ? (
            <Card className="test-card overflow-hidden border-0 shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1">
                <CardContent className="bg-white p-0 rounded-sm">
                  <div className="flex flex-col items-center text-center p-8 pb-6">
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-30"></div>
                      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 shadow-inner">
                        <CheckCircle2 className="h-10 w-10 text-blue-600" />
                      </div>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Test déjà complété</h2>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mb-4"></div>
                    <p className="text-gray-600 mb-6 max-w-md">
                      Vous avez déjà passé ce test pour cette offre. Votre résultat a été enregistré et est disponible
                      ci-dessous.
                    </p>

                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-8 w-full max-w-md">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-700 font-medium">Votre score</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {previousScore}
                          </span>
                          <span className="text-gray-500 text-sm">/ 100</span>
                        </div>
                      </div>
                      <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                          style={{ width: `${Math.min(100, Math.max(0, previousScore))}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                      <Button
                        onClick={() => router.push("/jobs")}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      >
                        Voir d'autres offres
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push("/")}
                        className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        Retour à l'accueil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </div>
            </Card>
          ) : (
            <Card className="test-card">
              <CardContent className="test-card-content">
                {loading ? (
                  <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p className="loading-text">Chargement du test de personnalité...</p>
                  </div>
                ) : error ? (
                  <div className="error-container">
                    <Alert variant="destructive" className="error-alert">
                      <AlertCircle className="error-icon" />
                      <AlertTitle>Erreur</AlertTitle>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <div className="error-action">
                      <Button onClick={() => router.push("/jobs")}>Retour aux offres d'emploi</Button>
                    </div>
                  </div>
                ) : hasTooManyViolations() ? (
                  <div className="error-container">
                    <Alert variant="destructive" className="error-alert">
                      <AlertCircle className="error-icon" />
                      <AlertTitle>Test interrompu</AlertTitle>
                      <AlertDescription>
                        Nous avons détecté plusieurs tentatives de contourner les règles du test. Votre session a été
                        interrompue pour des raisons de sécurité.
                      </AlertDescription>
                    </Alert>
                    <div className="error-action">
                      <Button onClick={() => router.push("/jobs")}>Retour aux offres d'emploi</Button>
                    </div>
                    <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-700 mb-2">Violations de sécurité détectées :</h4>
                      <ul className="list-disc pl-5 text-sm text-red-600">
                        {Object.entries(securityViolations).map(([type, count]) => (
                          <li key={type}>
                            {type === "clipboard" && `Tentatives de copier-coller: ${count}`}
                            {type === "tabswitch" && `Changements d'onglet: ${count}`}
                            {type === "windowblur" && `Sorties de la fenêtre: ${count}`}
                            {type === "keyboard" && `Raccourcis clavier interdits: ${count}`}
                            {type === "contextmenu" && `Ouvertures du menu contextuel: ${count}`}
                            {type === "fullscreen" && `Sorties du mode plein écran: ${count}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : testCompleted ? (
                  <div className="success-container">
                    <div className="success-icon-container">
                      <CheckCircle2 className="success-icon" />
                    </div>
                    <h2 className="success-title">Test complété !</h2>
                    <p className="success-message">
                      Merci d'avoir complété le test de personnalité. Votre candidature a été enregistrée et sera
                      examinée par notre équipe. N'hésitez pas à consulter votre email, nous vous enverrons bientôt une
                      notification concernant votre acceptation ou rejet pour un entretien présentiel.
                    </p>

                    {/* Rating system with smiles */}
                    <div className="rating-container">
                      <h4 className="rating-title">Comment évaluez-vous ce test ?</h4>
                      <div className="rating-options">
                        {[1, 2, 3, 4, 5].map((score) => (
                          <div key={score} className="rating-option">
                            <button
                              onClick={() => handleRatingSubmit(score)}
                              className="rating-button"
                              aria-label={`Note ${score} sur 5`}
                            >
                              <div className={`rating-smile ${selectedRating === score ? "selected" : "unselected"}`}>
                                <span className="rating-emoji">
                                  {score === 1 && "😞"}
                                  {score === 2 && "🙁"}
                                  {score === 3 && "😐"}
                                  {score === 4 && "🙂"}
                                  {score === 5 && "😄"}
                                </span>
                              </div>
                            </button>
                            <span className="rating-label">
                              {score === 1 && "Très insatisfait"}
                              {score === 2 && "Insatisfait"}
                              {score === 3 && "Neutre"}
                              {score === 4 && "Satisfait"}
                              {score === 5 && "Très satisfait"}
                            </span>
                          </div>
                        ))}
                      </div>
                      {ratingMessage && (
                        <div
                          className={`rating-message ${
                            ratingMessage.includes("Erreur") ? "rating-error" : "rating-success"
                          }`}
                        >
                          {ratingMessage}
                        </div>
                      )}
                    </div>

                    <div className="success-actions mt-6">
                      <Button onClick={() => router.push("/jobs")}>Voir d'autres offres</Button>
                      <Button variant="outline" onClick={() => router.push("/")}>
                        Retour à l'accueil
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="test-container">
                    <div className="test-instructions">
                      <h2 className="instructions-title">Instructions</h2>
                      <p className="instructions-text">
                        Ce test de personnalité nous aidera à évaluer votre compatibilité avec le poste. Il comporte Un
                        questionnaire à choix multiples.
                        <br />
                        <br />
                        Veuillez répondre honnêtement à toutes les questions. Il n'y a pas de bonnes ou mauvaises
                        réponses.
                      </p>
                      <Alert className="mb-4 bg-amber-50 border-amber-200">
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-amber-800">
                          Pour garantir l'intégrité du test, veuillez noter que :
                          <ul className="list-disc pl-5 mt-2 text-sm">
                            <li>Le copier-coller est désactivé pendant le test</li>
                            <li>Vous devez rester sur cette page jusqu'à la fin du test</li>
                            <li>Le test s'exécutera en mode plein écran</li>
                            <li>Toute tentative de contourner ces mesures sera enregistrée</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>

                    {candidatId && offreId ? (
                      <PersonalityTest candidatId={candidatId} offreId={offreId} onTestComplete={handleTestComplete} />
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="error-icon" />
                        <AlertTitle>Erreur</AlertTitle>
                        <AlertDescription>Identifiants manquants pour le test</AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}