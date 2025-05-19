"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff } from "lucide-react"

interface UserData {
  id: number
  email: string
  numTel?: string
  password?: string
  adresse?: string
  image?: string
  nom_societe?: string
  role?: string
  // Nouveaux champs
  apropos?: string
  lien_site_web?: string
  fax?: string
  domaine_activite?: string
}

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  userData: UserData | null
  onSuccess: () => void
}

const API_BASE_URL = "http://127.0.0.1:8000"

export default function ProfileEditModal({ isOpen, onClose, userData, onSuccess }: ProfileEditModalProps) {
  const [formData, setFormData] = useState<UserData | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const [cvFile, setCvFile] = useState<File | null>(null)
  const [cvFileName, setCvFileName] = useState<string | null>(null)
  const cvInputRef = useRef<HTMLInputElement>(null)

  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    if (userData) {
      setFormData({
        ...userData,
        password: "",
      })
      setImagePreview(userData.image || null)
      setCvFileName(userData.cv ? userData.cv.split("/").pop() : null)
    }
  }, [userData, isOpen])

  useEffect(() => {
    const token = sessionStorage.getItem("token") || sessionStorage.getItem("auth_token")
    if (!token) {
      setError("Session expirée. Veuillez vous reconnecter.")
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      if (file.size > 2 * 1024 * 1024) {
        setError("L'image ne doit pas dépasser 2MB")
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setError("Le CV ne doit pas dépasser 5MB")
        return
      }
      setCvFile(file)
      setCvFileName(file.name)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!formData || !userData) {
      setError("Données utilisateur non disponibles")
      setIsSubmitting(false)
      return
    }

    try {
      // Get and validate the authentication token
      const token = sessionStorage.getItem("token") || sessionStorage.getItem("auth_token")
      if (!token) {
        setError("Session expirée. Veuillez vous reconnecter.")
        setIsSubmitting(false)
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append("_method", "PUT")

      // Add text fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value && key !== "id" && key !== "image" && key !== "cv") {
          formDataToSend.append(key, value.toString())
        }
      })

      // Add files if changed
      if (imageFile) formDataToSend.append("image", imageFile)
      if (cvFile) formDataToSend.append("cv", cvFile)

      // Validate token format
      let response
      if (!token.startsWith("Bearer ") && !token.startsWith("bearer ")) {
        const formattedToken = `Bearer ${token}`

        // Update headers with properly formatted token
        response = await fetch(`${API_BASE_URL}/api/user/updateRec/${userData.id}`, {
          method: "POST",
          headers: {
            Authorization: formattedToken,
            Accept: "application/json",
          },
          body: formDataToSend,
        })
      } else {
        // Token already has Bearer prefix
        response = await fetch(`${API_BASE_URL}/api/user/updateRec/${userData.id}`, {
          method: "POST",
          headers: {
            Authorization: token,
            Accept: "application/json",
          },
          body: formDataToSend,
        })
      }

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          throw new Error(errorData.message || errorData.error || "Erreur lors de la mise à jour")
        } else {
          const errorText = await response.text()
          // console.error("Non-JSON error response:", errorText)
          // throw new Error(`Erreur ${response.status}: Le serveur a retourné une réponse invalide`)
        }
      }

      const result = await response.json()
      onSuccess()
      onClose()
    } catch (err) {
      console.error("Error updating profile:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setPasswordError(null)

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas")
      setIsSubmitting(false)
      return
    }

    if (!userData) {
      setPasswordError("Données utilisateur non disponibles")
      setIsSubmitting(false)
      return
    }

    try {
      const token = sessionStorage.getItem("token") || sessionStorage.getItem("auth_token")
      if (!token) {
        setPasswordError("Session expirée. Veuillez vous reconnecter.")
        setIsSubmitting(false)
        return
      }

      const formDataToSend = new FormData()
      formDataToSend.append("_method", "PUT")
      formDataToSend.append("old_password", passwordData.oldPassword)
      formDataToSend.append("password", passwordData.newPassword)

      const formattedToken = token.startsWith("Bearer ") || token.startsWith("bearer ") ? token : `Bearer ${token}`

      const response = await fetch(`${API_BASE_URL}/api/user/updatePassword/${userData.id}`, {
        method: "POST",
        headers: {
          Authorization: formattedToken,
          Accept: "application/json",
        },
        body: formDataToSend,
      })

      if (!response.ok) {
        const contentType = response.headers.get("content-type")
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          throw new Error(errorData.message || errorData.error || "Erreur lors de la mise à jour du mot de passe")
        } else {
          const errorText = await response.text()
          console.error("Non-JSON error response:", errorText)
          throw new Error(`Erreur ${response.status}: Le serveur a retourné une réponse invalide`)
        }
      }

      const result = await response.json()
      setShowPasswordModal(false)
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
      // Afficher un message de succès si nécessaire
    } catch (err) {
      // console.error("Error updating password:", err)
      // setPasswordError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  const passwordModal = (
    <Dialog
      open={showPasswordModal}
      onOpenChange={(open) => {
        if (!open) {
          setShowPasswordModal(false)
          setPasswordData({
            oldPassword: "",
            newPassword: "",
            confirmPassword: "",
          })
          setPasswordError(null)
        }
      }}
    >
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Changer votre mot de passe</DialogTitle>
        </DialogHeader>

        {passwordError && (
          <Alert variant="destructive">
            <AlertDescription>{passwordError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="oldPassword">Ancien mot de passe</Label>
            <div className="relative">
              <Input
                id="oldPassword"
                name="oldPassword"
                type={showOldPassword ? "text" : "password"}
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, oldPassword: e.target.value }))}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">Afficher/masquer le mot de passe</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">Afficher/masquer le mot de passe</span>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">Afficher/masquer le mot de passe</span>
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setShowPasswordModal(false)} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Enregistrement..." : "Changer le mot de passe"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier votre profil</DialogTitle>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center mb-6">
              <div className="relative w-24 h-24 mb-4 overflow-hidden rounded-full border">
                <Image src={imagePreview || "/placeholder.svg"} alt="Photo de profil" fill className="object-cover" />
              </div>

              <input
                type="file"
                ref={imageInputRef}
                onChange={handleImageChange}
                accept="image/jpeg,image/png,image/jpg"
                className="hidden"
              />

              <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Changer la photo
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nom_societe">Nom de l'entreprise</Label>
                <Input
                  id="nom_societe"
                  name="nom_societe"
                  value={formData?.nom_societe || ""}
                  onChange={handleInputChange}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData?.email || ""}
                  onChange={handleInputChange}
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="numTel">Téléphone</Label>
                <Input id="numTel" name="numTel" value={formData?.numTel || ""} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fax">Fax</Label>
                <Input id="fax" name="fax" value={formData?.fax || ""} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input id="adresse" name="adresse" value={formData?.adresse || ""} onChange={handleInputChange} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="lien_site_web">Site Web</Label>
                <Input
                  id="lien_site_web"
                  name="lien_site_web"
                  type="url"
                  value={formData?.lien_site_web || ""}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domaine_activite">Domaine d'activité</Label>
                <Input
                  id="domaine_activite"
                  name="domaine_activite"
                  value={formData?.domaine_activite || ""}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mot de passe</Label>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:underline"
                    onClick={(e) => {
                      e.preventDefault()
                      setShowPasswordModal(true)
                    }}
                  >
                    Vous voulez changer votre mot de passe?
                  </button>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value="••••••••"
                  disabled
                  className="bg-gray-100"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="apropos">À propos</Label>
                <textarea
                  id="apropos"
                  name="apropos"
                  value={formData?.apropos || ""}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Description de votre entreprise"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {passwordModal}
    </>
  )
}
