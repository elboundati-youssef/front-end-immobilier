"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from "next-intl" // 🌟 IMPORT NEXT-INTL
import { Heart, MapPin, Maximize2, BedDouble, Bath, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatPrice } from "@/lib/data"
import api from "@/services/api"

const API_URL = "http://127.0.0.1:8000";

interface PropertyCardProps {
  property: any; 
  initialIsFavorite?: boolean; 
}

export function PropertyCard({ property, initialIsFavorite = false }: PropertyCardProps) {
  const t = useTranslations("PropertyCard") // 🌟 INITIALISATION TRADUCTION
  const router = useRouter()
  const pathname = usePathname()
  
  // 🌟 GESTION DE LA LANGUE POUR LES LIENS
  const currentLocale = pathname.split("/")[1] || "fr"
  const l = (path: string) => `/${currentLocale}${path}`

  const [isFav, setIsFav] = useState(initialIsFavorite)
  const [loadingFav, setLoadingFav] = useState(false)

  useEffect(() => {
    setIsFav(initialIsFavorite)
  }, [initialIsFavorite])

  // Helper pour traduire les types (ex: appartement -> Apartment)
  const getTranslatedLabel = (category: string, value: string, defaultLabel: string) => {
    try {
      // On réutilise les traductions de SearchBar pour éviter la duplication
      const tSearch = require(`@/messages/${currentLocale}.json`).SearchBar;
      return tSearch[category][value] || defaultLabel;
    } catch {
      return defaultLabel;
    }
  }

  const getImageUrl = (path: string) => {
    if (!path) return "https://placehold.co/600x400?text=Pas+d+image";
    if (path.startsWith("/images") || path.startsWith("http")) return path;
    return `${API_URL}${path}`;
  }

  let firstImage = "/placeholder.jpg";
  if (Array.isArray(property.images) && property.images.length > 0) firstImage = property.images[0];
  else if (typeof property.images === 'string') {
      try { const parsed = JSON.parse(property.images); if(parsed.length > 0) firstImage = parsed[0]; } catch(e){}
  }

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation();

    const token = localStorage.getItem('token');
    if (!token) {
        alert(t("loginRequired")); // 🌟 Traduction
        router.push(l('/connexion'));
        return;
    }

    const previousState = isFav;
    setIsFav(!isFav);
    setLoadingFav(true);

    try {
        await api.post(`/properties/${property.id}/favorite`);
    } catch (error) {
        console.error("Erreur favori", error);
        setIsFav(previousState);
    } finally {
        setLoadingFav(false);
    }
  }

  const transactionType = property.transaction || property.transaction_type;
  const propertyType = property.type || property.property_type;

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
      
      {/* L'image principale */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={getImageUrl(firstImage)}
          alt={property.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent pointer-events-none" />

        <Link href={l(`/biens/${property.slug}`)} className="absolute inset-0 z-10" aria-label={`Voir les détails de ${property.title}`} />

        <div className="absolute left-3 top-3 flex gap-2 z-20">
          <Badge className="bg-primary text-primary-foreground capitalize shadow-sm">
            {getTranslatedLabel("transactionTypes", transactionType, transactionType)}
          </Badge>
          <Badge variant="secondary" className="bg-card/90 text-card-foreground backdrop-blur-sm capitalize shadow-sm">
            {getTranslatedLabel("propertyTypes", propertyType, propertyType || "Bien")}
          </Badge>
        </div>

        {/* BOUTON FAVORIS */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-3 top-3 h-8 w-8 rounded-full bg-card/90 text-foreground backdrop-blur-sm hover:bg-card z-20 shadow-sm transition-transform hover:scale-110"
          onClick={handleFavoriteClick}
          disabled={loadingFav}
          title={isFav ? t("removeFav") : t("addFav")}
        >
          {loadingFav ? (
             <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
             <Heart className={`h-4 w-4 transition-colors ${isFav ? "fill-red-500 text-red-500" : ""}`} />
          )}
        </Button>

        <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none">
          <p className="text-xl font-bold text-white drop-shadow-md">
            {formatPrice(property.price, transactionType)}
          </p>
        </div>
      </div>

      {/* LIEN INFOS */}
      <Link href={l(`/biens/${property.slug}`)} className="block p-4">
        <h3 className="mb-1 font-serif text-lg font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{property.title}</h3>

        <div className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="line-clamp-1">{property.address || property.city}</span>
        </div>

        <div className="flex items-center gap-4 border-t border-border pt-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium">
            <Maximize2 className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span>{property.surface} m&sup2;</span>
          </div>
          {(property.rooms > 0) && (
            <div className="flex items-center gap-1.5 font-medium">
              <BedDouble className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span>{property.bedrooms || property.rooms} {t("beds")}</span>
            </div>
          )}
          {(property.bathrooms > 0) && (
            <div className="flex items-center gap-1.5 font-medium">
              <Bath className="h-3.5 w-3.5 text-muted-foreground/70" />
              <span>{property.bathrooms} {t("baths")}</span>
            </div>
          )}
        </div>
      </Link>
    </div>
  )
}