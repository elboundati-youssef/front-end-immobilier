"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl" // 🌟 IMPORT NEXT-INTL
import {
  SlidersHorizontal, X, ArrowUpDown, Loader2,
  ChevronLeft, ChevronRight, Search, Sparkles, Building2, ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PropertyCard } from "@/components/property-card"
import {
  properties as staticProperties,
  cities, propertyTypes, transactionTypes,
  type PropertyType, type TransactionType,
} from "@/lib/data"
import api from "@/services/api"

type SortOption = "recent" | "price-asc" | "price-desc"
const API_URL = "http://127.0.0.1:8000"
const ITEMS_PER_PAGE = 6

/* ─── Hook: intersection observer ─── */
function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold })
    obs.observe(el); return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

// 🌟 COMPOSANT INTERNE : Filtre de ville avec Autocomplétion
function CityFilterAutocomplete({ 
  value, 
  onChange, 
  placeholder, 
  className 
}: { 
  value: string; 
  onChange: (val: string) => void; 
  placeholder: string; 
  className: string;
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
    <div ref={wrapperRef} className="relative w-full">
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
        style={{ paddingRight: '2.5rem' }} // Space for the arrow
      />
      <ChevronDown className="absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none z-10" />

      {isOpen && (
        <ul className="absolute z-50 top-full mt-1 max-h-60 w-full overflow-auto rounded-lg border border-border bg-card py-1 text-sm shadow-lg focus:outline-none">
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

export default function BiensPage() {
  const t = useTranslations("PropertiesPage") // 🌟 INITIALISATION TRADUCTION
  const searchParams = useSearchParams()

  const [allProperties, setAllProperties]   = useState<any[]>([])
  const [loading, setLoading]               = useState(true)
  const [currentPage, setCurrentPage]       = useState(1)
  const [favorites, setFavorites]           = useState<string[]>([])
  const [hasSearched, setHasSearched]       = useState(false)
  const [heroVisible, setHeroVisible]       = useState(false)
  const [searchFocused, setSearchFocused]   = useState(false)

  const [globalSearch, setGlobalSearch]     = useState("")
  const [city, setCity]                     = useState(searchParams.get("city") || "")
  const [type, setType]                     = useState<PropertyType | "">((searchParams.get("type") as PropertyType) || "")
  const [transaction, setTransaction]       = useState<TransactionType | "">((searchParams.get("transaction") as TransactionType) || "")
  const [minPrice, setMinPrice]             = useState("")
  const [maxPrice, setMaxPrice]             = useState("")
  const [minSurface, setMinSurface]         = useState("")
  const [rooms, setRooms]                   = useState("")
  const [sort, setSort]                     = useState<SortOption>("recent")
  const [showFilters, setShowFilters]       = useState(false)

  const { ref: resultsRef, inView: resultsInView } = useInView()

  // Traductions des suggestions
  const suggestions = [
    t("suggestions.s1"),
    t("suggestions.s2"),
    t("suggestions.s3"),
  ]

  useEffect(() => { const timer = setTimeout(() => setHeroVisible(true), 80); return () => clearTimeout(timer) }, [])

  useEffect(() => {
    setCity(searchParams.get("city") || "")
    setType((searchParams.get("type") as PropertyType) || "")
    setTransaction((searchParams.get("transaction") as TransactionType) || "")
    if (searchParams.get("q")) setGlobalSearch(searchParams.get("q") || "")
  }, [searchParams])

  useEffect(() => {
    const fetchFavorites = async () => {
      try { const res = await api.get('/my-favorites'); setFavorites(res.data.map((f: any) => f.id.toString())) }
      catch { /* non connecté */ }
    }
    fetchFavorites()
  }, [])

  const formatProperties = (data: any[]) => data.map((p: any) => {
    let images: string[] = []
    if (Array.isArray(p.images)) images = p.images
    else if (typeof p.images === 'string') { try { images = JSON.parse(p.images) } catch { images = [] } }
    const formattedImages = images.map((img: string) => img.startsWith('http') ? img : `${API_URL}${img}`)

    let features: string[] = []
    if (Array.isArray(p.equipments)) features = p.equipments
    else if (typeof p.equipments === 'string') { try { features = JSON.parse(p.equipments) } catch {} }
    if (Array.isArray(p.amenities)) features = p.amenities
    else if (typeof p.amenities === 'string') { try { features = JSON.parse(p.amenities) } catch {} }

    return {
      ...p,
      id: p.id.toString(),
      images: formattedImages.length > 0 ? formattedImages : ["/placeholder.jpg"],
      features,
      type: p.property_type || p.type,
      transaction: p.transaction_type || p.transaction,
      createdAt: p.created_at || p.createdAt,
    }
  })

  const fetchAllProperties = async () => {
    setLoading(true)
    try {
      const res = await api.get('/properties')
      setAllProperties([...staticProperties, ...formatProperties(res.data)])
    } catch { /* silent */ } finally { setLoading(false) }
  }

  useEffect(() => { fetchAllProperties() }, [])

  const handleSmartSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!globalSearch.trim()) { setHasSearched(false); fetchAllProperties(); return }
    setLoading(true); setHasSearched(true)
    try {
      const res = await api.get(`/smart-search?q=${encodeURIComponent(globalSearch)}`)
      setAllProperties(formatProperties(res.data))
    } catch { /* silent */ } finally { setLoading(false) }
  }

  const handleSuggestionClick = (text: string) => {
    setGlobalSearch(text)
    setTimeout(() => document.getElementById('magic-btn')?.click(), 50)
  }

  const filteredResult = useMemo(() => {
    let result = [...allProperties]
    if (city) result = result.filter((p) => p.city?.toLowerCase().includes(city.toLowerCase()))
    if (type) result = result.filter((p) => p.type === type)
    if (transaction) result = result.filter((p) => p.transaction === transaction)
    if (minPrice) result = result.filter((p) => p.price >= Number(minPrice))
    if (maxPrice) result = result.filter((p) => p.price <= Number(maxPrice))
    if (minSurface) result = result.filter((p) => p.surface >= Number(minSurface))
    if (rooms) result = result.filter((p) => p.rooms >= Number(rooms))
    switch (sort) {
      case "price-asc":  result.sort((a, b) => a.price - b.price); break
      case "price-desc": result.sort((a, b) => b.price - a.price); break
      default:           result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return result
  }, [allProperties, city, type, transaction, minPrice, maxPrice, minSurface, rooms, sort])

  const totalPages = Math.ceil(filteredResult.length / ITEMS_PER_PAGE)
  const currentItems = useMemo(() => {
    const s = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredResult.slice(s, s + ITEMS_PER_PAGE)
  }, [filteredResult, currentPage])

  useEffect(() => { setCurrentPage(1) }, [allProperties, city, type, transaction, minPrice, maxPrice, minSurface, rooms, sort])

  const activeFilters = [city, type, transaction, minPrice, maxPrice, minSurface, rooms].filter(Boolean).length

  const clearFilters = () => {
    setGlobalSearch(""); setCity(""); setType(""); setTransaction("")
    setMinPrice(""); setMaxPrice(""); setMinSurface(""); setRooms("")
    setHasSearched(false); fetchAllProperties()
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        :root { --ease-expo: cubic-bezier(0.16,1,0.3,1); }
        .rv { opacity:0; transform:translateY(28px); transition:opacity .65s var(--ease-expo),transform .65s var(--ease-expo); }
        .rv.on { opacity:1; transform:none; }
        .hw { display:inline-block; opacity:0; transform:translateY(36px); transition:opacity .7s var(--ease-expo),transform .7s var(--ease-expo); }
        .hv .hw { opacity:1; transform:none; }
        .magic-bar { display:flex; align-items:center; overflow:hidden; border-radius:99px; border:1.5px solid hsl(var(--border)); background:hsl(var(--card)); box-shadow:0 4px 24px rgba(0,0,0,.07); transition:box-shadow .3s ease, border-color .3s ease; }
        .magic-bar.focused { box-shadow:0 6px 36px rgba(0,0,0,.10); border-color:hsl(var(--primary)/.5); }
        .magic-input { flex:1; padding:16px 16px 16px 8px; background:transparent; border:none; outline:none; font-size:.95rem; color:hsl(var(--foreground)); font-family:'DM Sans',sans-serif; }
        .magic-input::placeholder { color:hsl(var(--muted-foreground)); }
        .magic-submit { background:hsl(var(--primary)); color:hsl(var(--primary-foreground)); border:none; border-radius:99px; margin:5px; padding:12px 24px; font-weight:600; font-size:.875rem; cursor:pointer; display:flex; align-items:center; gap:8px; transition:transform .25s var(--ease-expo),box-shadow .25s; font-family:'DM Sans',sans-serif; white-space:nowrap; }
        .magic-submit:hover { transform:scale(1.03); box-shadow:0 4px 16px rgba(0,0,0,.15); }
        .magic-submit:active { transform:scale(.98); }
        .sug-pill { padding:6px 14px; border-radius:99px; border:1px solid hsl(var(--border)); background:hsl(var(--secondary)); color:hsl(var(--secondary-foreground)); font-size:.78rem; cursor:pointer; transition:all .2s ease; font-family:'DM Sans',sans-serif; }
        .sug-pill:hover { background:hsl(var(--primary)/.08); border-color:hsl(var(--primary)/.4); color:hsl(var(--primary)); }
        .filter-panel { animation:slideDown .35s var(--ease-expo); }
        @keyframes slideDown { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:none; } }
        .filter-input { width:100%; border-radius:10px; border:1px solid hsl(var(--border)); background:hsl(var(--background)); padding:10px 12px; font-size:.85rem; color:hsl(var(--foreground)); outline:none; transition:border-color .2s,box-shadow .2s; font-family:'DM Sans',sans-serif; }
        .filter-input:focus { border-color:hsl(var(--primary)); box-shadow:0 0 0 3px hsl(var(--primary)/.12); }
        .filter-label { display:block; margin-bottom:6px; font-size:.75rem; font-weight:600; letter-spacing:.05em; text-transform:uppercase; color:hsl(var(--muted-foreground)); }
        .filter-badge { display:inline-flex; align-items:center; justify-content:center; width:20px; height:20px; border-radius:99px; background:hsl(var(--primary)); color:hsl(var(--primary-foreground)); font-size:.7rem; font-weight:700; }
        .card-item { opacity:0; transform:translateY(24px); animation:cardIn .5s var(--ease-expo) forwards; }
        @keyframes cardIn { to { opacity:1; transform:none; } }
        .page-btn { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; border:1px solid hsl(var(--border)); background:hsl(var(--card)); cursor:pointer; font-size:.875rem; font-weight:500; color:hsl(var(--foreground)); transition:all .2s ease; font-family:'DM Sans',sans-serif; }
        .page-btn:hover:not(:disabled) { border-color:hsl(var(--primary)); color:hsl(var(--primary)); background:hsl(var(--primary)/.06); }
        .page-btn.active { background:hsl(var(--primary)); color:hsl(var(--primary-foreground)); border-color:transparent; }
        .page-btn:disabled { opacity:.4; cursor:not-allowed; }
        @keyframes spin360 { to{transform:rotate(360deg);} }
        .spin { animation:spin360 .75s linear infinite; }
        .empty-state { border:1.5px dashed hsl(var(--border)); border-radius:20px; }
        .sort-select { appearance:none; border:1px solid hsl(var(--border)); background:hsl(var(--card)); border-radius:10px; padding:8px 14px; font-size:.875rem; color:hsl(var(--foreground)); outline:none; cursor:pointer; font-family:'DM Sans',sans-serif; transition:border-color .2s; }
        .sort-select:focus { border-color:hsl(var(--primary)); }
      `}</style>

      <div className="min-h-screen bg-background" style={{ fontFamily:"'DM Sans',sans-serif" }}>
        <Navbar />

        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">

          {/* ── Hero Search ── */}
          <div className={`mb-14 mx-auto max-w-3xl text-center pt-4 ${heroVisible ? "hv" : ""}`}>
            <div
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5"
              style={{ opacity:heroVisible?1:0, transition:"opacity .6s ease .1s", fontSize:".8rem", color:"hsl(var(--muted-foreground))" }}
            >
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>{t("hero.badge")}</span>
            </div>

            <h1
              className="mb-3 font-bold text-foreground"
              style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(2rem,5vw,3.2rem)", lineHeight:1.1 }}
            >
              <span className="hw" style={{ transitionDelay:"150ms" }}>{t("hero.title1")}</span>
              <span className="hw text-primary" style={{ transitionDelay:"280ms" }}>&nbsp;{t("hero.title2")}</span>
            </h1>

            <p
              className="mb-8 text-muted-foreground"
              style={{ fontSize:"1rem", opacity:heroVisible?1:0, transform:heroVisible?"none":"translateY(12px)", transition:"all .7s var(--ease-expo) .4s" }}
            >
              {t("hero.desc")}
            </p>

            <form
              onSubmit={handleSmartSearch}
              style={{ opacity:heroVisible?1:0, transform:heroVisible?"none":"translateY(16px)", transition:"all .8s var(--ease-expo) .55s" }}
            >
              <div className={`magic-bar${searchFocused?" focused":""}`}>
                <div style={{ padding:"0 8px 0 20px", color:"hsl(var(--primary))", flexShrink:0 }}>
                  <Sparkles className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  placeholder={t("search.placeholder")}
                  className="magic-input"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                />
                <button id="magic-btn" type="submit" className="magic-submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 spin" /> : <Search className="h-4 w-4" />}
                  <span className="hidden sm:inline">{t("search.button")}</span>
                </button>
              </div>
            </form>

            <div
              className="mt-4 flex flex-wrap justify-center gap-2"
              style={{ opacity:heroVisible?1:0, transition:"opacity .8s ease .75s" }}
            >
              <span style={{ fontSize:".75rem", color:"hsl(var(--muted-foreground))", alignSelf:"center" }}>{t("search.try")}</span>
              {suggestions.map((s, i) => (
                <button key={i} type="button" onClick={() => handleSuggestionClick(s)} className="sug-pill">
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* ── Results header ── */}
          <div
            ref={resultsRef}
            className={`mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5 rv${resultsInView?" on":""}`}
          >
            <div>
              <h2 className="font-bold text-foreground" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.5rem" }}>
                <span>{hasSearched ? t("results.searched") : t("results.all")}</span>
              </h2>
              <p className="text-muted-foreground mt-0.5" style={{ fontSize:".85rem" }}>
                <span className="font-semibold text-primary">{filteredResult.length}</span>{" "}
                <span>{filteredResult.length !== 1 ? t("results.foundPlural") : t("results.foundSingular")}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-all hover:border-primary/40 hover:bg-primary/5"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span>{t("filters.toggle")}</span>
                {activeFilters > 0 && <span className="filter-badge">{activeFilters}</span>}
              </button>

              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
                <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="sort-select">
                  <option value="recent">{t("sort.recent")}</option>
                  <option value="price-asc">{t("sort.priceAsc")}</option>
                  <option value="price-desc">{t("sort.priceDesc")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Filter panel ── */}
          {showFilters && (
            <div className="filter-panel mb-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-semibold text-foreground" style={{ fontSize:".95rem" }}>{t("filters.refine")}</h3>
                {(activeFilters > 0 || globalSearch) && (
                  <button onClick={clearFilters} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                    <X className="h-3.5 w-3.5" /> <span>{t("filters.clear")}</span>
                  </button>
                )}
              </div>
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {[
                  { 
                    label: t("filters.city"), 
                    el: <CityFilterAutocomplete value={city} onChange={setCity} placeholder={t("filters.allFeminine")} className="filter-input w-full" />
                  },
                   { label: t("filters.type"), el: <select value={type} onChange={(e) => setType(e.target.value as PropertyType|"")} className="filter-input"><option value="">{t("filters.allMasculine")}</option>{propertyTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select> },
                  { label: t("filters.transaction"), el: <select value={transaction} onChange={(e) => setTransaction(e.target.value as TransactionType|"")} className="filter-input"><option value="">{t("filters.allFeminine")}</option>{transactionTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select> },
                  { label: t("filters.rooms"), el: <select value={rooms} onChange={(e) => setRooms(e.target.value)} className="filter-input"><option value="">{t("filters.allFeminine")}</option>{[1,2,3,4,5,6].map((n) => <option key={n} value={n}>{n}+</option>)}</select> },
                  { label: t("filters.minPrice"), el: <input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" className="filter-input" /> },
                  { label: t("filters.maxPrice"), el: <input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder={t("filters.unlimited")} className="filter-input" /> },
                  { label: t("filters.minSurface"), el: <input type="number" value={minSurface} onChange={(e) => setMinSurface(e.target.value)} placeholder="0" className="filter-input" /> },
                 ].map(({ label, el }) => (
                  <div key={label} className="relative">
                    <span className="filter-label">{label}</span>
                    {el}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Content ── */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-28 text-muted-foreground gap-4">
              <div style={{ width:48,height:48,borderRadius:"50%",border:"3px solid hsl(var(--border))",borderTopColor:"hsl(var(--primary))",animation:"spin360 .8s linear infinite" }} />
              <p style={{ fontSize:".9rem" }}>{t("states.loading")}</p>
            </div>
          ) : currentItems.length > 0 ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {currentItems.map((property, i) => (
                  <div
                    key={property.id}
                    className="card-item"
                    style={{ animationDelay:`${i * 70}ms` }}
                  >
                    <PropertyCard property={property} initialIsFavorite={favorites.includes(property.id)} />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-14 flex items-center justify-center gap-2">
                  <button
                    className="page-btn"
                    onClick={() => { setCurrentPage(p => Math.max(p-1,1)); window.scrollTo({top:0,behavior:'smooth'}) }}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => {
                      if (currentPage === totalPages) return p === totalPages || p === totalPages - 1;
                      return p === currentPage || p === currentPage + 1;
                    })
                    .map((p) => (
                      <button 
                        key={p} 
                        className={`page-btn${currentPage===p?" active":""}`} 
                        onClick={() => { setCurrentPage(p as number); window.scrollTo({top:0,behavior:'smooth'}) }}
                      >
                        {p}
                      </button>
                    ))
                  }

                  <button
                    className="page-btn"
                    onClick={() => { setCurrentPage(p => Math.min(p+1,totalPages)); window.scrollTo({top:0,behavior:'smooth'}) }}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state py-24 text-center bg-secondary/20">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <Building2 className="h-7 w-7 text-muted-foreground" style={{ opacity:.5 }} />
              </div>
              <h3 className="mb-2 font-bold text-foreground" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.5rem" }}>
                {t("states.emptyTitle")}
              </h3>
              <p className="mb-8 text-muted-foreground" style={{ fontSize:".9rem" }}>
                {t("states.emptyDesc")}
              </p>
              <Button onClick={clearFilters} className="gap-2 rounded-full px-6">
                <span>{t("states.emptyButton")}</span>
              </Button>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </>
  )
}