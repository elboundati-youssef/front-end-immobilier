"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, Shield, Camera, Save, X, Loader2, Phone } from "lucide-react" // Ajout de Phone
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
  phone?: string // <-- Ajout de phone ici
  role: string
  avatar?: string
  created_at?: string
}

const API_URL = "http://127.0.0.1:8000";

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  
  // Référence pour l'input file caché
  const fileInputRef = useRef<HTMLInputElement>(null)

  // États pour le formulaire
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "", // <-- Ajout de phone ici
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

      // On essaie d'abord de charger depuis l'API pour avoir les données fraîches
      try {
        const res = await api.get('/user')
        setUser(res.data)
        setFormData({ 
          name: res.data.name, 
          email: res.data.email,
          phone: res.data.phone || "" // Remplissage initial
        })
        // Mise à jour du localStorage pour rester synchro
        localStorage.setItem("user", JSON.stringify(res.data))
      } catch (err) {
        console.error("Erreur chargement profil API", err)
        // Fallback sur le localStorage si l'API échoue
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser)
            setUser(parsedUser)
            setFormData({ 
              name: parsedUser.name, 
              email: parsedUser.email,
              phone: parsedUser.phone || "" // Remplissage initial fallback
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

  // 2. SAUVEGARDE DES MODIFICATIONS (NOM/EMAIL/PHONE)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Appel API réel (PUT)
      const res = await api.put('/user/profile', formData) 
      
      // Mise à jour locale
      const updatedUser = res.data.user // Le backend renvoie l'user mis à jour
      localStorage.setItem("user", JSON.stringify(updatedUser))
      setUser(updatedUser)
      
      // Déclencher un événement pour que la Navbar se mette à jour
      window.dispatchEvent(new Event("storage"))
      
      setIsEditing(false)
      alert("Profil mis à jour avec succès !")
    } catch (err) {
      console.error("Erreur mise à jour", err)
      alert("Erreur lors de la mise à jour.")
    } finally {
      setSaving(false)
    }
  }

  // 3. GESTION DE L'UPLOAD DE L'AVATAR
  const handleAvatarClick = () => {
    // Simule le clic sur l'input file caché
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    const formData = new FormData()
    formData.append('avatar', file)

    try {
        alert("Envoi de l'image en cours...")
        
        const res = await api.post('/user/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })

        // Le backend renvoie le nouveau chemin : { message: '...', avatar: '/storage/avatars/...' }
        const newAvatarUrl = res.data.avatar
        const updatedUser = { ...user, avatar: newAvatarUrl }
        
        setUser(updatedUser)
        localStorage.setItem("user", JSON.stringify(updatedUser))
        window.dispatchEvent(new Event("storage"))
        
        alert("Photo de profil mise à jour !")
    } catch (err) {
        console.error("Erreur upload avatar", err)
        alert("Erreur lors de l'envoi de l'image.")
    }
  }

  // Helper pour afficher l'image (URL absolue si nécessaire)
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
        <h1 className="mb-8 text-3xl font-serif font-bold text-foreground">Mon Profil</h1>

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
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              
              {/* Input file caché pour l'upload */}
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
                title="Modifier la photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            
            <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
              <Shield className="h-3 w-3" />
              {user.role}
            </div>
            
            <p className="mt-4 text-xs text-muted-foreground">
              Membre depuis le {user.created_at ? new Date(user.created_at).toLocaleDateString() : "2024"}
            </p>
          </div>

          {/* --- CARTE DROITE : INFORMATIONS --- */}
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Informations personnelles</h3>
              {!isEditing && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Modifier
                </Button>
              )}
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="pl-9"
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Adresse email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing} 
                    className="pl-9"
                    placeholder="exemple@email.com"
                  />
                </div>
              </div>

              {/* 🌟 NOUVEAU CHAMP : TÉLÉPHONE 🌟 */}
              <div className="grid gap-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing} 
                    className="pl-9"
                    placeholder="06 00 00 00 00"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label>Mot de passe</Label>
                <Input
                  type="password"
                  value="********"
                  disabled
                  className="bg-secondary/50 text-muted-foreground"
                />
                {isEditing && (
                  <p className="text-xs text-muted-foreground">Pour changer de mot de passe, contactez le support.</p>
                )}
              </div>

              {isEditing && (
                <div className="mt-6 flex items-center gap-3 pt-4 border-t border-border">
                  <Button type="submit" disabled={saving} className="gap-2">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                    Enregistrer
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
                    Annuler
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