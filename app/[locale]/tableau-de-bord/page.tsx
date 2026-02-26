"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl" // 🌟 IMPORT NEXT-INTL
import { Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

// Import des 3 modules séparés
import { ClientDashboard } from "@/components/dashboard/ClientDashboard"
import { AgencyDashboard } from "@/components/dashboard/AgencyDashboard"
import { AdminDashboard } from "@/components/dashboard/AdminDashboard"

// Types
type Role = "client" | "agence" | "proprietaire" | "admin"

export default function DashboardPage() {
  const t = useTranslations("DashboardPage") // 🌟 INITIALISATION TRADUCTION
  const router = useRouter()
  const pathname = usePathname()
  
  // 🌟 GESTION DE LA LANGUE POUR LES REDIRECTIONS
  const currentLocale = pathname.split("/")[1] || "fr"
  const l = (path: string) => `/${currentLocale}${path}`

  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("token")

    if (!storedUser || !token) {
      router.push(l("/connexion"))
      return
    }

    try {
      const parsedUser = JSON.parse(storedUser)
      setUser(parsedUser)
      setRole(parsedUser.role as Role)
    } catch (error) {
      router.push(l("/connexion"))
    } finally {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!role) return null

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <div className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 lg:px-8">
        
        {/* Header Commun à tous les rôles */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold text-foreground">
              {t("title")}
            </h1>
            <p className="text-muted-foreground mt-1">
              <span>{t("welcome")} </span>
              <span className="font-semibold text-foreground">{user?.name}</span>
            </p>
          </div>
          <div>
             <Badge variant="outline" className="text-sm px-3 py-1 uppercase bg-secondary/50">
               <span>{t("workspace")} </span>
               {/* Si le rôle est "proprietaire", on peut aussi le traduire plus tard si besoin */}
               <span>{role}</span>
             </Badge>
          </div>
        </div>

        {/* 🌟 Affichage Conditionnel des Composants 🌟 */}
        {role === "client" ? (
            <ClientDashboard />
        ) : (role === "agence" || role === "proprietaire") ? (
            <AgencyDashboard />
        ) : role === "admin" ? (
            <AdminDashboard />
        ) : (
            // Sécurité : Si le rôle n'est ni client, ni agence, ni admin
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
                {t("unauthorized")}
            </div>
        )}

      </div>
      <Footer />
    </div>
  )
}