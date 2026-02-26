"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl" // 🌟 IMPORT NEXT-INTL
import dynamic from 'next/dynamic'
import { Upload, Plus, Check, Loader2, AlertCircle, FileImage, X, MapPin as MapPinIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { cities, propertyTypes, transactionTypes } from "@/lib/data"
import api from "@/services/api"

// 🌟 IMPORT DYNAMIQUE POUR LEAFLET (SANS SSR) 🌟
const MapPicker = dynamic(() => import('@/components/MapPicker'), { 
    ssr: false, 
    loading: () => <div className="h-full w-full flex items-center justify-center bg-secondary/50"><Loader2 className="animate-spin text-primary" /></div>
})

const MAX_IMAGES = 5;

// Coordonnées approximatives des villes pour centrer la carte
const cityCoordinates: Record<string, [number, number]> = {
    "Tanger": [35.7595, -5.8340],
    "Casablanca": [33.5731, -7.5898],
    "Rabat": [34.0209, -6.8416],
    "Marrakech": [31.6295, -7.9811],
    "Agadir": [30.4278, -9.5981],
    "Fes": [34.0331, -5.0003],
    "Meknes": [33.8935, -5.5547],
    "Oujda": [34.6814, -1.9086],
    "Tetouan": [35.5784, -5.3684],
    "Al Hoceima": [35.2472, -3.9317],
    "Nador": [35.1681, -2.9335],
    "Kenitra": [34.2610, -6.5802]
}

export default function PublierPage() {
  const t = useTranslations("PublishPage") // 🌟 INITIALISATION TRADUCTION
  const router = useRouter()
  const pathname = usePathname()
  
  // 🌟 GESTION DE LA LANGUE POUR LA REDIRECTION
  const currentLocale = pathname.split("/")[1] || "fr"
  const l = (path: string) => `/${currentLocale}${path}`

  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  
  // Stockage des fichiers images
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  // --- ÉTATS POUR LA CARTE ---
  const [mapCenter, setMapCenter] = useState<[number, number]>([35.7595, -5.8340]) // Tanger par défaut
  const [markerPosition, setMarkerPosition] = useState<any>(null)

  const [formData, setFormData] = useState({
    title: "",
    transaction_type: "",
    property_type: "",
    description: "",
    price: "",
    surface: "",
    rooms: "",
    bedrooms: "",
    bathrooms: "",
    city: "",
    address: "",
    equipments: [] as string[],
  })

  // Traduction des équipements (les clés d'origine restent pour l'API, le label change)
  const equipmentsList = [
    { key: "Parking", label: t("equipments.parking") },
    { key: "Piscine", label: t("equipments.pool") },
    { key: "Jardin", label: t("equipments.garden") },
    { key: "Ascenseur", label: t("equipments.elevator") },
    { key: "Climatisation", label: t("equipments.ac") },
    { key: "Securite 24h", label: t("equipments.security") },
    { key: "Terrasse", label: t("equipments.terrace") },
    { key: "Garage", label: t("equipments.garage") },
    { key: "Fibre optique", label: t("equipments.fiber") },
    { key: "Domotique", label: t("equipments.smartHome") },
    { key: "Vue mer", label: t("equipments.seaView") },
    { key: "Proche ecoles", label: t("equipments.schools") },
    { key: "Meuble", label: t("equipments.furnished") }
  ]

  // Helper pour traduire les selects
  const getTranslatedLabel = (category: string, value: string, defaultLabel: string) => {
    try {
      const tSearch = require(`@/messages/${currentLocale}.json`).SearchBar;
      return tSearch[category][value] || defaultLabel;
    } catch {
      return defaultLabel;
    }
  }

  // 🌟 PROTECTION DE LA ROUTE & GESTION DES RÔLES 🌟
  useEffect(() => {
    const token = localStorage.getItem("token")
    const userStr = localStorage.getItem("user")
    
    if (!token || !userStr) {
      router.push(l("/connexion"))
      return;
    }

    try {
      const user = JSON.parse(userStr);
      if (user.role === 'client') {
        router.push(l('/'));
        return;
      }
      setIsCheckingAuth(false);
    } catch (e) {
      router.push(l("/connexion"))
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value })
    setError("")

    if (name === 'city' && cityCoordinates[value]) {
        setMapCenter(cityCoordinates[value]);
        setMarkerPosition(null); 
    }
  }

  const toggleEquipment = (eqKey: string) => {
    setFormData(prev => ({
      ...prev,
      equipments: prev.equipments.includes(eqKey)
        ? prev.equipments.filter(e => e !== eqKey)
        : [...prev.equipments, eqKey]
    }))
  }

  // GESTION DES IMAGES AVEC LIMITE DE 5
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      
      const remainingSlots = MAX_IMAGES - selectedFiles.length;

      if (remainingSlots <= 0) {
        setError(t("alerts.limitReached"));
        return;
      }

      let filesToAdd = newFiles;
      if (newFiles.length > remainingSlots) {
        filesToAdd = newFiles.slice(0, remainingSlots);
        setError(t("alerts.partialAdd").replace("{num}", remainingSlots.toString()));
      } else {
        setError(""); 
      }

      setSelectedFiles(prev => [...prev, ...filesToAdd])
    }
  }

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setError("") 
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const data = new FormData()
      
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'equipments') {
            formData.equipments.forEach(eq => data.append('equipments[]', eq))
        } else {
            data.append(key, value as string)
        }
      })

      if (markerPosition) {
          data.append('latitude', markerPosition.lat.toString());
          data.append('longitude', markerPosition.lng.toString());
      }

      selectedFiles.forEach((file) => {
        data.append('images[]', file)
      })

      const response = await api.post("/properties", data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      
      if (response.status === 201) {
        setSubmitted(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch (err: any) {
      console.error(err)
      const message = err.response?.data?.message || t("alerts.publishError")
      setError(message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  // 🌟 AFFICHAGE DU CHARGEMENT PENDANT LA VÉRIFICATION D'AUTHENTIFICATION 🌟
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-xl px-4 py-20 text-center lg:px-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">{t("success.title")}</h1>
          <p className="mb-8 text-muted-foreground">
            {t("success.desc")}
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => {
                setSubmitted(false)
                setSelectedFiles([])
                setMarkerPosition(null)
                setFormData({
                    title: "", transaction_type: "", property_type: "", description: "", price: "",
                    surface: "", rooms: "", bedrooms: "", bathrooms: "", city: "", address: "", equipments: []
                })
            }}>{t("success.btnNew")}</Button>
            <Button variant="outline" onClick={() => router.push(l("/tableau-de-bord"))}>
              {t("success.btnDash")}
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="mb-8 text-muted-foreground">
          {t("subtitle")}
        </p>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-foreground">{t("sections.general")}</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.title")}</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder={t("placeholders.title")}
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.transaction")}</label>
                  <select 
                    name="transaction_type" 
                    value={formData.transaction_type}
                    onChange={handleChange}
                    required 
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t("select.choose")}</option>
                    {transactionTypes.map((tr) => (
                      <option key={tr.value} value={tr.value}>{getTranslatedLabel("transactionTypes", tr.value, tr.label)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.propertyType")}</label>
                  <select 
                    name="property_type" 
                    value={formData.property_type}
                    onChange={handleChange}
                    required 
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t("select.choose")}</option>
                    {propertyTypes.map((pt) => (
                      <option key={pt.value} value={pt.value}>{getTranslatedLabel("propertyTypes", pt.value, pt.label)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.desc")}</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder={t("placeholders.desc")}
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.price")}</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Ex: 1500000"
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-foreground">{t("sections.details")}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.surface")}</label>
                <input name="surface" type="number" value={formData.surface} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.rooms")}</label>
                <input name="rooms" type="number" value={formData.rooms} onChange={handleChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.bedrooms")}</label>
                <input name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
               <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.bathrooms")}</label>
                <input name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-foreground">{t("sections.location")}</h2>
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.city")}</label>
                    <select name="city" value={formData.city} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">{t("select.chooseCity")}</option>
                      {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.address")}</label>
                    <input name="address" type="text" value={formData.address} onChange={handleChange} required placeholder={t("placeholders.address")} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
              </div>

              {/* 🌟 LA CARTE INTERACTIVE 🌟 */}
              <div className="mt-2">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      <MapPinIcon className="h-4 w-4 text-primary" /> 
                      {t("map.title")}
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">{t("map.desc")}</p>
                  
                  <div className="h-[300px] w-full rounded-xl overflow-hidden border border-border relative z-0">
                      <MapPicker mapCenter={mapCenter} markerPosition={markerPosition} setMarkerPosition={setMarkerPosition} />
                  </div>
                  
                  {markerPosition && (
                      <div className="mt-2 flex justify-between items-center bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200 text-xs">
                          <span className="flex items-center gap-2"><Check className="h-3 w-3" /> {t("map.saved")} ({markerPosition.lat.toFixed(4)}, {markerPosition.lng.toFixed(4)})</span>
                          <button type="button" onClick={() => setMarkerPosition(null)} className="font-semibold underline hover:text-green-800">{t("map.clear")}</button>
                      </div>
                  )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-foreground">{t("sections.equipments")}</h2>
            <div className="flex flex-wrap gap-2">
              {equipmentsList.map((eq) => (
                <button
                  key={eq.key}
                  type="button"
                  onClick={() => toggleEquipment(eq.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    formData.equipments.includes(eq.key)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {formData.equipments.includes(eq.key) && <Check className="h-3.5 w-3.5" />}
                  <span>{eq.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
               <h2 className="font-serif text-xl font-bold text-foreground">{t("sections.photos")}</h2>
               <span className="text-sm text-muted-foreground">
                 <span>{selectedFiles.length}/{MAX_IMAGES}</span> <span>{t("photos.images")}</span>
               </span>
            </div>
            
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" 
                multiple 
                accept="image/png, image/jpeg, image/jpg"
            />

            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 px-6 py-12 text-center">
              <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="mb-1 text-sm font-medium text-foreground">{t("photos.dragDrop")}</p>
              <p className="mb-4 text-xs text-muted-foreground">{t("photos.rules")}</p>
              
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="gap-2" 
                onClick={triggerFileInput}
                disabled={selectedFiles.length >= MAX_IMAGES}
              >
                <Plus className="h-4 w-4" />
                <span>{selectedFiles.length >= MAX_IMAGES ? t("photos.limit") : t("photos.chooseFiles")}</span>
              </Button>

              {selectedFiles.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 rounded-lg bg-background border border-border pl-3 pr-2 py-2 text-sm shadow-sm">
                            <FileImage className="h-4 w-4 text-primary shrink-0"/>
                            <span className="truncate max-w-[120px]">{file.name}</span>
                            <button 
                                type="button" 
                                onClick={() => removeFile(index)} 
                                className="ml-1 rounded-full p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <Button type="submit" size="lg" className="w-full text-base" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> <span>{t("buttons.publishing")}</span>
              </>
            ) : (
              <span>{t("buttons.publish")}</span>
            )}
          </Button>
        </form>
      </div>

      <Footer />
    </div>
  )
}