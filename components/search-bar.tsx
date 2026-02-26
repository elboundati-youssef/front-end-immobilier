"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl" // 🌟 IMPORT NEXT-INTL
import { Search, MapPin, Home, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cities, propertyTypes, transactionTypes } from "@/lib/data"

export function SearchBar({ variant = "hero" }: { variant?: "hero" | "compact" }) {
  const t = useTranslations("SearchBar") // 🌟 INITIALISATION TRADUCTION
  const router = useRouter()
  const pathname = usePathname()
  
  // 🌟 GESTION DE LA LANGUE POUR LA REDIRECTION
  const currentLocale = pathname.split("/")[1] || "fr"
  const l = (path: string) => `/${currentLocale}${path}`

  const [city, setCity] = useState("")
  const [type, setType] = useState("")
  const [transaction, setTransaction] = useState("")

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (city) params.set("city", city)
    if (type) params.set("type", type)
    if (transaction) params.set("transaction", transaction)
    
    // Redirection avec la bonne langue
    router.push(l(`/biens?${params.toString()}`))
  }

  // --- TRADUCTIONS DYNAMIQUES DES TYPES ---
  // On crée un petit helper pour traduire les données statiques (qui sont en français dans lib/data.ts)
  const getTranslatedLabel = (category: string, value: string, defaultLabel: string) => {
    try {
      return t(`${category}.${value}`);
    } catch {
      return defaultLabel; // Fallback au cas où la trad manque
    }
  }

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
        <div className="relative flex-1 min-w-[140px]">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-lg border-0 bg-secondary py-2.5 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t("city")}</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-[140px]">
          <Home className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border-0 bg-secondary py-2.5 pl-9 pr-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t("type")}</option>
            {propertyTypes.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {getTranslatedLabel("propertyTypes", pt.value, pt.label)}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={handleSearch} size="sm" className="gap-2">
          <Search className="h-4 w-4" />
          <span>{t("searchBtn")}</span>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-lg md:p-6">
      <div className="mb-4 flex gap-2">
        {transactionTypes.map((tt) => (
          <button
            key={tt.value}
            onClick={() => setTransaction(transaction === tt.value ? "" : tt.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              transaction === tt.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {getTranslatedLabel("transactionTypes", tt.value, tt.label)}
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t("allCities")}</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Home className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full rounded-lg border border-border bg-background py-3 pl-10 pr-4 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">{t("allTypes")}</option>
            {propertyTypes.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {getTranslatedLabel("propertyTypes", pt.value, pt.label)}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={handleSearch} className="gap-2 py-3 text-sm">
          <Search className="h-4 w-4" />
          <span>{t("searchBtn")}</span>
          {/* Modification de l'icône de flèche pour RTL */}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  )
}