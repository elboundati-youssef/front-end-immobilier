"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation" // Pour rediriger si pas connecté
import { Heart, MapPin, Maximize2, BedDouble, Bath, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { type Property, formatPrice } from "@/lib/data"
import api from "@/services/api"

// URL du backend
const API_URL = "http://127.0.0.1:8000";

interface PropertyCardProps {
  property: any; // On met any pour accepter le format Laravel et data.ts
  initialIsFavorite?: boolean; // Nouvelle propriété optionnelle
}

export function PropertyCard({ property, initialIsFavorite = false }: PropertyCardProps) {
  const router = useRouter()
  const [isFav, setIsFav] = useState(initialIsFavorite)
  const [loadingFav, setLoadingFav] = useState(false)

  // Mettre à jour l'état si la prop change (utile lors du filtrage/pagination)
  useEffect(() => {
    setIsFav(initialIsFavorite)
  }, [initialIsFavorite])

  // --- FONCTION INTELLIGENTE POUR L'IMAGE ---
  const getImageUrl = (path: string) => {
    if (!path) return "https://placehold.co/600x400?text=Pas+d+image";
    if (path.startsWith("/images") || path.startsWith("http")) return path;
    return `${API_URL}${path}`;
  }

  // Sécurité image
  let firstImage = "/placeholder.jpg";
  if (Array.isArray(property.images) && property.images.length > 0) firstImage = property.images[0];
  else if (typeof property.images === 'string') {
      try { const parsed = JSON.parse(property.images); if(parsed.length > 0) firstImage = parsed[0]; } catch(e){}
  }

  // --- GESTION DU CLIC FAVORIS ---
  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault(); // Empêche d'ouvrir la page du bien
    e.stopPropagation();

    // 1. Vérifier si connecté (Token présent ?)
    const token = localStorage.getItem('token');
    if (!token) {
        alert("Vous devez être connecté pour ajouter un favori.");
        router.push('/connexion');
        return;
    }

    // 2. Optimistic UI (On change la couleur tout de suite)
    const previousState = isFav;
    setIsFav(!isFav);
    setLoadingFav(true);

    try {
        // 3. Appel API Laravel
        await api.post(`/properties/${property.id}/favorite`);
        // Le backend gère l'ajout ou le retrait automatiquement (toggle)
    } catch (error) {
        console.error("Erreur favori", error);
        // Si erreur, on remet l'état d'avant
        setIsFav(previousState);
    } finally {
        setLoadingFav(false);
    }
  }

  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={getImageUrl(firstImage)}
          alt={property.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized // Important pour localhost
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />

        <div className="absolute left-3 top-3 flex gap-2">
          <Badge className="bg-primary text-primary-foreground capitalize">
            {property.transaction || property.transaction_type}
          </Badge>
          <Badge variant="secondary" className="bg-card/90 text-card-foreground backdrop-blur-sm capitalize">
            {property.type || property.property_type || "Bien"}
          </Badge>
        </div>

        {/* BOUTON FAVORIS ACTIF */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 h-8 w-8 rounded-full bg-card/80 text-foreground backdrop-blur-sm hover:bg-card z-20"
          onClick={handleFavoriteClick}
          disabled={loadingFav}
          title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          {loadingFav ? (
             <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
             <Heart className={`h-4 w-4 transition-colors ${isFav ? "fill-red-500 text-red-500" : ""}`} />
          )}
        </Button>

        <div className="absolute bottom-3 left-3">
          <p className="text-lg font-bold text-card">
            {formatPrice(property.price, property.transaction || property.transaction_type)}
          </p>
        </div>
      </div>

      <Link href={`/biens/${property.id}`} className="block p-4">
        <h3 className="mb-1 font-serif text-lg font-semibold text-foreground line-clamp-1">{property.title}</h3>

        <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          <span className="line-clamp-1">{property.address || property.city}</span>
        </div>

        <div className="flex items-center gap-4 border-t border-border pt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Maximize2 className="h-3.5 w-3.5" />
            <span>{property.surface} m&sup2;</span>
          </div>
          {(property.rooms > 0) && (
            <div className="flex items-center gap-1.5">
              <BedDouble className="h-3.5 w-3.5" />
              <span>{property.bedrooms || property.rooms} ch.</span>
            </div>
          )}
          {(property.bathrooms > 0) && (
            <div className="flex items-center gap-1.5">
              <Bath className="h-3.5 w-3.5" />
              <span>{property.bathrooms} sdb.</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}