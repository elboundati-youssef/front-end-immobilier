"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
// 🌟 IMPORT DYNAMIQUE DE NEXT.JS 🌟
import dynamic from 'next/dynamic'
import { useTranslations } from "next-intl" // 🌟 IMPORT NEXT-INTL
import { Upload, Plus, Check, Loader2, AlertCircle, FileImage, X, ArrowLeft, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { cities, propertyTypes, transactionTypes } from "@/lib/data"
import api from "@/services/api"

// 🌟 CHARGEMENT SANS SSR (Résout l'erreur 'window is not defined') 🌟
const MapPicker = dynamic(() => import('@/components/MapPicker'), { 
    ssr: false, 
    loading: () => <div className="h-full w-full flex items-center justify-center bg-secondary/50"><Loader2 className="animate-spin text-primary" /></div>
})

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

const MAX_IMAGES = 5;
const API_URL = "http://127.0.0.1:8000";

export default function ModifierPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations("EditPage") // 🌟 INITIALISATION TRADUCTION
  const { id } = use(params)
  const router = useRouter()
  const pathname = usePathname()
  
  // 🌟 GESTION DE LA LANGUE POUR LES REDIRECTIONS
  const currentLocale = pathname.split("/")[1] || "fr"
  const l = (path: string) => `/${currentLocale}${path}`

  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loadingData, setLoadingData] = useState(true)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [error, setError] = useState("")
  
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])

  const [mapCenter, setMapCenter] = useState<[number, number]>([35.7595, -5.8340])
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

  // Traduction des équipements
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

  const getTranslatedLabel = (category: string, value: string, defaultLabel: string) => {
    try {
      const tSearch = require(`@/messages/${currentLocale}.json`).SearchBar;
      return tSearch[category][value] || defaultLabel;
    } catch {
      return defaultLabel;
    }
  }

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

  useEffect(() => {
    if (isCheckingAuth) return;

    const fetchProperty = async () => {
      try {
        const res = await api.get(`/properties/${id}`)
        const data = res.data

        let loadedEquipments: string[] = [];
        if (Array.isArray(data.equipments)) loadedEquipments = data.equipments;
        else if (typeof data.equipments === 'string') {
             try { loadedEquipments = JSON.parse(data.equipments); } catch (e) {}
        }

        let loadedImages: string[] = [];
        if (Array.isArray(data.images)) loadedImages = data.images;
        else if (typeof data.images === 'string') {
             try { loadedImages = JSON.parse(data.images); } catch (e) {}
        }

        setFormData({
            title: data.title || "",
            transaction_type: data.transaction_type || "",
            property_type: data.property_type || "",
            description: data.description || "",
            price: data.price || "",
            surface: data.surface || "",
            rooms: data.rooms || "",
            bedrooms: data.bedrooms || "",
            bathrooms: data.bathrooms || "",
            city: data.city || "",
            address: data.address || "",
            equipments: loadedEquipments,
        })

        setExistingImages(loadedImages)

        if (data.latitude && data.longitude) {
            import('leaflet').then((L) => {
                const lat = parseFloat(data.latitude);
                const lng = parseFloat(data.longitude);
                setMarkerPosition(L.latLng(lat, lng));
                setMapCenter([lat, lng]);
            });
        } else if (data.city && cityCoordinates[data.city]) {
            setMapCenter(cityCoordinates[data.city]);
        }

      } catch (err) {
        console.error(err)
        setError(t("alerts.loadError"))
      } finally {
        setLoadingData(false)
      }
    }

    if (id) fetchProperty()
  }, [id, isCheckingAuth])

  const getImageUrl = (path: string) => {
    if (path.startsWith("http") || path.startsWith("/images")) return path;
    return `${API_URL}${path}`;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value })
    
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      const remainingSlots = MAX_IMAGES - newFiles.length;

      if (remainingSlots <= 0) {
        setError(t("alerts.limitReached"));
        return;
      }

      let filesToAdd = files;
      if (files.length > remainingSlots) {
        filesToAdd = files.slice(0, remainingSlots);
        setError(t("alerts.partialAdd").replace("{num}", remainingSlots.toString()));
      } else {
        setError(""); 
      }

      setNewFiles(prev => [...prev, ...filesToAdd])
    }
  }

  const removeNewFile = (index: number) => {
    setNewFiles(prev => prev.filter((_, i) => i !== index))
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingSubmit(true)
    setError("")

    try {
      const data = new FormData()
      data.append("_method", "PUT")

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
      } else {
          data.append('latitude', '');
          data.append('longitude', '');
      }

      newFiles.forEach((file) => {
        data.append('images[]', file)
      })

      await api.post(`/properties/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      
      router.push(l("/tableau-de-bord")) 
      
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || t("alerts.updateError"))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoadingSubmit(false)
    }
  }

  if (isCheckingAuth || loadingData) {
      return (
        <div className="min-h-screen bg-background flex flex-col">
          <Navbar />
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 py-8 lg:px-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6 gap-2 pl-0 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="h-4 w-4" /> <span>{t("buttons.back")}</span>
        </Button>

        <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="mb-8 text-muted-foreground">{t("subtitle")}</p>

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
                <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.transaction")}</label>
                  <select name="transaction_type" value={formData.transaction_type} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">{t("select.choose")}</option>
                    {transactionTypes.map((tr) => <option key={tr.value} value={tr.value}>{getTranslatedLabel("transactionTypes", tr.value, tr.label)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.propertyType")}</label>
                  <select name="property_type" value={formData.property_type} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">{t("select.choose")}</option>
                    {propertyTypes.map((pt) => <option key={pt.value} value={pt.value}>{getTranslatedLabel("propertyTypes", pt.value, pt.label)}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.desc")}</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={4} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.price")}</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-foreground">{t("sections.details")}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.surface")}</label><input name="surface" type="number" value={formData.surface} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.rooms")}</label><input name="rooms" type="number" value={formData.rooms} onChange={handleChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.bedrooms")}</label><input name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.bathrooms")}</label><input name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
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
                      {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">{t("fields.address")}</label>
                    <input name="address" type="text" value={formData.address} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
              </div>

              {/* CARTE INTERACTIVE SANS ERREUR SSR */}
              <div className="mt-2">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      <MapPin className="h-4 w-4 text-primary" /> 
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
            </div>

          <div className="mb-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-700 border border-blue-100 flex items-start gap-2">
    <AlertCircle className="h-5 w-5 shrink-0" />
    <p>
        {t.rich("photos.warning", {
            strong: (chunks) => <strong>{chunks}</strong>
        })}
    </p>
</div>

            {existingImages.length > 0 && newFiles.length === 0 && (
                <div className="mb-6">
                    <p className="text-sm font-medium mb-2">{t("photos.current")}</p>
                    <div className="flex flex-wrap gap-3">
                        {existingImages.map((img, idx) => (
                            <div key={idx} className="relative h-20 w-28 rounded-lg overflow-hidden border">
                                <Image src={getImageUrl(img)} alt="Actuelle" fill className="object-cover" unoptimized />
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden" 
                multiple 
                accept="image/png, image/jpeg, image/jpg"
            />

            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-secondary/30 px-6 py-8 text-center">
              <Upload className="mb-3 h-8 w-8 text-muted-foreground" />
              <p className="mb-1 text-sm font-medium text-foreground">{t("photos.dragDrop")}</p>
              
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="gap-2 mt-2" 
                onClick={triggerFileInput}
                disabled={newFiles.length >= MAX_IMAGES}
              >
                <Plus className="h-4 w-4" />
                <span>{newFiles.length >= MAX_IMAGES ? t("photos.limit") : t("photos.chooseFiles")}</span>
              </Button>

              {newFiles.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2 w-full">
                    {newFiles.map((file, index) => (
                        <div key={index} className="flex items-center gap-2 rounded-lg bg-background border border-border pl-3 pr-2 py-2 text-sm shadow-sm">
                            <span className="truncate max-w-[150px]">{file.name}</span>
                            <button type="button" onClick={() => removeNewFile(index)} className="text-muted-foreground hover:text-destructive">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
              <span>{t("buttons.cancel")}</span>
            </Button>
            <Button type="submit" size="lg" className="flex-1 text-base" disabled={loadingSubmit}>
                {loadingSubmit ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> <span>{t("buttons.saving")}</span></> : <span>{t("buttons.save")}</span>}
            </Button>
          </div>

        </form>
      </div>

      <Footer />
    </div>
  )
}