"use client"

import { use, useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  Maximize2,
  BedDouble,
  Bath,
  Home,
  Phone,
  Mail,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Check,
  Eye,
  Calendar,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PropertyCard } from "@/components/property-card"
import { formatPrice } from "@/lib/data" // On garde formatPrice mais on enlève staticProperties
import api from "@/services/api"

// URL de ton backend Laravel
const API_URL = "http://127.0.0.1:8000";

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  
  // États des données
  const [property, setProperty] = useState<any>(null)
  const [similarProperties, setSimilarProperties] = useState<any[]>([]) // État pour les biens similaires
  const [loading, setLoading] = useState(true)
  const [currentImage, setCurrentImage] = useState(0)
  
  // États pour les favoris
  const [isFav, setIsFav] = useState(false)
  const [loadingFav, setLoadingFav] = useState(false)
  const [userFavorites, setUserFavorites] = useState<string[]>([]) // Liste de tous les favoris

  // États formulaire contact
  const [showContact, setShowContact] = useState(false)
  const [contactSent, setContactSent] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageData, setMessageData] = useState({ name: "", email: "", message: "" })

  // --- FONCTION INTELLIGENTE POUR L'IMAGE ---
  const getImageUrl = (path: string) => {
    if (!path) return "https://placehold.co/600x400?text=Pas+d+image"; 
    if (path.startsWith("/images") || path.startsWith("http")) {
      return path;
    }
    return `${API_URL}${path}`;
  }

  // --- 1. CHARGEMENT DES DONNÉES (BIEN + SIMILAIRES + FAVORIS) ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // A. Récupérer le bien principal
        const res = await api.get(`/properties/${id}`)
        const loadedProperty = res.data
        setProperty(loadedProperty)

        // B. Récupérer TOUS les biens pour filtrer les similaires
        const allRes = await api.get('/properties')
        const allProps = allRes.data

        // Logique de filtrage pour les similaires (Même ville OU même type, sauf lui-même)
        const similar = allProps
            .filter((p: any) => 
                p.id.toString() !== id && 
                (p.city === loadedProperty.city || p.property_type === loadedProperty.property_type)
            )
            .slice(0, 3) // On en garde 3
            .map((p: any) => {
                // Normalisation des images pour PropertyCard
                let imgs: string[] = [];
                if (Array.isArray(p.images)) imgs = p.images;
                else if (typeof p.images === 'string') { try { imgs = JSON.parse(p.images); } catch(e){ imgs = [] } }
                
                const formattedImages = imgs.map(img => img.startsWith('http') ? img : `${API_URL}${img}`);

                return {
                    ...p,
                    id: p.id.toString(),
                    images: formattedImages.length > 0 ? formattedImages : ["/placeholder.jpg"],
                    type: p.property_type, 
                    transaction: p.transaction_type
                };
            });
        
        setSimilarProperties(similar)

        // C. Récupérer les favoris de l'utilisateur
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const favRes = await api.get('/my-favorites');
                // On stocke tous les IDs des favoris
                const favIds = favRes.data.map((p: any) => p.id.toString());
                setUserFavorites(favIds);

                // Vérifier si le bien PRINCIPAL est favori
                if (loadedProperty) {
                    setIsFav(favIds.includes(loadedProperty.id.toString()));
                }
            } catch (err) {
                console.log("Erreur favoris (non connecté ?)", err);
            }
        }

      } catch (err) {
        console.error("Erreur chargement global", err)
      } finally {
        setLoading(false)
      }
    }

    if (id) fetchData()
  }, [id])

  // --- 2. GESTION DU CLIC FAVORIS (Bien principal) ---
  const handleFavoriteClick = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
        if (confirm("Vous devez être connecté pour ajouter des favoris. Voulez-vous vous connecter ?")) {
            router.push('/connexion');
        }
        return;
    }

    setLoadingFav(true);
    const previousState = isFav;
    setIsFav(!isFav); // Optimistic UI

    try {
        await api.post(`/properties/${id}/favorite`);
        
        // Mettre à jour la liste globale aussi
        if (!isFav) {
            setUserFavorites(prev => [...prev, id]);
        } else {
            setUserFavorites(prev => prev.filter(fid => fid !== id));
        }

    } catch (err) {
        console.error("Erreur toggle favori", err);
        setIsFav(previousState);
    } finally {
        setLoadingFav(false);
    }
  }
// Fonction pour vérifier la connexion avant d'ouvrir le formulaire
  const handleShowContact = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        router.push('/connexion'); // Redirige si pas de token
        return;
    }
    setShowContact(!showContact);
  }

  // Fonction pour envoyer le message au backend
  const handleMessageSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setSendingMessage(true);
      try {
          await api.post(`/properties/${id}/message`, messageData);
          setContactSent(true);
          setMessageData({ name: "", email: "", message: "" });
      } catch (err) {
          alert("Erreur lors de l'envoi.");
      } finally {
          setSendingMessage(false);
      }
  }
  // --- RENDU : LOADING ---
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  // --- RENDU : NOT FOUND ---
  if (!property) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-8">
          <h1 className="mb-4 font-serif text-3xl font-bold text-foreground">Bien introuvable</h1>
          <Button onClick={() => router.push("/biens")} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Retour aux annonces
          </Button>
        </div>
        <Footer />
      </div>
    )
  }

  // --- NORMALISATION DONNÉES BIEN PRINCIPAL ---
  let images: string[] = [];
  if (Array.isArray(property.images)) images = property.images;
  else if (typeof property.images === 'string') { try { images = JSON.parse(property.images); } catch (e) { images = []; } }
  if (images.length === 0) images = ["https://placehold.co/600x400?text=No+Image"];

  let features: string[] = [];
  if (property.features && Array.isArray(property.features)) features = property.features; 
  else if (property.equipments) {
      if (Array.isArray(property.equipments)) features = property.equipments;
      else try { features = JSON.parse(property.equipments); } catch (e) {}
  }

  const dateString = property.createdAt || property.created_at;
  const formattedDate = dateString ? new Date(dateString).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "Récemment";

  const nextImage = () => setCurrentImage((prev) => (prev + 1) % images.length)
  const prevImage = () => setCurrentImage((prev) => (prev - 1 + images.length) % images.length)

  // --- RENDU FINAL ---
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">Accueil</Link>
          <span>/</span>
          <Link href="/biens" className="hover:text-primary">Biens</Link>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{property.title}</span>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            
            {/* Gallery */}
            <div className="relative mb-6 overflow-hidden rounded-2xl bg-secondary/20 aspect-[16/10]">
              <Image
                src={getImageUrl(images[currentImage])}
                alt={`${property.title} - Image ${currentImage + 1}`}
                fill
                className="object-cover"
                priority
                unoptimized
              />

              {images.length > 1 && (
                <>
                  <button onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70">
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70">
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <div className="absolute bottom-3 left-3 flex gap-2">
                <Badge className="bg-primary text-primary-foreground capitalize">
                  {property.transaction || property.transaction_type}
                </Badge>
                <Badge variant="secondary" className="bg-card/90 text-card-foreground backdrop-blur-sm capitalize">
                  {property.type || property.property_type}
                </Badge>
              </div>

              <div className="absolute bottom-3 right-3 rounded-full bg-card/80 px-3 py-1 text-xs text-foreground backdrop-blur-sm">
                {currentImage + 1} / {images.length}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImage(idx)}
                    className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                      idx === currentImage ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <Image 
                        src={getImageUrl(img)}
                        alt={`Miniature ${idx + 1}`} 
                        fill 
                        className="object-cover"
                        unoptimized 
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Title & Actions */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="mb-2 font-serif text-2xl font-bold text-foreground md:text-3xl">{property.title}</h1>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{property.address}, {property.city}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={handleFavoriteClick} 
                    disabled={loadingFav}
                    title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  {loadingFav ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                      <Heart className={`h-4 w-4 ${isFav ? "fill-destructive text-destructive" : ""}`} />
                  )}
                </Button>
                <Button variant="outline" size="icon"><Share2 className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Price */}
            <div className="mb-6 rounded-xl bg-primary/5 p-4">
              <p className="text-3xl font-bold text-primary">{formatPrice(property.price, property.transaction || property.transaction_type)}</p>
            </div>

            {/* Key Details */}
            <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <Maximize2 className="mx-auto mb-2 h-5 w-5 text-primary" />
                <p className="text-lg font-bold text-foreground">{property.surface} m&sup2;</p>
                <p className="text-xs text-muted-foreground">Surface</p>
              </div>
              {(property.rooms !== undefined) && (
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <Home className="mx-auto mb-2 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold text-foreground">{property.rooms}</p>
                  <p className="text-xs text-muted-foreground">Pièces</p>
                </div>
              )}
              {(property.bedrooms !== undefined) && (
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <BedDouble className="mx-auto mb-2 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold text-foreground">{property.bedrooms}</p>
                  <p className="text-xs text-muted-foreground">Chambres</p>
                </div>
              )}
              {(property.bathrooms !== undefined) && (
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <Bath className="mx-auto mb-2 h-5 w-5 text-primary" />
                  <p className="text-lg font-bold text-foreground">{property.bathrooms}</p>
                  <p className="text-xs text-muted-foreground">SdB</p>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-6">
              <h2 className="mb-3 font-serif text-xl font-bold text-foreground">Description</h2>
              <p className="leading-relaxed text-muted-foreground whitespace-pre-line">{property.description}</p>
            </div>

            {/* Features */}
            {features.length > 0 && (
                <div className="mb-6">
                <h2 className="mb-3 font-serif text-xl font-bold text-foreground">Equipements</h2>
                <div className="flex flex-wrap gap-2">
                    {features.map((feature) => (
                    <div key={feature} className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
                        <Check className="h-3.5 w-3.5 text-primary" /> {feature}
                    </div>
                    ))}
                </div>
                </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Eye className="h-4 w-4" /> {property.views || 0} vues
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" /> Publiée le {formattedDate}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary capitalize">
                    {(property.agency || property.user?.name || "A").charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{property.agency || property.user?.name || "Agence / Particulier"}</h3>
                    <p className="text-sm text-muted-foreground">Vérifié</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <a href={`tel:${property.agencyPhone || property.user?.phone || ""}`}>
                    <Button className="w-full gap-2"><Phone className="h-4 w-4" /> Appeler</Button>
                  </a>
                  <Button variant="outline" className="w-full gap-2" onClick={handleShowContact}>
                    <Mail className="h-4 w-4" /> Envoyer un message
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </Button>
                </div>
              </div>

              {/* Contact Form */}
              {showContact && (
                <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
                  <h3 className="mb-4 font-semibold text-foreground">Envoyer un message</h3>
                  {contactSent ? (
                    <div className="rounded-lg bg-primary/10 p-4 text-center">
                      <Check className="mx-auto mb-2 h-8 w-8 text-primary" />
                      <p className="font-medium text-foreground">Message envoyé !</p>
                    </div>
                  ) : (
                   <form onSubmit={handleMessageSubmit} className="flex flex-col gap-3">
  <input 
    type="text" placeholder="Votre nom" required 
    className="rounded-lg border bg-background px-3 py-2.5 text-sm"
    value={messageData.name}
    onChange={(e) => setMessageData({...messageData, name: e.target.value})}
  />
  <input 
    type="email" placeholder="Votre email" required 
    className="rounded-lg border bg-background px-3 py-2.5 text-sm"
    value={messageData.email}
    onChange={(e) => setMessageData({...messageData, email: e.target.value})}
  />
  <textarea 
    placeholder="Votre message..." rows={4} required 
    className="rounded-lg border bg-background px-3 py-2.5 text-sm"
    value={messageData.message}
    onChange={(e) => setMessageData({...messageData, message: e.target.value})}
  />
  <Button type="submit" className="w-full" disabled={sendingMessage}>
    {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : "Envoyer"}
  </Button>
</form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Similar Properties (Utilisant l'état dynamic similarProperties) */}
        {similarProperties.length > 0 && (
          <div className="mt-12 border-t border-border pt-12">
            <h2 className="mb-6 font-serif text-2xl font-bold text-foreground">Biens similaires</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {similarProperties.map((p) => (
                <PropertyCard 
                    key={p.id} 
                    property={p} 
                    // Activation correcte des favoris pour les biens similaires
                    initialIsFavorite={userFavorites.includes(p.id.toString())}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}