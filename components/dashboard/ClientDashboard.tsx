"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Bell, MessageSquare, Loader2, MapPin, ChevronLeft, ChevronRight, User, Building2, Send, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/data"
import api from "@/services/api"

type ClientTab = "favoris" | "alertes" | "messages"

const API_URL = "http://127.0.0.1:8000";
const ITEMS_PER_PAGE = 6; 

export function ClientDashboard() {
  const [clientTab, setClientTab] = useState<ClientTab>("favoris")
  
  // États pour les Favoris
  const [favorites, setFavorites] = useState<any[]>([])
  const [loadingFav, setLoadingFav] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // États pour les Messages et le Chat
  const [messages, setMessages] = useState<any[]>([])
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

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
      setMessages(res.data)
    } catch (err) {
      console.error("Erreur récupération messages", err)
    } finally {
      setLoadingMsg(false)
    }
  }

  // --- SUPPRESSION SÉCURISÉE ---
  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce message ?")) return;
    try {
      await api.delete(`/messages/${messageId}`);
      
      setMessages(prev => {
          const filteredMessages = prev.filter(m => m.id !== messageId);
          
          // Vérifie s'il reste des messages pour l'annonce actuellement sélectionnée
          const remainingForContact = filteredMessages.filter(m => m.property_id == selectedPropertyId);
          
          // S'il n'y a plus aucun message, on ferme le chat pour éviter le bug d'affichage
          if (remainingForContact.length === 0) {
              setSelectedPropertyId(null);
          }
          
          return filteredMessages;
      });
    } catch (err) {
      console.error("Erreur lors de la suppression du message", err);
      alert("Impossible de supprimer le message.");
    }
  }

  // --- LOGIQUE DE CHAT POUR LE CLIENT ---
  const groupedConversations = messages.reduce((acc, msg) => {
      const propId = msg.property_id || "deleted";
      
      if (!acc[propId]) {
          acc[propId] = {
              property_id: propId,
              property_title: msg.property?.title || "Annonce supprimée/inconnue",
              agency_name: "Agence / Propriétaire",
              latestMessageDate: new Date(msg.created_at),
              messages: []
          };
      }
      acc[propId].messages.push(msg);
      
      const msgDate = new Date(msg.created_at);
      if (msgDate > acc[propId].latestMessageDate) {
          acc[propId].latestMessageDate = msgDate;
      }
      return acc;
  }, {} as Record<string, any>);

  const conversationList = Object.values(groupedConversations).sort(
      (a: any, b: any) => b.latestMessageDate.getTime() - a.latestMessageDate.getTime()
  );

  const activeChatMessages = selectedPropertyId && groupedConversations[selectedPropertyId] 
      ? groupedConversations[selectedPropertyId].messages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      : [];

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedPropertyId) return;
    
    setSendingReply(true);
    try {
        const previousMessage = activeChatMessages.length > 0 ? activeChatMessages[0] : null;

        const payload = {
            message: replyText,
            name: previousMessage?.name || "Client", 
            email: previousMessage?.email || "client@email.com", 
            phone: previousMessage?.phone || "" 
        };

        const response = await api.post(`/properties/${selectedPropertyId}/message`, payload);
        
        const newFakeMessage = {
            id: response.data?.id || Date.now(),
            property_id: selectedPropertyId,
            message: replyText,
            created_at: new Date().toISOString(),
            is_from_client: true, // Tag explicite
            name: payload.name,
            email: payload.email
        };
        
        setMessages(prev => [...prev, newFakeMessage]);
        setReplyText("");
    } catch (e: any) {
        console.error("Erreur détaillée:", e.response?.data || e.message);
        alert("Erreur : Impossible d'envoyer. Vérifie la console (F12) pour voir l'erreur exacte.");
    } finally {
        setSendingReply(false);
    }
  }

  const totalPages = Math.ceil(favorites.length / ITEMS_PER_PAGE)
  const currentFavorites = favorites.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

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
              onClick={() => {
                  setClientTab(tab.key as ClientTab);
                  if (tab.key !== "messages") setSelectedPropertyId(null);
              }}
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

      {clientTab === "messages" && (
        <div className="flex flex-col md:flex-row gap-4 h-[600px] border border-border rounded-xl bg-card overflow-hidden">
          
          {loadingMsg ? (
            <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : conversationList.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Vous n'avez envoyé aucun message.</div>
          ) : (
            <>
              <div className={`w-full md:w-1/3 border-r border-border flex flex-col ${selectedPropertyId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-border bg-secondary/30 font-semibold">Mes discussions</div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                  {conversationList.map((contact: any) => (
                    <button
                      key={contact.property_id}
                      onClick={() => setSelectedPropertyId(contact.property_id)}
                      className={`w-full text-left p-3 rounded-lg flex items-start gap-3 transition-colors ${
                        selectedPropertyId === contact.property_id ? 'bg-primary/10' : 'hover:bg-secondary/50'
                      }`}
                    >
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0 mt-0.5">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="font-semibold text-sm truncate text-foreground">{contact.property_title}</div>
                        <div className="text-[10px] text-primary mb-1">Avec : {contact.agency_name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {contact.messages[contact.messages.length - 1].message}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`flex-1 flex flex-col bg-[#f0f2f5] dark:bg-secondary/10 relative ${!selectedPropertyId ? 'hidden md:flex' : 'flex'}`}>
                {selectedPropertyId && groupedConversations[selectedPropertyId] ? (
                  <>
                    <div className="p-4 bg-card border-b border-border flex items-center justify-between shadow-sm z-10">
                      <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setSelectedPropertyId(null)}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 pr-4">
                          <h3 className="font-semibold text-foreground truncate">{groupedConversations[selectedPropertyId]?.agency_name}</h3>
                          <p className="text-xs text-muted-foreground truncate">Annonce : {groupedConversations[selectedPropertyId]?.property_title}</p>
                        </div>
                      </div>
                      <Link href={`/biens/${selectedPropertyId}`}>
                        <Button variant="outline" size="sm" className="hidden sm:flex shrink-0">Voir l'annonce</Button>
                      </Link>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                      {activeChatMessages.map((msg: any) => {
                          // LA VRAIE LOGIQUE ICI : Si le message vient de "Agence", c'est l'autre. Sinon, c'est MOI (le client).
                          const isMe = msg.name !== "Agence" && msg.is_from_agency !== true; 
                          
                          return (
                            <div key={msg.id} className={`flex flex-col group max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                
                                <div className="flex items-center gap-2">
                                  {isMe && (
                                    <button 
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                      title="Supprimer le message"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}

                                  {/* C'est ICI qu'on gère le bg-primary pour MOI et bg-card pour l'AUTRE */}
                                  <div className={`p-3 rounded-2xl text-sm shadow-sm ${
                                      isMe 
                                      ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                                      : 'bg-card border border-border text-foreground rounded-tl-sm'
                                    }`}
                                  >
                                      {msg.message}
                                  </div>

                                  {!isMe && (
                                    <button 
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                      title="Supprimer le message"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>

                                <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                                    {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                          )
                      })}
                    </div>

                    <div className="p-4 bg-card border-t border-border">
                        <form 
                            onSubmit={(e) => { e.preventDefault(); handleSendReply(); }} 
                            className="flex items-center gap-2"
                        >
                            <input 
                                type="text"
                                placeholder="Écrire un message..."
                                className="flex-1 rounded-full border border-border bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                            <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!replyText.trim() || sendingReply}>
                                {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                            </Button>
                        </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                    <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                    <p>Sélectionnez une discussion pour afficher les messages.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}