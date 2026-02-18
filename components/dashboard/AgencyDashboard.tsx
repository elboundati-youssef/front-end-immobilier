"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Building2, Eye, MousePointerClick, Phone, Plus, Edit, Trash2, BarChart3, MessageSquare, Loader2, MapPin, Heart, ChevronLeft, ChevronRight, User, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/data"
import api from "@/services/api"

type AgenceTab = "annonces" | "messages" | "statistiques" | "favoris"

const API_URL = "http://127.0.0.1:8000";
const ITEMS_PER_PAGE = 5;

// --- COMPOSANT PAGINATION RÉUTILISABLE ---
function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <Button variant="outline" size="icon" onClick={() => onPageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            className="h-9 w-9 p-0"
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        ))}
      </div>
      <Button variant="outline" size="icon" onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function AgencyDashboard() {
  const [agenceTab, setAgenceTab] = useState<AgenceTab>("annonces")
  
  // --- ÉTATS DONNÉES ---
  const [myProperties, setMyProperties] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])
  
  // --- ÉTATS CHARGEMENT ---
  const [loadingProps, setLoadingProps] = useState(false)
  const [loadingFavs, setLoadingFavs] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(false)

  // --- ÉTATS PAGINATION INDÉPENDANTS ---
  const [currentPropPage, setCurrentPropPage] = useState(1)
  const [currentFavPage, setCurrentFavPage] = useState(1)
  const [currentMsgPage, setCurrentMsgPage] = useState(1)

  // --- 1. CHARGEMENT INITIAL ---
  useEffect(() => {
    fetchMyProperties()
    fetchFavorites()
    fetchMessages()
  }, [])

  const fetchMyProperties = async () => {
    setLoadingProps(true)
    try {
      const res = await api.get('/my-properties')
      setMyProperties(res.data)
    } catch (err) { console.error("Erreur annonces", err) } finally { setLoadingProps(false) }
  }

  const fetchFavorites = async () => {
    setLoadingFavs(true)
    try {
      const res = await api.get('/my-favorites')
      setFavorites(res.data)
    } catch (err) { console.error("Erreur favoris", err) } finally { setLoadingFavs(false) }
  }

  const fetchMessages = async () => {
    setLoadingMsg(true)
    try {
      const res = await api.get('/my-received-messages')
      setMessages(res.data)
    } catch (err) { console.error("Erreur messages", err) } finally { setLoadingMsg(false) }
  }

  // --- ACTIONS ---
  const removeFavorite = async (id: number) => {
    try {
      await api.post(`/properties/${id}/favorite`)
      setFavorites(prev => prev.filter(p => p.id !== id))
    } catch (err) { console.error("Erreur retrait favori", err) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette annonce ?")) return
    try {
      await api.delete(`/properties/${id}`)
      setMyProperties(prev => prev.filter(p => p.id !== id))
    } catch (err) { alert("Impossible de supprimer.") }
  }

  // --- LOGIQUE PAGINATION ---
  const paginatedProps = myProperties.slice((currentPropPage - 1) * ITEMS_PER_PAGE, currentPropPage * ITEMS_PER_PAGE)
  const totalPropPages = Math.ceil(myProperties.length / ITEMS_PER_PAGE)

  const paginatedFavs = favorites.slice((currentFavPage - 1) * ITEMS_PER_PAGE, currentFavPage * ITEMS_PER_PAGE)
  const totalFavPages = Math.ceil(favorites.length / ITEMS_PER_PAGE)

  const paginatedMsgs = messages.slice((currentMsgPage - 1) * ITEMS_PER_PAGE, currentMsgPage * ITEMS_PER_PAGE)
  const totalMsgPages = Math.ceil(messages.length / ITEMS_PER_PAGE)

  const getImageUrl = (imagesData: any) => {
    if (!imagesData) return "/placeholder.jpg";
    let images = typeof imagesData === 'string' ? JSON.parse(imagesData) : imagesData;
    let imagePath = (Array.isArray(images) && images.length > 0) ? images[0] : "/placeholder.jpg";
    if (imagePath.startsWith("http") || imagePath.startsWith("/images")) return imagePath;
    return `${API_URL}${imagePath}`;
  }

  return (
    <>
      {/* --- STATISTIQUES --- */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Annonces", value: myProperties.length.toString(), icon: Building2, color: "text-primary" },
          { label: "Messages", value: messages.length.toString(), icon: MessageSquare, color: "text-primary" },
          { label: "Favoris", value: favorites.length.toString(), icon: Heart, color: "text-primary" },
          { label: "Vues", value: "0", icon: Eye, color: "text-primary" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <stat.icon className={`h-5 w-5 mb-2 ${stat.color}`} />
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* --- NAVIGATION --- */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
        {[
          { key: "annonces", label: "Mes annonces", icon: Building2 },
          { key: "favoris", label: "Favoris", icon: Heart },
          { key: "messages", label: "Messages", icon: MessageSquare },
          { key: "statistiques", label: "Statistiques", icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setAgenceTab(tab.key as AgenceTab)}
            className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              agenceTab === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* --- ONGLET 1 : ANNONCES --- */}
      {agenceTab === "annonces" && (
        <>
          <div className="mb-4 flex justify-end">
            <Link href="/publier"><Button className="gap-2"><Plus className="h-4 w-4" /> Nouvelle annonce</Button></Link>
          </div>
          {loadingProps ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
          ) : paginatedProps.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-xl">Aucune annonce.</div>
          ) : (
            <div className="flex flex-col gap-4">
              {paginatedProps.map((p) => (
                <div key={p.id} className="relative group">
                  <Link href={`/biens/${p.id}`} className="absolute inset-0 z-10" />
                  <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 md:flex-row md:items-center relative transition-all hover:shadow-md">
                    <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg">
                      <Image src={getImageUrl(p.images)} alt={p.title} fill className="object-cover" unoptimized />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{p.title}</h3>
                        <Badge variant={p.status === "publié" ? "default" : "secondary"}>{p.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.city}</div>
                      <p className="font-bold text-primary">{formatPrice(p.price, p.transaction_type)}</p>
                    </div>
                    <div className="flex gap-2 z-20 relative">
                      <Button variant="outline" size="icon" onClick={(e) => { e.preventDefault(); window.location.href = `/modifier/${p.id}`; }}><Edit className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className="text-destructive" onClick={(e) => { e.preventDefault(); handleDelete(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
              <Pagination currentPage={currentPropPage} totalPages={totalPropPages} onPageChange={setCurrentPropPage} />
            </div>
          )}
        </>
      )}

      {/* --- ONGLET 2 : FAVORIS --- */}
      {agenceTab === "favoris" && (
        <>
          {loadingFavs ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl">Aucun favori.</div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedFavs.map((p) => (
                  <div key={p.id} className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md">
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image src={getImageUrl(p.images)} alt={p.title} fill className="object-cover" unoptimized />
                      <button
                        onClick={(e) => { e.preventDefault(); removeFavorite(p.id); }}
                        className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-red-500 z-20 shadow-sm"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </button>
                      <Link href={`/biens/${p.id}`} className="absolute inset-0 z-10" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold truncate">{p.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.city}</p>
                      <p className="font-bold text-primary">{formatPrice(p.price, p.transaction_type)}</p>
                    </div>
                  </div>
                ))}
              </div>
              {/* ✅ PAGINATION FAVORIS - identique aux annonces */}
              <Pagination currentPage={currentFavPage} totalPages={totalFavPages} onPageChange={setCurrentFavPage} />
            </div>
          )}
        </>
      )}

      {/* --- ONGLET 3 : MESSAGES --- */}
      {agenceTab === "messages" && (
        <div className="flex flex-col gap-3">
          {loadingMsg ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
          ) : paginatedMsgs.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl">Aucun message reçu.</div>
          ) : (
            <>
              {paginatedMsgs.map((msg) => (
                <div key={msg.id} className="p-4 border rounded-xl bg-card hover:shadow-sm transition-all">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* En-tête : nom + date */}
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-bold text-foreground">{msg.name}</h4>
                          {/* ✅ EMAIL */}
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {msg.email}
                          </p>
                          {/* ✅ TÉLÉPHONE - affiché seulement s'il existe */}
                          {msg.phone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Phone className="h-3 w-3" /> {msg.phone}
                            </p>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded shrink-0 ml-2">
                          {new Date(msg.created_at).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>

                      {/* ✅ CORPS DU MESSAGE */}
                      <div className="p-3 bg-secondary/30 rounded-lg text-sm text-foreground mb-2 whitespace-pre-wrap">
                        {msg.message}
                      </div>

                      {/* Annonce concernée */}
                      <div className="text-[11px] text-primary font-medium flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        Concernant : {msg.property?.title || "Annonce supprimée"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {/* ✅ PAGINATION MESSAGES */}
              <Pagination currentPage={currentMsgPage} totalPages={totalMsgPages} onPageChange={setCurrentMsgPage} />
            </>
          )}
        </div>
      )}

      {/* --- ONGLET 4 : STATISTIQUES --- */}
      {agenceTab === "statistiques" && (
        <div className="py-12 text-center text-muted-foreground border border-dashed rounded-xl">
          Les statistiques détaillées seront disponibles prochainement.
        </div>
      )}
    </>
  )
}