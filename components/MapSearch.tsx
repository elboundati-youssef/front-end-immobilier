"use client"

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Link from 'next/link'
import Image from 'next/image'

// Correction de l'icône par défaut de Leaflet
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const API_URL = "http://127.0.0.1:8000";

export default function MapSearch({ properties, locale }: { properties: any[], locale: string }) {
  // Centre par défaut (Maroc)
  const defaultCenter = [31.7917, -7.0926]; 

  // Fonction pour l'image
  const getImageUrl = (imagesData: any) => {
    if (!imagesData) return "/placeholder.jpg";
    let images = typeof imagesData === 'string' ? JSON.parse(imagesData) : imagesData;
    let path = (Array.isArray(images) && images.length > 0) ? images[0] : "/placeholder.jpg";
    if (path.startsWith("http") || path.startsWith("/images")) return path;
    return `${API_URL}${path}`;
  }

  // 🌟 FONCTION POUR TRADUIRE "VENTE" / "LOCATION" SELON LA LANGUE
  const getTransactionLabel = (type: string) => {
    // Si transaction === 'vente'
    if (type === 'vente') {
      if (locale === 'ar') return 'شراء'; // Acheter en arabe
      if (locale === 'en') return 'Buy';  // Acheter en anglais
      return 'Acheter';
    }
    // Si transaction === 'location'
    if (type === 'location') {
      if (locale === 'ar') return 'إيجار'; // Louer en arabe
      if (locale === 'en') return 'Rent';  // Louer en anglais
      return 'Louer';
    }
    return type; // Sécurité au cas où
  }

  return (
    <MapContainer 
      center={defaultCenter as [number, number]} 
      zoom={6} 
      className="h-full w-full rounded-2xl z-0 shadow-sm border border-border"
    >
      {/* 🌟 FOND DE CARTE GOOGLE MAPS (Affiche le Maroc complet, sans coupure) */}
      <TileLayer
        url={`https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&gl=MA&hl=${locale}`}
        attribution="&copy; Google Maps"
      />

      {properties.map((property) => {
        // On n'affiche que les biens qui ont des coordonnées valides
        if (!property.latitude || !property.longitude) return null;

        return (
          <Marker 
            key={property.id} 
            position={[property.latitude, property.longitude]} 
            icon={icon}
          >
            <Popup className="custom-popup">
              <Link href={`/${locale}/biens/${property.slug || property.id}`} className="flex flex-col gap-2 w-[200px] hover:opacity-90 transition-opacity">
                
                {/* Image du bien + Badge */}
                <div className="relative h-28 w-full rounded-lg overflow-hidden bg-secondary">
                   <Image src={getImageUrl(property.images)} alt={property.title} fill className="object-cover" unoptimized />
                   
                   {/* 🌟 LE BADGE ACHETER / LOUER ICI 👇 */}
                   <div className="absolute top-2 left-2 rtl:right-2 rtl:left-auto z-10 rounded bg-[#c26d43] px-2 py-1 text-[10px] font-bold text-white shadow-md uppercase tracking-widest">
                     {getTransactionLabel(property.transaction)}
                   </div>
                </div>

                {/* Infos sous l'image */}
                <div>
                  <p className="font-bold text-sm m-0 line-clamp-1 text-foreground">{property.title}</p>
                  <p className="text-muted-foreground text-xs m-0 mb-1">{property.city}</p>
                  <p className="text-[#c26d43] font-bold text-sm m-0">{property.price} DH</p>
                </div>

              </Link>
            </Popup>
          </Marker>
        )
      })}
    </MapContainer>
  )
}