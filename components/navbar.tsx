"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Menu, X, Home, Search, User, Plus, Phone, Info, ChevronDown, LayoutDashboard, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

// Définition du type utilisateur
interface UserData {
  name: string;
  email: string;
  role: string;
  avatar?: string;
}

const navLinks = [
  { href: "/", label: "Accueil", icon: Home },
  { href: "/biens", label: "Biens", icon: Search },
  { href: "/contact", label: "Contact", icon: Phone },
  { href: "/a-propos", label: "A propos", icon: Info },
]

// URL du backend (À modifier si votre backend est hébergé ailleurs)
const API_URL = "http://127.0.0.1:8000";

export function Navbar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false) // Menu Mobile
  const [userMenuOpen, setUserMenuOpen] = useState(false) // Dropdown User
  const [user, setUser] = useState<UserData | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  
  const menuRef = useRef<HTMLDivElement>(null)

  // 1. Récupérer l'utilisateur au chargement
  useEffect(() => {
    setIsMounted(true)
    
    // Fonction pour écouter les mises à jour du localStorage (ex: changement photo profil)
    const loadUser = () => {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser))
            } catch (e) {
                console.error("Erreur parsing user", e)
            }
        }
    }

    loadUser()

    // Écouteur pour mettre à jour la navbar si le profil change dans une autre page
    window.addEventListener("storage", loadUser)

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    
    return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        window.removeEventListener("storage", loadUser)
    }
  }, [])

  // 2. Fonction de Déconnexion
  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    setUser(null)
    setIsOpen(false)
    setUserMenuOpen(false)
    router.push("/connexion")
    router.refresh()
  }

  // 3. Helper pour l'URL de l'avatar
  const getAvatarUrl = (path: string | undefined) => {
    if (!path) return null;
    if (path.startsWith('http')) return path; // Si c'est déjà un lien complet (Google, etc.)
    return `${API_URL}${path}`; // Sinon on ajoute l'URL du backend
  }

  const showPublishButton = !user || (user.role === 'agence' || user.role === 'proprietaire' || user.role === 'admin');

  if (!isMounted) return null

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      <nav className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* --- LOGO --- */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Home className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-bold text-foreground">ImmoMaroc</span>
          </Link>

          {/* --- LIENS (Desktop) --- */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* --- ACTIONS DROITE (Desktop) --- */}
          <div className="hidden items-center gap-3 md:flex">
            
            {showPublishButton && (
              <Link href={user ? "/publier" : "/connexion"}>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Publier
                </Button>
              </Link>
            )}

            {user ? (
              // --- SI CONNECTÉ : MENU DÉROULANT ---
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-full border border-border bg-background p-1 pr-3 transition-colors hover:bg-secondary focus:outline-none"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm overflow-hidden relative">
                    {user.avatar ? (
                      <img 
                        src={getAvatarUrl(user.avatar) || ""} 
                        alt="Avatar" 
                        className="h-full w-full object-cover" 
                      />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <span className="text-sm font-medium max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Content */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-lg border border-border bg-card shadow-lg animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-1">
                      <div className="px-3 py-2 border-b border-border mb-1">
                        <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                        <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary uppercase mt-1">
                          {user.role}
                        </span>
                      </div>
                      
                      <Link 
                        href="/profile" 
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary transition-colors"
                      >
                        <User className="h-4 w-4" />
                        Mon Profil
                      </Link>

                      <Link 
                        href="/tableau-de-bord" 
                        onClick={() => setUserMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-secondary transition-colors"
                      >
                        <LayoutDashboard className="h-4 w-4" />
                        Tableau de bord
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Déconnexion
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/connexion">
                <Button variant="outline" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  Connexion
                </Button>
              </Link>
            )}
          </div>

          {/* --- BOUTON MENU MOBILE --- */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-lg p-2 text-foreground transition-colors hover:bg-secondary md:hidden"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* --- MENU MOBILE (Responsive) --- */}
        {isOpen && (
          <div className="border-t border-border py-4 md:hidden animate-in slide-in-from-top-5">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })}

              <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
                {user ? (
                  <>
                    <div className="px-3 py-2 flex items-center gap-3 bg-secondary/30 rounded-lg mb-2">
                       <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold overflow-hidden relative">
                          {user.avatar ? (
                            <img 
                                src={getAvatarUrl(user.avatar) || ""} 
                                alt="Avatar" 
                                className="h-full w-full object-cover" 
                            />
                          ) : (
                            user.name.charAt(0).toUpperCase()
                          )}
                       </div>
                       <div className="overflow-hidden">
                         <p className="text-sm font-medium truncate">{user.name}</p>
                         <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                       </div>
                    </div>

                    <Link href="/profile" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full gap-2 justify-start">
                        <User className="h-4 w-4" />
                        Mon Profil
                      </Button>
                    </Link>

                    <Link href="/tableau-de-bord" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full gap-2 justify-start">
                        <LayoutDashboard className="h-4 w-4" />
                        Tableau de bord
                      </Button>
                    </Link>

                    {showPublishButton && (
                      <Link href="/publier" onClick={() => setIsOpen(false)}>
                        <Button className="w-full gap-2 justify-start">
                          <Plus className="h-4 w-4" />
                          Publier une annonce
                        </Button>
                      </Link>
                    )}

                    <Button 
                      variant="ghost" 
                      onClick={handleLogout}
                      className="w-full gap-2 justify-start text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      Déconnexion
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/connexion" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full gap-2">
                        <User className="h-4 w-4" />
                        Connexion
                      </Button>
                    </Link>
                    <Link href="/connexion" onClick={() => setIsOpen(false)}>
                      <Button className="w-full gap-2">
                        <Plus className="h-4 w-4" />
                        Publier une annonce
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}