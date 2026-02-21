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
  
  // États des données utilisateur
  const [currentUser, setCurrentUser] = useState<any>(null)

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
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));

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

  // --- LOGIQUE MESSAGES (UNIFIÉE CLIENT) ---
  const fetchSentMessages = async () => {
    setLoadingMsg(true)
    try {
      const [sent, received] = await Promise.all([
          api.get('/my-sent-messages'),
          api.get('/my-received-messages').catch(() => ({ data: [] }))
      ]);
      const allMsgs = [...sent.data, ...received.data];
      
      const uniqueMsgs = Array.from(new Map(allMsgs.map(m => [m.id, m])).values());
      setMessages(uniqueMsgs);
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
          const remainingForContact = filteredMessages.filter(m => m.property_id == selectedPropertyId);
          
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

  const activeThread = selectedPropertyId ? groupedConversations[selectedPropertyId] : null;
  const activeChatMessages = activeThread 
      ? activeThread.messages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      : [];

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedPropertyId) return;
    
    setSendingReply(true);
    try {
        const payload = {
            message: replyText,
            name: currentUser?.name || "Client", 
            email: currentUser?.email || "client@email.com", 
            phone: currentUser?.phone || "" 
        };

        const response = await api.post(`/properties/${selectedPropertyId}/message`, payload);
        
        const newFakeMessage = {
            id: response.data?.id || Date.now(),
            property_id: selectedPropertyId,
            message: replyText,
            created_at: new Date().toISOString(),
            is_from_client: true,
            name: payload.name,
            email: payload.email
        };
        
        setMessages(prev => [...prev, newFakeMessage]);
        setReplyText("");
    } catch (e: any) {
        console.error("Erreur détaillée:", e.response?.data || e.message);
        alert("Erreur : Impossible d'envoyer.");
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
      {/* 🌟 ONGLET NAVIGATION 🌟 */}
      <div className="mb-6 flex gap-2 overflow-x-auto rounded-lg border border-border bg-card p-1.5 custom-scrollbar">
        {[
          { key: "favoris", label: "Mes Favoris", icon: Heart },
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
              className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex-1 sm:flex-none ${
                clientTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {clientTab === "favoris" && (
        <>
            {loadingFav ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : favorites.length === 0 ? (
                <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground bg-card shadow-sm">Vous n'avez pas encore de favoris.</div>
            ) : (
                <div className="flex flex-col gap-4">
                    {currentFavorites.map((p) => {
                        const imgUrl = getImageUrl(p.images);
                        return (
                            <div key={p.id} className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 transition-all shadow-sm hover:shadow-md group relative">
                                
                                <Link href={`/biens/${p.id}`} className="relative h-48 sm:h-32 w-full sm:w-48 shrink-0 overflow-hidden rounded-lg bg-secondary block hover:opacity-90">
                                    <Image src={imgUrl} alt={p.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                                </Link>
                                
                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <Link href={`/biens/${p.id}`} className="text-lg font-semibold hover:text-primary hover:underline truncate mb-1 pr-12 sm:pr-0">
                                        {p.title}
                                    </Link>
                                    <div className="text-sm text-muted-foreground flex items-center gap-1.5 mb-2">
                                        <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                                        <span className="truncate">{p.city}</span>
                                    </div>
                                    <p className="font-bold text-primary mt-auto">{formatPrice(p.price, p.transaction_type)}</p>
                                </div>
                                
                                <div className="absolute right-4 top-4 sm:relative sm:right-auto sm:top-auto flex sm:flex-col items-center justify-center shrink-0 z-20">
                                    <Button 
                                        variant="outline" 
                                        size="icon" 
                                        className="rounded-full bg-white/90 text-red-500 hover:bg-red-50 hover:text-red-600 shadow-sm transition-transform hover:scale-110 h-10 w-10 border-red-100"
                                        onClick={(e) => { e.preventDefault(); removeFavorite(p.id); }}
                                        title="Retirer des favoris"
                                    >
                                        <Heart className="h-5 w-5 fill-current" />
                                    </Button>
                                </div>

                            </div>
                        )
                    })}
                    
                    {totalPages > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="text-sm px-2 text-muted-foreground">Page {currentPage} sur {totalPages}</span>
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
            <div key={i} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10"><Bell className="h-4 w-4 text-primary" /></div>
              <div className="flex-1"><p className="text-sm text-foreground">{alert.text}</p><p className="text-xs text-muted-foreground mt-1">{alert.time}</p></div>
            </div>
          ))}
        </div>
      )}

      {/* 🌟 ONGLET MESSAGES 🌟 */}
      {clientTab === "messages" && (
        <div className="flex flex-col md:flex-row h-[75vh] min-h-[500px] border border-border rounded-xl bg-card overflow-hidden shadow-sm relative">
          
          {loadingMsg ? (
            <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : conversationList.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Vous n'avez envoyé aucun message.</div>
          ) : (
            <>
              {/* LISTE DES CONVERSATIONS */}
              <div className={`w-full md:w-1/3 border-r border-border flex flex-col bg-card absolute md:relative inset-0 z-20 md:z-0 ${selectedPropertyId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-border bg-secondary/30 font-semibold shrink-0">Mes discussions</div>
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

              {/* ZONE DE CHAT */}
              <div className={`flex-1 flex flex-col bg-[#f0f2f5] dark:bg-secondary/10 absolute md:relative inset-0 z-30 md:z-0 h-full w-full ${!selectedPropertyId ? 'hidden md:flex' : 'flex'}`}>
                {activeThread ? (
                  <>
                    <div className="p-3 md:p-4 bg-card border-b border-border flex items-center justify-between shadow-sm z-10 shrink-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setSelectedPropertyId(null)}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 pr-2">
                          <h3 className="font-semibold text-foreground truncate">{activeThread.agency_name}</h3>
                          <p className="text-xs text-muted-foreground truncate">Annonce : {activeThread.property_title}</p>
                        </div>
                      </div>
                      <Link href={`/biens/${selectedPropertyId}`}>
                        <Button variant="outline" size="sm" className="hidden sm:flex shrink-0">Voir l'annonce</Button>
                      </Link>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                      {activeChatMessages.map((msg: any, index: number) => {
                          
                          // 🌟 CORRECTION DE LA COULEUR DES MESSAGES 🌟
                          // C'est MOI (marron) SEULEMENT si le nom n'est pas "Agence" ni "Propriétaire".
                          const isMe = msg.name !== "Agence" && msg.name !== "Propriétaire" && msg.is_from_agency !== true; 
                          
                          return (
                            <div key={`${msg.id}-${index}`} className={`flex flex-col group max-w-[85%] md:max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                                
                                <div className="flex items-center gap-2">
                                  {isMe && (
                                    <button 
                                      onClick={() => handleDeleteMessage(msg.id)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full hidden md:block"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}

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
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full hidden md:block"
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

                    <div className="p-3 bg-card border-t border-border shrink-0 mt-auto">
                        <form onSubmit={(e) => { e.preventDefault(); handleSendReply(); }} className="flex items-center gap-2">
                            <input 
                                type="text" 
                                placeholder="Écrire un message..." 
                                className="flex-1 rounded-full border border-border bg-secondary/50 px-4 py-3 md:py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary" 
                                value={replyText} 
                                onChange={(e) => setReplyText(e.target.value)} 
                            />
                            <Button type="submit" size="icon" className="rounded-full shrink-0 h-10 w-10 md:h-9 md:w-9" disabled={!replyText.trim() || sendingReply}>
                                {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                            </Button>
                        </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center hidden md:flex">
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