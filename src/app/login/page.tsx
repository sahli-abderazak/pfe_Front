"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Lock, Mail, Loader2, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

export default function Login() {
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const router = useRouter()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [showErrorDialog, setShowErrorDialog] = useState<boolean>(false)
  const [showPassword, setShowPassword] = useState<boolean>(false)

  const handleGoogleLogin = () => {
    // Implement Google login
    console.log("Google login clicked")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        if (data.user && data.user.archived === 1) {
          setError("Nous rencontrons un problème avec votre compte. Contactez l'administrateur pour en savoir plus.")
          setShowErrorDialog(true)
          return
        }

        // If the user is not active, redirect to verification page
        if (data.user && !data.user.active) {
          router.push(`/verify?email=${encodeURIComponent(email)}`)
          return
        }

        console.log("Login successful", data)
        sessionStorage.setItem("token", data.token)

        if (email === "admin@gmail.com") {
          router.push("/dashbord")
        } else {
          router.push("/dashbord_rec")
        }
      } else {
        // console.error("Login failed", data.error)

        // Check if the error is about inactive account
        if (data.error && data.error.includes("Veuillez vérifier votre compte")) {
          router.push(`/verify?email=${encodeURIComponent(email)}`)
          return
        }

        setError(data.error || "Identifiants incorrects")
        setShowErrorDialog(true)
      }
    } catch (error) {
      // console.error("Erreur de connexion", error)
      setError("Une erreur s'est produite lors de la connexion")
      setShowErrorDialog(true)
    } finally {
      setIsLoading(false)
    }
  }

  const closeErrorDialog = () => {
    setShowErrorDialog(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-5xl overflow-hidden rounded-xl md:rounded-2xl shadow-lg md:shadow-xl">
        <div className="flex flex-col md:flex-row">
          {/* Image Section */}
          <div className="md:w-1/2 relative flex items-center justify-center h-48 md:h-full bg-white">
            <div
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-64 md:h-64 lg:w-80 lg:h-80 bg-contain bg-center bg-no-repeat mx-auto mt-8 md:mt-12"
              style={{
                backgroundImage: "url(/Logo.jpeg)",
                backgroundColor: "#ffffff",
              }}
            />
          </div>

          {/* Form Section */}
          <div className="md:w-1/2 p-6 md:p-8 lg:p-12 bg-white">
            <div className="max-w-md mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6 md:mb-8">Bienvenue</h2>

              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10 bg-gray-50 border border-gray-300 focus:border-[#2c4999] focus:ring-[#2c4999]"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">Mot de passe</Label>
                    <Link href="/forgot-password" className="text-sm text-[#2c4999] hover:underline">
                      Mot de passe oublié?
                    </Link>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 bg-gray-50 border border-gray-300 focus:border-[#2c4999] focus:ring-[#2c4999]"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                      <span className="sr-only">
                        {showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full bg-[#2c4999] hover:bg-[#233a7a] text-white font-semibold py-2.5 md:py-3 rounded-lg transition-colors duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    "Se connecter"
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Vous n'avez pas de compte?{" "}
                  <Link href="/register" className="text-[#2c4999] hover:underline">
                    S'inscrire
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md max-w-[90%] mx-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-red-600">
              <AlertCircle className="h-6 w-6 mr-2" />
              Erreur de connexion
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-center text-gray-700">{error}</p>
          </div>
          <DialogFooter>
            <Button onClick={closeErrorDialog} className="w-full bg-[#2c4999] hover:bg-[#233a7a]">
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
