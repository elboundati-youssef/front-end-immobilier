"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation" 
import { useTranslations } from "next-intl" // 🌟 IMPORT NEXT-INTL
import { Home, Eye, EyeOff, Mail, Lock, Loader2, Phone, User } from "lucide-react" 
import { Button } from "@/components/ui/button"

export default function ConnexionPage() {
  const t = useTranslations("AuthPage") // 🌟 INITIALISATION TRADUCTION
  const router = useRouter()
  const pathname = usePathname()

  // 🌟 GESTION DE LA LANGUE POUR LA REDIRECTION
  const currentLocale = pathname.split("/")[1] || "fr"
  const l = (path: string) => `/${currentLocale}${path}`

  const [showPassword, setShowPassword] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "", 
    password: "",
    role: "client", 
  })

  useEffect(() => {
    const user = localStorage.getItem('user');
    
    if (user) {
      router.push(l('/'));
    } else {
      setIsCheckingAuth(false);
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("") 
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const endpoint = isLogin ? "/login" : "/register"
    const url = `http://127.0.0.1:8000/api${endpoint}`

    try {
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
        throw new Error(data.message || t("errors.default")) // 🌟 Traduction
      }

      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))

      router.push(l("/")) 
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

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
          <Link href={l("/")} className="mb-8 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-bold text-foreground">ConceptImmo</span>
          </Link>

          <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">
            {isLogin ? t("login.title") : t("register.title")}
          </h1>
          <p className="mb-8 text-muted-foreground">
            {isLogin ? t("login.subtitle") : t("register.subtitle")}
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-500 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {/* Champ NOM */}
            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("form.name")}</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t("form.namePlaceholder")}
                    required={!isLogin}
                    className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* Champ TÉLÉPHONE */}
            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("form.phone")}</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t("form.phonePlaceholder")}
                    required={!isLogin}
                    className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            )}

            {/* Champ EMAIL */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("form.email")}</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t("form.emailPlaceholder")}
                  required
                  className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Champ MOT DE PASSE */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">{t("form.password")}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder={t("form.passwordPlaceholder")}
                  required
                  className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Champ RÔLE */}
            {!isLogin && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("form.role")}</label>
                <select 
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="client">{t("roles.client")}</option>
                  <option value="proprietaire">{t("roles.owner")}</option>
                  <option value="agence">{t("roles.agency")}</option>
                </select>
              </div>
            )}

            {/* Liens supplémentaires */}
            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" className="rounded border-border" />
                  {t("form.rememberMe")}
                </label>
                <button type="button" className="text-sm text-primary hover:underline">
                  {t("form.forgotPassword")}
                </button>
              </div>
            )}

            <Button type="submit" className="mt-2 w-full py-3" disabled={isLoading}>
              {isLoading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("buttons.loading")}</>
              ) : (
                isLogin ? t("buttons.login") : t("buttons.register")
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <span>{isLogin ? t("switch.toRegister") : t("switch.toLogin")} </span>
            <button
              onClick={() => {
                setIsLogin(!isLogin)
                setError("")
                setFormData({ ...formData, name: "", phone: "", password: "" })
              }}
              className="font-medium text-primary hover:underline"
            >
              {isLogin ? t("buttons.register") : t("buttons.login")}
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
            {t("banner.title")}
          </h2>
          <p className="max-w-sm text-lg leading-relaxed text-primary-foreground/80">
            {t("banner.desc")}
          </p>
        </div>
      </div>
    </div>
  )
}