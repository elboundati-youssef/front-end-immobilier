"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { SlidersHorizontal, X, ArrowUpDown, Loader2, ChevronLeft, ChevronRight, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PropertyCard } from "@/components/property-card"
// On supprime SearchBar importé car on va créer notre propre input simple ici pour la recherche globale
import {
  properties as staticProperties,
  cities,
  propertyTypes,
  transactionTypes,
  type PropertyType,
  type TransactionType,
} from "@/lib/data"
import api from "@/services/api"

type SortOption = "recent" | "price-asc" | "price-desc"

const API_URL = "http://127.0.0.1:8000";
const ITEMS_PER_PAGE = 6; 

export default function BiensPage() {
  const searchParams = useSearchParams()

  // --- ÉTATS ---
  const [allProperties, setAllProperties] = useState<any[]>(staticProperties)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [favorites, setFavorites] = useState<string[]>([])

  // --- NOUVEAU : RECHERCHE GLOBALE ---
  const [globalSearch, setGlobalSearch] = useState("")

  // États des filtres avancés
  const [city, setCity] = useState(searchParams.get("city") || "")
  const [type, setType] = useState<PropertyType | "">((searchParams.get("type") as PropertyType) || "")
  const [transaction, setTransaction] = useState<TransactionType | "">((searchParams.get("transaction") as TransactionType) || "")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [minSurface, setMinSurface] = useState("")
  const [rooms, setRooms] = useState("")
  const [sort, setSort] = useState<SortOption>("recent")
  const [showFilters, setShowFilters] = useState(false)

  // --- SYNCHRONISATION URL ---
  useEffect(() => {
    setCity(searchParams.get("city") || "")
    setType((searchParams.get("type") as PropertyType) || "")
    setTransaction((searchParams.get("transaction") as TransactionType) || "")
    // Si une recherche globale est passée dans l'URL (optionnel)
    if (searchParams.get("q")) setGlobalSearch(searchParams.get("q") || "")
  }, [searchParams])

  // --- CHARGEMENT FAVORIS ---
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const res = await api.get('/my-favorites')
        const favIds = res.data.map((fav: any) => fav.id.toString())
        setFavorites(favIds)
      } catch (err) { console.log("Non connecté") }
    }
    fetchFavorites()
  }, [])

  // --- CHARGEMENT DONNÉES ---
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const res = await api.get('/properties') 
        const dynamicProperties = res.data.map((p: any) => {
            let images: string[] = [];
            if (Array.isArray(p.images)) images = p.images;
            else if (typeof p.images === 'string') { try { images = JSON.parse(p.images); } catch(e){ images = [] } }
            const formattedImages = images.map(img => img.startsWith('http') ? img : `${API_URL}${img}`);
            let features: string[] = [];
            if (Array.isArray(p.equipments)) features = p.equipments;
            else if (typeof p.equipments === 'string') { try { features = JSON.parse(p.equipments); } catch(e){} }

            return {
                ...p,
                id: p.id.toString(),
                images: formattedImages.length > 0 ? formattedImages : ["/placeholder.jpg"],
                features: features,
                type: p.property_type,
                transaction: p.transaction_type,
                createdAt: p.created_at, 
            };
        });
        setAllProperties([...staticProperties, ...dynamicProperties]);
      } catch (error) { console.error("Erreur API", error); } finally { setLoading(false); }
    };
    fetchProperties();
  }, []);

  // --- FILTRAGE INTELLIGENT ---
  const filteredResult = useMemo(() => {
    let result = [...allProperties]

    // 1. RECHERCHE GLOBALE (Titre, Ville, Type, Transaction)
    if (globalSearch) {
        const term = globalSearch.toLowerCase();
        result = result.filter(p => 
            (p.title && p.title.toLowerCase().includes(term)) ||
            (p.city && p.city.toLowerCase().includes(term)) ||
            (p.type && p.type.toLowerCase().includes(term)) ||
            (p.transaction && p.transaction.toLowerCase().includes(term))
        );
    }

    // 2. FILTRES AVANCÉS (S'appliquent EN PLUS de la recherche globale)
    if (city) result = result.filter((p) => p.city && p.city.toLowerCase().includes(city.toLowerCase()))
    if (type) result = result.filter((p) => p.type === type)
    if (transaction) result = result.filter((p) => p.transaction === transaction)
    if (minPrice) result = result.filter((p) => p.price >= Number(minPrice))
    if (maxPrice) result = result.filter((p) => p.price <= Number(maxPrice))
    if (minSurface) result = result.filter((p) => p.surface >= Number(minSurface))
    if (rooms) result = result.filter((p) => p.rooms >= Number(rooms))

    // 3. TRI
    switch (sort) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break
      case "price-desc": result.sort((a, b) => b.price - a.price); break
      case "recent":
      default: result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return result
  }, [allProperties, globalSearch, city, type, transaction, minPrice, maxPrice, minSurface, rooms, sort])

  // --- PAGINATION ---
  const totalPages = Math.ceil(filteredResult.length / ITEMS_PER_PAGE)
  const currentItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredResult.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredResult, currentPage])

  useEffect(() => { setCurrentPage(1) }, [globalSearch, city, type, transaction, minPrice, maxPrice, minSurface, rooms, sort])

  const activeFilters = [city, type, transaction, minPrice, maxPrice, minSurface, rooms].filter(Boolean).length

  const clearFilters = () => {
    setGlobalSearch(""); // On vide aussi la recherche globale
    setCity(""); setType(""); setTransaction(""); setMinPrice(""); setMaxPrice(""); setMinSurface(""); setRooms("");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 font-serif text-3xl font-bold text-foreground md:text-4xl">Tous les biens</h1>
          <p className="text-muted-foreground">{filteredResult.length} bien{filteredResult.length !== 1 ? "s" : ""} trouvés</p>
        </div>

        {/* --- BARRE DE RECHERCHE UNIQUE --- */}
        <div className="mb-6 relative">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Rechercher par titre, ville, type (ex: 'Villa Tanger' ou 'Location')"
                    className="h-12 w-full rounded-xl border border-border bg-card pl-10 pr-4 text-sm shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                />
            </div>
        </div>

        {/* Filtres & Tri */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="outline" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4" />
            Filtres avancés {activeFilters > 0 && <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{activeFilters}</span>}
          </Button>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select value={sort} onChange={(e) => setSort(e.target.value as SortOption)} className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="recent">Plus récent</option>
              <option value="price-asc">Moins cher</option>
              <option value="price-desc">Plus cher</option>
            </select>
          </div>
        </div>

        {/* Panneau Filtres Avancés */}
        {showFilters && (
          <div className="mb-6 rounded-xl border border-border bg-card p-4 shadow-sm md:p-6 animate-in fade-in slide-in-from-top-2">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Critères spécifiques</h3>
              {(activeFilters > 0 || globalSearch) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                  <X className="h-3.5 w-3.5" /> Tout effacer
                </Button>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {/* Les mêmes sélecteurs qu'avant */}
              <div><label className="mb-1.5 block text-sm font-medium">Ville</label><select value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"><option value="">Toutes</option>{cities.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="mb-1.5 block text-sm font-medium">Type</label><select value={type} onChange={(e) => setType(e.target.value as PropertyType | "")} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"><option value="">Tous</option>{propertyTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              <div><label className="mb-1.5 block text-sm font-medium">Transaction</label><select value={transaction} onChange={(e) => setTransaction(e.target.value as TransactionType | "")} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"><option value="">Toutes</option>{transactionTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
              <div><label className="mb-1.5 block text-sm font-medium">Pièces</label><select value={rooms} onChange={(e) => setRooms(e.target.value)} className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm"><option value="">Toutes</option>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}+</option>)}</select></div>
              <div><label className="mb-1.5 block text-sm font-medium">Prix min</label><input type="number" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="0" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1.5 block text-sm font-medium">Prix max</label><input type="number" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" /></div>
              <div><label className="mb-1.5 block text-sm font-medium">Surface min</label><input type="number" value={minSurface} onChange={(e) => setMinSurface(e.target.value)} placeholder="m²" className="w-full rounded-lg border bg-background px-3 py-2.5 text-sm" /></div>
            </div>
          </div>
        )}

        {/* Résultats & Pagination */}
        {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
        ) : currentItems.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {currentItems.map((property) => (
                <PropertyCard key={property.id} property={property} initialIsFavorite={favorites.includes(property.id)} />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button variant="outline" size="icon" onClick={() => { setCurrentPage(prev => Math.max(prev - 1, 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                <div className="flex items-center gap-1">{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (<Button key={page} variant={currentPage === page ? "default" : "outline"} className="h-10 w-10 p-0" onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>{page}</Button>))}</div>
                <Button variant="outline" size="icon" onClick={() => { setCurrentPage(prev => Math.min(prev + 1, totalPages)); window.scrollTo({ top: 0, behavior: 'smooth' }); }} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}
          </>
        ) : (
          <div className="py-20 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary"><SlidersHorizontal className="h-8 w-8 text-muted-foreground" /></div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">Aucun bien trouvé</h3>
            <p className="mb-6 text-muted-foreground">Essayez de modifier vos critères de recherche.</p>
            <Button variant="outline" onClick={clearFilters}>Effacer les filtres</Button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}