"use client"

import { useState, useEffect, useRef, use } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
// 🌟 IMPORT DYNAMIQUE DE NEXT.JS 🌟
import dynamic from 'next/dynamic'
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

const equipmentsList = [
  "Parking", "Piscine", "Jardin", "Ascenseur", "Climatisation",
  "Securite 24h", "Terrasse", "Garage", "Fibre optique", "Domotique",
  "Vue mer", "Proche ecoles", "Meuble",
]

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
  const { id } = use(params)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 🌟 NOUVEL ÉTAT POUR LA PROTECTION DES ROUTES 🌟
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  const [loadingData, setLoadingData] = useState(true)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [error, setError] = useState("")
  
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])

  // --- ÉTATS POUR LA CARTE ---
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

  // 🌟 PROTECTION DE LA ROUTE & GESTION DES RÔLES 🌟
  useEffect(() => {
    const token = localStorage.getItem("token")
    const userStr = localStorage.getItem("user")
    
    if (!token || !userStr) {
      router.push("/connexion")
      return;
    }

    try {
      const user = JSON.parse(userStr);
      // On bloque les clients (seuls les admins, agences ou propriétaires peuvent modifier)
      if (user.role === 'client') {
        router.push('/');
        return;
      }
      setIsCheckingAuth(false);
    } catch (e) {
      router.push("/connexion")
    }
  }, [router])

  useEffect(() => {
    // Si on est encore en train de vérifier l'auth, on ne fetch pas les données
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

        // CHARGEMENT DU GPS EXISTANT
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
        setError("Impossible de charger les informations du bien.")
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

  const toggleEquipment = (eq: string) => {
    setFormData(prev => ({
      ...prev,
      equipments: prev.equipments.includes(eq)
        ? prev.equipments.filter(e => e !== eq)
        : [...prev.equipments, eq]
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files)
      const remainingSlots = MAX_IMAGES - newFiles.length;

      if (remainingSlots <= 0) {
        setError("Limite de 5 nouvelles images atteinte.");
        return;
      }

      let filesToAdd = files;
      if (files.length > remainingSlots) {
        filesToAdd = files.slice(0, remainingSlots);
        setError(`Seulement ${remainingSlots} images ajoutées.`);
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
      
      router.push("/tableau-de-bord") 
      
    } catch (err: any) {
      console.error(err)
      setError(err.response?.data?.message || "Erreur lors de la modification.")
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoadingSubmit(false)
    }
  }

  // 🌟 AFFICHAGE DU CHARGEMENT PENDANT LA VÉRIFICATION D'AUTHENTIFICATION 🌟
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
            <ArrowLeft className="h-4 w-4" /> Retour
        </Button>

        <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">Modifier l&apos;annonce</h1>
        <p className="mb-8 text-muted-foreground">
          Mettez à jour les informations de votre bien.
        </p>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-foreground">Informations générales</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Titre</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Transaction</label>
                  <select name="transaction_type" value={formData.transaction_type} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Choisir</option>
                    {transactionTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Type de bien</label>
                  <select name="property_type" value={formData.property_type} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                    <option value="">Choisir</option>
                    {propertyTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={4} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Prix (DH)</label>
                <input type="number" name="price" value={formData.price} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-foreground">Détails</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div><label className="mb-1.5 block text-sm font-medium text-foreground">Surface (m²)</label><input name="surface" type="number" value={formData.surface} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-foreground">Pièces</label><input name="rooms" type="number" value={formData.rooms} onChange={handleChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-foreground">Chambres</label><input name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
              <div><label className="mb-1.5 block text-sm font-medium text-foreground">Salles de bain</label><input name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" /></div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-foreground">Localisation</h2>
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Ville</label>
                    <select name="city" value={formData.city} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="">Choisir</option>
                      {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Adresse</label>
                    <input name="address" type="text" value={formData.address} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
              </div>

              {/* CARTE INTERACTIVE SANS ERREUR SSR */}
              <div className="mt-2">
                  <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      <MapPin className="h-4 w-4 text-primary" /> 
                      Emplacement sur la carte (Optionnel)
                  </label>
                  <p className="text-xs text-muted-foreground mb-3">Cliquez sur la carte pour modifier l'emplacement exact du bien.</p>
                  
                  <div className="h-[300px] w-full rounded-xl overflow-hidden border border-border relative z-0">
                      <MapPicker mapCenter={mapCenter} markerPosition={markerPosition} setMarkerPosition={setMarkerPosition} />
                  </div>
                  
                  {markerPosition && (
                      <div className="mt-2 flex justify-between items-center bg-green-50 text-green-700 px-3 py-2 rounded-lg border border-green-200 text-xs">
                          <span className="flex items-center gap-2"><Check className="h-3 w-3" /> Emplacement enregistré ({markerPosition.lat.toFixed(4)}, {markerPosition.lng.toFixed(4)})</span>
                          <button type="button" onClick={() => setMarkerPosition(null)} className="font-semibold underline hover:text-green-800">Effacer</button>
                      </div>
                  )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-foreground">Équipements</h2>
            <div className="flex flex-wrap gap-2">
              {equipmentsList.map((eq) => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleEquipment(eq)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                    formData.equipments.includes(eq)
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {formData.equipments.includes(eq) && <Check className="h-3.5 w-3.5" />}
                  {eq}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
               <h2 className="font-serif text-xl font-bold text-foreground">Photos</h2>
            </div>

            <div className="mb-4 rounded-lg bg-blue-50 p-4 text-sm text-blue-700 border border-blue-100 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <p>Si vous ajoutez de nouvelles photos ci-dessous, elles <strong>remplaceront</strong> toutes les photos actuelles.</p>
            </div>

            {existingImages.length > 0 && newFiles.length === 0 && (
                <div className="mb-6">
                    <p className="text-sm font-medium mb-2">Photos actuelles :</p>
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
              <p className="mb-1 text-sm font-medium text-foreground">Glissez vos nouvelles photos</p>
              
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="gap-2 mt-2" 
                onClick={triggerFileInput}
                disabled={newFiles.length >= MAX_IMAGES}
              >
                <Plus className="h-4 w-4" />
                {newFiles.length >= MAX_IMAGES ? "Limite atteinte" : "Sélectionner nouvelles photos"}
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
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>Annuler</Button>
            <Button type="submit" size="lg" className="flex-1 text-base" disabled={loadingSubmit}>
                {loadingSubmit ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement...</> : "Sauvegarder les modifications"}
            </Button>
          </div>

        </form>
      </div>

      <Footer />
    </div>
  )
}