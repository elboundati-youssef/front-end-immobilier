"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
// 🌟 IMPORT DE ChevronDown ICI
import { Search, MapPin, Home, ArrowRight, ChevronDown } from "lucide-react" 
import { Button } from "@/components/ui/button"
import { cities, propertyTypes, transactionTypes } from "@/lib/data"

// 🌟 COMPOSANT INTERNE : Champ de recherche de ville avec Autocomplétion
function CityAutocomplete({ 
  value, 
  onChange, 
  placeholder, 
  className,
  t 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  placeholder: string; 
  className: string;
  t: any;
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState(value)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    setSearchTerm(value)
  }, [value])

  const filteredCities = cities.filter(city => {
    const search = searchTerm.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    const target = city.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    return target.startsWith(search) 
  })

  return (
    <div ref={wrapperRef} className="relative w-full h-full">
      <MapPin className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground z-10" />
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value)
          setIsOpen(true)
          if (e.target.value === "") onChange("") 
        }}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        className={className}
      />
      
      {/* 🌟 NOUVELLE FLÈCHE DYNAMIQUE (end-3 pour gérer le RTL) */}
      <ChevronDown className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />

      {isOpen && (
        <ul className="absolute z-50 bottom-full mb-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card py-1 text-sm shadow-lg focus:outline-none">
          {filteredCities.length === 0 ? (
            <li className="relative cursor-default select-none py-2 px-4 text-muted-foreground">
              Aucune ville
            </li>
          ) : (
            filteredCities.map((city) => (
              <li
                key={city}
                className={`relative cursor-pointer select-none py-2 px-4 hover:bg-primary/10 hover:text-primary transition-colors ${
                  value === city ? "bg-primary/10 text-primary font-medium" : "text-foreground"
                }`}
                onClick={() => {
                  onChange(city)
                  setSearchTerm(city)
                  setIsOpen(false)
                }}
              >
                {city}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}

export function SearchBar({ variant = "hero" }: { variant?: "hero" | "compact" }) {
  const t = useTranslations("SearchBar")
  const router = useRouter()
  const pathname = usePathname()
  
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
    
    router.push(l(`/biens?${params.toString()}`))
  }

  const getTranslatedLabel = (category: string, value: string, defaultLabel: string) => {
    try {
      return t(`${category}.${value}`);
    } catch {
      return defaultLabel;
    }
  }

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-sm">
        <div className="relative flex-1 min-w-[140px]">
          <CityAutocomplete
            value={city}
            onChange={setCity}
            placeholder={t("city")}
            t={t}
            // 🌟 Ajout de pe-9 pour ne pas coller à la flèche
            className="w-full rounded-lg border-0 bg-secondary py-2.5 ps-9 pe-9 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="relative flex-1 min-w-[140px]">
          <Home className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            // 🌟 Ajout de pe-9
            className="w-full rounded-lg border-0 bg-secondary py-2.5 ps-9 pe-9 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="">{t("type")}</option>
            {propertyTypes.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {getTranslatedLabel("propertyTypes", pt.value, pt.label)}
              </option>
            ))}
          </select>
          {/* 🌟 NOUVELLE FLÈCHE DYNAMIQUE */}
          <ChevronDown className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
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
          <CityAutocomplete
            value={city}
            onChange={setCity}
            placeholder={t("allCities")}
            t={t}
            // 🌟 Ajout de pe-10
            className="w-full rounded-lg border border-border bg-background py-3 ps-10 pe-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="relative">
          <Home className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            // 🌟 Ajout de pe-10
            className="w-full rounded-lg border border-border bg-background py-3 ps-10 pe-10 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
          >
            <option value="">{t("allTypes")}</option>
            {propertyTypes.map((pt) => (
              <option key={pt.value} value={pt.value}>
                {getTranslatedLabel("propertyTypes", pt.value, pt.label)}
              </option>
            ))}
          </select>
          {/* 🌟 NOUVELLE FLÈCHE DYNAMIQUE */}
          <ChevronDown className="absolute end-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        <Button onClick={handleSearch} className="gap-2 py-3 text-sm">
          <Search className="h-4 w-4" />
          <span>{t("searchBtn")}</span>
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  )
}