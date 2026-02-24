"use client"

import { useState, useEffect } from "react" // <-- useEffect ajouté ici
import Link from "next/link"
import { useRouter } from "next/navigation" 
import { Home, Eye, EyeOff, Mail, Lock, Loader2, Phone, User } from "lucide-react" 
import { Button } from "@/components/ui/button"

export default function ConnexionPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Nouvel état pour empêcher le rendu du formulaire si l'utilisateur est déjà connecté
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // État pour stocker les données du formulaire
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "", 
    password: "",
    role: "client", 
  })

  // 🌟 PROTECTION DE LA ROUTE : Vérification au chargement de la page
  useEffect(() => {
    const user = localStorage.getItem('user');
    
    if (user) {
      // Si un utilisateur est trouvé dans le localStorage, on le renvoie à l'accueil
      router.push('/');
    } else {
      // Sinon, on le laisse accéder à la page de connexion
      setIsCheckingAuth(false);
    }
  }, [router])

  // Gestion des changements dans les inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("") 
  }

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    // Choix de la route API selon le mode
    const endpoint = isLogin ? "/login" : "/register"
    const url = `http://127.0.0.1:8000/api${endpoint}`

    try {
      // Si on se connecte, pas besoin d'envoyer le téléphone et le nom
      const dataToSend = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(dataToSend),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Une erreur est survenue.")
      }

      // SUCCÈS : On stocke le token et les infos user
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      // Redirection vers l'accueil après connexion
      router.push("/") 
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 🌟 On n'affiche rien (ou un petit loader) tant qu'on n'a pas vérifié l'authentification
  // Cela évite que l'utilisateur voie la page de connexion 1 seconde avant d'être redirigé
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left - Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 md:px-8 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-bold text-foreground">ImmoMaroc</span>
          </Link>

          <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">
            {isLogin ? "Connexion" : "Créer un compte"}
          </h1>
          <p className="mb-8 text-muted-foreground">
            {isLogin
              ? "Connectez-vous pour accéder à votre espace."
              : "Inscrivez-vous pour profiter de toutes les fonctionnalités."}
          </p>

          {/* Affichage des erreurs */}
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-500 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Champ NOM (Inscription uniquement) */}
            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Votre nom"
                    required={!isLogin}
                    className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* Champ TÉLÉPHONE (Inscription uniquement) */}
            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Numéro de téléphone</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Ex: 06 00 00 00 00"
                    required={!isLogin}
                    className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* Champ EMAIL (Connexion & Inscription) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  required
                  className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Champ MOT DE PASSE (Connexion & Inscription) */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Votre mot de passe"
                  required
                  className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Champ RÔLE (Inscription uniquement) */}
            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Type de compte</label>
                <select 
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="client">Client</option>
                  <option value="proprietaire">Propriétaire</option>
                  <option value="agence">Agence</option>
                </select>
              </div>
            )}

            {/* Liens supplémentaires (Connexion uniquement) */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" className="rounded border-border" />
                  Se souvenir de moi
                </label>
                <button type="button" className="text-sm text-primary hover:underline">
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            <Button type="submit" className="mt-2 w-full py-3" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Chargement...
                </>
              ) : (
                isLogin ? "Se connecter" : "Créer mon compte"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Pas encore de compte ?" : "Déjà inscrit ?"}{" "}
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError("")
                setFormData({ ...formData, name: "", phone: "", password: "" }) // Reset des champs
              }}
              className="font-medium text-primary hover:underline"
            >
              {isLogin ? "Créer un compte" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>

      {/* Right - Image */}
      <div className="hidden flex-1 bg-primary lg:block">
        <div className="flex h-full flex-col items-center justify-center px-12 text-center">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-foreground/10">
            <Home className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="mb-4 font-serif text-3xl font-bold text-primary-foreground">
            Bienvenue sur ImmoMaroc
          </h2>
          <p className="max-w-sm text-lg leading-relaxed text-primary-foreground/80">
            La plateforme de référence pour l&apos;immobilier au Maroc. Trouvez, publiez et gérez vos biens en toute simplicité.
          </p>
        </div>
      </div>
    </div>
  )
}