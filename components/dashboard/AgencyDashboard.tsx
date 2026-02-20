"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Building2, Eye, Plus, Edit, Trash2, BarChart3, MessageSquare, Loader2, MapPin, Heart, ChevronLeft, ChevronRight, User, Send, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/data"
import api from "@/services/api"

type AgenceTab = "annonces" | "messages" | "statistiques" | "favoris"

const API_URL = "http://127.0.0.1:8000";
const ITEMS_PER_PAGE = 5;

function Pagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <Button variant="outline" size="icon" onClick={() => onPageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button key={page} variant={currentPage === page ? "default" : "outline"} className="h-9 w-9 p-0" onClick={() => onPageChange(page)}>
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
  const [myProperties, setMyProperties] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [totalViews, setTotalViews] = useState(0)
  const [messages, setMessages] = useState<any[]>([])
  const [selectedContactEmail, setSelectedContactEmail] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  const [loadingProps, setLoadingProps] = useState(false)
  const [loadingFavs, setLoadingFavs] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [currentPropPage, setCurrentPropPage] = useState(1)
  const [currentFavPage, setCurrentFavPage] = useState(1)

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
      const views = res.data.reduce((sum: number, p: any) => sum + (p.views_count || 0), 0)
      setTotalViews(views)
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
      setMyProperties(prev => {
        const updated = prev.filter(p => p.id !== id)
        setTotalViews(updated.reduce((sum: number, p: any) => sum + (p.views_count || 0), 0))
        return updated
      })
    } catch (err) { alert("Impossible de supprimer.") }
  }

  const handleDeleteMessage = async (messageId: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce message pour vous ?")) return;
    try {
      await api.delete(`/messages/${messageId}`);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== messageId);
        if (filtered.filter(m => m.email === selectedContactEmail).length === 0) setSelectedContactEmail(null);
        return filtered;
      });
    } catch (err) { alert("Impossible de supprimer le message."); }
  }

  const groupedConversations = messages.reduce((acc, msg) => {
    const email = msg.email || 'inconnu@email.com';
    if (!acc[email]) {
      acc[email] = { name: msg.name !== 'Agence' ? msg.name : 'Client', email, phone: msg.phone || '', latestMessageDate: new Date(msg.created_at), messages: [] };
    }
    acc[email].messages.push(msg);
    const msgDate = new Date(msg.created_at);
    if (msgDate > acc[email].latestMessageDate) acc[email].latestMessageDate = msgDate;
    return acc;
  }, {} as Record<string, any>);

  const conversationList = Object.values(groupedConversations).sort((a: any, b: any) => b.latestMessageDate.getTime() - a.latestMessageDate.getTime());
  const activeChatMessages = selectedContactEmail && groupedConversations[selectedContactEmail]
    ? groupedConversations[selectedContactEmail].messages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    : [];

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedContactEmail) return;
    setSendingReply(true);
    try {
      const last = activeChatMessages[activeChatMessages.length - 1];
      if (!last?.property_id) { alert("Impossible de déterminer à quelle annonce ce message est lié."); return; }
      const response = await api.post(`/properties/${last.property_id}/message`, { name: "Agence", email: selectedContactEmail, message: replyText });
      setMessages(prev => [...prev, { id: response.data?.id || Date.now(), property_id: last.property_id, name: "Agence", email: selectedContactEmail, message: replyText, created_at: new Date().toISOString(), is_from_agency: true }]);
      setReplyText("");
    } catch (e: any) {
      alert("Erreur lors de l'envoi. Vérifie la console.");
    } finally { setSendingReply(false); }
  }

  // --- CALCULS STATISTIQUES ---
  const topProperties = [...myProperties].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 5)
  const maxViews = topProperties.length > 0 ? (topProperties[0].views_count || 1) : 1
  const totalContacts = conversationList.length
  const totalFavorites = favorites.length
  const conversionRate = totalViews > 0 ? ((totalContacts / totalViews) * 100).toFixed(2) : "0.00"
  const publishedCount = myProperties.filter(p => p.status === 'publié').length
  const pendingCount = myProperties.filter(p => p.status !== 'publié').length

  const paginatedProps = myProperties.slice((currentPropPage - 1) * ITEMS_PER_PAGE, currentPropPage * ITEMS_PER_PAGE)
  const totalPropPages = Math.ceil(myProperties.length / ITEMS_PER_PAGE)
  const paginatedFavs = favorites.slice((currentFavPage - 1) * ITEMS_PER_PAGE, currentFavPage * ITEMS_PER_PAGE)
  const totalFavPages = Math.ceil(favorites.length / ITEMS_PER_PAGE)

  const getImageUrl = (imagesData: any) => {
    if (!imagesData) return "/placeholder.jpg";
    let images = typeof imagesData === 'string' ? JSON.parse(imagesData) : imagesData;
    let imagePath = (Array.isArray(images) && images.length > 0) ? images[0] : "/placeholder.jpg";
    if (imagePath.startsWith("http") || imagePath.startsWith("/images")) return imagePath;
    return `${API_URL}${imagePath}`;
  }

  return (
    <>
      {/* STATS GLOBALES */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Annonces", value: myProperties.length.toString(), icon: Building2 },
          { label: "Personnes", value: conversationList.length.toString(), icon: MessageSquare },
          { label: "Favoris", value: favorites.length.toString(), icon: Heart },
          { label: "Vues", value: totalViews.toString(), icon: Eye },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <stat.icon className="h-5 w-5 mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
        {[
          { key: "annonces", label: "Mes annonces", icon: Building2 },
          { key: "favoris", label: "Favoris", icon: Heart },
          { key: "messages", label: "Messages", icon: MessageSquare },
          { key: "statistiques", label: "Statistiques", icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setAgenceTab(tab.key as AgenceTab); if (tab.key !== "messages") setSelectedContactEmail(null); }}
            className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${agenceTab === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* ONGLET ANNONCES */}
      {agenceTab === "annonces" && (
        <>
          <div className="mb-4 flex justify-end">
            <Link href="/publier"><Button className="gap-2"><Plus className="h-4 w-4" /> Nouvelle annonce</Button></Link>
          </div>
          {loadingProps ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : paginatedProps.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground">Aucune annonce.</div>
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
                      <div className="text-sm text-muted-foreground flex items-center gap-3">
                        <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {p.city}</span>
                        <span className="flex items-center gap-1 text-primary/80 font-medium">
                          <Eye className="h-3.5 w-3.5" /> {p.views_count || 0} vue{(p.views_count || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <p className="font-bold text-primary">{formatPrice(p.price, p.transaction_type)}</p>
                    </div>
                    <div className="flex gap-2 z-20 relative">
                      <Button variant="outline" size="icon" onClick={(e) => { e.preventDefault(); window.location.href = `/modifier/${p.id}`; }}><Edit className="h-4 w-4" /></Button>
                      <Button variant="outline" size="icon" className="text-destructive hover:bg-destructive/10" onClick={(e) => { e.preventDefault(); handleDelete(p.id); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </div>
              ))}
              <Pagination currentPage={currentPropPage} totalPages={totalPropPages} onPageChange={setCurrentPropPage} />
            </div>
          )}
        </>
      )}

      {/* ONGLET FAVORIS */}
      {agenceTab === "favoris" && (
        <>
          {loadingFavs ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground">Aucun favori.</div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {paginatedFavs.map((p) => (
                  <div key={p.id} className="group relative overflow-hidden rounded-xl border bg-card transition-all hover:shadow-md">
                    <div className="relative h-48 w-full overflow-hidden">
                      <Image src={getImageUrl(p.images)} alt={p.title} fill className="object-cover" unoptimized />
                      <button onClick={(e) => { e.preventDefault(); removeFavorite(p.id); }} className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-red-500 z-20 shadow-sm transition-colors hover:bg-white/90">
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
              <Pagination currentPage={currentFavPage} totalPages={totalFavPages} onPageChange={setCurrentFavPage} />
            </div>
          )}
        </>
      )}

      {/* ONGLET MESSAGES */}
      {agenceTab === "messages" && (
        <div className="flex flex-col md:flex-row gap-4 h-[600px] border border-border rounded-xl bg-card overflow-hidden">
          {loadingMsg ? (
            <div className="flex-1 flex justify-center items-center"><Loader2 className="animate-spin text-primary" /></div>
          ) : conversationList.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Aucune conversation.</div>
          ) : (
            <>
              <div className={`w-full md:w-1/3 border-r border-border flex flex-col ${selectedContactEmail ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-border bg-secondary/30 font-semibold">Conversations</div>
                <div className="overflow-y-auto flex-1 p-2 space-y-1">
                  {conversationList.map((contact: any) => (
                    <button key={contact.email} onClick={() => setSelectedContactEmail(contact.email)}
                      className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedContactEmail === contact.email ? 'bg-primary/10' : 'hover:bg-secondary/50'}`}>
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="font-semibold text-sm truncate text-foreground">{contact.name}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {contact.messages.length > 0 ? contact.messages[contact.messages.length - 1].message : ''}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`flex-1 flex flex-col bg-[#f0f2f5] dark:bg-secondary/10 relative ${!selectedContactEmail ? 'hidden md:flex' : 'flex'}`}>
                {selectedContactEmail && groupedConversations[selectedContactEmail] ? (
                  <>
                    <div className="p-4 bg-card border-b border-border flex items-center gap-3 shadow-sm z-10">
                      <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setSelectedContactEmail(null)}>
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{groupedConversations[selectedContactEmail]?.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {selectedContactEmail}{groupedConversations[selectedContactEmail]?.phone ? ` • ${groupedConversations[selectedContactEmail]?.phone}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                      {activeChatMessages.map((msg: any) => {
                        const isMe = msg.is_from_agency === true || msg.name === "Agence";
                        return (
                          <div key={msg.id} className={`flex flex-col group max-w-[80%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                            {!isMe && msg.property && (
                              <span className="text-[10px] text-muted-foreground mb-1 ml-1 flex items-center gap-1">
                                <Building2 className="h-3 w-3" /> Concernant : {msg.property.title}
                              </span>
                            )}
                            <div className="flex items-center gap-2">
                              {isMe && (
                                <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <div className={`p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border border-border text-foreground rounded-tl-sm'}`}>
                                {msg.message}
                              </div>
                              {!isMe && (
                                <button onClick={() => handleDeleteMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full">
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
                      <form onSubmit={(e) => { e.preventDefault(); handleSendReply(); }} className="flex items-center gap-2">
                        <input type="text" placeholder="Écrire un message..." className="flex-1 rounded-full border border-border bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                        <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!replyText.trim() || sendingReply}>
                          {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center">
                    <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                    <p>Sélectionnez une conversation pour afficher les messages.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ONGLET STATISTIQUES — 100% DYNAMIQUE */}
      {agenceTab === "statistiques" && (
        <div className="flex flex-col gap-6">

          {/* KPIs globaux */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {[
              { label: "Total vues", value: totalViews.toString(), icon: Eye, sub: "sur toutes les annonces" },
              { label: "Contacts reçus", value: totalContacts.toString(), icon: MessageSquare, sub: "personnes distinctes" },
              { label: "Favoris reçus", value: totalFavorites.toString(), icon: Heart, sub: "biens mis en favoris" },
              { label: "Taux de contact", value: `${conversionRate}%`, icon: TrendingUp, sub: "vues → contacts" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{kpi.label}</span>
                  <kpi.icon className="h-4 w-4 text-primary" />
                </div>
                <p className="text-3xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">

            {/* Vues par annonce */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-5 font-semibold text-foreground flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Vues par annonce
              </h3>
              {loadingProps ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>
              ) : topProperties.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Aucune annonce.</p>
              ) : (
                <div className="flex flex-col gap-4">
                  {topProperties.map((p) => {
                    const pct = maxViews > 0 ? Math.max(((p.views_count || 0) / maxViews) * 100, 2) : 2
                    return (
                      <div key={p.id} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate mb-1.5">{p.title}</p>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <span className="w-16 text-right text-sm font-semibold text-muted-foreground shrink-0">
                          {p.views_count || 0} vue{(p.views_count || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Résumé de performance */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-5 font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Résumé de performance
              </h3>
              <div className="flex flex-col gap-0">
                {[
                  { label: "Annonces publiées", value: publishedCount.toString() },
                  { label: "Annonces en attente", value: pendingCount.toString() },
                  { label: "Total vues reçues", value: totalViews.toString() },
                  { label: "Contacts uniques", value: totalContacts.toString() },
                  { label: "Favoris reçus", value: totalFavorites.toString() },
                  { label: "Taux de contact", value: `${conversionRate}%` },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <span className="font-semibold text-foreground">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Tableau détail par annonce */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-5 font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Détail par annonce
            </h3>
            {loadingProps ? (
              <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>
            ) : myProperties.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune annonce.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground text-left">
                      <th className="py-2 pr-4 font-medium">Annonce</th>
                      <th className="py-2 pr-4 font-medium">Ville</th>
                      <th className="py-2 pr-4 font-medium">Statut</th>
                      <th className="py-2 text-right font-medium">Vues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myProperties.map((p) => (
                      <tr key={p.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/20 transition-colors">
                        <td className="py-3 pr-4 font-medium text-foreground max-w-[200px] truncate">{p.title}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{p.city}</td>
                        <td className="py-3 pr-4">
                          <Badge variant={p.status === "publié" ? "default" : "secondary"} className="text-xs">{p.status}</Badge>
                        </td>
                        <td className="py-3 text-right font-semibold text-primary">{p.views_count || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}
    </>
  )
}