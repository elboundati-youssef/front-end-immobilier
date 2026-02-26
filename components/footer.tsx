"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl" // 🌟 IMPORT NEXT-INTL
import { Home, Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  const t = useTranslations("Footer") // 🌟 INITIALISATION TRADUCTION
  const pathname = usePathname()
  
  // 🌟 GESTION DE LA LANGUE ACTUELLE POUR LES LIENS
  const currentLocale = pathname.split("/")[1] || "fr"
  const l = (path: string) => `/${currentLocale}${path}`

  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // On récupère le rôle de l'utilisateur depuis le localStorage au chargement
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserRole(user.role) // 'client', 'agence', 'proprietaire', ou 'admin'
      } catch (e) {
        console.error("Erreur parsing user", e)
      }
    }
  }, [])

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        {/* 🌟 AJOUT DE 'text-center md:text-left' ICI */}
        <div className="grid gap-10 text-center md:grid-cols-2 md:text-left lg:grid-cols-4 lg:gap-8">
          
          {/* Colonne 1 : À propos */}
          {/* 🌟 AJOUT DE 'flex flex-col items-center md:items-start' ICI */}
          <div className="flex flex-col items-center md:items-start">
            <Link href={l("/")} className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-serif text-xl font-bold text-foreground">ConceptImmo</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t("aboutText")}
            </p>
          </div>

          {/* Colonne 2 : Navigation */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="mb-4 font-semibold text-foreground">{t("nav.title")}</h3>
            <ul className="flex flex-col items-center md:items-start gap-2.5">
              <li>
                <Link href={l("/")} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  {t("nav.home")}
                </Link>
              </li>
              <li>
                <Link href={l("/biens")} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  {t("nav.allProperties")}
                </Link>
              </li>
              
              {/* CONDITION D'AFFICHAGE SELON LE RÔLE */}
              <li>
                {userRole === "client" ? (
                  <Link href={l("/tableau-de-bord")} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {t("nav.dashboard")}
                  </Link>
                ) : (
                  <Link href={l("/publier")} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {t("nav.publish")}
                  </Link>
                )}
              </li>

              <li>
                <Link href={l("/a-propos")} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  {t("nav.about")}
                </Link>
              </li>
              <li>
                <Link href={l("/contact")} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  {t("nav.contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Colonne 3 : Types de biens */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="mb-4 font-semibold text-foreground">{t("types.title")}</h3>
            <ul className="flex flex-col items-center md:items-start gap-2.5">
              {[
                { label: t("types.apartments"), value: "appartement" },
                { label: t("types.villas"), value: "villa" },
                { label: t("types.houses"), value: "maison" },
                { label: t("types.lands"), value: "terrain" },
                { label: t("types.offices"), value: "bureau" }
              ].map((type) => (
                <li key={type.value}>
                  <Link 
                    href={l(`/biens?type=${type.value}`)} 
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {type.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne 4 : Contact */}
          <div className="flex flex-col items-center md:items-start">
            <h3 className="mb-4 font-semibold text-foreground">{t("contact.title")}</h3>
            <ul className="flex flex-col items-center md:items-start gap-3">
              {/* 🌟 AJOUT DE 'flex-col md:flex-row items-center md:items-start justify-center md:justify-start' ICI */}
              <li className="flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-2 md:gap-2.5 text-sm text-muted-foreground">
                <MapPin className="md:mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{t("contact.address")}</span>
              </li>
              <li className="flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-2 md:gap-2.5 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                <span dir="ltr">{t("contact.phone")}</span>
              </li>
              <li className="flex flex-col md:flex-row items-center md:items-start justify-center md:justify-start gap-2 md:gap-2.5 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span>{t("contact.email")}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p dir={currentLocale === 'ar' ? 'rtl' : 'ltr'}>&copy; {new Date().getFullYear()} ImmoMaroc. {t("copyright")}</p>
        </div>
      </div>
    </footer>
  )
}