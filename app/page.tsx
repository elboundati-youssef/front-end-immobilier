"use client"

import { useState, useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Building2, Users, Shield, TrendingUp, Loader2, MapPin, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { PropertyCard } from "@/components/property-card"
import { SearchBar } from "@/components/search-bar"
import { cities } from "@/lib/data"
import api from "@/services/api"

const API_URL = "http://127.0.0.1:8000"

const stats = [
  { icon: Building2, value: "5,000+", label: "Annonces actives", delay: "0ms" },
  { icon: Users, value: "12,000+", label: "Utilisateurs", delay: "100ms" },
  { icon: Shield, value: "100%", label: "Annonces vérifiées", delay: "200ms" },
  { icon: TrendingUp, value: "3,200+", label: "Transactions réussies", delay: "300ms" },
]

/* ─── Hook: intersection observer générique ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/* ─── Animated counter ─── */
function AnimatedCounter({ target, duration = 1800 }: { target: string; duration?: number }) {
  const [display, setDisplay] = useState("0")
  const { ref, inView } = useInView()

  useEffect(() => {
    if (!inView) return
    const num = parseInt(target.replace(/\D/g, ""))
    const suffix = target.replace(/[\d,]/g, "")
    let start = 0
    const step = Math.ceil(num / (duration / 16))
    const timer = setInterval(() => {
      start = Math.min(start + step, num)
      setDisplay(start.toLocaleString("fr-FR") + suffix)
      if (start >= num) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [inView, target, duration])

  return <span ref={ref}>{inView ? display : "0"}</span>
}

/* ─── Floating particle – valeurs fixes pour éviter l'erreur d'hydratation ─── */
const PARTICLE_DATA = [
  { left: 12, top: 8,  delay: 0.0, dur: 7.2, w: 5, h: 4, op: 0.22 },
  { left: 28, top: 55, delay: 1.3, dur: 9.1, w: 4, h: 6, op: 0.28 },
  { left: 45, top: 20, delay: 2.5, dur: 6.8, w: 7, h: 5, op: 0.18 },
  { left: 62, top: 72, delay: 0.7, dur: 8.4, w: 5, h: 7, op: 0.24 },
  { left: 78, top: 35, delay: 3.1, dur: 10.2,w: 4, h: 4, op: 0.20 },
  { left: 91, top: 15, delay: 1.9, dur: 7.6, w: 6, h: 5, op: 0.17 },
  { left: 5,  top: 80, delay: 4.2, dur: 9.8, w: 5, h: 6, op: 0.25 },
  { left: 38, top: 90, delay: 0.4, dur: 6.3, w: 3, h: 4, op: 0.30 },
  { left: 55, top: 48, delay: 2.8, dur: 11.0,w: 6, h: 5, op: 0.19 },
  { left: 70, top: 65, delay: 5.0, dur: 8.7, w: 4, h: 7, op: 0.22 },
  { left: 83, top: 82, delay: 1.5, dur: 7.9, w: 7, h: 4, op: 0.26 },
  { left: 20, top: 42, delay: 3.7, dur: 9.5, w: 5, h: 5, op: 0.21 },
  { left: 50, top: 10, delay: 0.9, dur: 6.5, w: 4, h: 6, op: 0.23 },
  { left: 67, top: 28, delay: 4.6, dur: 10.8,w: 6, h: 4, op: 0.16 },
  { left: 88, top: 50, delay: 2.1, dur: 7.3, w: 5, h: 5, op: 0.28 },
  { left: 33, top: 70, delay: 5.5, dur: 8.1, w: 4, h: 7, op: 0.20 },
  { left: 75, top: 95, delay: 1.1, dur: 9.4, w: 7, h: 4, op: 0.24 },
  { left: 15, top: 25, delay: 3.4, dur: 11.5,w: 5, h: 5, op: 0.18 },
]

function Particles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {PARTICLE_DATA.map((p, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            width: `${p.w}px`,
            height: `${p.h}px`,
            opacity: p.op,
          }}
        />
      ))}
    </div>
  )
}

export default function HomePage() {
  const [featuredProperties, setFeaturedProperties] = useState<any[]>([])
  const [allProperties, setAllProperties] = useState<any[]>([])
  const [userFavorites, setUserFavorites] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [heroVisible, setHeroVisible] = useState(false)

  const { ref: statsRef, inView: statsInView } = useInView()
  const { ref: featuredRef, inView: featuredInView } = useInView()
  const { ref: citiesRef, inView: citiesInView } = useInView()
  const { ref: ctaRef, inView: ctaInView } = useInView()

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = localStorage.getItem("user")
        if (storedUser) {
          try { setUser(JSON.parse(storedUser)) } catch (e) { console.error(e) }
        }

        const res = await api.get("/properties")
        const rawProperties = res.data

        const normalizedProperties = rawProperties
          .filter((p: any) => p.status === "publié")
          .map((p: any) => {
            let images: string[] = []
            if (Array.isArray(p.images)) images = p.images
            else if (typeof p.images === "string") { try { images = JSON.parse(p.images) } catch { images = [] } }
            const formattedImages = images.map((img) => (img.startsWith("http") ? img : `${API_URL}${img}`))
            return {
              ...p,
              id: p.id.toString(),
              images: formattedImages.length > 0 ? formattedImages : ["/placeholder.jpg"],
              type: p.property_type,
              transaction: p.transaction_type,
            }
          })

        setAllProperties(normalizedProperties)
        setFeaturedProperties(normalizedProperties.slice(0, 6))

        const token = localStorage.getItem("token")
        if (token) {
          try {
            const favRes = await api.get("/my-favorites")
            setUserFavorites(favRes.data.map((p: any) => p.id.toString()))
          } catch { /* non connecté */ }
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
    <>
      {/* ── Global styles injectées ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');

        :root { --ease-expo: cubic-bezier(0.16,1,0.3,1); }

        /* Particules flottantes */
        .particle {
          position: absolute;
          border-radius: 50%;
          background: white;
          animation: floatUp var(--dur,8s) ease-in-out infinite alternate;
        }
        @keyframes floatUp {
          0%   { transform: translateY(0) scale(1); opacity: 0.2; }
          50%  { transform: translateY(-40px) scale(1.3); opacity: 0.5; }
          100% { transform: translateY(0) scale(1); opacity: 0.2; }
        }

        /* Scroll reveal */
        .reveal { opacity: 0; transform: translateY(36px); transition: opacity .7s var(--ease-expo), transform .7s var(--ease-expo); }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        .reveal-delay-1 { transition-delay: 100ms; }
        .reveal-delay-2 { transition-delay: 200ms; }
        .reveal-delay-3 { transition-delay: 320ms; }
        .reveal-delay-4 { transition-delay: 440ms; }
        .reveal-delay-5 { transition-delay: 560ms; }
        .reveal-delay-6 { transition-delay: 680ms; }

        /* Hero text entrance */
        .hero-word {
          display: inline-block;
          opacity: 0;
          transform: translateY(60px) rotateX(-20deg);
          transition: opacity .8s var(--ease-expo), transform .8s var(--ease-expo);
        }
        .hero-visible .hero-word { opacity: 1; transform: none; }

        /* Shimmer badge */
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .badge-shimmer {
          background: linear-gradient(90deg, rgba(255,255,255,0.12) 25%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.12) 75%);
          background-size: 200% auto;
          animation: shimmer 2.5s linear infinite;
        }

        /* Stat card hover */
        .stat-card { transition: transform .3s var(--ease-expo), box-shadow .3s ease; }
        .stat-card:hover { transform: translateY(-6px) scale(1.03); box-shadow: 0 20px 40px -10px rgba(0,0,0,0.12); }

        /* City card hover */
        .city-card { transition: all .35s var(--ease-expo); position: relative; overflow: hidden; }
        .city-card::before {
          content: '';
          position: absolute; inset: 0;
          background: linear-gradient(135deg, var(--primary) 0%, transparent 100%);
          opacity: 0;
          transition: opacity .35s ease;
        }
        .city-card:hover::before { opacity: 0.06; }
        .city-card:hover { border-color: var(--primary); box-shadow: 0 8px 32px -8px rgba(0,0,0,0.15); transform: translateY(-3px); }

        /* Gradient text */
        .gradient-text {
          background: linear-gradient(135deg, #ffffff 30%, rgba(255,255,255,0.65) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* CTA glow */
        .cta-glow {
          position: relative;
        }
        .cta-glow::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(255,255,255,0.3), rgba(255,255,255,0));
          opacity: 0;
          transition: opacity .3s;
        }
        .cta-glow:hover::before { opacity: 1; }

        /* Pulsing dot */
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.6); opacity: 0.5; }
        }
        .pulse-dot {
          width: 8px; height: 8px; border-radius: 50%;
          background: #22c55e;
          animation: pulse-dot 1.8s ease-in-out infinite;
          display: inline-block;
        }

        /* Morphing blob in hero */
        @keyframes morph {
          0%,100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          25%      { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          50%      { border-radius: 50% 60% 30% 60% / 30% 50% 70% 40%; }
          75%      { border-radius: 40% 70% 60% 30% / 70% 30% 40% 60%; }
        }
        .blob {
          animation: morph 10s ease-in-out infinite;
          background: radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, transparent 70%);
          pointer-events: none;
        }

        /* Loading skeleton pulse */
        @keyframes skeletonPulse {
          0%,100% { opacity: .4; }
          50%      { opacity: .8; }
        }
        .skeleton { animation: skeletonPulse 1.4s ease-in-out infinite; }

        /* Loader spinner custom */
        @keyframes spin360 { to { transform: rotate(360deg); } }
        .loader-ring {
          width: 48px; height: 48px;
          border: 3px solid rgba(0,0,0,0.06);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: spin360 .8s linear infinite;
        }
      `}</style>

      <div className="min-h-screen bg-background" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Navbar />

        {/* ── Hero ── */}
        <section className="relative overflow-hidden" style={{ minHeight: "88vh", display: "flex", alignItems: "center" }}>
          <div className="absolute inset-0">
            <Image src="/images/img1-c.jpg" alt="Propriété de luxe" fill className="object-cover" priority style={{ transform: "scale(1.04)", transition: "transform 8s ease-out" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 60%, rgba(0,0,0,0.65) 100%)" }} />
            {/* Blob lumineux */}
            <div className="blob absolute" style={{ width: 600, height: 600, top: "10%", right: "-10%", borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }} />
            <div className="blob absolute" style={{ width: 400, height: 400, bottom: "5%", left: "-8%", borderRadius: "40% 60% 70% 30% / 30% 50% 60% 70%", animationDelay: "-4s" }} />
            <Particles />
          </div>

          <div className={`relative mx-auto max-w-7xl px-4 py-24 md:py-36 lg:px-8 w-full ${heroVisible ? "hero-visible" : ""}`}>
            {/* Badge */}
            <div className="mx-auto mb-6 flex justify-center">
              <span
                className="badge-shimmer inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-1.5 text-sm text-white/90"
                style={{ backdropFilter: "blur(12px)", background: "rgba(255,255,255,0.08)", opacity: heroVisible ? 1 : 0, transform: heroVisible ? "none" : "translateY(-16px)", transition: "all 0.6s var(--ease-expo)" }}
              >
                <span className="pulse-dot" />
                Plus de 5 000 annonces vérifiées
                <Sparkles className="h-3.5 w-3.5 opacity-70" />
              </span>
            </div>

            <div className="mx-auto max-w-3xl text-center">
              <h1
                className="mb-4 font-bold tracking-tight text-card md:text-5xl lg:text-6xl text-balance"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(2.2rem,6vw,4rem)", lineHeight: 1.1 }}
              >
                {["Trouvez", "le bien", "de vos", "rêves"].map((w, i) => (
                  <span
                    key={i}
                    className="hero-word"
                    style={{ transitionDelay: `${i * 120 + 200}ms`, marginRight: "0.25em" }}
                  >
                    {w === "rêves" ? <span className="gradient-text">{w}</span> : w}
                  </span>
                ))}
              </h1>

              <p
                className="mb-10 text-lg leading-relaxed text-card/80 md:text-xl"
                style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "none" : "translateY(20px)", transition: "all 0.8s var(--ease-expo) 0.6s" }}
              >
                Explorez des milliers d&apos;annonces vérifiées à travers tout le Maroc.&nbsp;
                <span className="text-white/60">Vente, location, appartements, villas et plus encore.</span>
              </p>
            </div>

            <div
              className="mx-auto max-w-3xl"
              style={{ opacity: heroVisible ? 1 : 0, transform: heroVisible ? "none" : "translateY(30px)", transition: "all 0.9s var(--ease-expo) 0.8s" }}
            >
              <SearchBar variant="hero" />
            </div>

            {/* Scroll indicator */}
            <div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
              style={{ opacity: heroVisible ? 0.6 : 0, transition: "opacity 1s ease 1.4s" }}
            >
              <span className="text-white/50 text-xs tracking-widest uppercase">Défiler</span>
              <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)" }} />
            </div>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="border-b border-border bg-card" ref={statsRef}>
          <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {stats.map((stat, i) => {
                const Icon = stat.icon
                return (
                  <div
                    key={stat.label}
                    className={`stat-card text-center rounded-2xl p-6 reveal${statsInView ? " visible" : ""} reveal-delay-${i + 1}`}
                    style={{ background: "linear-gradient(135deg, rgba(var(--primary-rgb,0,0,0),0.03), transparent)" }}
                  >
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif", letterSpacing: "-0.02em" }}>
                      <AnimatedCounter target={stat.value} />
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Featured Properties ── */}
        <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8" ref={featuredRef}>
          <div className={`mb-12 flex items-end justify-between reveal${featuredInView ? " visible" : ""}`}>
            <div>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-primary">
                <span className="block h-px w-6 bg-primary" />
                Biens en vedette
              </p>
              <h2 className="font-bold text-foreground md:text-4xl" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem,4vw,2.8rem)" }}>
                Nos dernières annonces
              </h2>
            </div>
            <Link href="/biens">
              <Button variant="outline" className="hidden gap-2 md:flex cta-glow" style={{ borderRadius: 99 }}>
                Voir tout <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="loader-ring" />
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProperties.length > 0 ? (
                featuredProperties.map((property, i) => (
                  <div
                    key={property.id}
                    className={`reveal${featuredInView ? " visible" : ""} reveal-delay-${Math.min(i + 1, 6)}`}
                    style={{ transitionDelay: `${i * 90}ms` }}
                  >
                    <PropertyCard
                      property={property}
                      initialIsFavorite={userFavorites.includes(property.id.toString())}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-full flex flex-col items-center gap-3 py-20 text-muted-foreground">
                  <Building2 className="h-12 w-12 opacity-25" />
                  <p>Aucune annonce trouvée.</p>
                </div>
              )}
            </div>
          )}

          <div className="mt-10 text-center md:hidden">
            <Link href="/biens">
              <Button variant="outline" className="gap-2" style={{ borderRadius: 99 }}>
                Voir toutes les annonces <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* ── Cities ── */}
        <section className="bg-secondary/50 py-20" ref={citiesRef}>
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className={`mb-12 text-center reveal${citiesInView ? " visible" : ""}`}>
              <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-primary">
                <MapPin className="h-3.5 w-3.5" /> Explorez par ville
              </p>
              <h2 className="font-bold text-foreground md:text-4xl" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem,4vw,2.8rem)" }}>
                Principales villes du Maroc
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {cities.map((city, i) => {
                const count = allProperties.filter((p) => p.city === city).length
                return (
                  <Link
                    key={city}
                    href={`/biens?city=${city}`}
                    className={`city-card group flex items-center justify-between rounded-2xl border border-border bg-card p-5 reveal${citiesInView ? " visible" : ""} reveal-delay-${Math.min(i + 1, 6)}`}
                    style={{ transitionDelay: `${i * 60}ms` }}
                  >
                    <div>
                      <h3 className="font-semibold text-foreground" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.1rem" }}>{city}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {count} annonce{count !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:translate-x-1.5 group-hover:text-primary" />
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative overflow-hidden bg-primary" ref={ctaRef}>
          {/* Cercles décoratifs */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-56 w-56 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute right-1/3 top-1/2 h-32 w-32 -translate-y-1/2 rounded-full bg-white/5" />

          <div className="relative mx-auto max-w-7xl px-4 py-20 lg:px-8">
            <div className={`mx-auto max-w-2xl text-center reveal${ctaInView ? " visible" : ""}`}>
              {user?.role === "client" ? (
                <>
                  <h2 className="mb-4 font-bold text-primary-foreground" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem,4vw,2.6rem)" }}>
                    Prêt à trouver le logement idéal ?
                  </h2>
                  <p className="mb-10 text-lg leading-relaxed text-primary-foreground/80">
                    Explorez nos offres exclusives et trouvez la perle rare parmi nos milliers d&apos;annonces vérifiées.
                  </p>
                  <Link href="/biens">
                    <Button size="lg" variant="secondary" className="gap-3 rounded-full px-8 py-3 text-base font-medium">
                      Parcourir les biens <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="mb-4 font-bold text-primary-foreground" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(1.8rem,4vw,2.6rem)" }}>
                    Vous avez un bien à vendre ou à louer ?
                  </h2>
                  <p className="mb-10 text-lg leading-relaxed text-primary-foreground/80">
                    Publiez votre annonce gratuitement et touchez des milliers de clients potentiels à travers tout le Maroc.
                  </p>
                  <Link href="/publier">
                    <Button size="lg" variant="secondary" className="gap-3 rounded-full px-8 py-3 text-base font-medium">
                      Publier une annonce <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}