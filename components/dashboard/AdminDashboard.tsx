"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { 
  Users, Building2, AlertTriangle, Clock, Settings, 
  CheckCircle2, Trash2, Loader2, ChevronLeft, 
  ChevronRight, Eye, Heart, Mail, User, Phone
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/data"
import api from "@/services/api"

type AdminTab = "utilisateurs" | "annonces" | "signalements" | "favoris" | "messages"

const API_URL = "http://127.0.0.1:8000";
const ITEMS_PER_PAGE = 5; 

export function AdminDashboard() {
  const [adminTab, setAdminTab] = useState<AdminTab>("utilisateurs")
  
  // --- ÉTATS DES DONNÉES ---
  const [users, setUsers] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])
  const [favorites, setFavorites] = useState<any[]>([])
  const [contacts, setContacts] = useState<any[]>([])

  // --- ÉTATS DE CHARGEMENT ---
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingProps, setLoadingProps] = useState(false)
  const [loadingReports, setLoadingReports] = useState(false)
  const [loadingFavs, setLoadingFavs] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)

  // --- ÉTATS DE PAGINATION ---
  const [userPage, setUserPage] = useState(1)
  const [propPage, setPropPage] = useState(1)
  const [reportPage, setReportPage] = useState(1)
  const [favPage, setFavPage] = useState(1)
  const [contactPage, setContactPage] = useState(1)

  // --- 1. CHARGEMENT INITIAL ---
  useEffect(() => {
    fetchUsers()
    fetchProperties()
    fetchReports()
    fetchFavorites()
    fetchContacts()
  }, [])

  // --- 2. FONCTIONS DE RÉCUPÉRATION ---
  
  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
        const res = await api.get('/users') 
        setUsers(res.data)
    } catch (err) { console.error("Erreur chargement utilisateurs", err) } 
    finally { setLoadingUsers(false) }
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
    } catch (err) { console.error("Erreur chargement annonces", err) } 
    finally { setLoadingProps(false) }
  }

  const fetchReports = async () => {
    setLoadingReports(true)
    try {
        const res = await api.get('/reports')
        setReports(res.data) 
    } catch (err) { console.error("Erreur chargement signalements", err) } 
    finally { setLoadingReports(false) }
  }

  const fetchFavorites = async () => {
    setLoadingFavs(true)
    try {
        const res = await api.get('/my-favorites') 
        setFavorites(res.data)
    } catch (err) { console.error("Erreur chargement favoris", err) } 
    finally { setLoadingFavs(false) }
  }

  const fetchContacts = async () => {
    setLoadingContacts(true)
    try {
        const res = await api.get('/admin/contacts') 
        const sortedContacts = res.data.sort((a: any, b: any) => {
             return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setContacts(sortedContacts)
    } catch (err) { 
        console.error("Erreur chargement contacts", err) 
    } finally { 
        setLoadingContacts(false) 
    }
  }

  // --- 3. ACTIONS ADMIN ---
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
    } catch (err) { alert("Erreur suppression") }
  }

  const handleDeleteContact = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce message ?")) return
    try {
      await api.delete(`/admin/contacts/${id}`)
      setContacts(prev => prev.filter(c => c.id !== id))
    } catch (err) { alert("Erreur lors de la suppression du message") }
  }

  const handleDeleteReport = async (id: number) => {
    if (!confirm("Voulez-vous supprimer ce signalement (marqué comme traité/ignoré) ?")) return
    try {
        await api.delete(`/reports/${id}`)
        setReports(prev => prev.filter(r => r.id !== id))
    } catch (err) { alert("Erreur lors de la suppression du signalement") }
  }

  // --- 4. LOGIQUE PAGINATION ---
  const paginate = (data: any[], page: number) => data.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const getPages = (data: any[]) => Math.ceil(data.length / ITEMS_PER_PAGE)

  // --- FONCTION IMAGE ---
  const getImageUrl = (imagesData: any) => {
    if (!imagesData) return "/placeholder.jpg";
    let images = typeof imagesData === 'string' ? JSON.parse(imagesData) : imagesData;
    let path = (Array.isArray(images) && images.length > 0) ? images[0] : "/placeholder.jpg";
    if (path.startsWith("http") || path.startsWith("/images")) return path;
    return `${API_URL}${path}`;
  }

  return (
    <>
      {/* Stats Admin Dynamiques avec ajout du Compteur Signalements */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Utilisateurs", value: users.length, icon: Users },
          { label: "Annonces", value: properties.length, icon: Building2 },
          { label: "En attente", value: properties.filter(p => p.status === 'en attente').length, icon: Clock },
          { label: "Favoris", value: favorites.length, icon: Heart },
          { label: "Messages", value: contacts.length, icon: Mail },
          { label: "Signalements", value: reports.length, icon: AlertTriangle }, // Compteur ajouté ici
        ].map((stat) => (
          <div key={stat.label} className={`rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm ${stat.label === "Signalements" && stat.value > 0 ? "border-red-200 bg-red-50/30" : ""}`}>
            <stat.icon className={`mb-2 h-5 w-5 ${stat.label === "Signalements" && stat.value > 0 ? "text-red-500" : "text-primary"}`} />
            <p className={`text-2xl font-bold ${stat.label === "Signalements" && stat.value > 0 ? "text-red-600" : "text-foreground"}`}>{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Onglets Admin avec un badge rouge sur l'onglet Signalements */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
        {[
          { key: "utilisateurs", label: "Utilisateurs", icon: Users },
          { key: "annonces", label: "Annonces", icon: Building2 },
          { key: "favoris", label: "Mes Favoris", icon: Heart },
          { key: "messages", label: "Messages", icon: Mail },
          { key: "signalements", label: "Signalements", icon: AlertTriangle, count: reports.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setAdminTab(tab.key as AdminTab)}
            className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              adminTab === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" /> 
            {tab.label}
            {/* Badge rouge dynamique pour les signalements */}
            {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                    {tab.count}
                </span>
            )}
          </button>
        ))}
      </div>

      {/* === ONGLET 1 : UTILISATEURS === */}
      {adminTab === "utilisateurs" && (
        <div className="overflow-hidden rounded-xl border border-border bg-card flex flex-col">
          {loadingUsers ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : (
            <>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="border-b border-border bg-secondary/50">
                        <tr>
                            <th className="px-4 py-3 text-left font-medium">ID</th>
                            <th className="px-4 py-3 text-left font-medium">Nom</th>
                            <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Email</th>
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
                                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{user.email}</td>
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

      {/* === ONGLET 2 : ANNONCES === */}
      {adminTab === "annonces" && (
        <div className="flex flex-col gap-3">
          {loadingProps ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : (
            <>
                {properties.length === 0 ? <div className="text-center py-10 border border-dashed rounded-xl">Aucune annonce.</div> : 
                paginate(properties, propPage).map((p) => (
                <div key={p.id} className="flex flex-col md:flex-row md:items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md group">
                    <Link href={`/biens/${p.id}`} className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary block hover:opacity-80">
                        <Image src={getImageUrl(p.images)} alt={p.title} fill className="object-cover" unoptimized />
                    </Link>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <Link href={`/biens/${p.id}`} className="text-sm font-semibold hover:text-primary hover:underline">{p.title}</Link>
                            <Badge variant={p.status === "publié" ? "default" : "secondary"} className="text-[10px] h-5 capitalize">{p.status}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">ID: #{p.id} • {p.city} {p.price && `• ${formatPrice(p.price, p.transaction_type)}`}</div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={`/biens/${p.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        {p.status !== 'publié' && (
                            <Button variant="outline" size="sm" className="gap-1 h-8 text-green-600 border-green-200" onClick={() => handleValidate(p.id)}>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Valider
                            </Button>
                        )}
                        <Button variant="outline" size="sm" className="gap-1 h-8 text-destructive border-destructive/20" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> Suppr.
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
            </>
          )}
        </div>
      )}

      {/* === ONGLET 3 : FAVORIS === */}
      {adminTab === "favoris" && (
        <div className="flex flex-col gap-3">
          {loadingFavs ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : (
            <>
                {favorites.length === 0 ? <div className="text-center py-10 border border-dashed rounded-xl">Aucun favori.</div> : 
                paginate(favorites, favPage).map((f) => (
                <div key={f.id} className="flex flex-col md:flex-row md:items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md">
                    <Link href={`/biens/${f.id}`} className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary block">
                        <Image src={getImageUrl(f.images)} alt={f.title} fill className="object-cover" unoptimized />
                    </Link>
                    <div className="flex-1">
                        <Link href={`/biens/${f.id}`} className="text-sm font-semibold hover:text-primary hover:underline">{f.title}</Link>
                        <div className="text-xs text-muted-foreground mt-1">{f.city}</div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-red-500"><Heart className="h-5 w-5 fill-current" /></Button>
                    </div>
                </div>
                ))}
                {getPages(favorites) > 1 && (
                    <div className="mt-4 flex justify-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setFavPage(p => Math.max(p - 1, 1))} disabled={favPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => setFavPage(p => Math.min(p + 1, getPages(favorites)))} disabled={favPage === getPages(favorites)}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                )}
            </>
          )}
        </div>
      )}

      {/* === ONGLET 4 : MESSAGES CONTACT === */}
      {adminTab === "messages" && (
        <div className="flex flex-col gap-4">
          {loadingContacts ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : (
            <>
              {contacts.length === 0 ? (
                <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground">
                  Aucun message de contact.
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

      {/* === ONGLET 5 : SIGNALEMENTS (MIS À JOUR AVEC LIEN CLIQUABLE) === */}
      {adminTab === "signalements" && (
        <div className="flex flex-col gap-3">
            {loadingReports ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : (
                <>
                    {reports.length === 0 ? <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground">Aucun signalement en attente.</div> :
                    paginate(reports, reportPage).map((report) => (
                        <div key={report.id} className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50/20 p-4 transition-all hover:shadow-md">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                        Annonce : 
                                        {/* LIEN CLIQUABLE VERS L'ANNONCE */}
                                        {report.property_id ? (
                                            <Link href={`/biens/${report.property_id}`} className="text-primary hover:underline flex items-center gap-1">
                                                {report.property_title || "Annonce supprimée/inconnue"}
                                                <Eye className="h-3 w-3" />
                                            </Link>
                                        ) : (
                                            <span className="text-primary">{report.property_title || "Annonce supprimée/inconnue"}</span>
                                        )}
                                    </h4>
                                    <Badge variant="outline" className="bg-white border-red-200 text-red-600">{report.status || 'en attente'}</Badge>
                                </div>
                                <p className="text-sm text-foreground/90 italic bg-white p-3 rounded-md border border-red-100 mb-2">
                                    "{report.reason}"
                                </p>
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <User className="h-3 w-3" /> Signalé par {report.reporter}
                                    <span className="mx-1">•</span>
                                    <Clock className="h-3 w-3" /> {report.date}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 ml-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 text-destructive hover:bg-destructive/10"
                                    onClick={() => handleDeleteReport(report.id)}
                                >
                                    <Trash2 className="h-4 w-4 mr-1" /> Ignorer
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Pagination Signalements */}
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
    </>
  )
}