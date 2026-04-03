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


export const properties = [
  {
    id: "test1",
    title: "Appartement Moderne au Centre-Ville",
    description: "Magnifique appartement de standing au coeur de Casablanca, entièrement rénové avec des matériaux haut de gamme. Lumineux et spacieux, il offre une vue imprenable sur la ville. Cuisine équipée, salon double, balcon panoramique.",
    price: 1850000,
    type: "appartement",
    transaction: "vente",
    status: "disponible",
    surface: 120,
    rooms: 4,
    bedrooms: 2,
    bathrooms: 2,
    address: "Boulevard Mohammed V, Casablanca",
    city: "Casablanca",
    lat: 33.5898,        // Gardé pour compatibilité
    lng: -7.6038,        // Gardé pour compatibilité
    latitude: 33.5898,   // 🌟 Ajout explicite pour la DB/Carte
    longitude: -7.6038,  // 🌟 Ajout explicite pour la DB/Carte
    images: ["/images/exemple-1.jpg", "/images/exemple-4.jpg"],
    features: ["Parking", "Ascenseur", "Climatisation", "Sécurité 24h"],
    agency: "Agence Prestige Immo",
    agencyPhone: "+212 5 22 00 00 00",
    agencyEmail: "contact@prestigeimmo.ma",
    createdAt: "2026-02-10",
    views: 245,
  },
  {
    id: "test2",
    title: "Villa de Luxe avec Piscine",
    description: "Superbe villa contemporaine dans un quartier résidentiel prisé de Marrakech. Jardin paysager de 500m2, piscine chauffée, terrasse couverte. 5 chambres avec salles de bains attenantes. Parfait pour une famille.",
    price: 4500000,
    type: "villa",
    transaction: "vente",
    status: "disponible",
    surface: 350,
    rooms: 8,
    bedrooms: 5,
    bathrooms: 5,
    address: "Route de l'Ourika, Marrakech",
    city: "Marrakech",
    lat: 31.5885,
    lng: -7.9811,
    latitude: 31.5885,
    longitude: -7.9811,
    images: ["/images/exemple-2.jpg", "/images/img-c.jpg"],
    features: ["Piscine", "Jardin", "Parking", "Climatisation", "Sécurité 24h"],
    agency: "Marrakech Real Estate",
    agencyPhone: "+212 5 24 00 00 00",
    agencyEmail: "info@mre.ma",
    createdAt: "2026-02-08",
    views: 512,
  },
  {
    id: "test3",
    title: "Bureau Premium - Quartier d'Affaires",
    description: "Espace de bureau professionnel dans le quartier d'affaires de Rabat. Idéal pour entreprise en croissance. Open space moderne, salles de réunion équipées, fibre optique.",
    price: 15000,
    type: "bureau",
    transaction: "location",
    status: "disponible",
    surface: 200,
    rooms: 6,
    bedrooms: 0,
    bathrooms: 2,
    address: "Hay Riad, Rabat",
    city: "Rabat",
    lat: 33.9563,
    lng: -6.8647,
    latitude: 33.9563,
    longitude: -6.8647,
    images: ["/images/exemple-1.jpg"],
    features: ["Parking", "Ascenseur", "Climatisation", "Fibre optique"],
    agency: "Pro Office Immo",
    agencyPhone: "+212 5 37 00 00 00",
    agencyEmail: "contact@prooffice.ma",
    createdAt: "2026-02-12",
    views: 189,
  },
  {
    id: "test4",
    title: "Penthouse Vue Mer Panoramique",
    description: "Exceptionnel penthouse en duplex avec terrasse de 80m2 et vue mer à 180 degrés. Finitions luxueuses, domotique intégrée, jacuzzi privatif sur le toit. Un bien d'exception à Tanger.",
    price: 6200000,
    type: "appartement",
    transaction: "vente",
    status: "disponible",
    surface: 250,
    rooms: 6,
    bedrooms: 3,
    bathrooms: 3,
    address: "Corniche de Tanger, Tanger",
    city: "Tanger",
    lat: 35.7758,
    lng: -5.8039,
    latitude: 35.7758,
    longitude: -5.8039,
    images: ["/images/exemple-4.jpg", "/images/exemple-1.jpg"],
    features: ["Vue mer", "Terrasse", "Piscine", "Parking", "Domotique"],
    agency: "Tanger Bay Properties",
    agencyPhone: "+212 5 39 00 00 00",
    agencyEmail: "info@tangerbay.ma",
    createdAt: "2026-02-05",
    views: 678,
  },
  {
    id: "test5",
    title: "Maison Familiale avec Jardin",
    description: "Charmante maison familiale dans un quartier calme et sécurisé de Fès. Grand jardin, garage double, cuisine ouverte sur le salon. Proche écoles et commerces.",
    price: 2100000,
    type: "maison",
    transaction: "vente",
    status: "disponible",
    surface: 180,
    rooms: 5,
    bedrooms: 3,
    bathrooms: 2,
    address: "Quartier Champs de Course, Fès",
    city: "Fès",
    lat: 34.0333,
    lng: -5.0000,
    latitude: 34.0333,
    longitude: -5.0000,
    images: ["/images/exemple-5.jpg"],
    features: ["Jardin", "Garage", "Climatisation", "Proche écoles"],
    agency: "Fès Immo Services",
    agencyPhone: "+212 5 35 00 00 00",
    agencyEmail: "contact@fesimmo.ma",
    createdAt: "2026-02-14",
    views: 156,
  },
  {
    id: "test6",
    title: "Terrain Constructible Vue Montagne",
    description: "Magnifique terrain constructible de 1000m2 avec vue dégagée sur les montagnes de l'Atlas. Idéal pour projet de villa ou petit lotissement. Titre foncier disponible.",
    price: 800000,
    type: "terrain",
    transaction: "vente",
    status: "disponible",
    surface: 1000,
    rooms: 0,
    bedrooms: 0,
    bathrooms: 0,
    address: "Route d'Ifrane, Région de Meknès",
    city: "Meknès",
    lat: 33.8935,
    lng: -5.5473,
    latitude: 33.8935,
    longitude: -5.5473,
    images: ["/images/exemple-6.jpg"],
    features: ["Titre foncier", "Vue montagne", "Route goudronnée"],
    agency: "Atlas Terrain Pro",
    agencyPhone: "+212 5 35 00 00 00",
    agencyEmail: "contact@atlasterrain.ma",
    createdAt: "2026-02-01",
    views: 312,
  }
];
export const cities = [
  "Agadir",
  "Al Hoceïma",
  "Asilah",
  "Azrou",
  "Béni Mellal",
  "Benslimane",
  "Berkane",
  "Berrechid",
  "Casablanca",
  "Chefchaouen",
  "Dakhla",
  "El Jadida",
  "Errachidia",
  "Essaouira",
  "Fès",
  "Fnideq",
  "Guelmim",
  "Guercif",
  "Ifrane",
  "Kénitra",
  "Khémisset",
  "Khenifra",
  "Khouribga",
  "Ksar El Kebir",
  "Laâyoune",
  "Larache",
  "M'diq",
  "Marrakech",
  "Martil",
  "Meknès",
  "Midelt",
  "Mohammedia",
  "Nador",
  "Ouarzazate",
  "Oued Zem",
  "Ouezzane",
  "Oujda",
  "Rabat",
  "Safi",
  "Salé",
  "Sefrou",
  "Settat",
  "Sidi Bennour",
  "Sidi Ifni",
  "Sidi Kacem",
  "Sidi Slimane",
  "Tanger",
  "Tan-Tan",
  "Taourirt",
  "Taroudant",
  "Taza",
  "Témara",
  "Tétouan",
  "Tinghir",
  "Tiznit",
  "Youssoufia",
  "Zagora"
];

export const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: "appartement", label: "Appartement" },
  { value: "villa", label: "Villa" },
  { value: "maison", label: "Maison" },
  { value: "terrain", label: "Terrain" },
  { value: "bureau", label: "Bureau" },
]

export const transactionTypes: { value: TransactionType; label: string }[] = [
  { value: "vente", label: "Acheter" },
  { value: "location", label: "Louer" },
]

export function formatPrice(price: number, transaction: TransactionType): string {
  const formatted = new Intl.NumberFormat("fr-MA").format(price)
  return transaction === "location" ? `${formatted} DH/mois` : `${formatted} DH`
}
