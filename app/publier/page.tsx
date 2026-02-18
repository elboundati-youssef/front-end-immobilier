"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, Plus, Check, Loader2, AlertCircle, FileImage, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { cities, propertyTypes, transactionTypes } from "@/lib/data"
import api from "@/services/api"

const equipmentsList = [
  "Parking", "Piscine", "Jardin", "Ascenseur", "Climatisation",
  "Securite 24h", "Terrasse", "Garage", "Fibre optique", "Domotique",
  "Vue mer", "Proche ecoles", "Meuble",
]

const MAX_IMAGES = 5;

export default function PublierPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
  // Stockage des fichiers images
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

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

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/connexion")
    }
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError("")
  }

  const toggleEquipment = (eq: string) => {
    setFormData(prev => ({
      ...prev,
      equipments: prev.equipments.includes(eq)
        ? prev.equipments.filter(e => e !== eq)
        : [...prev.equipments, eq]
    }))
  }

  // GESTION DES IMAGES AVEC LIMITE DE 5
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      
      // Vérifier combien d'images on peut encore ajouter
      const remainingSlots = MAX_IMAGES - selectedFiles.length;

      if (remainingSlots <= 0) {
        setError("Vous avez déjà atteint la limite de 5 images.");
        return;
      }

      // Si l'utilisateur sélectionne trop d'images, on coupe
      let filesToAdd = newFiles;
      if (newFiles.length > remainingSlots) {
        filesToAdd = newFiles.slice(0, remainingSlots);
        setError(`Seules ${remainingSlots} images ont été ajoutées (limite de 5 atteinte).`);
      } else {
        setError(""); // Clear error si tout va bien
      }

      setSelectedFiles(prev => [...prev, ...filesToAdd])
    }
  }

  // Supprimer une image de la liste
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setError("") // Enlever l'erreur si on libère de la place
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // CRÉATION DU FORMDATA (Obligatoire pour envoyer des images)
      const data = new FormData()
      
      // 1. Ajouter les champs texte
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'equipments') {
            formData.equipments.forEach(eq => data.append('equipments[]', eq))
        } else {
            data.append(key, value as string)
        }
      })

      // 2. Ajouter les images
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
      const message = err.response?.data?.message || "Erreur lors de la publication."
      setError(message)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-xl px-4 py-20 text-center lg:px-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">Annonce soumise</h1>
          <p className="mb-8 text-muted-foreground">
            Votre annonce a été soumise avec succès. Elle sera publiée après vérification par notre équipe.
          </p>
          <div className="flex justify-center gap-4">
            <Button onClick={() => {
                setSubmitted(false)
                setSelectedFiles([])
                setFormData({
                    title: "", transaction_type: "", property_type: "", description: "", price: "",
                    surface: "", rooms: "", bedrooms: "", bathrooms: "", city: "", address: "", equipments: []
                })
            }}>Publier une autre annonce</Button>
            <Button variant="outline" onClick={() => router.push("/tableau-de-bord")}>
              Mon tableau de bord
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
        <h1 className="mb-2 font-serif text-3xl font-bold text-foreground">Publier une annonce</h1>
        <p className="mb-8 text-muted-foreground">
          Remplissez les informations ci-dessous pour publier votre bien immobilier.
        </p>

        {error && (
          <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-200">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Informations générales */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-foreground">Informations générales</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Titre de l&apos;annonce</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Ex: Appartement moderne au centre-ville"
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Type de transaction</label>
                  <select 
                    name="transaction_type" 
                    value={formData.transaction_type}
                    onChange={handleChange}
                    required 
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Choisir</option>
                    {transactionTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">Type de bien</label>
                  <select 
                    name="property_type" 
                    value={formData.property_type}
                    onChange={handleChange}
                    required 
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Choisir</option>
                    {propertyTypes.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Décrivez votre bien en détail..."
                  required
                  className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Prix (DH)</label>
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

          {/* Détails techniques */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-foreground">Détails du bien</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Surface (m²)</label>
                <input name="surface" type="number" value={formData.surface} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Nombre de pièces</label>
                <input name="rooms" type="number" value={formData.rooms} onChange={handleChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Chambres</label>
                <input name="bedrooms" type="number" value={formData.bedrooms} onChange={handleChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
               <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Salles de bain</label>
                <input name="bathrooms" type="number" value={formData.bathrooms} onChange={handleChange} className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </div>

          {/* Localisation */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-serif text-xl font-bold text-foreground">Localisation</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Ville</label>
                <select name="city" value={formData.city} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="">Choisir une ville</option>
                  {cities.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Adresse</label>
                <input name="address" type="text" value={formData.address} onChange={handleChange} required className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </div>

          {/* Équipements */}
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

          {/* Photos */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
               <h2 className="font-serif text-xl font-bold text-foreground">Photos</h2>
               <span className="text-sm text-muted-foreground">{selectedFiles.length}/{MAX_IMAGES} images</span>
            </div>
            
            {/* Input Caché */}
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
              <p className="mb-1 text-sm font-medium text-foreground">Glissez vos photos ici</p>
              <p className="mb-4 text-xs text-muted-foreground">PNG, JPG jusqu&apos;a 5MB chacune</p>
              
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="gap-2" 
                onClick={triggerFileInput}
                disabled={selectedFiles.length >= MAX_IMAGES} // Désactive si 5 images
              >
                <Plus className="h-4 w-4" />
                {selectedFiles.length >= MAX_IMAGES ? "Limite atteinte" : "Choisir des fichiers"}
              </Button>

              {/* Affichage des fichiers sélectionnés avec bouton supprimer */}
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publication en cours...
              </>
            ) : (
              "Publier l'annonce"
            )}
          </Button>
        </form>
      </div>

      <Footer />
    </div>
  )
}