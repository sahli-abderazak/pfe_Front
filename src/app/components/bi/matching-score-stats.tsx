"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { useState, useEffect } from "react"

export function MatchingScoreStats() {
  const [matchingScores, setMatchingScores] = useState<any[]>([])
  const [personalityTraits, setPersonalityTraits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = sessionStorage.getItem("token")

        // Fetch matching scores
        const scoresResponse = await fetch("http://localhost:8000/api/stats/matching-scores", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        // Fetch personality traits
        const traitsResponse = await fetch("http://localhost:8000/api/stats/personality-traits", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (scoresResponse.ok && traitsResponse.ok) {
          const scoresData = await scoresResponse.json()
          const traitsData = await traitsResponse.json()

          setMatchingScores(scoresData)
          setPersonalityTraits(traitsData)
        } else {
          console.error("Failed to fetch matching score statistics")
          // Use sample data for demonstration
          setMatchingScores([
            { name: "Développeur Frontend", score: 75 },
            { name: "Développeur Full Stack", score: 65 },
            { name: "Data Scientist", score: 80 },
            { name: "Chef de Projet IT", score: 70 },
            { name: "Designer UX/UI", score: 85 },
          ])

          setPersonalityTraits([
            { trait: "Ouverture", value: 80 },
            { trait: "Conscience", value: 70 },
            { trait: "Extraversion", value: 60 },
            { trait: "Agréabilité", value: 75 },
            { trait: "Stabilité", value: 65 },
          ])
        }
      } catch (error) {
        console.error("Error fetching matching score statistics:", error)
        // Use sample data for demonstration
        setMatchingScores([
          { name: "Développeur Frontend", score: 75 },
          { name: "Développeur Full Stack", score: 65 },
          { name: "Data Scientist", score: 80 },
          { name: "Chef de Projet IT", score: 70 },
          { name: "Designer UX/UI", score: 85 },
        ])

        setPersonalityTraits([
          { trait: "Ouverture", value: 80 },
          { trait: "Conscience", value: 70 },
          { trait: "Extraversion", value: 60 },
          { trait: "Agréabilité", value: 75 },
          { trait: "Stabilité", value: 65 },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Scores de Matching par Poste</CardTitle>
          <CardDescription>Scores moyens de matching des candidats par poste</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={matchingScores} margin={{ top: 20, right: 30, left: 20, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="score" name="Score de matching (%)" fill="#ec4899" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Traits de Personnalité</CardTitle>
          <CardDescription>Analyse des traits de personnalité des candidats</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={personalityTraits}>
                <PolarGrid />
                <PolarAngleAxis dataKey="trait" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} />
                <Radar
                  name="Traits de personnalité"
                  dataKey="value"
                  stroke="#f43f5e"
                  fill="#f43f5e"
                  fillOpacity={0.6}
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
