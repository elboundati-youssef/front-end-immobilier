"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl" // 🌟 IMPORT NEXT-INTL
import { 
  Building2, Eye, Plus, Edit, Trash2, BarChart3, 
  MessageSquare, Loader2, MapPin, Heart, ChevronLeft, 
  ChevronRight, User, Send, TrendingUp, Home, Activity,
  CheckCircle2, Clock, PieChart, Bell, Phone 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/data"
import api from "@/services/api"

type AgenceTab = "annonces" | "messages" | "statistiques" | "favoris" | "notifications"

const API_URL = "http://127.0.0.1:8000";
const ITEMS_PER_PAGE = 6;

// 🌟 Modification pour accepter les traductions
function Pagination({ currentPage, totalPages, onPageChange, textPage, textOf }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void; textPage: string; textOf: string }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-2">
      <Button variant="outline" size="icon" onClick={() => onPageChange(Math.max(currentPage - 1, 1))} disabled={currentPage === 1}>
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-sm px-2 text-muted-foreground">
        <span>{textPage} </span>
        <span>{currentPage}</span>
        <span> {textOf} </span>
        <span>{totalPages}</span>
      </span>
      <Button variant="outline" size="icon" onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))} disabled={currentPage === totalPages}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

export function AgencyDashboard() {
  const t = useTranslations("AgencyDashboard") // 🌟 INITIALISATION TRADUCTION
  const pathname = usePathname()
  
  // 🌟 GESTION DE LA LANGUE POUR LES REDIRECTIONS & DATES
  const currentLocale = pathname.split("/")[1] || "fr"
  const l = (path: string) => `/${currentLocale}${path}`

  const [agenceTab, setAgenceTab] = useState<AgenceTab>("annonces")
  const [currentUser, setCurrentUser] = useState<any>(null)
  
  const [myProperties, setMyProperties] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [totalViews, setTotalViews] = useState(0)
  
  const [allMyMessages, setAllMyMessages] = useState<any[]>([])
  
  const [agencyNotifications, setAgencyNotifications] = useState<any[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const [currentNotifPage, setCurrentNotifPage] = useState(1)

  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)
  
  const [loadingProps, setLoadingProps] = useState(false)
  const [loadingFavs, setLoadingFavs] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState(false)
  
  const [currentPropPage, setCurrentPropPage] = useState(1)
  const [currentFavPage, setCurrentFavPage] = useState(1)

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));

    fetchMyProperties()
    fetchFavorites()
    fetchUnifiedMessages()
    fetchAgencyNotifications()
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

  const fetchAgencyNotifications = async () => {
      setLoadingNotifs(true)
      try {
          const res = await api.get('/my-properties/likes'); 
          setAgencyNotifications(res.data);
      } catch (err) {
          console.error("Erreur récupération notifications", err)
      } finally {
          setLoadingNotifs(false)
      }
  }

  const fetchUnifiedMessages = async () => {
    setLoadingMsg(true);
    try {
      const [received, sent] = await Promise.all([
        api.get('/my-received-messages'),
        api.get('/my-sent-messages')
      ]);
      const receivedMsgs = (received.data || []).map((m: any) => ({ ...m, is_mine: false }));
      const sentMsgs = (sent.data || []).map((m: any) => ({ ...m, is_mine: true }));

      const allMessages = [...receivedMsgs, ...sentMsgs];
      const uniqueMessages = Array.from(new Map(allMessages.map(m => [m.id, m])).values());
      
      setAllMyMessages(uniqueMessages);
    } catch (err) { console.error("Erreur messages", err) } finally { setLoadingMsg(false) }
  }

  const removeFavorite = async (id: number) => {
    try {
      await api.post(`/properties/${id}/favorite`)
      setFavorites(prev => prev.filter(p => p.id !== id))
    } catch (err) { console.error("Erreur retrait favori", err) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t("adsTab.confirmDelete"))) return
    try {
      await api.delete(`/properties/${id}`)
      setMyProperties(prev => {
        const updated = prev.filter(p => p.id !== id)
        setTotalViews(updated.reduce((sum: number, p: any) => sum + (p.views_count || 0), 0))
        return updated
      })
    } catch (err) { alert(t("adsTab.errorDelete")) }
  }

  const handleDeleteMyMessage = async (messageId: number) => {
    if (!confirm(t("messagesTab.confirmDelete"))) return;
    try {
      await api.delete(`/messages/${messageId}`);
      setAllMyMessages(prev => {
        const filtered = prev.filter(m => m.id !== messageId);
        const threadStillExists = filtered.some(m => `${m.property_id}_${m.email}` === selectedThreadId);
        if (!threadStillExists) setSelectedThreadId(null);
        return filtered;
      });
    } catch (err) { alert(t("messagesTab.errorDelete")); }
  }

  const groupedConversations = allMyMessages.reduce((acc, msg) => {
    const threadId = `${msg.property_id}_${msg.email}`;
    
    if (!acc[threadId]) {
      const amIVisitor = currentUser && msg.email === currentUser.email;
      
      let dName = "";
      let dEmail = "";

      if (amIVisitor) {
          dName = `${t("messagesTab.ad")} ${msg.property?.title || '#' + msg.property_id}`;
          dEmail = t("messagesTab.discussionOwner");
      } else {
          dName = (msg.name !== 'Propriétaire' && msg.name !== 'Agence' && msg.name !== 'Admin') ? msg.name : 'Client';
          dEmail = msg.email;
      }

      acc[threadId] = {
        threadId,
        property_id: msg.property_id,
        contact_email: msg.email,
        displayName: dName,
        displayEmail: dEmail,
        phone: msg.phone || '',
        latestMessageDate: new Date(msg.created_at),
        messages: []
      };
    }
    acc[threadId].messages.push(msg);
    const msgDate = new Date(msg.created_at);
    if (msgDate > acc[threadId].latestMessageDate) acc[threadId].latestMessageDate = msgDate;
    return acc;
  }, {} as Record<string, any>);

  const conversationList = Object.values(groupedConversations).sort((a: any, b: any) => b.latestMessageDate.getTime() - a.latestMessageDate.getTime());
  const activeThread = selectedThreadId ? groupedConversations[selectedThreadId] : null;
  const activeChatMessages = activeThread ? activeThread.messages.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) : [];

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeThread) return;
    setSendingReply(true);
    try {
      const amIVisitor = currentUser && activeThread.contact_email === currentUser.email;
      const nameToSend = amIVisitor ? currentUser.name : "Agence";

      await api.post(`/properties/${activeThread.property_id}/message`, { 
        name: nameToSend, 
        email: activeThread.contact_email, 
        message: replyText 
      });
      
      fetchUnifiedMessages();
      setReplyText("");
    } catch (e: any) {
      alert(t("messagesTab.errorSend"));
    } finally { setSendingReply(false); }
  }

  const topProperties = [...myProperties].sort((a, b) => (b.views_count || 0) - (a.views_count || 0)).slice(0, 5)
  const maxViews = topProperties.length > 0 ? (topProperties[0].views_count || 1) : 1
  
  const totalContacts = conversationList.filter((c:any) => currentUser && c.contact_email !== currentUser.email).length;
  const conversionRate = totalViews > 0 ? ((totalContacts / totalViews) * 100).toFixed(2) : "0.00"
  
  const publishedCount = myProperties.filter(p => p.status === 'publié').length
  const pendingCount = myProperties.filter(p => p.status !== 'publié').length
  
  const ventesCount = myProperties.filter(p => p.transaction_type?.toLowerCase() === 'vente').length
  const locationsCount = myProperties.filter(p => p.transaction_type?.toLowerCase() === 'location').length
  
  const avgViews = myProperties.length > 0 ? (totalViews / myProperties.length).toFixed(1) : "0"

  const paginatedProps = myProperties.slice((currentPropPage - 1) * ITEMS_PER_PAGE, currentPropPage * ITEMS_PER_PAGE)
  const totalPropPages = Math.ceil(myProperties.length / ITEMS_PER_PAGE)
  
  const paginatedFavs = favorites.slice((currentFavPage - 1) * ITEMS_PER_PAGE, currentFavPage * ITEMS_PER_PAGE)
  const totalFavPages = Math.ceil(favorites.length / ITEMS_PER_PAGE)

  const paginatedNotifs = agencyNotifications.slice((currentNotifPage - 1) * ITEMS_PER_PAGE, currentNotifPage * ITEMS_PER_PAGE)
  const totalNotifPages = Math.ceil(agencyNotifications.length / ITEMS_PER_PAGE)

  const getImageUrl = (imagesData: any) => {
    if (!imagesData) return "/placeholder.jpg";
    let images = typeof imagesData === 'string' ? JSON.parse(imagesData) : imagesData;
    let imagePath = (Array.isArray(images) && images.length > 0) ? images[0] : "/placeholder.jpg";
    if (imagePath.startsWith("http") || imagePath.startsWith("/images")) return imagePath;
    return `${API_URL}${imagePath}`;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* 🌟 SIDEBAR (Menu) 🌟 */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="sticky top-20 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible rounded-2xl border border-border bg-card p-3 shadow-sm custom-scrollbar">
          <h3 className="hidden lg:block px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
            {t("sidebar.title")}
          </h3>

          {[
            { key: "annonces", label: t("sidebar.ads"), icon: Home },
            { key: "messages", label: t("sidebar.messages"), icon: MessageSquare, count: conversationList.length },
            { key: "favoris", label: t("sidebar.favorites"), icon: Heart },
            { key: "notifications", label: t("sidebar.activities"), icon: Bell, count: agencyNotifications.length },
            { type: "divider" },
            { type: "title", label: t("sidebar.performance") },
            { key: "statistiques", label: t("sidebar.stats"), icon: Activity },
          ].map((tab, idx) => {
            if (tab.type === "divider") return <div key={`div-${idx}`} className="hidden lg:block h-px w-full bg-border my-2" />
            if (tab.type === "title") return <h3 key={`title-${idx}`} className="hidden lg:block px-3 pt-4 pb-2 text-xs font-bold uppercase tracking-wider text-primary">{tab.label}</h3>
            
            const isActive = agenceTab === tab.key;
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                onClick={() => { setAgenceTab(tab.key as AgenceTab); if (tab.key !== "messages") setSelectedThreadId(null); }}
                className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                  isActive ? "bg-primary text-primary-foreground shadow-md" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon className={`h-4 w-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />} 
                  <span>{tab.label}</span>
                </div>
                {tab.count !== undefined && tab.count > 0 && (
                    <span className={`flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-bold ${
                        isActive ? "bg-white text-primary" : "bg-primary/20 text-primary"
                    }`}>{tab.count}</span>
                )}
              </button>
            )
          })}
        </div>
      </aside>

      {/* 🌟 CONTENU PRINCIPAL 🌟 */}
      <main className="flex-1 min-w-0 flex flex-col gap-6">

        {/* STATS RAPIDES */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: t("quickStats.ads"), value: myProperties.length.toString(), icon: Building2 },
            { label: t("quickStats.contacts"), value: totalContacts.toString(), icon: MessageSquare },
            { label: t("quickStats.likes"), value: agencyNotifications.length.toString(), icon: Heart }, 
            { label: t("quickStats.views"), value: totalViews.toString(), icon: Eye },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* 🌟 ONGLET ANNONCES 🌟 */}
        {agenceTab === "annonces" && (
          <div className="flex flex-col gap-3">
            <div className="mb-2 flex justify-between items-center">
              <h2 className="text-lg font-semibold font-serif">{t("adsTab.title")}</h2>
              <Link href={l("/publier")}><Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> <span>{t("adsTab.publish")}</span></Button></Link>
            </div>
            
            {loadingProps ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
            ) : paginatedProps.length === 0 ? (
              <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground bg-card shadow-sm">{t("adsTab.empty")}</div>
            ) : (
              <div className="flex flex-col gap-5">
                {paginatedProps.map((p) => (
                  <div key={p.id} className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 transition-all shadow-sm hover:shadow-md group">
                    
                    <Link href={l(`/biens/${p.id}`)} className="relative h-48 sm:h-32 w-full sm:w-48 shrink-0 overflow-hidden rounded-lg bg-secondary block hover:opacity-90">
                      <Image src={getImageUrl(p.images)} alt={p.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                      <Badge variant={p.status === "publié" ? "default" : "secondary"} className={`absolute top-2 left-2 shadow-sm capitalize ${p.status === 'en attente' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''}`}>
                        {/* On tente de traduire le statut (ex: status.publié) */}
                        {t(`status.${p.status}`) || p.status}
                      </Badge>
                    </Link>
                    
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <Link href={l(`/biens/${p.id}`)} className="text-lg font-semibold hover:text-primary hover:underline truncate mb-1">
                        {p.title}
                      </Link>
                      <div className="text-sm text-muted-foreground flex items-center gap-3 mb-2">
                        <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.city}</span>
                        <span className="flex items-center gap-1 text-primary/80 font-medium">
                          <Eye className="h-3.5 w-3.5" /> <span>{p.views_count || 0}</span> <span>{t("adsTab.views")}</span>
                        </span>
                      </div>
                      <p className="font-bold text-primary mt-auto">{formatPrice(p.price, p.transaction_type)}</p>
                    </div>

                    <div className="flex sm:flex-col gap-3 shrink-0 mt-2 sm:mt-0 justify-center">
                      <Link href={l(`/modifier/${p.id}`)} className="flex-1 sm:flex-none">
                        <Button variant="outline" className="w-full h-11 sm:h-10 text-primary border-primary/30 hover:bg-primary/10 gap-2">
                          <Edit className="h-4 w-4" /> <span className="sm:hidden xl:inline">{t("adsTab.edit")}</span>
                        </Button>
                      </Link>
                      <Button variant="outline" className="flex-1 sm:flex-none h-11 sm:h-10 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={(e) => { e.preventDefault(); handleDelete(p.id); }}>
                        <Trash2 className="h-4 w-4" /> <span className="sm:hidden xl:inline">{t("adsTab.delete")}</span>
                      </Button>
                    </div>

                  </div>
                ))}
                <Pagination currentPage={currentPropPage} totalPages={totalPropPages} onPageChange={setCurrentPropPage} textPage={t("pagination.page")} textOf={t("pagination.of")} />
              </div>
            )}
          </div>
        )}

        {/* ONGLET FAVORIS */}
        {agenceTab === "favoris" && (
          <div className="flex flex-col gap-3">
            {loadingFavs ? (
              <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground bg-card shadow-sm">{t("favoritesTab.empty")}</div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {paginatedFavs.map((p) => (
                    <div key={p.id} className="group relative overflow-hidden rounded-xl border bg-card transition-all shadow-sm hover:shadow-md">
                      <div className="relative h-48 w-full overflow-hidden">
                        <Image src={getImageUrl(p.images)} alt={p.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                        <button onClick={(e) => { e.preventDefault(); removeFavorite(p.id); }} className="absolute right-3 top-3 rounded-full bg-white p-1.5 text-red-500 z-20 shadow-sm transition-transform hover:scale-110">
                          <Heart className="h-4 w-4 fill-current" />
                        </button>
                        <Link href={l(`/biens/${p.id}`)} className="absolute inset-0 z-10" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{p.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" /> {p.city}</p>
                        <p className="font-bold text-primary">{formatPrice(p.price, p.transaction_type)}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Pagination currentPage={currentFavPage} totalPages={totalFavPages} onPageChange={setCurrentFavPage} textPage={t("pagination.page")} textOf={t("pagination.of")} />
              </div>
            )}
          </div>
        )}

        {/* 🌟 ONGLET NOTIFICATIONS 🌟 */}
        {agenceTab === "notifications" && (
            <div className="flex flex-col gap-3">
                <div className="mb-2 flex justify-between items-center">
                    <h2 className="text-lg font-semibold font-serif">
                      <span>{t("notificationsTab.title")} </span>
                      <span>({agencyNotifications.length})</span>
                    </h2>
                </div>

                {loadingNotifs ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                ) : paginatedNotifs.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground bg-card shadow-sm flex flex-col items-center justify-center gap-3">
                        <Heart className="h-8 w-8 text-muted-foreground opacity-30" />
                        <p>{t("notificationsTab.empty")}</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {paginatedNotifs.map((notif: any) => (
                            <div key={notif.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 transition-colors">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
                                        <Heart className="h-5 w-5 fill-current" />
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-sm text-foreground">
                                            <span className="font-semibold">{notif.user_name}</span> <span>{t("notificationsTab.addedToFav")}</span>
                                        </p>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                                            <Link href={l(`/biens/${notif.property_id}`)} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                                <Building2 className="h-3.5 w-3.5" />
                                                {notif.property_title}
                                            </Link>
                                            
                                            <span className="hidden sm:inline text-muted-foreground">•</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <User className="h-3 w-3" /> {notif.user_email}
                                            </span>
                                            
                                            {notif.user_phone && (
                                              <>
                                                <span className="hidden sm:inline text-muted-foreground">•</span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Phone className="h-3 w-3" /> {notif.user_phone}
                                                </span>
                                              </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs text-muted-foreground whitespace-nowrap self-end sm:self-center bg-secondary px-2 py-1 rounded-md">
                                    {new Date(notif.created_at).toLocaleDateString(currentLocale === 'en' ? 'en-US' : currentLocale === 'ar' ? 'ar-MA' : 'fr-FR', {
                                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        ))}

                        <Pagination currentPage={currentNotifPage} totalPages={totalNotifPages} onPageChange={setCurrentNotifPage} textPage={t("pagination.page")} textOf={t("pagination.of")} />
                    </div>
                )}
            </div>
        )}

        {/* 🌟 ONGLET MESSAGES 🌟 */}
        {agenceTab === "messages" && (
          <div className="flex flex-col md:flex-row gap-0 md:gap-4 h-[calc(100vh-200px)] min-h-[500px] border border-border rounded-xl bg-card overflow-hidden shadow-sm relative">
            
            {/* Liste des conversations */}
            <div className={`w-full md:w-1/3 border-r border-border flex flex-col bg-card absolute md:relative inset-0 z-20 md:z-0 ${selectedThreadId ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-border bg-secondary/30 font-semibold shrink-0">
                {t("messagesTab.conversations")}
              </div>
              <div className="overflow-y-auto flex-1 p-2 space-y-1">
                {conversationList.map((contact: any) => (
                  <button key={contact.threadId} onClick={() => setSelectedThreadId(contact.threadId)}
                    className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${selectedThreadId === contact.threadId ? 'bg-primary/10' : 'hover:bg-secondary/50'}`}>
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="font-semibold text-sm truncate text-foreground">{contact.displayName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {contact.messages.length > 0 ? contact.messages[contact.messages.length - 1].message : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Zone de Chat Active */}
            <div className={`flex-1 flex flex-col bg-[#f0f2f5] dark:bg-secondary/10 absolute md:relative inset-0 z-30 md:z-0 h-full w-full ${!selectedThreadId ? 'hidden md:flex' : 'flex'}`}>
              {activeThread ? (
                <>
                  <div className="p-3 md:p-4 bg-card border-b border-border flex items-center gap-3 shadow-sm z-10 shrink-0">
                    <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setSelectedThreadId(null)}>
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground shrink-0">
                      <User className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{activeThread.displayName}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {activeThread.displayEmail} {activeThread.phone ? ` • ${activeThread.phone}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                    {activeChatMessages.map((msg: any, index: number) => {
                      const amIVisitor = currentUser && activeThread.contact_email === currentUser.email;
                      let isMe = false;

                      if (amIVisitor) {
                          isMe = msg.name !== "Propriétaire" && msg.name !== "Agence" && msg.name !== "Admin";
                      } else {
                          isMe = msg.name === "Propriétaire" || msg.name === "Agence" || msg.name === "Admin";
                      }
                      
                      return (
                        <div key={`${msg.id}-${index}`} className={`flex flex-col group max-w-[85%] md:max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                          {!isMe && msg.property && amIVisitor === false && (
                            <span className="text-[10px] text-muted-foreground mb-1 ml-1 flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> <span>{t("messagesTab.aboutAd")} </span> <span>{msg.property.title}</span>
                            </span>
                          )}
                          <div className="flex items-center gap-2">
                            {isMe && (
                              <button onClick={() => handleDeleteMyMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full hidden md:block">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                            <div className={`p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-card border border-border text-foreground rounded-tl-sm'}`}>
                              {msg.message}
                            </div>
                            {!isMe && (
                              <button onClick={() => handleDeleteMyMessage(msg.id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full hidden md:block">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground mt-1 mx-1">
                            {new Date(msg.created_at).toLocaleTimeString(currentLocale === 'en' ? 'en-US' : currentLocale === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="p-3 bg-card border-t border-border shrink-0 mt-auto">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendReply(); }} className="flex items-center gap-2">
                      <input type="text" placeholder={t("messagesTab.placeholder")} className="flex-1 rounded-full border border-border bg-secondary/50 px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                      <Button type="submit" size="icon" className="rounded-full shrink-0" disabled={!replyText.trim() || sendingReply}>
                        {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center hidden md:flex">
                  <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                  <p>{t("messagesTab.empty")}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🌟 ONGLET STATISTIQUES 🌟 */}
        {agenceTab === "statistiques" && (
          <div className="flex flex-col gap-6">

            {/* Nouveaux KPIs Pertinents */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {[
                { label: t("statsTab.contactRate"), value: `${conversionRate}%`, icon: TrendingUp, sub: t("statsTab.contactRateSub") },
                { label: t("statsTab.avgViews"), value: avgViews, icon: Activity, sub: t("statsTab.avgViewsSub") },
                { label: t("statsTab.online"), value: publishedCount.toString(), icon: CheckCircle2, sub: t("statsTab.onlineSub") },
                { label: t("statsTab.pending"), value: pendingCount.toString(), icon: Clock, sub: t("statsTab.pendingSub") },
              ].map((kpi) => (
                <div key={kpi.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
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

              {/* Top Annonces */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-5 font-semibold text-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" /> {t("statsTab.topAdsTitle")}
                </h3>
                {loadingProps ? (
                  <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>
                ) : topProperties.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">{t("statsTab.emptyTopAds")}</p>
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
                            <span>{p.views_count || 0}</span> <span>{(p.views_count || 0) !== 1 ? t("statsTab.viewPlural") : t("statsTab.viewSingular")}</span>
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Répartition Portefeuille */}
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-5 font-semibold text-foreground flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" /> {t("statsTab.portfolioTitle")}
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("statsTab.forSale")}</span>
                    <span className="font-bold">{ventesCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("statsTab.forRent")}</span>
                    <span className="font-bold">{locationsCount}</span>
                  </div>
                  
                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden flex mt-2">
                    <div style={{width: `${myProperties.length ? (ventesCount/myProperties.length)*100 : 0}%`}} className="bg-primary h-full transition-all duration-500"/>
                    <div style={{width: `${myProperties.length ? (locationsCount/myProperties.length)*100 : 0}%`}} className="bg-blue-400 h-full transition-all duration-500"/>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary block"></span> {t("statsTab.sale")}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 block"></span> {t("statsTab.rent")}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  )
}