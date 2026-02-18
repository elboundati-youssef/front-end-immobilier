export type PropertyType = "appartement" | "villa" | "terrain" | "bureau" | "maison"
export type TransactionType = "vente" | "location"
export type PropertyStatus = "disponible" | "vendu" | "loue"

export interface Property {
  id: string
  title: string
  description: string
  price: number
  type: PropertyType
  transaction: TransactionType
  status: PropertyStatus
  surface: number
  rooms: number
  bedrooms: number
  bathrooms: number
  address: string
  city: string
  lat: number
  lng: number
  images: string[]
  features: string[]
  agency: string
  agencyPhone: string
  agencyEmail: string
  createdAt: string
  views: number
}

export const properties: Property[] = [
// {
//   id: "test1",
//   title: "Appartement Moderne au Centre-Ville",
//   description: "Magnifique appartement de standing au coeur de Casablanca, entierement renove avec des materiaux haut de gamme. Lumineux et spacieux, il offre une vue imprenable sur la ville. Cuisine equipee, salon double, balcon panoramique.",
//   price: 1850000,
//   type: "appartement",
//   transaction: "vente",
//   status: "disponible",
//   surface: 120,
//   rooms: 4,
//   bedrooms: 2,
//   bathrooms: 2,
//   address: "Boulevard Mohammed V, Casablanca",
//   city: "Casablanca",
//   lat: 33.5731,
//   lng: -7.5898,
//   images: ["/images/exemple-1.jpg", "/images/exemple-4.jpg"],
//   features: ["Parking", "Ascenseur", "Climatisation", "Securite 24h"],
//   agency: "Agence Prestige Immo",
//   agencyPhone: "+212 5 22 00 00 00",
//   agencyEmail: "contact@prestigeimmo.ma",
//   createdAt: "2026-02-10",
//   views: 245,
// },
// {
//   id: "test2",
//   title: "Villa de Luxe avec Piscine",
//   description: "Superbe villa contemporaine dans un quartier residentiel prisee de Marrakech. Jardin paysager de 500m2, piscine chauffee, terrasse couverte. 5 chambres avec salles de bains attenantes. Parfait pour une famille.",
//   price: 4500000,
//   type: "villa",
//   transaction: "vente",
//   status: "disponible",
//   surface: 350,
//   rooms: 8,
//   bedrooms: 5,
//   bathrooms: 5,
//   address: "Route de l'Ourika, Marrakech",
//   city: "Marrakech",
//   lat: 31.6295,
//   lng: -7.9811,
//   images: ["/images/exemple-2.jpg", "/images/img-c.jpg"],
//   features: ["Piscine", "Jardin", "Parking", "Climatisation", "Securite 24h"],
//   agency: "Marrakech Real Estate",
//   agencyPhone: "+212 5 24 00 00 00",
//   agencyEmail: "info@mre.ma",
//   createdAt: "2026-02-08",
//   views: 512,
// },
// {
//   id: "test3",
//   title: "Bureau Premium - Quartier d'Affaires",
//   description: "Espace de bureau professionnel dans le quartier d'affaires de Rabat. Ideal pour entreprise en croissance. Open space moderne, salles de reunion equipees, fibre optique.",
//   price: 15000,
//   type: "bureau",
//   transaction: "location",
//   status: "disponible",
//   surface: 200,
//   rooms: 6,
//   bedrooms: 0,
//   bathrooms: 2,
//   address: "Hay Riad, Rabat",
//   city: "Rabat",
//   lat: 34.0209,
//   lng: -6.8416,
//   images: ["/images/exemple-1.jpg"],
//   features: ["Parking", "Ascenseur", "Climatisation", "Fibre optique"],
//   agency: "Pro Office Immo",
//   agencyPhone: "+212 5 37 00 00 00",
//   agencyEmail: "contact@prooffice.ma",
//   createdAt: "2026-02-12",
//   views: 189,
// },
// {
//   id: "test4",
//   title: "Penthouse Vue Mer Panoramique",
//   description: "Exceptionnel penthouse en duplex avec terrasse de 80m2 et vue mer a 180 degres. Finitions luxueuses, domotique integree, jacuzzi privatif sur le toit. Un bien d'exception a Tanger.",
//   price: 6200000,
//   type: "appartement",
//   transaction: "vente",
//   status: "disponible",
//   surface: 250,
//   rooms: 6,
//   bedrooms: 3,
//   bathrooms: 3,
//   address: "Corniche de Tanger, Tanger",
//   city: "Tanger",
//   lat: 35.7595,
//   lng: -5.8340,
//   images: ["/images/exemple-4.jpg", "/images/exemple-1.jpg"],
//   features: ["Vue mer", "Terrasse", "Piscine", "Parking", "Domotique"],
//   agency: "Tanger Bay Properties",
//   agencyPhone: "+212 5 39 00 00 00",
//   agencyEmail: "info@tangerbay.ma",
//   createdAt: "2026-02-05",
//   views: 678,
// },
// {
//   id: "test5",
//   title: "Maison Familiale avec Jardin",
//   description: "Charmante maison familiale dans un quartier calme et securise de Fes. Grand jardin, garage double, cuisine ouverte sur le salon. Proche ecoles et commerces.",
//   price: 2100000,
//   type: "maison",
//   transaction: "vente",
//   status: "disponible",
//   surface: 180,
//   rooms: 5,
//   bedrooms: 3,
//   bathrooms: 2,
//   address: "Quartier des Oliviers, Fes",
//   city: "Fes",
//   lat: 34.0181,
//   lng: -5.0078,
//   images: ["/images/exemple-5.jpg"],
//   features: ["Jardin", "Garage", "Climatisation", "Proche ecoles"],
//   agency: "Fes Immo Services",
//   agencyPhone: "+212 5 35 00 00 00",
//   agencyEmail: "contact@fesimmo.ma",
//   createdAt: "2026-02-14",
//   views: 156,
// },
// {
//   id: "test6",
//   title: "Terrain Constructible Vue Montagne",
//   description: "Magnifique terrain constructible de 1000m2 avec vue degagee sur les montagnes de l'Atlas. Ideal pour projet de villa ou petit lotissement. Titre foncier disponible.",
//   price: 800000,
//   type: "terrain",
//   transaction: "vente",
//   status: "disponible",
//   surface: 1000,
//   rooms: 0,
//   bedrooms: 0,
//   bathrooms: 0,
//   address: "Route d'Ifrane, Region de Meknes",
//   city: "Meknes",
//   lat: 33.8935,
//   lng: -5.5473,
//   images: ["/images/exemple-6.jpg"],
//   features: ["Titre foncier", "Vue montagne", "Route goudronnee"],
//   agency: "Atlas Terrain Pro",
//   agencyPhone: "+212 5 35 00 00 00",
//   agencyEmail: "contact@atlasterrain.ma",
//   createdAt: "2026-02-01",
//   views: 312,
// },
]

export const cities = ["Casablanca", "Marrakech", "Rabat", "Tanger", "Fes", "Meknes", "Agadir", "Oujda"]

export const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: "appartement", label: "Appartement" },
  { value: "villa", label: "Villa" },
  { value: "maison", label: "Maison" },
  { value: "terrain", label: "Terrain" },
  { value: "bureau", label: "Bureau" },
]

export const transactionTypes: { value: TransactionType; label: string }[] = [
  { value: "vente", label: "Vente" },
  { value: "location", label: "Location" },
]

export function formatPrice(price: number, transaction: TransactionType): string {
  const formatted = new Intl.NumberFormat("fr-MA").format(price)
  return transaction === "location" ? `${formatted} DH/mois` : `${formatted} DH`
}
