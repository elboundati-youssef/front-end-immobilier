"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Bell, MessageSquare, Loader2, MapPin, ChevronLeft, ChevronRight, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/data"
import api from "@/services/api"

type ClientTab = "favoris" | "alertes" | "messages"

// URL du backend
const API_URL = "http://127.0.0.1:8000";
const ITEMS_PER_PAGE = 6; 

export function ClientDashboard() {
  const [clientTab, setClientTab] = useState<ClientTab>("favoris")
  
  // États pour les Favoris
  const [favorites, setFavorites] = useState<any[]>([])
  const [loadingFav, setLoadingFav] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // États pour les Messages
  const [messages, setMessages] = useState<any[]>([])
  const [loadingMsg, setLoadingMsg] = useState(false)

  // --- CHARGEMENT DES DONNÉES SELON L'ONGLET ---
  useEffect(() => {
    if (clientTab === "favoris") {
        fetchFavorites()
    } else if (clientTab === "messages") {
        fetchSentMessages()
    }
  }, [clientTab])

  // --- LOGIQUE FAVORIS ---
  const fetchFavorites = async () => {
    setLoadingFav(true)
    try {
        const res = await api.get('/my-favorites')
        setFavorites(res.data)
        setCurrentPage(1)
    } catch (err) {
        console.error("Erreur favoris", err)
    } finally {
        setLoadingFav(false)
    }
  }

  const removeFavorite = async (id: number) => {
    try {
        await api.post(`/properties/${id}/favorite`)
        setFavorites(prev => {
            const newFavorites = prev.filter(p => p.id !== id);
            const newTotalPages = Math.ceil(newFavorites.length / ITEMS_PER_PAGE);
            if (currentPage > 1 && currentPage > newTotalPages) {
                setCurrentPage(prevPage => Math.max(prevPage - 1, 1));
            }
            return newFavorites;
        })
    } catch (err) {
        console.error("Erreur suppression favori", err)
    }
  }

  // --- LOGIQUE MESSAGES (ENVOYÉS PAR LE CLIENT) ---
  const fetchSentMessages = async () => {
    setLoadingMsg(true)
    try {
      const res = await api.get('/my-sent-messages')
      console.log("Messages récupérés :", res.data) // Pour vérifier dans la console F12
      setMessages(res.data)
    } catch (err) {
      console.error("Erreur récupération messages", err)
    } finally {
      setLoadingMsg(false)
    }
  }

  // --- LOGIQUE DE PAGINATION (Favoris) ---
  const totalPages = Math.ceil(favorites.length / ITEMS_PER_PAGE)
  const currentFavorites = favorites.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // --- FONCTION IMAGE ---
  const getImageUrl = (imagesData: any) => {
    if (!imagesData) return "/placeholder.jpg";
    let imagePath = "";
    let images = imagesData;
    if (typeof imagesData === 'string') {
        try { images = JSON.parse(imagesData); } catch (e) { return "/placeholder.jpg"; }
    }
    if (Array.isArray(images) && images.length > 0) {
        imagePath = images[0];
    } else {
        return "/placeholder.jpg";
    }
    if (imagePath.startsWith("http") || imagePath.startsWith("/images")) return imagePath;
    return `${API_URL}${imagePath}`;
  }

  return (
    <>
      {/* Navigation des onglets */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
        {[
          { key: "favoris", label: "Favoris", icon: Heart },
          { key: "alertes", label: "Alertes", icon: Bell },
          { key: "messages", label: "Messages", icon: MessageSquare },
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setClientTab(tab.key as ClientTab)}
              className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
                clientTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* --- ONGLET FAVORIS --- */}
      {clientTab === "favoris" && (
        <>
            {loadingFav ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : favorites.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground">Vous n&apos;avez pas encore de favoris.</div>
            ) : (
                <div className="flex flex-col gap-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {currentFavorites.map((p) => {
                            const imgUrl = getImageUrl(p.images);
                            return (
                                <div key={p.id} className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-md">
                                    <div className="relative h-48 w-full overflow-hidden">
                                        <Image src={imgUrl} alt={p.title} fill className="object-cover transition-transform group-hover:scale-105" unoptimized />
                                        <button 
                                            onClick={(e) => { e.preventDefault(); removeFavorite(p.id); }}
                                            className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-red-500 transition-colors hover:bg-white/90 z-20 shadow-sm"
                                        >
                                            <Heart className="h-4 w-4 fill-current" />
                                        </button>
                                        <Link href={`/biens/${p.id}`} className="absolute inset-0 z-10" />
                                    </div>
                                    <div className="p-4">
                                        <Link href={`/biens/${p.id}`} className="block font-semibold text-foreground hover:text-primary mb-1 truncate">{p.title}</Link>
                                        <p className="text-sm text-muted-foreground mb-2 truncate flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.city}</p>
                                        <p className="font-bold text-primary">{formatPrice(p.price, p.transaction_type)}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <Button key={page} variant={currentPage === page ? "default" : "outline"} className="h-9 w-9 p-0" onClick={() => setCurrentPage(page)}>{page}</Button>
                                ))}
                            </div>
                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    )}
                </div>
            )}
        </>
      )}

      {/* --- ONGLET ALERTES --- */}
      {clientTab === "alertes" && (
        <div className="flex flex-col gap-3">
          {[
            { text: "Nouveau bien correspondant à votre recherche : Villa à Marrakech", time: "Il y a 2h" },
            { text: "Baisse de prix sur un bien en favori : Appartement à Casablanca", time: "Il y a 5h" },
          ].map((alert, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10"><Bell className="h-4 w-4 text-primary" /></div>
              <div className="flex-1"><p className="text-sm text-foreground">{alert.text}</p><p className="text-xs text-muted-foreground">{alert.time}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* --- ONGLET MESSAGES (VRAIS MESSAGES RÉCUPÉRÉS) --- */}
      {clientTab === "messages" && (
        <div className="flex flex-col gap-3">
          {loadingMsg ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground">Vous n&apos;avez envoyé aucun message pour le moment.</div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-foreground">
                      À propos de : {msg.property?.title || "Bien immobilier"}
                    </p>
                    <span className="text-[10px] uppercase text-muted-foreground font-medium bg-secondary px-2 py-0.5 rounded">
                        Envoyé
                    </span>
                  </div>
                  <div className="p-3 bg-secondary/30 rounded-lg text-sm italic text-foreground mb-2">
                    &quot;{msg.message}&quot;
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> Destinataire : Propriétaire
                    </span>
                    <span>
                      {msg.created_at ? new Date(msg.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </>
  )
}