"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { 
  Users, Building2, AlertTriangle, Clock, Settings, 
  CheckCircle2, Trash2, Loader2, ChevronLeft, 
  ChevronRight, Eye, Heart, Mail, User, Phone,
  Home, MessageSquare, BarChart3, TrendingUp, Send, Plus, 
  Activity, PieChart, Store, MapPin, Edit, Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/data"
import api from "@/services/api"

type AdminTab = "utilisateurs" | "annonces" | "signalements" | "statistiques" | "contacts" | "mes_annonces" | "mes_messages" | "mes_statistiques" | "favoris" | "notifications"

const API_URL = "http://127.0.0.1:8000";
const ITEMS_PER_PAGE = 5; 

export function AdminDashboard() {
  const [adminTab, setAdminTab] = useState<AdminTab>("utilisateurs")
  
  // --- ÉTATS DES DONNÉES ---
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])
  
  const [myProperties, setMyProperties] = useState<any[]>([])
  const [allMyMessages, setAllMyMessages] = useState<any[]>([])

  // 🌟 NOUVEAUX ÉTATS POUR LES NOTIFICATIONS 🌟
  const [agencyNotifications, setAgencyNotifications] = useState<any[]>([])
  const [loadingNotifs, setLoadingNotifs] = useState(false)
  const [currentNotifPage, setCurrentNotifPage] = useState(1)

  // --- CHAT ETAT ---
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState("")
  const [sendingReply, setSendingReply] = useState(false)

  // --- ÉTATS DE CHARGEMENT ---
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingProps, setLoadingProps] = useState(false)
  const [loadingReports, setLoadingReports] = useState(false)
  const [loadingFavs, setLoadingFavs] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [loadingMyProps, setLoadingMyProps] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  // --- ÉTATS DE PAGINATION ---
  const [userPage, setUserPage] = useState(1)
  const [propPage, setPropPage] = useState(1)
  const [reportPage, setReportPage] = useState(1)
  const [favPage, setFavPage] = useState(1)
  const [contactPage, setContactPage] = useState(1)
  const [myPropPage, setMyPropPage] = useState(1)

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setCurrentUser(JSON.parse(userStr));

    fetchUsers()
    fetchProperties()
    fetchReports()
    fetchFavorites()
    fetchContacts()
    fetchMyProperties()
    fetchUnifiedMessages()
    fetchAgencyNotifications() // <-- LIGNE AJOUTÉE
  }, [])

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try { const res = await api.get('/users'); setUsers(res.data) } catch (e) {} finally { setLoadingUsers(false) }
  }

  const fetchProperties = async () => {
    setLoadingProps(true)
    try { 
        const res = await api.get('/admin/properties')
        const sorted = res.data.sort((a: any, b: any) => {
            if (a.status === 'en attente' && b.status !== 'en attente') return -1;
            if (a.status !== 'en attente' && b.status === 'en attente') return 1;
            return 0;
        });
        setProperties(sorted)
    } catch (e) {} finally { setLoadingProps(false) }
  }

  const fetchReports = async () => {
    setLoadingReports(true)
    try { const res = await api.get('/reports'); setReports(res.data) } catch (e) {} finally { setLoadingReports(false) }
  }

  const fetchFavorites = async () => {
    setLoadingFavs(true)
    try { const res = await api.get('/my-favorites'); setFavorites(res.data) } catch (e) {} finally { setLoadingFavs(false) }
  }

  const fetchContacts = async () => {
    setLoadingContacts(true)
    try { 
        const res = await api.get('/admin/contacts')
        const sortedContacts = res.data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setContacts(sortedContacts)
    } catch (e) {} finally { setLoadingContacts(false) }
  }

  const fetchMyProperties = async () => {
    setLoadingMyProps(true)
    try { const res = await api.get('/my-properties'); setMyProperties(res.data); } catch (e) {} finally { setLoadingMyProps(false) }
  }

  const fetchUnifiedMessages = async () => {
    setLoadingMessages(true);
    try {
      const [received, sent] = await Promise.all([
        api.get('/my-received-messages'),
        api.get('/my-sent-messages')
      ]);
      
      const allMessages = [...received.data, ...sent.data];
      const uniqueMessages = Array.from(new Map(allMessages.map(m => [m.id, m])).values());
      
      setAllMyMessages(uniqueMessages);
    } catch (e) {
      console.error("Erreur messages unifiés", e);
    } finally { setLoadingMessages(false); }
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

  // --- ACTIONS ADMIN ---
  const handleValidate = async (id: number) => {
    try {
      await api.patch(`/admin/properties/${id}/validate`) 
      setProperties(prev => {
          const updated = prev.map(p => p.id === id ? { ...p, status: 'publié' } : p);
          return [...updated].sort((a: any, b: any) => {
            if (a.status === 'en attente' && b.status !== 'en attente') return -1;
            if (a.status !== 'en attente' && b.status === 'en attente') return 1;
            return 0;
        });
      });
    } catch (err) { alert("Erreur lors de la validation") }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer définitivement cette annonce ?")) return
    try {
      await api.delete(`/admin/properties/${id}`)
      setProperties(prev => prev.filter(p => p.id !== id))
      setMyProperties(prev => prev.filter(p => p.id !== id))
    } catch (err) { alert("Erreur suppression") }
  }

  const handleDeleteContact = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce message ?")) return
    try {
      await api.delete(`/admin/contacts/${id}`)
      setContacts(prev => prev.filter(c => c.id !== id))
    } catch (err) { alert("Erreur lors de la suppression") }
  }

  const handleDeleteReport = async (id: number) => {
    if (!confirm("Voulez-vous supprimer ce signalement ?")) return
    try {
        await api.delete(`/reports/${id}`)
        setReports(prev => prev.filter(r => r.id !== id))
    } catch (err) { alert("Erreur suppression") }
  }

  const handleDeleteMyProp = async (id: number) => {
    if (!confirm("Supprimer définitivement votre annonce ?")) return
    try {
      await api.delete(`/properties/${id}`)
      setMyProperties(prev => prev.filter(p => p.id !== id))
      setProperties(prev => prev.filter(p => p.id !== id))
    } catch (err) { alert("Erreur suppression") }
  }

  // 🌟 SUPPRIMER DES FAVORIS 🌟
  const removeFavorite = async (id: number) => {
    try {
      await api.post(`/properties/${id}/favorite`)
      setFavorites(prev => prev.filter(p => p.id !== id))
    } catch (err) { console.error("Erreur retrait favori", err) }
  }

  const handleDeleteMyMessage = async (messageId: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce message ?")) return;
    try {
      await api.delete(`/messages/${messageId}`);
      setAllMyMessages(prev => {
        const filtered = prev.filter(m => m.id !== messageId);
        const threadStillExists = filtered.some(m => `${m.property_id}_${m.email}` === selectedThreadId);
        if (!threadStillExists) setSelectedThreadId(null);
        return filtered;
      });
    } catch (err) { alert("Impossible de supprimer."); }
  }

  const groupedConversations = allMyMessages.reduce((acc, msg) => {
    const threadId = `${msg.property_id}_${msg.email}`;
    
    if (!acc[threadId]) {
      const amIVisitor = currentUser && msg.email === currentUser.email;
      
      let dName = "";
      let dEmail = "";

      if (amIVisitor) {
          dName = `Annonce : ${msg.property?.title || 'Bien #' + msg.property_id}`;
          dEmail = "Discussion avec l'annonceur";
      } else {
          dName = (msg.name !== 'Propriétaire' && msg.name !== 'Agence') ? msg.name : 'Client';
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
      const nameToSend = amIVisitor ? currentUser.name : "Propriétaire";
      
      await api.post(`/properties/${activeThread.property_id}/message`, { 
          name: nameToSend, 
          email: activeThread.contact_email, 
          message: replyText 
      });
      
      fetchUnifiedMessages();
      setReplyText("");
    } catch (e: any) {
      alert("Erreur lors de l'envoi.");
    } finally { setSendingReply(false); }
  }

  // --- STATISTIQUES GLOBALES DU SITE ---
  const totalSiteViews = properties.reduce((sum: number, p: any) => sum + Number(p.views_count || 0), 0)
  const publishedCount = properties.filter(p => p.status === 'publié').length
  const pendingCount = properties.filter(p => p.status === 'en attente').length
  const siteConversionRate = totalSiteViews > 0 ? ((contacts.length / totalSiteViews) * 100).toFixed(2) : "0.00"
  
  const totalVentes = properties.filter(p => strContainsSafe(p.transaction_type, 'vente')).length
  const totalLocations = properties.filter(p => strContainsSafe(p.transaction_type, 'location')).length
  
  const clientsCount = users.filter(u => u.role === 'client').length
  const agencesCount = users.filter(u => u.role === 'agence').length
  const propsCount = users.filter(u => u.role === 'proprietaire').length

  const topPropertiesAdmin = [...properties].sort((a, b) => Number(b.views_count || 0) - Number(a.views_count || 0)).slice(0, 5)
  const maxAdminViews = topPropertiesAdmin.length > 0 ? Number(topPropertiesAdmin[0].views_count || 1) : 1

  // --- STATISTIQUES PERSONNELLES ---
  const myTotalViews = myProperties.reduce((sum: number, p: any) => sum + Number(p.views_count || 0), 0)
  const myTotalContacts = conversationList.filter((c:any) => currentUser && c.contact_email !== currentUser.email).length;
  const myConversionRate = myTotalViews > 0 ? ((myTotalContacts / myTotalViews) * 100).toFixed(2) : "0.00"
  const myPublishedCount = myProperties.filter(p => p.status === 'publié').length
  const myPendingCount = myProperties.filter(p => p.status !== 'publié').length
  
  const myVentesCount = myProperties.filter(p => strContainsSafe(p.transaction_type, 'vente')).length
  const myLocationsCount = myProperties.filter(p => strContainsSafe(p.transaction_type, 'location')).length
  const myAvgViews = myProperties.length > 0 ? (myTotalViews / myProperties.length).toFixed(1) : "0"

  const myTopProperties = [...myProperties].sort((a, b) => Number(b.views_count || 0) - Number(a.views_count || 0)).slice(0, 5)
  const myMaxViews = myTopProperties.length > 0 ? Number(myTopProperties[0].views_count || 1) : 1

  function strContainsSafe(val: any, search: string) {
      if (!val) return false;
      return val.toString().toLowerCase().includes(search.toLowerCase());
  }

  const paginate = (data: any[], page: number) => data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const getPages = (data: any[]) => Math.ceil(data.length / ITEMS_PER_PAGE)

  // 🌟 PAGINATION DES NOTIFICATIONS 🌟
  const paginatedNotifs = agencyNotifications.slice((currentNotifPage - 1) * ITEMS_PER_PAGE, currentNotifPage * ITEMS_PER_PAGE)
  const totalNotifPages = Math.ceil(agencyNotifications.length / ITEMS_PER_PAGE)

  const getImageUrl = (imagesData: any) => {
    if (!imagesData) return "/placeholder.jpg";
    let images = typeof imagesData === 'string' ? JSON.parse(imagesData) : imagesData;
    let path = (Array.isArray(images) && images.length > 0) ? images[0] : "/placeholder.jpg";
    if (path.startsWith("http") || path.startsWith("/images")) return path;
    return `${API_URL}${path}`;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      
      {/* 🌟 STATS RAPIDES (En premier sur mobile, cachées sur desktop car gérées à droite) 🌟 */}
      <div className="lg:hidden grid grid-cols-2 sm:grid-cols-3 gap-4 mb-2">
        {[
          { label: "Utilisateurs", value: users.length, icon: Users, color: "" },
          { label: "Annonces", value: properties.length, icon: Building2, color: "" },
          { label: "À valider", value: pendingCount, icon: Clock, color: pendingCount > 0 ? "border-orange-200 bg-orange-50/50 text-orange-600" : "" }, 
          { label: "Signalements", value: reports.length, icon: AlertTriangle, color: reports.length > 0 ? "border-red-200 bg-red-50/50 text-red-600" : "" }, 
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border border-border bg-card p-4 shadow-sm ${stat.color}`}>
            <div className="flex items-center justify-between mb-1">
              <stat.icon className={`h-4 w-4 ${stat.color ? "opacity-80" : "text-primary"}`} />
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
            <p className="text-[10px] font-medium opacity-80 uppercase">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* 🌟 LAYOUT À GAUCHE : SIDEBAR DE NAVIGATION 🌟 */}
      <aside className="w-full lg:w-64 shrink-0">
        <div className="sticky top-20 flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible rounded-2xl border border-border bg-card p-3 shadow-sm custom-scrollbar">
          
          <h3 className="hidden lg:block px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Administration</h3>

          {[
            { key: "utilisateurs", label: "Utilisateurs", icon: Users },
            { key: "annonces", label: "Annonces du site", icon: Building2 },
            { key: "signalements", label: "Signalements", icon: AlertTriangle, count: reports.length, alert: true },
            { key: "statistiques", label: "Stats Globales", icon: PieChart },
            { key: "contacts", label: "Contacts Site", icon: Mail },
            { type: "divider" }, 
            { type: "title", label: "Espace Personnel" }, 
            { key: "mes_annonces", label: "Mes Annonces", icon: Home },
            { key: "mes_messages", label: "Mes Messages", icon: MessageSquare, count: conversationList.length },
            { key: "mes_statistiques", label: "Mes Statistiques", icon: Activity }, 
            { key: "notifications", label: "Activités", icon: Bell, count: agencyNotifications.length },
            { key: "favoris", label: "Mes Favoris", icon: Heart },
          ].map((tab, idx) => {
            if (tab.type === "divider") {
              return <div key={`div-${idx}`} className="hidden lg:block h-px w-full bg-border my-2" />
            }
            if (tab.type === "title") {
              return <h3 key={`title-${idx}`} className="hidden lg:block px-3 pt-4 pb-2 text-xs font-bold uppercase tracking-wider text-primary">{tab.label}</h3>
            }
            
            const isActive = adminTab === tab.key;
            const Icon = tab.icon;

            return (
              <button
                key={tab.key}
                onClick={() => { setAdminTab(tab.key as AdminTab); if (tab.key !== "mes_messages") setSelectedThreadId(null); }}
                className={`flex items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all whitespace-nowrap ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-3">
                  {Icon && <Icon className={`h-4 w-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />} 
                  {tab.label}
                </div>
                
                {tab.count !== undefined && tab.count > 0 && (
                    <span className={`flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-bold ${
                        tab.alert ? "bg-red-500 text-white" : "bg-primary/20 text-primary"
                    }`}>
                        {tab.count}
                    </span>
                )}
              </button>
            )
          })}
        </div>
      </aside>

      {/* 🌟 CONTENU PRINCIPAL (DROITE) 🌟 */}
      <main className="flex-1 min-w-0 flex flex-col gap-6">

        {/* --- STATISTIQUES RAPIDES (Desktop Uniquement) --- */}
        <div className="hidden lg:grid grid-cols-5 gap-4">
          {[
            { label: "Utilisateurs", value: users.length, icon: Users, color: "" },
            { label: "Total Annonces", value: properties.length, icon: Building2, color: "" },
            { label: "À valider", value: pendingCount, icon: Clock, color: pendingCount > 0 ? "border-orange-200 bg-orange-50/50 text-orange-600" : "" }, 
            { label: "Signalements", value: reports.length, icon: AlertTriangle, color: reports.length > 0 ? "border-red-200 bg-red-50/50 text-red-600" : "" }, 
            { label: "Contacts Site", value: contacts.length, icon: Mail, color: "" },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl border border-border bg-card p-4 transition-all shadow-sm ${stat.color}`}>
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color ? "opacity-80" : "text-primary"}`} />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs font-medium opacity-80">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* === ONGLET : UTILISATEURS === */}
        {adminTab === "utilisateurs" && (
          <div className="overflow-hidden rounded-xl border border-border bg-card flex flex-col shadow-sm">
            {loadingUsers ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : (
              <>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                          <thead className="border-b border-border bg-secondary/50">
                          <tr>
                              <th className="px-4 py-3 text-left font-medium">ID</th>
                              <th className="px-4 py-3 text-left font-medium">Nom</th>
                              <th className="px-4 py-3 text-left font-medium">Email</th>
                              <th className="px-4 py-3 text-left font-medium">Rôle</th>
                              <th className="px-4 py-3 text-right font-medium">Actions</th>
                          </tr>
                          </thead>
                          <tbody>
                          {users.length === 0 ? (
                              <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Aucun utilisateur.</td></tr>
                          ) : (
                              paginate(users, userPage).map((user) => (
                                  <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                                    <td className="px-4 py-3 text-muted-foreground">#{user.id}</td>
                                    <td className="px-4 py-3 font-medium">{user.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                                    <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{user.role || 'user'}</Badge></td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="ghost" size="icon"><Settings className="h-4 w-4 text-muted-foreground" /></Button>
                                    </td>
                                  </tr>
                              ))
                          )}
                          </tbody>
                      </table>
                  </div>
                  {getPages(users) > 1 && (
                      <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
                          <Button variant="outline" size="icon" onClick={() => setUserPage(p => Math.max(p - 1, 1))} disabled={userPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                          <span className="text-sm px-2 text-muted-foreground">Page {userPage} sur {getPages(users)}</span>
                          <Button variant="outline" size="icon" onClick={() => setUserPage(p => Math.min(p + 1, getPages(users)))} disabled={userPage === getPages(users)}><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                  )}
              </>
            )}
          </div>
        )}

        {/* === ONGLET : TOUTES LES ANNONCES DU SITE === */}
        {adminTab === "annonces" && (
          <div className="flex flex-col gap-4">
            {loadingProps ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : (
              <div className="flex flex-col gap-4">
                  {properties.length === 0 ? <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground shadow-sm bg-card">Aucune annonce.</div> : 
                  paginate(properties, propPage).map((p) => (
                  <div key={p.id} className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 transition-all shadow-sm hover:shadow-md group">
                      
                      <Link href={`/biens/${p.id}`} className="relative h-48 sm:h-32 w-full sm:w-48 shrink-0 overflow-hidden rounded-lg bg-secondary block hover:opacity-90">
                          <Image src={getImageUrl(p.images)} alt={p.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                          <Badge variant={p.status === "publié" ? "default" : "secondary"} className={`absolute top-2 left-2 shadow-sm capitalize ${p.status === 'en attente' ? 'bg-orange-500 text-white' : ''}`}>
                            {p.status}
                          </Badge>
                      </Link>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <Link href={`/biens/${p.id}`} className="text-lg font-semibold hover:text-primary hover:underline truncate mb-1">
                            {p.title}
                          </Link>
                          <div className="text-sm text-muted-foreground mb-1">Par: <span className="font-medium text-foreground">{p.user?.name || 'Inconnu'}</span></div>
                          <div className="text-sm text-muted-foreground flex items-center gap-3 mb-2">
                              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.city}</span>
                              <span className="flex items-center gap-1 text-primary/80 font-medium">
                                <Eye className="h-3.5 w-3.5" /> {p.views_count || 0} vues
                              </span>
                          </div>
                          <p className="font-bold text-primary mt-auto">{formatPrice(p.price, p.transaction_type)}</p>
                      </div>
                      
                      <div className="flex sm:flex-col gap-3 shrink-0 mt-2 sm:mt-0 justify-center">
                          {p.status !== 'publié' && (
                              <Button variant="outline" className="flex-1 sm:flex-none h-12 sm:h-10 text-green-600 border-green-300 hover:bg-green-50 gap-2" onClick={() => handleValidate(p.id)}>
                                  <CheckCircle2 className="h-4 w-4" /> <span className="sm:hidden xl:inline">Valider</span>
                              </Button>
                          )}
                          <Button variant="outline" className="flex-1 sm:flex-none h-12 sm:h-10 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="h-4 w-4" /> <span className="sm:hidden xl:inline">Supprimer</span>
                          </Button>
                      </div>
                  </div>
                  ))}
                  {getPages(properties) > 1 && (
                      <div className="mt-4 flex justify-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => setPropPage(p => Math.max(p - 1, 1))} disabled={propPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                          <span className="text-sm px-2 flex items-center text-muted-foreground">{propPage} / {getPages(properties)}</span>
                          <Button variant="outline" size="icon" onClick={() => setPropPage(p => Math.min(p + 1, getPages(properties)))} disabled={propPage === getPages(properties)}><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* 🌟 === ONGLET : MES ANNONCES PERSONNELLES === 🌟 */}
        {adminTab === "mes_annonces" && (
          <div className="flex flex-col gap-4">
            <div className="mb-2 flex justify-between items-center">
              <h2 className="text-lg font-semibold font-serif">Vos propres annonces</h2>
              <Link href="/publier"><Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Publier</Button></Link>
            </div>
            {loadingMyProps ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : (
              <div className="flex flex-col gap-4">
                  {myProperties.length === 0 ? <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground shadow-sm bg-card">Vous n'avez publié aucune annonce.</div> : 
                  paginate(myProperties, myPropPage).map((p) => (
                  <div key={p.id} className="flex flex-col sm:flex-row gap-4 rounded-xl border border-border bg-card p-4 transition-all shadow-sm hover:shadow-md group">
                      
                      <Link href={`/biens/${p.id}`} className="relative h-48 sm:h-32 w-full sm:w-48 shrink-0 overflow-hidden rounded-lg bg-secondary block hover:opacity-90">
                          <Image src={getImageUrl(p.images)} alt={p.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                          <Badge variant={p.status === "publié" ? "default" : "secondary"} className={`absolute top-2 left-2 shadow-sm capitalize ${p.status === 'en attente' ? 'bg-orange-500 text-white' : ''}`}>
                            {p.status}
                          </Badge>
                      </Link>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <Link href={`/biens/${p.id}`} className="text-lg font-semibold hover:text-primary hover:underline truncate mb-1">
                            {p.title}
                          </Link>
                          <div className="text-sm text-muted-foreground flex items-center gap-3 mb-2">
                              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.city}</span>
                              <span className="flex items-center gap-1 text-primary/80 font-medium">
                                <Eye className="h-3.5 w-3.5" /> {p.views_count || 0} vues
                              </span>
                          </div>
                          <p className="font-bold text-primary mt-auto">{formatPrice(p.price, p.transaction_type)}</p>
                      </div>
                      
                      <div className="flex sm:flex-col gap-3 shrink-0 mt-2 sm:mt-0 justify-center">
                          <Link href={`/modifier/${p.id}`} className="flex-1 sm:flex-none">
                              <Button variant="outline" className="w-full h-12 sm:h-10 text-primary border-primary/30 hover:bg-primary/10 gap-2">
                                <Edit className="h-4 w-4" /> <span className="sm:hidden xl:inline">Modifier</span>
                              </Button>
                          </Link>
                          <Button variant="outline" className="flex-1 sm:flex-none h-12 sm:h-10 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleDeleteMyProp(p.id)}>
                              <Trash2 className="h-4 w-4" /> <span className="sm:hidden xl:inline">Supprimer</span>
                          </Button>
                      </div>
                  </div>
                  ))}
                  {getPages(myProperties) > 1 && (
                      <div className="mt-4 flex justify-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => setMyPropPage(p => Math.max(p - 1, 1))} disabled={myPropPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                          <span className="text-sm px-2 flex items-center text-muted-foreground">{myPropPage} / {getPages(myProperties)}</span>
                          <Button variant="outline" size="icon" onClick={() => setMyPropPage(p => Math.min(p + 1, getPages(myProperties)))} disabled={myPropPage === getPages(myProperties)}><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* 🌟 === ONGLET : STATISTIQUES GLOBALES DU SITE === 🌟 */}
        {adminTab === "statistiques" && (
          <div className="flex flex-col gap-6">

            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {[
                { label: "Vues Globales", value: totalSiteViews.toString(), icon: Eye, sub: "sur tout le site" },
                { label: "Annonces Actives", value: publishedCount.toString(), icon: Building2, sub: "en ligne" },
                { label: "Utilisateurs", value: users.length.toString(), icon: Users, sub: "inscrits" },
                { label: "Messages envoyés", value: contacts.length.toString(), icon: MessageSquare, sub: "via les formulaires" },
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
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-5 font-semibold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Typologie des membres
                </h3>
                <div className="flex flex-col gap-0">
                  {[
                    { label: "Clients (Chercheurs)", value: clientsCount.toString() },
                    { label: "Agences Immobilières", value: agencesCount.toString() },
                    { label: "Propriétaires Particuliers", value: propsCount.toString() },
                    { label: "Total Signalements", value: reports.length.toString() },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                      <span className="font-semibold text-foreground">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-5 font-semibold text-foreground flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" /> Répartition globale du marché
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Biens en Vente</span>
                    <span className="font-bold">{totalVentes}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Biens en Location</span>
                    <span className="font-bold">{totalLocations}</span>
                  </div>
                  
                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden flex mt-2">
                    <div style={{width: `${properties.length ? (totalVentes/properties.length)*100 : 0}%`}} className="bg-primary h-full transition-all duration-500"/>
                    <div style={{width: `${properties.length ? (totalLocations/properties.length)*100 : 0}%`}} className="bg-blue-400 h-full transition-all duration-500"/>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary block"></span> Vente</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 block"></span> Location</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🌟 === ONGLET : MES STATISTIQUES PERSONNELLES === 🌟 */}
        {adminTab === "mes_statistiques" && (
          <div className="flex flex-col gap-6">

            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              {[
                { label: "Taux de Contact", value: `${myConversionRate}%`, icon: TrendingUp, sub: "Vues → Contacts" },
                { label: "Moyenne Vues", value: myAvgViews, icon: Activity, sub: "Vues / Annonce" },
                { label: "Biens en ligne", value: myPublishedCount.toString(), icon: CheckCircle2, sub: "Publiés" },
                { label: "En Modération", value: myPendingCount.toString(), icon: Clock, sub: "En attente" },
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
              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-5 font-semibold text-foreground flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" /> Vos annonces les plus vues
                </h3>
                {loadingMyProps ? (
                  <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>
                ) : myTopProperties.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Aucune annonce.</p>
                ) : (
                  <div className="flex flex-col gap-4">
                    {myTopProperties.map((p) => {
                      const pct = myMaxViews > 0 ? Math.max(((p.views_count || 0) / myMaxViews) * 100, 2) : 2
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

              <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-5 font-semibold text-foreground flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" /> Répartition de votre portefeuille
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Biens en Vente</span>
                    <span className="font-bold">{myVentesCount}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Biens en Location</span>
                    <span className="font-bold">{myLocationsCount}</span>
                  </div>
                  
                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden flex mt-2">
                    <div style={{width: `${myProperties.length ? (myVentesCount/myProperties.length)*100 : 0}%`}} className="bg-primary h-full transition-all duration-500"/>
                    <div style={{width: `${myProperties.length ? (myLocationsCount/myProperties.length)*100 : 0}%`}} className="bg-blue-400 h-full transition-all duration-500"/>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary block"></span> Vente</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 block"></span> Location</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🌟 === ONGLET : MES MESSAGES (CHAT FIXE POUR MOBILE) === 🌟 */}
        {adminTab === "mes_messages" && (
          <div className="flex flex-col md:flex-row h-[75vh] min-h-[500px] border border-border rounded-xl bg-card overflow-hidden shadow-sm relative">
            
            <div className={`w-full md:w-1/3 border-r border-border flex flex-col bg-card absolute md:relative inset-0 z-20 md:z-0 ${selectedThreadId ? 'hidden md:flex' : 'flex'}`}>
              <div className="p-4 border-b border-border bg-secondary/30 font-semibold shrink-0">Conversations Personnelles</div>
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
                          isMe = msg.name !== "Propriétaire" && msg.name !== "Agence";
                      } else {
                          isMe = msg.name === "Propriétaire" || msg.name === "Agence";
                      }
                      
                      return (
                        <div key={`${msg.id}-${index}`} className={`flex flex-col group max-w-[85%] md:max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                          {!isMe && msg.property && amIVisitor === false && (
                            <span className="text-[10px] text-muted-foreground mb-1 ml-1 flex items-center gap-1">
                              <Building2 className="h-3 w-3" /> Concernant : {msg.property.title}
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
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  <div className="p-3 bg-card border-t border-border shrink-0 mt-auto">
                    <form onSubmit={(e) => { e.preventDefault(); handleSendReply(); }} className="flex items-center gap-2">
                      <input type="text" placeholder="Écrire un message..." className="flex-1 rounded-full border border-border bg-secondary/50 px-4 py-3 md:py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary" value={replyText} onChange={(e) => setReplyText(e.target.value)} />
                      <Button type="submit" size="icon" className="rounded-full shrink-0 h-10 w-10 md:h-9 md:w-9" disabled={!replyText.trim() || sendingReply}>
                        {sendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-6 text-center hidden md:flex">
                  <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                  <p>Sélectionnez une discussion.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 🌟 NOUVEL ONGLET : NOTIFICATIONS (Activités) 🌟 */}
        {adminTab === "notifications" && (
            <div className="flex flex-col gap-3">
                <div className="mb-2 flex justify-between items-center">
                    <h2 className="text-lg font-semibold font-serif">Activité sur vos annonces ({agencyNotifications.length})</h2>
                </div>

                {loadingNotifs ? (
                    <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div>
                ) : paginatedNotifs.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-xl text-muted-foreground bg-card shadow-sm flex flex-col items-center justify-center gap-3">
                        <Heart className="h-8 w-8 text-muted-foreground opacity-30" />
                        <p>Personne n'a encore ajouté vos biens en favoris.</p>
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
                                            <span className="font-semibold">{notif.user_name}</span> a ajouté votre annonce à ses favoris.
                                        </p>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                                            <Link href={`/biens/${notif.property_id}`} className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
                                                <Building2 className="h-3.5 w-3.5" />
                                                {notif.property_title}
                                            </Link>
                                            
                                            <span className="hidden sm:inline text-muted-foreground">•</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <User className="h-3 w-3" /> {notif.user_email}
                                            </span>
                                            
                                            {/* Téléphone affiché s'il existe */}
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
                                    {new Date(notif.created_at).toLocaleDateString('fr-FR', {
                                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Pagination stricte (1 et 2 maximum) */}
                        {totalNotifPages > 1 && (
                            <div className="mt-6 flex items-center justify-center gap-2">
                              <Button variant="outline" size="icon" onClick={() => setCurrentNotifPage(p => Math.max(p - 1, 1))} disabled={currentNotifPage === 1}>
                                <ChevronLeft className="h-4 w-4" />
                              </Button>

                              {Array.from({ length: totalNotifPages }, (_, i) => i + 1)
                                .filter(p => {
                                  if (currentNotifPage === totalNotifPages) return p === totalNotifPages || p === totalNotifPages - 1;
                                  return p === currentNotifPage || p === currentNotifPage + 1;
                                })
                                .map((p) => (
                                  <Button key={p} variant={currentNotifPage === p ? "default" : "outline"} className="h-9 w-9 p-0" onClick={() => setCurrentNotifPage(p)}>
                                    {p}
                                  </Button>
                                ))
                              }

                              <Button variant="outline" size="icon" onClick={() => setCurrentNotifPage(p => Math.min(p + 1, totalNotifPages))} disabled={currentNotifPage === totalNotifPages}>
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}

        {/* 🌟 ONGLET : FAVORIS (FIX CORRIGÉ) 🌟 */}
        {adminTab === "favoris" && (
          <div className="flex flex-col gap-3">
            {loadingFavs ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : (
              <>
                  {favorites.length === 0 ? <div className="text-center py-10 border border-dashed rounded-xl shadow-sm bg-card">Aucun favori.</div> : 
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {paginate(favorites, favPage).map((f) => (
                    <div key={f.id} className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all shadow-sm hover:shadow-md">
                        <div className="relative h-48 w-full overflow-hidden bg-secondary">
                            <Image src={getImageUrl(f.images)} alt={f.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized />
                        </div>
                        <div className="p-4 flex-1">
                            <Link href={`/biens/${f.id}`} className="text-sm font-semibold hover:text-primary hover:underline truncate block">{f.title}</Link>
                            <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" /> {f.city}</div>
                            <p className="font-bold text-primary mt-2">{formatPrice(f.price, f.transaction_type)}</p>
                        </div>
                        <div className="absolute right-3 top-3 z-20">
                            <Button variant="ghost" size="icon" className="rounded-full bg-white/90 text-red-500 hover:bg-white hover:scale-110 shadow-sm transition-all" onClick={(e) => { e.preventDefault(); removeFavorite(f.id); }}>
                              <Heart className="h-5 w-5 fill-current" />
                            </Button>
                        </div>
                        <Link href={`/biens/${f.id}`} className="absolute inset-0 z-10" />
                    </div>
                    ))}
                  </div>
                  }
                  {getPages(favorites) > 1 && (
                      <div className="mt-6 flex justify-center gap-2">
                          <Button variant="outline" size="icon" onClick={() => setFavPage(p => Math.max(p - 1, 1))} disabled={favPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                          <Button variant="outline" size="icon" onClick={() => setFavPage(p => Math.min(p + 1, getPages(favorites)))} disabled={favPage === getPages(favorites)}><ChevronRight className="h-4 w-4" /></Button>
                      </div>
                  )}
              </>
            )}
          </div>
        )}

        {/* ONGLET : CONTACTS SITE */}
        {adminTab === "contacts" && (
          <div className="flex flex-col gap-4">
            {loadingContacts ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-primary" />
              </div>
            ) : (
              <>
                {contacts.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground shadow-sm bg-card">
                    Aucun message de contact au site.
                  </div>
                ) : (
                  paginate(contacts, contactPage).map((c) => (
                    <div key={c.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-sm font-semibold text-foreground capitalize">
                            <User className="h-4 w-4 text-primary" /> {c.nom} {c.prenom}
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {new Date(c.created_at).toLocaleDateString("fr-FR", {
                              day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
                            })}
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 text-destructive hover:bg-destructive/10 h-8 w-8 -mt-1 -mr-1"
                          onClick={() => handleDeleteContact(c.id)}
                          title="Supprimer ce message"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" />
                          <a href={`mailto:${c.email}`} className="hover:text-primary hover:underline">{c.email}</a>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" />
                          <a href={`tel:${c.telephone}`} className="hover:text-primary hover:underline">{c.telephone}</a>
                        </div>
                      </div>

                      <div className="mt-2 rounded-lg bg-secondary/30 p-4 border border-border/50">
                        <h4 className="text-sm font-semibold text-foreground mb-2">Sujet : {c.sujet}</h4>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap leading-relaxed">{c.message}</p>
                      </div>
                    </div>
                  ))
                )}

                {getPages(contacts) > 1 && (
                  <div className="mt-4 flex justify-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setContactPage((p) => Math.max(p - 1, 1))} disabled={contactPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                    <span className="text-sm px-2 flex items-center text-muted-foreground">{contactPage} / {getPages(contacts)}</span>
                    <Button variant="outline" size="icon" onClick={() => setContactPage((p) => Math.min(p + 1, getPages(contacts)))} disabled={contactPage === getPages(contacts)}><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

{/* 🌟 ONGLET : SIGNALEMENTS (AJUSTÉ POUR MOBILE) 🌟 */}
        {adminTab === "signalements" && (
          <div className="flex flex-col gap-3">
              {loadingReports ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : (
                  <>
                      {reports.length === 0 ? <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground shadow-sm bg-card">Aucun signalement en attente.</div> :
                      paginate(reports, reportPage).map((report) => (
                          <div key={report.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-xl border border-red-200 bg-red-50/20 p-5 transition-all shadow-sm hover:shadow-md">
                              
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                                  <AlertTriangle className="h-6 w-6 text-red-600" />
                              </div>
                              
                              <div className="flex-1 min-w-0 w-full">
                                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3">
                                      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                          Annonce : 
                                          {report.property_id ? (
                                              <Link href={`/biens/${report.property_id}`} className="text-primary hover:underline flex items-center gap-1 truncate">
                                                  {report.property_title || "Annonce supprimée"}
                                                  <Eye className="h-3 w-3 shrink-0" />
                                              </Link>
                                          ) : (
                                              <span className="text-primary truncate">{report.property_title || "Annonce supprimée"}</span>
                                          )}
                                      </h4>
                                      <Badge variant="outline" className="bg-white border-red-200 text-red-600 self-start sm:self-auto">{report.status || 'en attente'}</Badge>
                                  </div>
                                  
                                  <p className="text-sm text-foreground/90 italic bg-white p-3 rounded-md border border-red-100 mb-3 shadow-sm">
                                      "{report.reason}"
                                  </p>
                                  
                                  <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1.5">
                                      <User className="h-3.5 w-3.5" /> Signalé par <span className="font-medium">{report.reporter}</span>
                                      <span className="mx-1 hidden sm:inline">•</span>
                                      <Clock className="h-3.5 w-3.5 ml-0 sm:ml-2" /> {report.date}
                                  </div>
                              </div>

                              {/* 🌟 ZONE DES BOUTONS D'ACTION MODIFIÉE 🌟 */}
                              <div className="flex flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0 shrink-0">
                                  
                                  {/* BOUTON 1 : SUPPRIMER L'ANNONCE ENTIÈREMENT */}
                                  {report.property_id && (
                                      <Button 
                                          variant="destructive" 
                                          className="w-full sm:w-auto h-11 sm:h-9"
                                          onClick={() => {
                                              handleDelete(report.property_id);
                                              // On retire aussi le signalement de l'écran pour que ce soit propre
                                              setReports(prev => prev.filter(r => r.id !== report.id));
                                          }}
                                      >
                                          <Trash2 className="h-4 w-4 mr-2" /> Supprimer l'annonce
                                      </Button>
                                  )}

                                  {/* BOUTON 2 : IGNORER LE SIGNALEMENT (L'annonce reste en ligne) */}
                                  <Button 
                                      variant="outline" 
                                      className="w-full sm:w-auto h-11 sm:h-9 text-muted-foreground border-border hover:bg-secondary bg-white"
                                      onClick={() => handleDeleteReport(report.id)}
                                  >
                                      <CheckCircle2 className="h-4 w-4 mr-2" /> Ignorer le signalement
                                  </Button>
                              </div>
                          </div>
                      ))}

                      {getPages(reports) > 1 && (
                          <div className="mt-4 flex justify-center gap-2">
                              <Button variant="outline" size="icon" onClick={() => setReportPage(p => Math.max(p - 1, 1))} disabled={reportPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                              <span className="text-sm px-2 flex items-center text-muted-foreground">{reportPage} / {getPages(reports)}</span>
                              <Button variant="outline" size="icon" onClick={() => setReportPage(p => Math.min(p + 1, getPages(reports)))} disabled={reportPage === getPages(reports)}><ChevronRight className="h-4 w-4" /></Button>
                          </div>
                      )}
                  </>
              )}
          </div>
        )}

      </main>
    </div>
  )
}