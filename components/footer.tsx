import Link from "next/link"
import { Home, Phone, Mail, MapPin } from "lucide-react"

export function Footer() {
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
              La premiere plateforme immobiliere au Maroc. Trouvez votre bien ideal parmi des milliers d&apos;annonces verifiees.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Navigation</h3>
            <ul className="flex flex-col gap-2.5">
              {[
                { href: "/", label: "Accueil" },
                { href: "/biens", label: "Tous les biens" },
                { href: "/publier", label: "Publier une annonce" },
                { href: "/a-propos", label: "A propos" },
                { href: "/contact", label: "Contact" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-foreground">Types de biens</h3>
            <ul className="flex flex-col gap-2.5">
              {["Appartements", "Villas", "Maisons", "Terrains", "Bureaux"].map((type) => (
                <li key={type}>
                  <Link href="/biens" className="text-sm text-muted-foreground transition-colors hover:text-primary">
                    {type}
                  </Link>
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
          <p>&copy; 2026 ImmoMaroc. Tous droits reserves.</p>
        </div>
      </div>
    </footer>
  )
}
