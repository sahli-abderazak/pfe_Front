"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertCircle, Clock, Shield } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import TestSecurity from "./test-security"

// Ajouter ces imports en haut du fichier
import { useState, useEffect, useRef, useCallback } from "react"

// Ajouter ces imports en haut du fichier (après les imports existants)
import { X } from "lucide-react"

interface Option {
  text: string
  score: number
}

interface TestQuestion {
  trait: string
  question: string
  options: Option[]
}

interface PersonalityTestProps {
  candidatId: number
  offreId: number
  onTestComplete?: () => void
}

// Ajouter cette fonction après les imports mais avant le composant
function generateTestId(candidatId: number, offreId: number) {
  return `test_${candidatId}_${offreId}_${new Date().toISOString().split("T")[0]}`
}

const PersonalityTest: React.FC<PersonalityTestProps> = ({ candidatId, offreId, onTestComplete }) => {
  const [questions, setQuestions] = useState<TestQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState<Option | null>(null)
  const [totalScore, setTotalScore] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [testCompleted, setTestCompleted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [answers, setAnswers] = useState<(Option | null)[]>([])
  const [testStage, setTestStage] = useState<"qcm" | "image" | "completed" | "timeout">("qcm")
  const [personalityAnalysis, setPersonalityAnalysis] = useState<string | null>(null)
  const [securityViolations, setSecurityViolations] = useState<Record<string, number>>({})
  const [testForcedToEnd, setTestForcedToEnd] = useState(false)
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  // Ajouter ces états dans le composant PersonalityTest
  const [testId, setTestId] = useState<string | null>(null)
  const [cheatingDetected, setCheatingDetected] = useState(false)

  // Ajouter ces états dans le composant PersonalityTest (avec les autres états)
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [unansweredQuestions, setUnansweredQuestions] = useState<number[]>([])

  // Timer state
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [totalTime] = useState(7 * 60) // 7 minutes in seconds
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Use refs to track initialization state and prevent multiple API calls
  const isInitialRender = useRef(true)
  const questionsInitialized = useRef(false)
  const apiCallInProgress = useRef(false)

  // Remplacer la fonction handleTimeExpired par celle-ci pour calculer et enregistrer les scores par trait
  const handleTimeExpired = useCallback(async () => {
    try {
      // Préparer les données des réponses pour le stockage, y compris les questions sans réponse
      const answersData = questions.map((question, index) => {
        const answer = answers[index]

        if (answer) {
          // Si une réponse existe pour cette question
          const optionIndex = question.options.findIndex(
            (opt) => opt.text === answer.text && opt.score === answer.score,
          )

          return {
            question_index: index,
            selected_option_index: optionIndex !== -1 ? optionIndex : 0,
            score: answer.score,
            trait: question.trait,
          }
        } else {
          // Si aucune réponse n'existe pour cette question, score = 0
          return {
            question_index: index,
            selected_option_index: -1, // Aucune option sélectionnée
            score: 0, // Score de 0 pour les questions sans réponse
            trait: question.trait,
          }
        }
      })

      // Calculer le score total, y compris les 0 pour les questions sans réponse
      const currentTotalScore = answersData.reduce((total, answer) => total + answer.score, 0)

      // Calculer les scores par trait de personnalité
      const traitScores: Record<string, number> = {}

      // Initialiser les scores par trait
      answersData.forEach((answer) => {
        if (!traitScores[answer.trait]) {
          traitScores[answer.trait] = 0
        }
        traitScores[answer.trait] += answer.score
      })

      // Ensure we have valid IDs
      const candidatIdNumber = Number(candidatId)
      const offreIdNumber = Number(offreId)

      if (isNaN(candidatIdNumber) || isNaN(offreIdNumber)) {
        throw new Error("Identifiants de candidat ou d'offre invalides")
      }

      console.log(`Envoi du score pour temps écoulé - candidat ID: ${candidatIdNumber}, offre ID: ${offreIdNumber}`)
      console.log(`Score total calculé: ${currentTotalScore}, Réponses: ${answersData.length}/${questions.length}`)
      console.log("Scores par trait:", traitScores)

      const storeScoreResponse = await fetch(`http://127.0.0.1:8000/api/store-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidat_id: candidatIdNumber,
          offre_id: offreIdNumber,
          score_total: currentTotalScore,
          questions: questions,
          answers: answersData, // Inclut toutes les questions, même celles sans réponse
          status: "temps ecoule", // Statut pour temps écoulé
          trait_scores: traitScores, // Ajouter les scores par trait
        }),
      })

      if (!storeScoreResponse.ok) {
        const errorData = await storeScoreResponse.json()
        throw new Error(errorData.error || `Erreur HTTP ${storeScoreResponse.status}`)
      }

      console.log(`Score pour temps écoulé enregistré avec succès`)

      // Nettoyer le localStorage une fois le score enregistré
      if (testId) {
        localStorage.setItem(
          `personality_test_${testId}`,
          JSON.stringify({
            questions,
            answers,
            lastUpdated: new Date().toISOString(),
            status: "temps ecoule",
            startTime: startTime,
            timeRemaining: 0,
          }),
        )
      }
    } catch (error) {
      console.error(`Erreur: ${error instanceof Error ? error.message : String(error)}`)
    }
  }, [answers, questions, candidatId, offreId, testId, startTime])

  // Ajouter cette fonction après la déclaration des états
  const checkTimeExpired = useCallback(() => {
    if (timeRemaining !== null && timeRemaining <= 0 && testStage !== "timeout") {
      setTestStage("timeout")
      handleTimeExpired()
    }
  }, [timeRemaining, testStage, handleTimeExpired])

  // Initialize timer when component mounts
  useEffect(() => {
    // Vérifier si un test est en cours dans le localStorage
    if (testId) {
      const savedTest = localStorage.getItem(`personality_test_${testId}`)
      if (savedTest) {
        try {
          const parsedTest = JSON.parse(savedTest)

          // Restaurer l'heure de départ et calculer le temps restant
          if (parsedTest.startTime) {
            const startTimeFromStorage = parsedTest.startTime
            setStartTime(startTimeFromStorage)

            // Calculer le temps écoulé depuis le début du test
            const now = Date.now()
            const elapsedSeconds = Math.floor((now - startTimeFromStorage) / 1000)

            // Calculer le temps restant
            const remaining = totalTime - elapsedSeconds

            // Si le temps est déjà écoulé, passer directement à l'état timeout
            if (remaining <= 0) {
              setTimeRemaining(0)
              setTestStage("timeout")
              handleTimeExpired()
              return
            }

            setTimeRemaining(remaining)
          } else {
            // Aucune heure de départ trouvée, initialiser avec le temps total
            const newStartTime = Date.now()
            setStartTime(newStartTime)
            setTimeRemaining(totalTime)

            // Mettre à jour le localStorage avec l'heure de départ
            localStorage.setItem(
              `personality_test_${testId}`,
              JSON.stringify({
                ...parsedTest,
                startTime: newStartTime,
              }),
            )
          }
        } catch (error) {
          console.error("Erreur lors de la restauration du timer:", error)
          setTimeRemaining(totalTime)
          setStartTime(Date.now())
        }
      } else {
        // Aucun test trouvé, initialiser avec le temps total
        setTimeRemaining(totalTime)
        setStartTime(Date.now())
      }
    } else {
      // Aucun testId, initialiser avec le temps total
      setTimeRemaining(totalTime)
      setStartTime(Date.now())
    }
  }, [testId, totalTime, handleTimeExpired])

  // Clear timer when test is completed
  useEffect(() => {
    if (testStage === "completed" && timerRef.current) {
      clearInterval(timerRef.current)
    }
  }, [testStage])

  // Fetch questions when component mounts
  useEffect(() => {
    if (!apiCallInProgress.current && !questionsInitialized.current) {
      fetchQuestions()
    }
  }, [candidatId, offreId])

  // Initialize answers array when questions are loaded
  useEffect(() => {
    if (questions.length > 0 && !questionsInitialized.current) {
      console.log("Initializing answers array for the first time")
      setAnswers(new Array(questions.length).fill(null))
      questionsInitialized.current = true
    }
  }, [questions])

  // Modifier l'effet qui met à jour l'option sélectionnée lors du changement de question
  // Remplacer l'effet existant par celui-ci:
  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      console.log(`Updating selected option for question ${currentQuestionIndex}`)
      const savedAnswer = answers[currentQuestionIndex]

      // Si une réponse existe pour cette question, la définir comme option sélectionnée
      if (savedAnswer) {
        // Trouver l'option correspondante dans les options de la question actuelle
        const currentQuestionOptions = questions[currentQuestionIndex].options
        const matchingOption = currentQuestionOptions.find(
          (option) => option.text === savedAnswer.text && option.score === savedAnswer.score,
        )

        // Si une option correspondante est trouvée, la définir comme sélectionnée
        if (matchingOption) {
          setSelectedOption(matchingOption)
        } else {
          setSelectedOption(savedAnswer) // Fallback au cas où
        }
      } else {
        // Aucune réponse pour cette question, réinitialiser l'option sélectionnée
        setSelectedOption(null)
      }
    }
  }, [currentQuestionIndex, answers, questions])

  // Format time remaining as MM:SS
  const formatTime = (seconds: number | null) => {
    if (timeRemaining === null) {
      return "00:00"
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  // Remplacer la fonction fetchQuestions par celle-ci
  const fetchQuestions = async () => {
    // Prevent multiple simultaneous API calls
    if (apiCallInProgress.current) {
      console.log("API call already in progress, skipping duplicate fetch")
      return
    }

    try {
      apiCallInProgress.current = true
      setLoading(true)
      setError(null)
      console.log(`Récupération des questions pour candidat ID: ${candidatId}, offre ID: ${offreId}`)

      // Ensure IDs are numbers
      const candidatIdNumber = Number(candidatId)
      const offreIdNumber = Number(offreId)

      if (isNaN(candidatIdNumber) || isNaN(offreIdNumber)) {
        throw new Error("IDs de candidat ou d'offre invalides")
      }

      // Check if the candidate has already completed the test for this offer

      // Le reste de la fonction reste inchangé...
      // Générer un ID de test unique basé sur le candidat et l'offre
      const generatedTestId = generateTestId(candidatIdNumber, offreIdNumber)

      // Vérifier si un test existe déjà dans le localStorage
      const savedTest = localStorage.getItem(`personality_test_${generatedTestId}`)

      if (savedTest) {
        // Récupérer le test sauvegardé
        const parsedTest = JSON.parse(savedTest)
        console.log("Test existant trouvé dans le localStorage:", generatedTestId)

        setTestId(generatedTestId)
        setQuestions(parsedTest.questions)

        // Si des réponses existent, les restaurer
        if (parsedTest.answers && Array.isArray(parsedTest.answers)) {
          // S'assurer que les réponses sont des objets valides avec text et score
          const validatedAnswers = parsedTest.answers.map((answer) => {
            if (answer && typeof answer === "object" && "text" in answer && "score" in answer) {
              return answer
            }
            return null
          })

          setAnswers(validatedAnswers)

          // Restaurer l'index de la question actuelle s'il existe
          if (parsedTest.currentQuestionIndex !== undefined) {
            const questionIndex = Number(parsedTest.currentQuestionIndex)
            setCurrentQuestionIndex(questionIndex)

            // Définir l'option sélectionnée pour la question actuelle restaurée
            if (validatedAnswers[questionIndex]) {
              // On ne définit pas directement l'option ici, car les questions ne sont peut-être pas encore chargées
              // L'effet ci-dessus s'en chargera une fois que les questions seront disponibles
              console.log("Réponse trouvée pour la question actuelle:", validatedAnswers[questionIndex])
            }
          }
        }

        setLoading(false)
        apiCallInProgress.current = false
        return
      }

      // Le reste du code reste inchangé...
      // Aucun test existant, générer un nouveau
      const response = await fetch(`http://127.0.0.1:8000/api/generate-test`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidat_id: candidatIdNumber,
          offre_id: offreIdNumber,
        }),
      })

      if (!response.ok) {
        // Vérifier si l'erreur est due à un test déjà complété
        if (response.status === 403) {
          const errorData = await response.json()

          // Vérifier explicitement si l'erreur mentionne une triche détectée
          if (
            errorData.error &&
            (errorData.error.includes("triche détectée") || errorData.error.includes("Test bloqué : triche"))
          ) {
            // Afficher un message de triche détectée
            setTestStage("completed")
            setTestCompleted(true)
            setCheatingDetected(true)

            // Nettoyer le localStorage pour ce test
            if (candidatId && offreId) {
              const testIdPattern = `test_${candidatId}_${offreId}`
              Object.keys(localStorage).forEach((key) => {
                if (key.startsWith(`personality_test_${testIdPattern}`)) {
                  localStorage.removeItem(key)
                }
              })
            }

            setLoading(false)
            apiCallInProgress.current = false
            return
          }

          if (errorData.error && errorData.error.includes("déjà passé le test")) {
            // Afficher un message personnalisé et arrêter le chargement du test
            setTestStage("completed") // Utiliser l'état "completed" pour afficher un message personnalisé
            setTestCompleted(true)
            setPersonalityAnalysis(
              `Vous avez déjà passé ce test. ${errorData.score ? `Votre score est de ${errorData.score}.` : ""}`,
            )
            setLoading(false)
            apiCallInProgress.current = false
            return
          }
        }

        const errorText = await response.text()
        console.error(`Erreur HTTP: ${response.status}, message: ${errorText}`)
        throw new Error(`Erreur lors de la récupération des questions: ${response.status}`)
      }

      const data = await response.json()
      console.log("Questions reçues:", data)

      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuestions(data.questions)
        setTestId(generatedTestId)

        // Sauvegarder le test dans le localStorage immédiatement
        localStorage.setItem(
          `personality_test_${generatedTestId}`,
          JSON.stringify({
            questions: data.questions,
            answers: new Array(data.questions.length).fill(null),
            startTime: Date.now(),
            status: "in_progress",
            currentQuestionIndex: 0, // Initialiser l'index de la question actuelle
          }),
        )
      } else {
        throw new Error("Format de réponse invalide ou aucune question trouvée")
      }
    } catch (error) {
      console.error(`Erreur: ${error instanceof Error ? error.message : String(error)}`)
      setError("Impossible de charger les questions du test. Veuillez réessayer.")
    } finally {
      setLoading(false)
      apiCallInProgress.current = false
    }
  }

  // Ajouter cette fonction pour sauvegarder l'état du test
  const saveTestState = useCallback(() => {
    if (!testId || questions.length === 0) return

    const currentTime = Date.now()

    localStorage.setItem(
      `personality_test_${testId}`,
      JSON.stringify({
        questions,
        answers,
        lastUpdated: new Date().toISOString(),
        status: "in_progress",
        startTime: startTime,
        timeRemaining: timeRemaining,
        currentQuestionIndex: currentQuestionIndex,
      }),
    )

    console.log("État du test sauvegardé dans le localStorage avec temps restant:", timeRemaining)
  }, [testId, questions, answers, startTime, timeRemaining, currentQuestionIndex])

  // Modifier la fonction handleOptionSelect pour sauvegarder après chaque sélection
  const handleOptionSelect = (option: Option) => {
    // Store the answer in the answers array
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = option
    setAnswers(newAnswers)

    // Update selected option for display
    setSelectedOption(option)
    setError(null)

    // Sauvegarder l'état après chaque sélection
    setTimeout(() => {
      localStorage.setItem(
        `personality_test_${testId}`,
        JSON.stringify({
          questions,
          answers: newAnswers,
          lastUpdated: new Date().toISOString(),
          status: "in_progress",
          startTime: startTime,
          timeRemaining: timeRemaining,
          currentQuestionIndex: currentQuestionIndex, // Ajouter l'index de la question actuelle
        }),
      )
    }, 0)
  }

  // Remplacer la fonction goToNextQuestion par celle-ci
  const goToNextQuestion = () => {
    if (!selectedOption) {
      setError("Veuillez sélectionner une réponse.")
      return
    }

    // Store the current answer
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = selectedOption
    setAnswers(newAnswers)

    // Déterminer le nouvel index de question
    const newQuestionIndex =
      currentQuestionIndex < questions.length - 1 ? currentQuestionIndex + 1 : currentQuestionIndex

    // Sauvegarder l'état avec le nouvel index
    localStorage.setItem(
      `personality_test_${testId}`,
      JSON.stringify({
        questions,
        answers: newAnswers,
        lastUpdated: new Date().toISOString(),
        status: "in_progress",
        startTime: startTime,
        timeRemaining: timeRemaining,
        currentQuestionIndex: newQuestionIndex, // Utiliser le nouvel index
      }),
    )

    if (currentQuestionIndex < questions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      // Check if all questions have been answered
      const missingAnswers = newAnswers
        .map((answer, index) => (answer === null ? index : -1))
        .filter((index) => index !== -1)

      if (missingAnswers.length > 0) {
        setUnansweredQuestions(missingAnswers)
        setShowValidationModal(true)
        return
      }

      // Show confirmation modal
      setShowConfirmationModal(true)
    }
  }

  // Ajouter cette fonction après goToNextQuestion
  const handleConfirmSubmit = () => {
    // Calculate final score from all answers
    const finalScore = answers.reduce((total, answer) => total + (answer ? answer.score : 0), 0)
    setTotalScore(finalScore)
    setShowConfirmationModal(false)
    submitQcmTest()
  }

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
      setError(null)
    }
  }

  // Modifier la fonction submitQcmTest pour inclure les scores par trait
  const submitQcmTest = async () => {
    try {
      setSubmitting(true)

      // Marquer le test comme terminé dans localStorage
      if (testId) {
        localStorage.setItem(
          `personality_test_${testId}`,
          JSON.stringify({
            questions,
            answers,
            lastUpdated: new Date().toISOString(),
            status: "completed",
            startTime: startTime,
            timeRemaining: timeRemaining,
          }),
        )
      }

      // Préparer les données des réponses pour le stockage
      const answersData = answers
        .map((answer, index) => {
          if (!answer) return null

          // Trouver l'index de l'option sélectionnée
          const optionIndex = questions[index].options.findIndex(
            (opt) => opt.text === answer.text && opt.score === answer.score,
          )

          return {
            question_index: index,
            selected_option_index: optionIndex !== -1 ? optionIndex : 0,
            score: answer.score,
            trait: questions[index].trait, // Ajouter le trait pour le calcul des scores par dimension
          }
        })
        .filter((a) => a !== null)

      // Calculer les scores par trait de personnalité
      const traitScores: Record<string, { score: number; count: number }> = {}

      // Initialiser les compteurs pour chaque trait
      answersData.forEach((answer) => {
        if (answer && answer.trait) {
          if (!traitScores[answer.trait]) {
            traitScores[answer.trait] = { score: 0, count: 0 }
          }
          traitScores[answer.trait].score += answer.score
          traitScores[answer.trait].count += 1
        }
      })

      // Calculer les scores moyens par trait
      const finalTraitScores: Record<string, number> = {}
      Object.keys(traitScores).forEach((trait) => {
        finalTraitScores[trait] = traitScores[trait].score
      })

      // Le reste de la fonction reste inchangé...
      // Ensure we have valid IDs
      const candidatIdNumber = Number(candidatId)
      const offreIdNumber = Number(offreId)

      if (isNaN(candidatIdNumber) || isNaN(offreIdNumber)) {
        throw new Error("Identifiants de candidat ou d'offre invalides")
      }

      console.log(`Envoi du score pour candidat ID: ${candidatIdNumber}, offre ID: ${offreIdNumber}`)
      console.log("Scores par trait:", finalTraitScores)

      // Nous n'avons plus besoin de calculer les scores ici, le backend s'en chargera
      // avec la nouvelle formule de pourcentage
      const storeScoreResponse = await fetch(`http://127.0.0.1:8000/api/store-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidat_id: candidatIdNumber,
          offre_id: offreIdNumber,
          score_total: totalScore,
          questions: questions, // Envoyer toutes les questions
          answers: answersData, // Envoyer toutes les réponses avec les index
          status: "terminer", // Ajouter le statut "terminer"
          trait_scores: finalTraitScores, // Ajouter les scores par trait
        }),
      })

      if (!storeScoreResponse.ok) {
        const errorData = await storeScoreResponse.json()
        throw new Error(errorData.error || `Erreur HTTP ${storeScoreResponse.status}`)
      }

      const data = await storeScoreResponse.json()
      console.log(`Score enregistré avec succès:`, data)

      // Move directly to completed stage
      setTestStage("completed")
      setTestCompleted(true)

      // Call onTestComplete callback if provided
      if (onTestComplete) {
        onTestComplete()
      }
    } catch (error) {
      console.error(`Erreur: ${error instanceof Error ? error.message : String(error)}`)
      setError(`Erreur lors de l'enregistrement du score: ${error instanceof Error ? error.message : String(error)}`)

      // Even if there's an error, move to completed stage after a delay
      setTimeout(() => {
        setTestStage("completed")
      }, 2000)
    } finally {
      setSubmitting(false)
    }
  }

  // Ajouter une fonction pour vérifier si le test doit être forcé à se terminer
  const checkForForcedEnd = (violations: Record<string, number>) => {
    // Vérifier si un type de violation a atteint ou dépassé 2 occurrences
    const shouldForceEnd = Object.values(violations).some((count) => count >= 2)

    if (shouldForceEnd && !testForcedToEnd) {
      setTestForcedToEnd(true)
      // Enregistrer le score avec le statut "forced_end"
      submitForcedEndTest(violations)
    }
  }

  // Modifier la fonction submitForcedEndTest pour inclure les scores par trait
  const submitForcedEndTest = async (violations: Record<string, number>) => {
    try {
      setSubmitting(true)

      // Préparer les données des réponses pour le stockage
      const answersData = answers
        .map((answer, index) => {
          if (!answer) return null

          // Trouver l'index de l'option sélectionnée
          const optionIndex = questions[index]?.options.findIndex(
            (opt) => opt.text === answer.text && opt.score === answer.score,
          )

          return {
            question_index: index,
            selected_option_index: optionIndex !== -1 ? optionIndex : 0,
            score: answer.score,
            trait: questions[index].trait, // Ajouter le trait pour le calcul des scores par dimension
          }
        })
        .filter((a) => a !== null)

      // Calculer le score total des réponses données
      const currentTotalScore = answers.reduce((total, answer) => total + (answer ? answer.score : 0), 0)

      // Calculer les scores par trait de personnalité
      const traitScores: Record<string, { score: number; count: number }> = {}

      // Initialiser les compteurs pour chaque trait
      answersData.forEach((answer) => {
        if (answer && answer.trait) {
          if (!traitScores[answer.trait]) {
            traitScores[answer.trait] = { score: 0, count: 0 }
          }
          traitScores[answer.trait].score += answer.score
          traitScores[answer.trait].count += 1
        }
      })

      // Calculer les scores moyens par trait
      const finalTraitScores: Record<string, number> = {}
      Object.keys(traitScores).forEach((trait) => {
        finalTraitScores[trait] = traitScores[trait].score
      })

      // Ensure we have valid IDs
      const candidatIdNumber = Number(candidatId)
      const offreIdNumber = Number(offreId)

      if (isNaN(candidatIdNumber) || isNaN(offreIdNumber)) {
        throw new Error("Identifiants de candidat ou d'offre invalides")
      }

      console.log(`Envoi du score forcé pour candidat ID: ${candidatIdNumber}, offre ID: ${offreIdNumber}`)
      console.log("Scores par trait:", finalTraitScores)

      // Utiliser la même API que pour les tests terminés avec succès
      const storeScoreResponse = await fetch(`http://127.0.0.1:8000/api/store-score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidat_id: candidatIdNumber,
          offre_id: offreIdNumber,
          score_total: currentTotalScore,
          questions: questions,
          answers: answersData,
          status: "tricher", // Utiliser le statut "tricher"
          security_violations: violations,
          trait_scores: finalTraitScores, // Ajouter les scores par trait
        }),
      })

      if (!storeScoreResponse.ok) {
        const errorData = await storeScoreResponse.json()
        throw new Error(errorData.error || `Erreur HTTP ${storeScoreResponse.status}`)
      }

      const data = await storeScoreResponse.json()
      console.log(`Score forcé enregistré avec succès:`, data)

      // Passer à l'étape terminée
      setTestStage("completed")
      setTestCompleted(true)

      // Appeler le callback onTestComplete si fourni
      if (onTestComplete) {
        onTestComplete()
      }
    } catch (error) {
      console.error(`Erreur: ${error instanceof Error ? error.message : String(error)}`)
      setError(
        `Erreur lors de l'enregistrement du score forcé: ${error instanceof Error ? error.message : String(error)}`,
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleRatingSubmit = async (score: number) => {
    setSelectedRating(score)

    try {
      // Ensure we have valid IDs
      const candidatIdNumber = Number(candidatId)
      const offreIdNumber = Number(offreId)

      if (isNaN(candidatIdNumber) || isNaN(offreIdNumber)) {
        console.error("Identifiants de candidat ou d'offre invalides")
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
        return
      }

      // Show confirmation message
      setRatingSubmitted(true)
      console.log("Évaluation enregistrée avec succès")
    } catch (error) {
      console.error("Erreur lors de l'enregistrement de l'évaluation:", error)
    }
  }

  // Modifier la fonction navigateToQuestion pour sauvegarder la réponse actuelle avant de naviguer
  const navigateToQuestion = (index: number) => {
    if (index >= 0 && index < questions.length) {
      // Sauvegarder la réponse actuelle avant de naviguer
      if (selectedOption) {
        const newAnswers = [...answers]
        newAnswers[currentQuestionIndex] = selectedOption
        setAnswers(newAnswers)

        // Sauvegarder dans localStorage avec le nouvel index
        if (testId) {
          localStorage.setItem(
            `personality_test_${testId}`,
            JSON.stringify({
              questions,
              answers: newAnswers,
              lastUpdated: new Date().toISOString(),
              status: "in_progress",
              startTime: startTime,
              timeRemaining: timeRemaining,
              currentQuestionIndex: index, // Utiliser le nouvel index
            }),
          )
        }
      } else {
        // Même si aucune option n'est sélectionnée, sauvegarder le nouvel index
        if (testId) {
          localStorage.setItem(
            `personality_test_${testId}`,
            JSON.stringify({
              questions,
              answers,
              lastUpdated: new Date().toISOString(),
              status: "in_progress",
              startTime: startTime,
              timeRemaining: timeRemaining,
              currentQuestionIndex: index, // Utiliser le nouvel index
            }),
          )
        }
      }

      setCurrentQuestionIndex(index)
      setError(null)
    }
  }

  // Modifier le gestionnaire de violations de sécurité pour vérifier si le test doit être forcé à se terminer
  const handleSecurityViolation = (type: string, count: number) => {
    const updatedViolations = {
      ...securityViolations,
      [type]: count,
    }

    setSecurityViolations(updatedViolations)

    // Vérifier si le test doit être forcé à se terminer
    checkForForcedEnd(updatedViolations)

    // Log the violation to the console
    console.log(`Security violation: ${type}, count: ${count}`)
  }

  // Modifier l'effet du timer pour éviter la référence circulaire
  // Remplacer l'effet existant par celui-ci:

  // Modifier l'effet du timer pour appeler handleTimeExpired quand le temps est écoulé
  useEffect(() => {
    // Vérifier si le test est déjà terminé
    if (testStage === "completed" || testStage === "timeout") {
      return
    }

    // Utiliser requestAnimationFrame pour une meilleure précision
    let lastUpdateTime = Date.now()
    let animationFrameId: number

    const updateTimer = () => {
      const now = Date.now()
      const deltaTime = now - lastUpdateTime

      // Mettre à jour le timer seulement si au moins 1000ms se sont écoulées
      if (deltaTime >= 1000) {
        lastUpdateTime = now

        setTimeRemaining((prev) => {
          if (!prev || prev <= 1) {
            // Time's up
            setTestStage("timeout")
            // Appeler la fonction pour enregistrer le score avec statut "temps écoulé"
            setTimeout(() => handleTimeExpired(), 0)
            return 0
          }

          // Décrémenter d'une seconde exactement
          return prev - 1
        })
      }

      // Continuer l'animation sauf si le test est terminé
      if (testStage !== "completed" && testStage !== "timeout") {
        animationFrameId = requestAnimationFrame(updateTimer)
      }
    }

    // Démarrer l'animation
    animationFrameId = requestAnimationFrame(updateTimer)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [testStage, handleTimeExpired])

  // Ajouter cet effet pour vérifier si le temps est écoulé après chaque rendu
  useEffect(() => {
    checkTimeExpired()
  }, [checkTimeExpired])

  // Modifier l'effet pour gérer la fermeture de la fenêtre et inclure les scores par trait
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Si le test n'est pas encore terminé, enregistrer le score
      if (!testCompleted && !testForcedToEnd && testStage !== "timeout") {
        // Calculer le score actuel
        const currentTotalScore = answers.reduce((total, answer) => total + (answer ? answer.score : 0), 0)

        // Préparer les données des réponses pour le calcul des scores par trait
        const answersWithTraits = answers
          .map((answer, index) => {
            if (!answer) return null
            const optionIndex = questions[index]?.options.findIndex(
              (opt) => opt.text === answer.text && opt.score === answer.score,
            )
            return {
              question_index: index,
              selected_option_index: optionIndex !== -1 ? optionIndex : 0,
              score: answer.score,
              trait: questions[index].trait,
            }
          })
          .filter((a) => a !== null)

        // Calculer les scores par trait de personnalité
        const traitScores: Record<string, { score: number; count: number }> = {}

        // Initialiser les compteurs pour chaque trait
        answersWithTraits.forEach((answer) => {
          if (answer && answer.trait) {
            if (!traitScores[answer.trait]) {
              traitScores[answer.trait] = { score: 0, count: 0 }
            }
            traitScores[answer.trait].score += answer.score
            traitScores[answer.trait].count += 1
          }
        })

        // Calculer les scores moyens par trait
        const finalTraitScores: Record<string, number> = {}
        Object.keys(traitScores).forEach((trait) => {
          finalTraitScores[trait] = traitScores[trait].score
        })

        // Envoyer une requête pour enregistrer le score en utilisant l'API existante
        navigator.sendBeacon(
          "http://127.0.0.1:8000/api/store-score",
          JSON.stringify({
            candidat_id: candidatId,
            offre_id: offreId,
            score_total: currentTotalScore,
            questions: questions,
            answers: answersWithTraits,
            status: "tricher", // Considérer l'abandon comme une triche
            security_violations: securityViolations,
            trait_scores: finalTraitScores, // Ajouter les scores par trait
          }),
        )
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [testCompleted, testForcedToEnd, testStage, answers, questions, candidatId, offreId, securityViolations])

  // Ajouter un effet pour nettoyer les tests terminés ou expirés
  useEffect(() => {
    // Fonction pour nettoyer les tests anciens
    const cleanupOldTests = () => {
      const now = new Date()
      const keys = Object.keys(localStorage)

      keys.forEach((key) => {
        if (key.startsWith("personality_test_")) {
          try {
            const testData = JSON.parse(localStorage.getItem(key) || "{}")

            // Si le test est terminé ou a plus de 24h, le supprimer
            if (testData.status === "completed" || testData.status === "abandoned") {
              // Garder les tests terminés pendant 1 heure seulement
              const lastUpdated = new Date(testData.lastUpdated || testData.startTime)
              const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)

              if (hoursSinceUpdate > 1) {
                localStorage.removeItem(key)
                console.log(`Test nettoyé: ${key}`)
              }
            } else if (testData.startTime) {
              // Pour les tests en cours, vérifier s'ils sont trop vieux (24h)
              const startTime = new Date(testData.startTime)
              const hoursSinceStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60)

              if (hoursSinceStart > 24) {
                localStorage.removeItem(key)
                console.log(`Test expiré nettoyé: ${key}`)
              }
            }
          } catch (e) {
            console.error(`Erreur lors du nettoyage du test ${key}:`, e)
          }
        }
      })
    }

    // Nettoyer les tests au chargement
    cleanupOldTests()

    // Nettoyer les tests toutes les heures
    const cleanupInterval = setInterval(cleanupOldTests, 60 * 60 * 1000)

    return () => clearInterval(cleanupInterval)
  }, [])

  // Ajouter un effet pour sauvegarder périodiquement l'état du test
  useEffect(() => {
    if (!testId || testCompleted || testForcedToEnd) return

    // Sauvegarder l'état toutes les 30 secondes
    const autoSaveInterval = setInterval(() => {
      if (questions.length > 0) {
        localStorage.setItem(
          `personality_test_${testId}`,
          JSON.stringify({
            questions,
            answers,
            lastUpdated: new Date().toISOString(),
            status: "in_progress",
            startTime: startTime,
            timeRemaining: timeRemaining,
            currentQuestionIndex: currentQuestionIndex, // Ajouter l'index de la question actuelle
          }),
        )
        console.log("Sauvegarde automatique effectuée")
      }
    }, 30000)

    return () => clearInterval(autoSaveInterval)
  }, [testId, questions, answers, testCompleted, testForcedToEnd, startTime, timeRemaining, currentQuestionIndex])

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
            <p className="text-white/80 text-center mt-2 text-sm sm:text-base">
              Vous n'êtes pas autorisé à repasser ce test
            </p>
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

  // Render timeout screen
  if (testStage === "timeout") {
    // Calculer le score pour l'affichage
    const answeredQuestions = answers.filter((answer) => answer !== null).length
    const totalQuestions = questions.length
    const scoreTotal = answers.reduce((total, answer) => total + (answer ? answer.score : 0), 0)
    const maxPossibleScore = totalQuestions * 5 // 5 est le score maximum par question
    const scorePercentage = maxPossibleScore > 0 ? Math.round((scoreTotal / maxPossibleScore) * 100) : 0

    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 space-y-6 text-center">
        <div className="flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold">Temps écoulé</h3>

        <p className="text-muted-foreground text-sm sm:text-base max-w-md">
          Le temps alloué pour ce test est écoulé. Votre candidature a été enregistrée avec les réponses que vous avez
          fournies. N'hésitez pas à consulter votre email, nous vous enverrons bientôt une notification concernant votre
          acceptation ou rejet pour un entretien présentiel.
        </p>
        <Button variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
          Retour
        </Button>
      </div>
    )
  }

  if (loading && testStage === "qcm") {
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 space-y-4">
        <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-full border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
        <p className="text-muted-foreground text-sm sm:text-base">Chargement des questions...</p>
      </div>
    )
  }

  if (testStage === "completed") {
    // Si cheatingDetected est vrai, afficher le message de triche
    if (cheatingDetected) {
      return renderCheatingDetectedMessage()
    }

    // Si personalityAnalysis contient un message, cela signifie que le candidat a déjà passé le test
    if (personalityAnalysis) {
      // Extraire le score du message s'il existe
      const scoreMatch = personalityAnalysis.match(/score est de (\d+)/)
      const score = scoreMatch ? scoreMatch[1] : null

      return (
        <div className="w-full max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="bg-blue-50 p-4 sm:p-6 flex flex-col items-center justify-center">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg
                  className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                </svg>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800">Test déjà complété</h2>
            </div>

            <div className="p-4 sm:p-6">
              <p className="text-center text-gray-600 mb-6 text-sm sm:text-base">
                Vous avez déjà passé ce test.
              </p>

             

              <div className="flex justify-center">
                <Button variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto px-6 py-2">
                  Retour
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    // Sinon, afficher le message de succès normal
    return (
      <div className="flex flex-col items-center justify-center p-6 sm:p-8 space-y-6 text-center">
        <div className="flex items-center justify-center h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-green-100">
          <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold">Test terminé !</h3>
        <p className="text-muted-foreground mb-6 text-sm sm:text-base max-w-md">
          Votre candidature a été enregistrée avec succès. N'hésitez pas à consulter votre email, nous vous enverrons
          bientôt une notification concernant votre acceptation ou rejet pour un entretien présentiel.
        </p>

        {/* Rating system with smiles */}
        <div className="mt-8 bg-white p-4 sm:p-6 rounded-lg shadow-sm border w-full max-w-md">
          <h4 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-center">Comment évaluez-vous ce test ?</h4>
          <div className="flex flex-wrap justify-center gap-1 sm:gap-4">
            {[1, 2, 3, 4, 5].map((score) => (
              <div key={score} className="flex flex-col items-center flex-1 min-w-0">
                <button
                  onClick={() => handleRatingSubmit(score)}
                  className="transition-all duration-300 hover:scale-110 focus:outline-none w-full mb-1 sm:mb-3"
                >
                  <div
                    className={`h-8 w-8 sm:h-16 sm:w-16 mx-auto rounded-full flex items-center justify-center shadow-md ${
                      selectedRating === score
                        ? "bg-blue-600 text-white transform scale-110"
                        : "bg-blue-100 text-blue-600 hover:bg-blue-200"
                    }`}
                  >
                    {score === 1 && <span className="text-sm sm:text-3xl">😞</span>}
                    {score === 2 && <span className="text-sm sm:text-3xl">🙁</span>}
                    {score === 3 && <span className="text-sm sm:text-3xl">😐</span>}
                    {score === 4 && <span className="text-sm sm:text-3xl">🙂</span>}
                    {score === 5 && <span className="text-sm sm:text-3xl">😄</span>}
                  </div>
                </button>
                <span className="text-xs sm:text-sm font-medium text-center leading-tight px-1">
                  {score === 1 && "Très insatisfait"}
                  {score === 2 && "Insatisfait"}
                  {score === 3 && "Neutre"}
                  {score === 4 && "Satisfait"}
                  {score === 5 && "Très satisfait"}
                </span>
              </div>
            ))}
          </div>
          {ratingSubmitted && (
            <div className="mt-4 sm:mt-6 p-3 bg-green-50 border border-green-200 rounded-md text-center text-green-700 font-medium text-sm">
              Merci pour votre évaluation !
            </div>
          )}
        </div>
      </div>
    )
  }

  if (error && testStage === "qcm") {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button onClick={fetchQuestions} className="w-full sm:w-auto">
            Réessayer
          </Button>
          <Button variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
            Retour
          </Button>
        </div>
      </div>
    )
  }

  if (!questions.length && testStage === "qcm") {
    return (
      <div className="p-4 sm:p-6 space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">Aucune question n'a été trouvée pour ce test.</AlertDescription>
        </Alert>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button onClick={fetchQuestions} className="w-full sm:w-auto">
            Réessayer
          </Button>
          <Button variant="outline" onClick={() => window.history.back()} className="w-full sm:w-auto">
            Retour
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = currentQuestionIndex > 0 ? (currentQuestionIndex / questions.length) * 100 : 0

  return (
    <TestSecurity candidatId={candidatId} offreId={offreId} onViolation={handleSecurityViolation} maxViolations={2}>
      <div className="p-3 sm:p-4 space-y-4 sm:space-y-6">
        {/* Timer display */}
        <div className="flex items-center justify-center gap-2 text-base sm:text-lg font-medium">
          <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className={`${timeRemaining < 60 ? "text-red-500 animate-pulse" : ""} text-sm sm:text-base`}>
            Temps restant: {formatTime(timeRemaining)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="font-medium text-sm sm:text-base">
              Question {currentQuestionIndex + 1} sur {questions.length}
            </h3>
            <span className="text-xs sm:text-sm text-muted-foreground">{Math.round(progress)}% complété</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question card */}
        <div className="border rounded-lg p-4 sm:p-6 space-y-4 sm:space-y-6 shadow-sm">
          <div className="space-y-2">
            <h4 className="text-base sm:text-lg font-medium leading-relaxed">{currentQuestion.question}</h4>
          </div>

          <div className="space-y-2 sm:space-y-3">
            {currentQuestion.options.map((option, index) => {
              // Vérifier si cette option correspond à la réponse sauvegardée
              const isSelected =
                selectedOption && selectedOption.text === option.text && selectedOption.score === option.score

              return (
                <div
                  key={index}
                  className={`flex items-start sm:items-center p-3 sm:p-4 rounded-md border cursor-pointer transition-colors ${
                    isSelected ? "bg-blue-100 border-blue-500" : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleOptionSelect(option)}
                >
                  <div className="flex-shrink-0 mr-3 mt-1 sm:mt-0">
                    <div
                      className={`h-4 w-4 sm:h-5 sm:w-5 rounded-full flex items-center justify-center ${
                        isSelected ? "bg-blue-500" : "border border-gray-300"
                      }`}
                    >
                      {isSelected && <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-white"></div>}
                    </div>
                  </div>
                  <span className="text-sm sm:text-base leading-relaxed">{option.text}</span>
                </div>
              )
            })}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          {/* Navigation buttons */}
          <div className="flex flex-col sm:flex-row justify-between pt-4 gap-3 sm:gap-0">
            <Button
              variant="outline"
              onClick={goToPreviousQuestion}
              disabled={currentQuestionIndex === 0 || submitting}
              className="w-full sm:w-auto order-2 sm:order-1"
            >
              Question précédente
            </Button>

            <Button
              onClick={goToNextQuestion}
              disabled={!selectedOption || submitting}
              className="w-full sm:w-auto order-1 sm:order-2"
            >
              {submitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin mr-2"></div>
                  Traitement...
                </>
              ) : currentQuestionIndex === questions.length - 1 ? (
                "Terminer le test"
              ) : (
                "Question suivante"
              )}
            </Button>
          </div>
        </div>

        {/* Question counter pills */}
        <div className="flex flex-wrap gap-2 justify-center max-h-32 overflow-y-auto">
          {questions.map((_, index) => (
            <div
              key={index}
              className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center text-xs sm:text-sm cursor-pointer transition-colors ${
                index === currentQuestionIndex
                  ? "bg-blue-500 text-white"
                  : answers[index]
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => navigateToQuestion(index)}
            >
              {index + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      {showConfirmationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden">
            <div className="bg-amber-50 border-b border-amber-100 px-4 sm:px-6 py-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
              <h3 className="text-base sm:text-lg font-semibold text-amber-800">Terminer le test</h3>
            </div>
            <div className="px-4 sm:px-6 py-4">
              <p className="text-gray-600 text-sm sm:text-base">
                Êtes-vous sûr de vouloir terminer le test ? Vous ne pourrez pas modifier vos réponses après la
                soumission.
              </p>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 flex flex-col sm:flex-row justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConfirmationModal(false)} className="w-full sm:w-auto">
                Annuler
              </Button>
              <Button className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto" onClick={handleConfirmSubmit}>
                Terminer
              </Button>
            </div>
          </div>
        </div>
      )}

      {showValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full overflow-hidden relative">
            <button
              onClick={() => setShowValidationModal(false)}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Fermer</span>
            </button>
            <div className="bg-red-50 border-b border-red-100 px-4 sm:px-6 py-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
                <h3 className="text-base sm:text-lg font-semibold text-red-800">Questions non répondues</h3>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4">
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                Veuillez répondre à toutes les questions avant de terminer le test. Il reste{" "}
                <span className="font-semibold text-red-600">{unansweredQuestions.length}</span> question(s) sans
                réponse.
              </p>

              <div className="bg-red-50 p-4 rounded-md">
                <h4 className="font-medium text-red-800 mb-2 text-sm sm:text-base">Questions à compléter :</h4>
                <div className="flex flex-wrap gap-2 max-h-32 sm:max-h-40 overflow-y-auto">
                  {unansweredQuestions.map((index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="border-red-200 bg-white text-red-700 hover:bg-red-50 text-xs sm:text-sm"
                      onClick={() => {
                        navigateToQuestion(index)
                        setShowValidationModal(false)
                      }}
                    >
                      Question {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-4 sm:px-6 py-4 border-t bg-gray-50 flex justify-end">
              <Button onClick={() => setShowValidationModal(false)} className="w-full sm:w-auto">
                Compris
              </Button>
            </div>
          </div>
        </div>
      )}
    </TestSecurity>
  )
}

export default PersonalityTest