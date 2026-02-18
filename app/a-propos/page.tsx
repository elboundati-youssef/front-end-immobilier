"use client"

import { useState, useEffect } from "react"
import { Building2, Users, Shield, Target, Award, Globe } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

const values = [
  {
    icon: Shield,
    title: "Confiance",
    description: "Toutes nos annonces sont vérifiées pour garantir la fiabilité des informations.",
  },
  {
    icon: Target,
    title: "Simplicité",
    description: "Une interface intuitive pour une recherche rapide et efficace de votre bien idéal.",
  },
  {
    icon: Users,
    title: "Proximité",
    description: "Nous connectons acheteurs, locataires et professionnels de l'immobilier.",
  },
  {
    icon: Award,
    title: "Excellence",
    description: "Un service premium avec un accompagnement personnalisé à chaque étape.",
  },
]

const team = [
  { name: "Karim El Amrani", role: "Fondateur & CEO", initials: "KA" },
  { name: "Leila Bennani", role: "Directrice Commerciale", initials: "LB" },
  { name: "Omar Tazi", role: "Directeur Technique", initials: "OT" },
  { name: "Nadia Fassi", role: "Responsable Marketing", initials: "NF" },
]

export default function AProposPage() {
  // État pour vérifier si l'utilisateur est connecté
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error("Erreur parsing user", e)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-20 text-center lg:px-8">
          <p className="mb-3 text-sm font-medium uppercase tracking-wider text-primary-foreground/70">A propos</p>
          <h1 className="mb-4 font-serif text-4xl font-bold text-primary-foreground md:text-5xl text-balance">
            La référence de l&apos;immobilier au Maroc
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-primary-foreground/80">
            ImmoMaroc est né de la volonté de moderniser le marché immobilier marocain en offrant une plateforme fiable, transparente et accessible à tous.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-1 text-sm font-medium uppercase tracking-wider text-primary">Notre mission</p>
            <h2 className="mb-4 font-serif text-3xl font-bold text-foreground">
              Faciliter l&apos;accès à l&apos;immobilier pour tous
            </h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Depuis notre création, nous avons pour objectif de démocratiser l&apos;accès à l&apos;information immobilière au Maroc. Nous croyons que chaque personne mérite de trouver le bien qui correspond à ses besoins et à son budget.
            </p>
            <p className="leading-relaxed text-muted-foreground">
              Notre plateforme met en relation acheteurs, locataires, propriétaires et agences immobilières dans un environnement sécurisé et transparent. Nous vérifions chaque annonce pour garantir la qualité des informations.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { value: "5,000+", label: "Annonces", icon: Building2 },
              { value: "12,000+", label: "Utilisateurs", icon: Users },
              { value: "8", label: "Villes", icon: Globe },
              { value: "3,200+", label: "Transactions", icon: Award },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="rounded-xl border border-border bg-card p-6 text-center">
                  <Icon className="mx-auto mb-3 h-6 w-6 text-primary" />
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-secondary/50">
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <div className="mb-10 text-center">
            <p className="mb-1 text-sm font-medium uppercase tracking-wider text-primary">Nos valeurs</p>
            <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">Ce qui nous anime</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => {
              const Icon = value.icon
              return (
                <div key={value.title} className="rounded-xl border border-border bg-card p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground">{value.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
        <div className="mb-10 text-center">
          <p className="mb-1 text-sm font-medium uppercase tracking-wider text-primary">Notre équipe</p>
          <h2 className="font-serif text-3xl font-bold text-foreground md:text-4xl">Des passionnés à votre service</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => (
            <div key={member.name} className="rounded-xl border border-border bg-card p-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                {member.initials}
              </div>
              <h3 className="font-semibold text-foreground">{member.name}</h3>
              <p className="text-sm text-muted-foreground">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center lg:px-8">
          <h2 className="mb-4 font-serif text-3xl font-bold text-primary-foreground">
            {user ? "Besoin d'aide ?" : "Rejoignez ImmoMaroc"}
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-lg text-primary-foreground/80">
            {user 
              ? "Notre équipe est à votre disposition pour vous accompagner dans tous vos projets immobiliers."
              : "Que vous soyez acheteur, locataire ou professionnel, notre plateforme est faite pour vous."
            }
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {/* On affiche le bouton d'inscription UNIQUEMENT si l'utilisateur n'est PAS connecté */}
            {!user && (
              <Link href="/connexion">
                <Button size="lg" variant="secondary">Créer un compte</Button>
              </Link>
            )}
            
            <Link href="/contact">
              <Button 
                size="lg" 
                variant="outline" 
                className="bg-[#b87355] border-white/20 text-white hover:bg-[#5D4037] hover:text-white"
              >
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}