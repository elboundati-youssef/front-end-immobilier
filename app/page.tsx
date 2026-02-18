"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Building2, Users, Shield, TrendingUp, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PropertyCard } from "@/components/property-card"
import { SearchBar } from "@/components/search-bar"
import { cities } from "@/lib/data" 
import api from "@/services/api"

// URL du backend
const API_URL = "http://127.0.0.1:8000";

const stats = [
  { icon: Building2, value: "5,000+", label: "Annonces actives" },
  { icon: Users, value: "12,000+", label: "Utilisateurs" },
  { icon: Shield, value: "100%", label: "Annonces vérifiées" },
  { icon: TrendingUp, value: "3,200+", label: "Transactions réussies" },
]

export default function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([])
  const [allProperties, setAllProperties] = useState<any[]>([])
  const [userFavorites, setUserFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  // NOUVEAU : État pour stocker l'utilisateur connecté
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Récupérer l'utilisateur du localStorage pour l'affichage conditionnel
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser))
            } catch (e) { console.error("Erreur parsing user", e) }
        }

        // 2. Récupérer toutes les annonces
        const res = await api.get('/properties')
        const rawProperties = res.data;

        // Normalisation des données
        const normalizedProperties = rawProperties
            // Filtre de sécurité frontend (optionnel si le backend filtre déjà)
            .filter((p: any) => p.status === 'publié')
            .map((p: any) => {
            let images: string[] = [];
            if (Array.isArray(p.images)) images = p.images;
            else if (typeof p.images === 'string') { try { images = JSON.parse(p.images); } catch(e){ images = [] } }
            
            const formattedImages = images.map(img => img.startsWith('http') ? img : `${API_URL}${img}`);

            return {
                ...p,
                id: p.id.toString(),
                images: formattedImages.length > 0 ? formattedImages : ["/placeholder.jpg"],
                type: p.property_type,
                transaction: p.transaction_type,
            };
        });

        setAllProperties(normalizedProperties);
        // On prend les 6 derniers
        setFeaturedProperties(normalizedProperties.slice(0, 6));

        // 3. Récupérer les favoris (si connecté)
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const favRes = await api.get('/my-favorites');
                const favIds = favRes.data.map((p: any) => p.id.toString());
                setUserFavorites(favIds);
            } catch (err) {
                console.log("Non connecté ou erreur favoris");
            }
        }

      } catch (err) {
        console.error("Erreur chargement Home", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/img1-c.jpg"
            alt="Propriété de luxe"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-foreground/60" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 md:py-36 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-serif text-4xl font-bold tracking-tight text-card md:text-5xl lg:text-6xl text-balance">
              Trouvez le bien immobilier de vos rêves
            </h1>
            <p className="mb-8 text-lg leading-relaxed text-card/80 md:text-xl">
              Explorez des milliers d&apos;annonces vérifiées à travers tout le Maroc. Vente, location, appartements, villas et plus encore.
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <SearchBar variant="hero" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="mb-1 text-sm font-medium uppercase tracking-wider text-primary">Biens en vedette</p>
            <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">Nos dernières annonces</h2>
          </div>
          <Link href="/biens">
            <Button variant="outline" className="hidden gap-2 md:flex">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {loading ? (
            <div className="flex justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProperties.length > 0 ? (
                featuredProperties.map((property) => (
                    <PropertyCard 
                        key={property.id} 
                        property={property}
                        initialIsFavorite={userFavorites.includes(property.id.toString())} 
                    />
                ))
            ) : (
                <div className="col-span-full text-center py-10 text-muted-foreground">Aucune annonce trouvée.</div>
            )}
            </div>
        )}

        <div className="mt-8 text-center md:hidden">
          <Link href="/biens">
            <Button variant="outline" className="gap-2">
              Voir toutes les annonces
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Cities Section */}
      <section className="bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-1 text-sm font-medium uppercase tracking-wider text-primary">Explorez par ville</p>
            <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">Principales villes du Maroc</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {cities.map((city) => {
                const count = allProperties.filter((p) => p.city === city).length;
                return (
                <Link
                    key={city}
                    href={`/biens?city=${city}`}
                    className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
                >
                    <div>
                    <h3 className="font-semibold text-foreground">{city}</h3>
                    <p className="text-sm text-muted-foreground">
                        {count} annonce{count !== 1 ? 's' : ''}
                    </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
                )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section (AFFICHAGE CONDITIONNEL ICI) */}
      <section className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            {user?.role === 'client' ? (
                // --- VERSION CLIENT ---
                <>
                    <h2 className="mb-4 font-serif text-3xl font-bold text-primary-foreground md:text-4xl">
                    Prêt à trouver le logement idéal ?
                    </h2>
                    <p className="mb-8 text-lg leading-relaxed text-primary-foreground/80">
                    Explorez nos offres exclusives et trouvez la perle rare parmi nos milliers d&apos;annonces vérifiées.
                    </p>
                    <Link href="/biens">
                    <Button size="lg" variant="secondary" className="gap-2 text-base">
                        Parcourir les biens
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                    </Link>
                </>
            ) : (
                // --- VERSION PAR DÉFAUT (Visiteur, Agence, Proprio) ---
                <>
                    <h2 className="mb-4 font-serif text-3xl font-bold text-primary-foreground md:text-4xl">
                    Vous avez un bien à vendre ou à louer ?
                    </h2>
                    <p className="mb-8 text-lg leading-relaxed text-primary-foreground/80">
                    Publiez votre annonce gratuitement et touchez des milliers de clients potentiels à travers tout le Maroc.
                    </p>
                    <Link href="/publier">
                    <Button size="lg" variant="secondary" className="gap-2 text-base">
                        Publier une annonce
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                    </Link>
                </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}