"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Home, Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    // On récupère le rôle de l'utilisateur depuis le localStorage au chargement
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        setUserRole(user.role) // 'client', 'agence', 'proprietaire', ou 'admin'
      } catch (e) {
        console.error("Erreur parsing user", e)
      }
    }
  }, [])

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Home className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-serif text-xl font-bold text-foreground">ImmoMaroc</span>
            </Link>
            <p className="text-sm leading-relaxed text-muted-foreground">
              La première plateforme immobilière au Maroc. Trouvez votre bien idéal parmi des milliers d&apos;annonces vérifiées.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Navigation</h3>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  Accueil
                </Link>
              </li>
              <li>
                <Link href="/biens" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  Tous les biens
                </Link>
              </li>
              
              {/* CONDITION D'AFFICHAGE SELON LE RÔLE */}
              <li>
                {userRole === "client" ? (
                  <Link href="/tableau-de-bord" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    Mon tableau de bord
                  </Link>
                ) : (
                  <Link href="/publier" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    Publier une annonce
                  </Link>
                )}
              </li>

              <li>
                <Link href="/a-propos" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  A propos
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

      <div>
            <h3 className="mb-4 font-semibold text-foreground">Types de biens</h3>
            <ul className="flex flex-col gap-2.5">
              {[
                // On met les "value" en minuscules pour que ça corresponde à la base de données
                { label: "Appartements", value: "appartement" },
                { label: "Villas", value: "villa" },
                { label: "Maisons", value: "maison" },
                { label: "Terrains", value: "terrain" },
                { label: "Bureaux", value: "bureau" }
              ].map((type) => (
                <li key={type.value}>
                  {/* Utiliser <a> au lieu de <Link> force le rafraîchissement de la page de recherche */}
                  <a 
                    href={`/biens?type=${type.value}`} 
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {type.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Contact</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                123 Boulevard Mohammed V, Casablanca
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Phone className="h-4 w-4 shrink-0 text-primary" />
                +212 5 22 00 00 00
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                contact@immomaroc.ma
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 ImmoMaroc. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  )
}