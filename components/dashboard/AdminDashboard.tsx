"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Users, Building2, AlertTriangle, Clock, Settings, CheckCircle2, Trash2, Loader2, ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/data"
import api from "@/services/api"

type AdminTab = "utilisateurs" | "annonces" | "signalements"

const API_URL = "http://127.0.0.1:8000";
const ITEMS_PER_PAGE = 5; 

export function AdminDashboard() {
  const [adminTab, setAdminTab] = useState<AdminTab>("utilisateurs")
  
  // --- ÉTATS DES DONNÉES ---
  const [users, setUsers] = useState<any[]>([])
  const [properties, setProperties] = useState<any[]>([])
  const [reports, setReports] = useState<any[]>([])

  // --- ÉTATS DE CHARGEMENT ---
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingProps, setLoadingProps] = useState(false)
  const [loadingReports, setLoadingReports] = useState(false)

  // --- ÉTATS DE PAGINATION ---
  const [userPage, setUserPage] = useState(1)
  const [propPage, setPropPage] = useState(1)
  const [reportPage, setReportPage] = useState(1)

  // --- 1. CHARGEMENT INITIAL ---
  useEffect(() => {
    fetchUsers()
    fetchProperties()
    fetchReports()
  }, [])

  // --- 2. FONCTIONS DE RÉCUPÉRATION ---
  
  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
        const res = await api.get('/users') 
        setUsers(res.data)
    } catch (err) {
        console.error("Erreur chargement utilisateurs", err)
    } finally {
        setLoadingUsers(false)
    }
  }

  const fetchProperties = async () => {
    setLoadingProps(true)
    try {
        const res = await api.get('/admin/properties')
        
        // TRI AUTOMATIQUE : EN ATTENTE D'ABORD
        const sorted = res.data.sort((a: any, b: any) => {
            if (a.status === 'en attente' && b.status !== 'en attente') return -1;
            if (a.status !== 'en attente' && b.status === 'en attente') return 1;
            return 0;
        });

        setProperties(sorted)
    } catch (err) {
        console.error("Erreur chargement annonces", err)
    } finally {
        setLoadingProps(false)
    }
  }

  const fetchReports = async () => {
    setLoadingReports(true)
    try {
        // const res = await api.get('/reports') // À activer quand le backend sera prêt
        // setReports(res.data)
        setReports([]) 
    } catch (err) { console.error(err) } finally { setLoadingReports(false) }
  }

  // --- 3. ACTIONS ADMIN ---
  const handleValidate = async (id: number) => {
    try {
      await api.patch(`/admin/properties/${id}/validate`) 
      
      // Mise à jour locale pour un retour visuel immédiat (descend l'annonce validée)
      setProperties(prev => {
          const updated = prev.map(p => p.id === id ? { ...p, status: 'publié' } : p);
          return [...updated].sort((a: any, b: any) => {
            if (a.status === 'en attente' && b.status !== 'en attente') return -1;
            if (a.status !== 'en attente' && b.status === 'en attente') return 1;
            return 0;
        });
      });
    } catch (err) {
      alert("Erreur lors de la validation")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer définitivement cette annonce ?")) return
    try {
      await api.delete(`/admin/properties/${id}`)
      setProperties(prev => prev.filter(p => p.id !== id))
    } catch (err) { alert("Erreur suppression") }
  }

  // --- 4. LOGIQUE PAGINATION ---
  const totalUserPages = Math.ceil(users.length / ITEMS_PER_PAGE)
  const paginatedUsers = users.slice((userPage - 1) * ITEMS_PER_PAGE, userPage * ITEMS_PER_PAGE)

  const totalPropPages = Math.ceil(properties.length / ITEMS_PER_PAGE)
  const paginatedProps = properties.slice((propPage - 1) * ITEMS_PER_PAGE, propPage * ITEMS_PER_PAGE)

  const totalReportPages = Math.ceil(reports.length / ITEMS_PER_PAGE)
  const paginatedReports = reports.slice((reportPage - 1) * ITEMS_PER_PAGE, reportPage * ITEMS_PER_PAGE)

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
      {/* Stats Admin Dynamiques */}
      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "Utilisateurs", value: users.length.toString(), icon: Users },
          { label: "Annonces", value: properties.length.toString(), icon: Building2 },
          { label: "En attente", value: properties.filter(p => p.status === 'en attente').length.toString(), icon: Clock },
          { label: "Signalements", value: reports.length.toString(), icon: AlertTriangle },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4 transition-all hover:shadow-sm">
            <stat.icon className="mb-2 h-5 w-5 text-primary" />
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Onglets Admin */}
      <div className="mb-6 flex gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1">
        {[
          { key: "utilisateurs", label: "Utilisateurs", icon: Users },
          { key: "annonces", label: "Annonces", icon: Building2 },
          { key: "signalements", label: "Signalements", icon: AlertTriangle },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setAdminTab(tab.key as AdminTab)}
            className={`flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors ${
              adminTab === tab.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" /> {tab.label}
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
                            <th className="px-4 py-3 text-left font-medium text-foreground">ID</th>
                            <th className="px-4 py-3 text-left font-medium text-foreground">Nom</th>
                            <th className="hidden px-4 py-3 text-left font-medium text-foreground md:table-cell">Email</th>
                            <th className="px-4 py-3 text-left font-medium text-foreground">Rôle</th>
                            <th className="px-4 py-3 text-left font-medium text-foreground">Date création</th>
                            <th className="px-4 py-3 text-right font-medium text-foreground">Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {paginatedUsers.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Aucun utilisateur trouvé.</td></tr>
                        ) : (
                            paginatedUsers.map((user) => (
                                <tr key={user.id} className="border-b border-border hover:bg-muted/50 last:border-0 transition-colors">
                                <td className="px-4 py-3 text-muted-foreground">#{user.id}</td>
                                <td className="px-4 py-3 font-medium text-foreground">{user.name}</td>
                                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">{user.email}</td>
                                <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{user.role || 'user'}</Badge></td>
                                <td className="px-4 py-3 text-muted-foreground text-xs">
                                    {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <Button variant="ghost" size="icon" title="Modifier">
                                        <Settings className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination Utilisateurs */}
                {totalUserPages > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t border-border">
                        <Button variant="outline" size="icon" onClick={() => setUserPage(p => Math.max(p - 1, 1))} disabled={userPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-sm px-2 text-muted-foreground">Page {userPage} sur {totalUserPages}</span>
                        <Button variant="outline" size="icon" onClick={() => setUserPage(p => Math.min(p + 1, totalUserPages))} disabled={userPage === totalUserPages}><ChevronRight className="h-4 w-4" /></Button>
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
                {paginatedProps.length === 0 ? <div className="text-center py-10 border border-dashed rounded-xl">Aucune annonce.</div> : 
                paginatedProps.map((p) => (
                <div key={p.id} className="flex flex-col md:flex-row md:items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-md group">
                    {/* LIEN CLIQUABLE SUR L'IMAGE */}
                    <Link href={`/biens/${p.id}`} className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-secondary block hover:opacity-80 transition-opacity">
                        <Image src={getImageUrl(p.images)} alt={p.title} fill className="object-cover" unoptimized />
                    </Link>
                    
                    <div className="flex-1">
                        {/* LIEN CLIQUABLE SUR LE TITRE */}
                        <div className="flex items-center gap-2">
                            <Link href={`/biens/${p.id}`} className="text-sm font-semibold text-foreground hover:text-primary hover:underline transition-colors">
                                {p.title}
                            </Link>
                            <Badge variant={p.status === "publié" ? "default" : "secondary"} className="text-[10px] h-5 capitalize">{p.status}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <span>ID: #{p.id}</span>
                            <span>•</span>
                            <span>{p.city}</span>
                            {p.price && <span>• {formatPrice(p.price, p.transaction_type)}</span>}
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link href={`/biens/${p.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="h-4 w-4" /></Button>
                        </Link>
                        {p.status !== 'publié' && (
                            <Button variant="outline" size="sm" className="gap-1 h-8 text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200" onClick={() => handleValidate(p.id)}>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Valider
                            </Button>
                        )}
                        <Button variant="outline" size="sm" className="gap-1 h-8 text-destructive hover:bg-destructive/10 border-destructive/20" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-3.5 w-3.5" /> Suppr.
                        </Button>
                    </div>
                </div>
                ))}

                {/* Pagination Annonces */}
                {totalPropPages > 1 && (
                    <div className="mt-4 flex justify-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => setPropPage(p => Math.max(p - 1, 1))} disabled={propPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                        <span className="text-sm px-2 flex items-center text-muted-foreground">{propPage} / {totalPropPages}</span>
                        <Button variant="outline" size="icon" onClick={() => setPropPage(p => Math.min(p + 1, totalPropPages))} disabled={propPage === totalPropPages}><ChevronRight className="h-4 w-4" /></Button>
                    </div>
                )}
            </>
          )}
        </div>
      )}

      {/* === ONGLET 3 : SIGNALEMENTS === */}
      {adminTab === "signalements" && (
        <div className="flex flex-col gap-3">
            {loadingReports ? <div className="flex justify-center py-10"><Loader2 className="animate-spin text-primary" /></div> : (
                <>
                    {paginatedReports.length === 0 ? <div className="text-center py-10 border border-dashed rounded-xl text-muted-foreground">Aucun signalement.</div> :
                    paginatedReports.map((report) => (
                        <div key={report.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-all hover:border-destructive/30">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">{report.reason}</p>
                            <p className="text-sm text-muted-foreground">Concerne : {report.property_title || "Annonce inconnue"}</p>
                            <p className="text-xs text-muted-foreground mt-1">Signalé par {report.reporter} le {report.date}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-8">Examiner</Button>
                            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground">Ignorer</Button>
                        </div>
                        </div>
                    ))}

                    {/* Pagination Signalements */}
                    {totalReportPages > 1 && (
                        <div className="mt-4 flex justify-center gap-2">
                            <Button variant="outline" size="icon" onClick={() => setReportPage(p => Math.max(p - 1, 1))} disabled={reportPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                            <span className="text-sm px-2 flex items-center text-muted-foreground">{reportPage} / {totalReportPages}</span>
                            <Button variant="outline" size="icon" onClick={() => setReportPage(p => Math.min(p + 1, totalReportPages))} disabled={reportPage === totalReportPages}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                    )}
                </>
            )}
        </div>
      )}
    </>
  )
}