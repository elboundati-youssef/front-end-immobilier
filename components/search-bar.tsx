"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, MapPin, Home, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cities, propertyTypes, transactionTypes } from "@/lib/data"

export function SearchBar({ variant = "hero" }: { variant?: "hero" | "compact" }) {
  const router = useRouter()
  const [city, setCity] = useState("")
  const [type, setType] = useState("")
  const [transaction, setTransaction] = useState("")

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (city) params.set("city", city)
    if (type) params.set("type", type)
    if (transaction) params.set("transaction", transaction)
    router.push(`/biens?${params.toString()}`)
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
            <option value="">Ville</option>
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
            <option value="">Type</option>
            {propertyTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <Button onClick={handleSearch} size="sm" className="gap-2">
          <Search className="h-4 w-4" />
          Rechercher
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-4 shadow-lg md:p-6">
      <div className="mb-4 flex gap-2">
        {transactionTypes.map((t) => (
          <button
            key={t.value}
            onClick={() => setTransaction(transaction === t.value ? "" : t.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              transaction === t.value
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t.label}
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
            <option value="">Toutes les villes</option>
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
            <option value="">Tous les types</option>
            {propertyTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <Button onClick={handleSearch} className="gap-2 py-3 text-sm">
          <Search className="h-4 w-4" />
          Rechercher
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
