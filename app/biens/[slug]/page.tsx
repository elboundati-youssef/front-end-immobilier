"use client"

import { use, useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import dynamic from 'next/dynamic'
import {
  ArrowLeft, Heart, Share2, MapPin, Maximize2,
  BedDouble, Bath, Home, Phone, Mail, MessageCircle,
  ChevronLeft, ChevronRight, Check, Eye, Calendar,
  Loader2, AlertTriangle, Send, MessageSquare, Trash2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PropertyCard } from "@/components/property-card"
import { formatPrice } from "@/lib/data"
import api from "@/services/api"

// 🌟 IMPORT DYNAMIQUE DE LA CARTE (SANS SSR) 🌟
const MapViewer = dynamic(() => import('@/components/MapViewer'), { 
    ssr: false, 
    loading: () => <div className="h-full w-full flex items-center justify-center bg-secondary/50"><Loader2 className="animate-spin text-primary" /></div>
})

const API_URL = "http://127.0.0.1:8000";

export default function PropertyDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const router = useRouter()
  
  // États des données
  const [property, setProperty] = useState<any>(null)
  const [similarProperties, setSimilarProperties] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [currentImage, setCurrentImage] = useState(0)
  const [mounted, setMounted] = useState(false) 
  
  // États pour les favoris
  const [isFav, setIsFav] = useState(false)
  const [loadingFav, setLoadingFav] = useState(false)
  const [userFavorites, setUserFavorites] = useState<string[]>([]) 

  // États pour le CHAT
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loadingChat, setLoadingChat] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)

  // États formulaire signalement
  const [showReport, setShowReport] = useState(false)
  const [reportSent, setReportSent] = useState(false)
  const [sendingReport, setSendingReport] = useState(false)
  const [reportReason, setReportReason] = useState("")

  const getImageUrl = (path: string) => {
    if (!path) return "https://placehold.co/600x400?text=Pas+d+image"; 
    if (path.startsWith("/images") || path.startsWith("http")) return path;
    return `${API_URL}${path}`;
  }

  useEffect(() => {
    setMounted(true); 
    const fetchData = async () => {
      try {
        const res = await api.get(`/properties/${slug}`)
        const loadedProperty = res.data
        setProperty(loadedProperty)

        const allRes = await api.get('/properties')
        const allProps = allRes.data

        const similar = allProps
            .filter((p: any) => 
                // 🌟 CORRECTION ICI : On utilise loadedProperty.id au lieu de l'ancien id
                p.id.toString() !== loadedProperty.id.toString() && 
                (p.city === loadedProperty.city || p.property_type === loadedProperty.property_type)
            )
            .slice(0, 3)
            .map((p: any) => {
                let imgs: string[] = [];
                if (Array.isArray(p.images)) imgs = p.images;
                else if (typeof p.images === 'string') { try { imgs = JSON.parse(p.images); } catch(e){ imgs = [] } }
                const formattedImages = imgs.map(img => img.startsWith('http') ? img : `${API_URL}${img}`);
                return {
                    ...p,
                    id: p.id.toString(),
                    images: formattedImages.length > 0 ? formattedImages : ["/placeholder.jpg"],
                    type: p.property_type, 
                    transaction: p.transaction_type
                };
            });
        
        setSimilarProperties(similar)

        const token = localStorage.getItem('token');
        if (token) {
            try {
                const favRes = await api.get('/my-favorites');
                const favIds = favRes.data.map((p: any) => p.id.toString());
                setUserFavorites(favIds);
                if (loadedProperty) setIsFav(favIds.includes(loadedProperty.id.toString()));
            } catch (err) { console.log("Erreur favoris (non connecté ?)", err); }
        }
      } catch (err) {
        console.error("Erreur chargement global", err)
      } finally {
        setLoading(false)
      }
    }
    // 🌟 CORRECTION ICI : On vérifie le slug
    if (slug) fetchData()
  }, [slug])

  const handleFavoriteClick = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        if (confirm("Vous devez être connecté pour ajouter des favoris. Voulez-vous vous connecter ?")) {
            router.push('/connexion');
        }
        return;
    }

    setLoadingFav(true);
    const previousState = isFav;
    setIsFav(!isFav); 

    try {
        // 🌟 CORRECTION ICI : On utilise property.id
        await api.post(`/properties/${property.id}/favorite`);
        if (!isFav) setUserFavorites(prev => [...prev, property.id.toString()]);
        else setUserFavorites(prev => prev.filter(fid => fid !== property.id.toString()));
    } catch (err) {
        setIsFav(previousState);
    } finally {
        setLoadingFav(false);
    }
  }

  // --- CHAT ---
  const handleOpenChat = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
        router.push('/connexion');
        return;
    }
    
    setShowChat(!showChat);
    
    if (!showChat) {
        setLoadingChat(true);
        try {
            const res = await api.get('/my-sent-messages');
            // 🌟 CORRECTION ICI : property.id
            const propMessages = res.data.filter((m: any) => m.property_id.toString() === property.id.toString());
            setChatMessages(propMessages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
        } catch (err) {
            console.error("Erreur chargement chat", err);
        } finally {
            setLoadingChat(false);
        }
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMessage.trim()) return;
      
      setSendingMessage(true);
      try {
          const userStr = localStorage.getItem('user');
          const user = userStr ? JSON.parse(userStr) : { name: "Client", email: "client@email.com" };

          const payload = {
              name: user.name,
              email: user.email,
              message: newMessage,
          };

          // 🌟 CORRECTION ICI : property.id
          const response = await api.post(`/properties/${property.id}/message`, payload);

          setChatMessages(prev => [...prev, {
              id: response.data?.id || Date.now(),
              property_id: property.id,
              message: newMessage,
              created_at: new Date().toISOString(),
              name: payload.name,
              email: payload.email,
              is_from_client: true,
          }]);
          
          setNewMessage(""); 
      } catch (err) {
          alert("Erreur lors de l'envoi.");
      } finally {
          setSendingMessage(false);
      }
  }

  const handleDeleteMessage = async (messageId: number) => {
      if (!confirm("Voulez-vous vraiment supprimer ce message ?")) return;
      try {
          await api.delete(`/messages/${messageId}`);
          setChatMessages(prev => prev.filter(m => m.id !== messageId));
      } catch (err) {
          console.error("Erreur lors de la suppression du message", err);
          alert("Impossible de supprimer le message.");
      }
  }

  // --- SIGNALEMENT ---
  const toggleReport = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        if (confirm("Vous devez être connecté pour signaler une annonce. Voulez-vous vous connecter ?")) router.push('/connexion');
        return;
    }
    setShowReport(!showReport);
  }

  const handleReportSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSendingReport(true);
      try {
          // 🌟 CORRECTION ICI : property.id
          await api.post(`/properties/${property.id}/report`, { reason: reportReason });
          setReportSent(true);
          setReportReason("");
          setTimeout(() => {
              setShowReport(false);
              setReportSent(false);
          }, 3000);
      } catch (err: any) {
          alert(err.response?.data?.message || "Erreur lors de l'envoi du signalement.");
      } finally {
          setSendingReport(false);
      }
  }

  const mapCenter = useMemo(() => {
    if (property && property.latitude && property.longitude) {
      return [parseFloat(property.latitude), parseFloat(property.longitude)] as [number, number];
    }
    return null;
  }, [property]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
  if (!property) return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-8">
          <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">Bien introuvable</h1>
          <Button onClick={() => router.push("/biens")} className="gap-2"><ArrowLeft className="h-4 w-4" /> Retour aux annonces</Button>
        </div>
        <Footer />
      </div>
  )

  let images: string[] = [];
  if (Array.isArray(property.images)) images = property.images;
  else if (typeof property.images === 'string') { try { images = JSON.parse(property.images); } catch (e) { images = []; } }
  if (images.length === 0) images = ["https://placehold.co/600x400?text=No+Image"];

  let features: string[] = [];
  if (property.features && Array.isArray(property.features)) features = property.features; 
  else if (property.equipments) {
      if (Array.isArray(property.equipments)) features = property.equipments;
      else try { features = JSON.parse(property.equipments); } catch (e) {}
  }

  const dateString = property.createdAt || property.created_at;
  const formattedDate = dateString ? new Date(dateString).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Récemment";

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length)
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Accueil</Link> <span>/</span>
          <Link href="/biens" className="hover:text-primary">Biens</Link> <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{property.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          
          {/* Main Content (Colonne de gauche) */}
          <div className="lg:col-span-2">
            
            <div className="relative mb-6 overflow-hidden rounded-2xl bg-secondary/20 aspect-[16/10]">
              <Image src={getImageUrl(images[currentImage])} alt={property.title} fill className="object-cover" priority unoptimized />
              {images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
              <div className="absolute bottom-3 left-3 flex gap-2">
                <Badge className="bg-primary text-primary-foreground capitalize">{property.transaction || property.transaction_type}</Badge>
                <Badge variant="secondary" className="bg-card/90 text-card-foreground backdrop-blur-sm capitalize">{property.type || property.property_type}</Badge>
              </div>
              <div className="absolute bottom-3 right-3 rounded-full bg-card/80 px-3 py-1 text-xs text-foreground backdrop-blur-sm">
                {currentImage + 1} / {images.length}
              </div>
            </div>

            {images.length > 1 && (
              <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setCurrentImage(idx)} className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${idx === currentImage ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"}`}>
                    <Image src={getImageUrl(img)} alt={`Miniature ${idx}`} fill className="object-cover" unoptimized />
                  </button>
                ))}
              </div>
            )}

            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                  <h1 className="mb-2 font-serif text-2xl font-bold text-foreground md:text-3xl">{property.title}</h1>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" /> <span>{property.address}, {property.city}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="icon" onClick={handleFavoriteClick} disabled={loadingFav} title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}>
                    {loadingFav ? <Loader2 className="h-4 w-4 animate-spin" /> : <Heart className={`h-4 w-4 ${isFav ? "fill-destructive text-destructive" : ""}`} />}
                  </Button>
                  <Button variant="outline" size="icon"><Share2 className="h-4 w-4" /></Button>
                  <Button variant={showReport ? "default" : "outline"} size="icon" onClick={toggleReport} className={showReport ? "bg-orange-500 hover:bg-orange-600 text-white border-orange-500" : "text-orange-500 hover:bg-orange-50 hover:text-orange-600 border-orange-200"} title="Signaler">
                      <AlertTriangle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {showReport && (
                  <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 shadow-sm animate-in fade-in slide-in-from-top-2 mt-4">
                      <h3 className="mb-3 font-semibold text-orange-800 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Signaler cette annonce</h3>
                      {reportSent ? (
                          <div className="flex items-center gap-2 text-green-700 font-medium bg-green-50 p-3 rounded-lg border border-green-200">
                              <Check className="h-5 w-5" /> <p>Signalement envoyé !</p>
                          </div>
                      ) : (
                          <form onSubmit={handleReportSubmit} className="flex flex-col gap-3">
                              <textarea placeholder="Indiquez la raison..." rows={3} required className="rounded-lg border-orange-200 bg-background px-3 py-2.5 text-sm outline-none" value={reportReason} onChange={(e) => setReportReason(e.target.value)} />
                              <div className="flex justify-end gap-2">
                                  <Button type="button" variant="ghost" onClick={() => setShowReport(false)} disabled={sendingReport}>Annuler</Button>
                                  <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white" disabled={sendingReport}>{sendingReport ? <Loader2 className="h-4 w-4 animate-spin" /> : "Envoyer"}</Button>
                              </div>
                          </form>
                      )}
                  </div>
              )}
            </div>

            <div className="mb-6 rounded-xl bg-primary/5 p-4">
              <p className="text-3xl font-bold text-primary">{formatPrice(property.price, property.transaction || property.transaction_type)}</p>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-4 text-center"><Maximize2 className="mx-auto mb-2 h-5 w-5 text-primary" /><p className="text-lg font-bold">{property.surface} m&sup2;</p><p className="text-xs text-muted-foreground">Surface</p></div>
              {property.rooms !== undefined && <div className="rounded-xl border border-border bg-card p-4 text-center"><Home className="mx-auto mb-2 h-5 w-5 text-primary" /><p className="text-lg font-bold">{property.rooms}</p><p className="text-xs text-muted-foreground">Pièces</p></div>}
              {property.bedrooms !== undefined && <div className="rounded-xl border border-border bg-card p-4 text-center"><BedDouble className="mx-auto mb-2 h-5 w-5 text-primary" /><p className="text-lg font-bold">{property.bedrooms}</p><p className="text-xs text-muted-foreground">Chambres</p></div>}
              {property.bathrooms !== undefined && <div className="rounded-xl border border-border bg-card p-4 text-center"><Bath className="mx-auto mb-2 h-5 w-5 text-primary" /><p className="text-lg font-bold">{property.bathrooms}</p><p className="text-xs text-muted-foreground">SdB</p></div>}
            </div>

            <div className="mb-6">
              <h2 className="mb-3 font-serif text-xl font-bold">Description</h2>
              <p className="leading-relaxed text-muted-foreground whitespace-pre-line">{property.description}</p>
            </div>

            {features.length > 0 && (
                <div className="mb-6">
                <h2 className="mb-3 font-serif text-xl font-bold">Equipements</h2>
                <div className="flex flex-wrap gap-2">
                    {features.map((feature) => (
                    <div key={feature} className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground"><Check className="h-3.5 w-3.5 text-primary" /> {feature}</div>
                    ))}
                </div>
                </div>
            )}

            {/* 🌟 AFFICHAGE DE LA CARTE GPS ICI 🌟 */}
            {mounted && mapCenter && (
              <div className="mb-8">
                <h2 className="mb-3 font-serif text-xl font-bold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Emplacement
                </h2>
                <div className="h-[350px] w-full rounded-2xl overflow-hidden border border-border relative z-0 shadow-sm">
                  <MapViewer center={mapCenter} address={property.address || property.city} />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><Eye className="h-4 w-4" /> {property.views || 0} vues</div>
              <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> Publiée le {formattedDate}</div>
            </div>
          </div>

          {/* Sidebar (Colonne de droite avec le Chat) */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary capitalize">
                    {(property.agency || property.user?.name || "A").charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{property.agency || property.user?.name || "Agence / Particulier"}</h3>
                    <p className="text-sm text-muted-foreground">Vérifié</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <a href={`tel:${property.agencyPhone || property.user?.phone || ""}`}>
                    <Button className="w-full gap-2"><Phone className="h-4 w-4" /> Appeler</Button>
                  </a>
                  
                  <Button variant={showChat ? "default" : "outline"} className="w-full gap-2" onClick={handleOpenChat}>
                    <MessageSquare className="h-4 w-4" /> {showChat ? "Fermer la discussion" : "Envoyer un message"}
                  </Button>
                  
                  <Button variant="outline" className="w-full gap-2">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </Button>
                </div>
              </div>

              {/* Interface de Chat */}
              {showChat && (
                <div className="mb-6 rounded-xl border border-border bg-card shadow-lg overflow-hidden flex flex-col h-[450px] animate-in slide-in-from-top-2">
                  <div className="bg-primary/10 p-4 border-b border-border flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/20 text-primary rounded-full flex items-center justify-center font-bold uppercase">
                      {(property.agency || property.user?.name || "P").charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">{property.agency || property.user?.name || "Propriétaire"}</p>
                      <p className="text-[11px] text-muted-foreground">Réponse par email</p>
                    </div>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 bg-secondary/20">
                    <div className="self-start bg-card border border-border p-3 rounded-2xl rounded-tl-sm text-sm text-foreground max-w-[85%] shadow-sm">
                      Bonjour ! Vous avez une question sur ce bien ? Laissez votre message ici.
                    </div>

                    {loadingChat ? (
                      <Loader2 className="animate-spin m-auto text-primary" />
                    ) : (
                      chatMessages.map(msg => {
                          const isMe = msg.name !== "Agence" && msg.is_from_client !== false; 
                          
                          return (
                              <div key={msg.id} className={`flex flex-col group max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                  <div className="flex items-center gap-2">
                                      {isMe && (
                                          <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                                              <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                      )}

                                      <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                                          isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border border-border text-foreground rounded-tl-sm'
                                      }`}>
                                          {msg.message}
                                      </div>

                                      {!isMe && (
                                          <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                                              <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                      )}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground mt-1 mx-1">
                                      {new Date(msg.created_at).toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'})}
                                  </div>
                              </div>
                          )
                      })
                    )}
                  </div>

                  <div className="p-3 bg-card border-t border-border">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Écrivez votre message..."
                        className="flex-1 bg-secondary/50 rounded-full px-4 text-sm outline-none focus:ring-1 focus:ring-primary border border-border"
                        value={newMessage}
                        onChange={e => setNewMessage(e.target.value)}
                      />
                      <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={sendingMessage || !newMessage.trim()}>
                        {sendingMessage ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4 ml-0.5" />}
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {similarProperties.length > 0 && (
          <div className="mt-12 border-t border-border pt-12">
            <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">Biens similaires</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similarProperties.map((p) => (
                <PropertyCard key={p.id} property={p} initialIsFavorite={userFavorites.includes(p.id.toString())} />
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}