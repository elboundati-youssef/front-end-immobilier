"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl" // 🌟 IMPORT NEXT-INTL
import { User, Mail, Shield, Camera, Save, X, Loader2, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import api from "@/services/api"

interface UserProfile {
  id: number
  name: string
  email: string
  phone?: string 
  role: string
  avatar?: string
  created_at?: string
}

const API_URL = "http://127.0.0.1:8000";

export default function ProfilePage() {
  const t = useTranslations("ProfilePage") // 🌟 INITIALISATION TRADUCTION
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "", 
  })

  // 1. CHARGEMENT DE L'UTILISATEUR
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token")
      const storedUser = localStorage.getItem("user")

      if (!token) {
        router.push("/connexion")
        return
      }

      try {
        const res = await api.get('/user')
        setUser(res.data)
        setFormData({ 
          name: res.data.name, 
          email: res.data.email,
          phone: res.data.phone || "" 
        })
        localStorage.setItem("user", JSON.stringify(res.data))
      } catch (err) {
        console.error("Erreur chargement profil API", err)
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser)
            setUser(parsedUser)
            setFormData({ 
              name: parsedUser.name, 
              email: parsedUser.email,
              phone: parsedUser.phone || ""
            })
        } else {
            router.push("/connexion")
        }
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  // 2. SAUVEGARDE DES MODIFICATIONS
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const res = await api.put('/user/profile', formData) 
      const updatedUser = res.data.user 
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      window.dispatchEvent(new Event("storage"))
      
      setIsEditing(false)
      alert(t("alerts.profileUpdated")) // 🌟 Traduction
    } catch (err) {
      console.error("Erreur mise à jour", err)
      alert(t("alerts.profileError")) // 🌟 Traduction
    } finally {
      setSaving(false)
    }
  }

  // 3. GESTION DE L'UPLOAD DE L'AVATAR
  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const formData = new FormData()
    formData.append('avatar', file)

    try {
      alert(t("alerts.uploading")) // 🌟 Traduction
      
      const res = await api.post('/user/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
      })

      const newAvatarUrl = res.data.avatar
      const updatedUser = { ...user, avatar: newAvatarUrl }
      
      setUser(updatedUser)
      localStorage.setItem("user", JSON.stringify(updatedUser))
      window.dispatchEvent(new Event("storage"))
      
      alert(t("alerts.avatarUpdated")) // 🌟 Traduction
    } catch (err) {
        console.error("Erreur upload avatar", err)
        alert(t("alerts.avatarError")) // 🌟 Traduction
    }
  }

  const getAvatarUrl = (path: string | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${API_URL}${path}`;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-secondary/30">
      <Navbar />

      <main className="container mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-8 text-3xl font-serif font-bold text-foreground">
          {t("title")}
        </h1>

        <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
          
          {/* --- CARTE GAUCHE : AVATAR & RÔLE --- */}
          <div className="flex flex-col items-center rounded-xl border border-border bg-card p-6 text-center shadow-sm">
            <div className="relative mb-4">
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary border-4 border-background shadow-sm overflow-hidden relative">
                {user.avatar ? (
                  <img 
                    src={getAvatarUrl(user.avatar) || ""} 
                    alt={user.name} 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <span>{user.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />

              <button 
                onClick={handleAvatarClick}
                className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
                title={t("editPhoto")}
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            
            <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Shield className="h-3 w-3" />
              <span>{user.role}</span>
            </div>
            
            <p className="mt-4 text-xs text-muted-foreground">
              <span>{t("memberSince")}</span> <span>{user.created_at ? new Date(user.created_at).toLocaleDateString() : "2024"}</span>
            </p>
          </div>

          {/* --- CARTE DROITE : INFORMATIONS --- */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold">{t("form.title")}</h3>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  <span>{t("buttons.edit")}</span>
                </Button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">{t("form.fullName")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="pl-9"
                    placeholder={t("form.namePlaceholder")}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">{t("form.email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing} 
                    className="pl-9"
                    placeholder={t("form.emailPlaceholder")}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="phone">{t("form.phone")}</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing} 
                    className="pl-9"
                    placeholder={t("form.phonePlaceholder")}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>{t("form.password")}</Label>
                <Input
                  type="password"
                  value="********"
                  disabled
                  className="bg-secondary/50 text-muted-foreground"
                />
                {isEditing && (
                  <p className="text-xs text-muted-foreground">{t("form.passwordHelp")}</p>
                )}
              </div>

              {isEditing && (
                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-border">
                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span>{t("buttons.save")}</span>
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => { 
                      setIsEditing(false); 
                      setFormData({ name: user.name, email: user.email, phone: user.phone || "" }); 
                    }}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    <span>{t("buttons.cancel")}</span>
                  </Button>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}