"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl" // 🌟 IMPORT NEXT-INTL
import { Building2, Users, Shield, Target, Award, Globe, ArrowRight, Quote } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"

/* ─── Hook intersection observer ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

/* ─── Animated counter ─── */
function AnimatedCounter({ target, duration = 1600 }: { target: string; duration?: number }) {
  const [display, setDisplay] = useState("0")
  const { ref, inView } = useInView(0.3)
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

/* ─── Particules fixes ─── */
const PARTICLES = [
  { left: 6,  top: 15, delay: 0.0, dur: 7.2, w: 5, h: 4, op: 0.18 },
  { left: 20, top: 62, delay: 1.5, dur: 9.1, w: 4, h: 6, op: 0.13 },
  { left: 42, top: 28, delay: 2.7, dur: 6.8, w: 6, h: 5, op: 0.16 },
  { left: 60, top: 78, delay: 0.9, dur: 8.4, w: 5, h: 7, op: 0.12 },
  { left: 76, top: 38, delay: 3.3, dur: 10.0,w: 4, h: 4, op: 0.18 },
  { left: 90, top: 20, delay: 1.8, dur: 7.5, w: 6, h: 5, op: 0.14 },
  { left: 33, top: 85, delay: 4.2, dur: 9.6, w: 5, h: 6, op: 0.15 },
  { left: 55, top: 10, delay: 2.1, dur: 11.0,w: 7, h: 4, op: 0.10 },
]

export default function AProposPage() {
  const t = useTranslations("AboutPage") // 🌟 INITIALISATION TRADUCTION
  const pathname = usePathname()
  
  // 🌟 GESTION DE LA LANGUE ACTUELLE POUR LES LIENS
  const currentLocale = pathname.split("/")[1] || "fr"
  const l = (path: string) => `/${currentLocale}${path}`

  const [user, setUser] = useState<any>(null)
  const [heroVisible, setHeroVisible] = useState(false)

  const { ref: missionRef,  inView: missionInView  } = useInView()
  const { ref: valuesRef,   inView: valuesInView   } = useInView()
  const { ref: teamRef,     inView: teamInView     } = useInView()
  const { ref: ctaRef,      inView: ctaInView      } = useInView()

  // 🌟 Les tableaux sont maintenant dans le composant pour utiliser t()
  const values = [
    { icon: Shield, title: t("values.v1.title"), description: t("values.v1.desc") },
    { icon: Target, title: t("values.v2.title"), description: t("values.v2.desc") },
    { icon: Users,  title: t("values.v3.title"), description: t("values.v3.desc") },
    { icon: Award,  title: t("values.v4.title"), description: t("values.v4.desc") },
  ]

  const team = [
    { name: "Karim El Amrani",  role: t("team.roles.ceo"),       initials: "KA" },
    { name: "Leila Bennani",    role: t("team.roles.sales"),     initials: "LB" },
    { name: "Omar Tazi",        role: t("team.roles.tech"),      initials: "OT" },
    { name: "Nadia Fassi",      role: t("team.roles.marketing"), initials: "NF" },
  ]

  const stats = [
    { value: "5,000+", label: t("stats.ads"),          icon: Building2 },
    { value: "12,000+",label: t("stats.users"),        icon: Users },
    { value: "8",      label: t("stats.cities"),       icon: Globe },
    { value: "3,200+", label: t("stats.transactions"), icon: Award },
  ]

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 80)
    const storedUser = localStorage.getItem("user")
    if (storedUser) { try { setUser(JSON.parse(storedUser)) } catch {} }
    return () => clearTimeout(timer)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        :root { --ease-expo: cubic-bezier(0.16,1,0.3,1); }
        .rv { opacity:0; transform:translateY(32px); transition:opacity .7s var(--ease-expo),transform .7s var(--ease-expo); }
        .rv.on { opacity:1; transform:none; }
        .d1{transition-delay:80ms;} .d2{transition-delay:160ms;} .d3{transition-delay:240ms;} .d4{transition-delay:320ms;} .d5{transition-delay:400ms;}
        .rv-left { opacity:0; transform:translateX(-40px); transition:opacity .8s var(--ease-expo),transform .8s var(--ease-expo); }
        .rv-left.on { opacity:1; transform:none; }
        .rv-right { opacity:0; transform:translateX(40px); transition:opacity .8s var(--ease-expo),transform .8s var(--ease-expo); transition-delay:120ms; }
        .rv-right.on { opacity:1; transform:none; }
        .hw { display:inline-block; opacity:0; transform:translateY(44px); transition:opacity .75s var(--ease-expo),transform .75s var(--ease-expo); }
        .hv .hw { opacity:1; transform:none; }
        .pt { position:absolute; border-radius:50%; background:var(--primary); animation:ptf var(--dur,8s) ease-in-out infinite alternate; }
        @keyframes ptf { 0%{transform:translateY(0) scale(1);} 100%{transform:translateY(-28px) scale(1.25);} }
        @keyframes shimmer { 0%{background-position:-200% center;} 100%{background-position:200% center;} }
        .shl { height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent); background-size:200% auto; animation:shimmer 2.5s linear infinite; }
        .stat-card { transition:transform .3s var(--ease-expo),box-shadow .3s ease; cursor:default; }
        .stat-card:hover { transform:translateY(-5px) scale(1.03); box-shadow:0 16px 40px -12px rgba(0,0,0,.12); }
        .val-card { transition:transform .3s var(--ease-expo),box-shadow .3s ease,border-color .3s; position:relative; overflow:hidden; }
        .val-card::before { content:''; position:absolute; inset:0; opacity:0; transition:opacity .3s; }
        .val-card:hover { transform:translateY(-4px); box-shadow:0 12px 36px -10px rgba(0,0,0,.1); }
        .val-card:hover::before { opacity:1; }
        .quote-mark { opacity:.08; position:absolute; top:16px; right:16px; pointer-events:none; }
        .cta-btn { transition:transform .25s var(--ease-expo),box-shadow .25s; }
        .cta-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(0,0,0,.2); }
      `}</style>

      <div className="min-h-screen bg-background" style={{ fontFamily:"'DM Sans',sans-serif" }}>
        <Navbar />

        {/* ── Hero ── */}
        <section className="relative overflow-hidden bg-primary py-24">
          {PARTICLES.map((p, i) => (
            <span key={i} className="pt" style={{
              left:`${p.left}%`, top:`${p.top}%`,
              animationDelay:`${p.delay}s`, ["--dur" as any]:`${p.dur}s`,
              width:`${p.w}px`, height:`${p.h}px`, opacity:p.op,
            }} />
          ))}
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/[0.03]" />

          <div className={`relative mx-auto max-w-7xl px-4 text-center lg:px-8 ${heroVisible?"hv":""}`}>
            <p
              className="mb-3 text-sm font-medium uppercase tracking-widest text-primary-foreground/60"
              style={{ opacity:heroVisible?1:0, transition:"opacity .6s ease .1s" }}
            >
              {t("hero.subtitle")}
            </p>
            <h1
              className="mb-5 font-bold text-primary-foreground"
              style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(2.4rem,5.5vw,4rem)", lineHeight:1.1 }}
            >
              <span className="hw" style={{ transitionDelay:"200ms" }}>
                {t("hero.title")}
              </span>
            </h1>
            <div className="shl mx-auto my-6 w-20" />
            <p
              className="mx-auto max-w-2xl text-lg leading-relaxed text-primary-foreground/80"
              style={{ opacity:heroVisible?1:0, transform:heroVisible?"none":"translateY(16px)", transition:"all .8s var(--ease-expo) .45s" }}
            >
              {t("hero.desc")}
            </p>
          </div>
        </section>

        {/* ── Mission ── */}
        <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8" ref={missionRef}>
          <div className="grid items-center gap-14 lg:grid-cols-2">

            {/* Text */}
            <div className={`rv-left${missionInView?" on":""}`}>
              <p className="mb-2 flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-primary">
                <span className="block h-px w-6 bg-primary" /> {t("mission.subtitle")}
              </p>
              <h2 className="mb-5 font-bold text-foreground" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.7rem,3.5vw,2.4rem)" }}>
                {t("mission.title")}
              </h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                {t("mission.p1")}
              </p>
              <p className="leading-relaxed text-muted-foreground">
                {t("mission.p2")}
              </p>

              {/* Inline quote */}
              <div className="mt-8 rounded-2xl border border-border bg-secondary/50 p-5 relative">
                <Quote className="quote-mark h-10 w-10 text-primary" />
                <p className="text-sm italic text-muted-foreground leading-relaxed">
                  &quot;{t("mission.quote")}&quot;
                </p>
                <p className="mt-2 text-xs font-semibold text-primary">{t("mission.author")}</p>
              </div>
            </div>

            {/* Stats grid */}
            <div className={`rv-right${missionInView?" on":""} grid grid-cols-2 gap-4`}>
              {stats.map(({ value, label, icon: Icon }, i) => (
                <div
                  key={label}
                  className={`stat-card rounded-2xl border border-border bg-card p-6 text-center rv${missionInView?" on":""} d${i+1}`}
                >
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground" style={{ fontFamily:"'Cormorant Garamond',serif" }}>
                    <AnimatedCounter target={value} />
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Values ── */}
        <section className="bg-secondary/50 py-20" ref={valuesRef}>
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className={`mb-12 text-center rv${valuesInView?" on":""}`}>
              <p className="mb-2 flex items-center justify-center gap-2 text-sm font-medium uppercase tracking-widest text-primary">
                <span className="block h-px w-6 bg-primary" /> {t("values.subtitle")} <span className="block h-px w-6 bg-primary" />
              </p>
              <h2 className="font-bold text-foreground" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.8rem,4vw,2.6rem)" }}>
                {t("values.title")}
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {values.map(({ icon: Icon, title, description }, i) => (
                <div
                  key={title}
                  className={`val-card rounded-2xl border border-border bg-card p-6 rv${valuesInView?" on":""} d${i+1}`}
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold text-foreground" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.15rem" }}>
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Team ── */}
        <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8" ref={teamRef}>
          <div className={`mb-12 text-center rv${teamInView?" on":""}`}>
            <p className="mb-2 flex items-center justify-center gap-2 text-sm font-medium uppercase tracking-widest text-primary">
              <span className="block h-px w-6 bg-primary" /> {t("team.subtitle")} <span className="block h-px w-6 bg-primary" />
            </p>
            <h2 className="font-bold text-foreground" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.8rem,4vw,2.6rem)" }}>
              {t("team.title")}
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {team.map(({ name, role, initials }, i) => (
              <div
                key={name}
                className={`team-card rounded-2xl border border-border bg-card p-8 text-center rv${teamInView?" on":""} d${i+1}`}
              >
                <div
                  className="team-avatar mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary border border-primary/20"
                >
                  {initials}
                </div>
                <h3 className="font-semibold text-foreground" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"1.1rem" }}>
                  {name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">{role}</p>
                <div className="mx-auto mt-4 h-px w-8 rounded-full bg-primary/30" />
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="relative overflow-hidden bg-primary" ref={ctaRef}>
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -left-8 bottom-0 h-48 w-48 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute left-1/2 top-0 h-px w-1/2 -translate-x-1/2" style={{ background:"linear-gradient(90deg,transparent,rgba(255,255,255,.25),transparent)" }} />

          <div className="relative mx-auto max-w-7xl px-4 py-20 text-center lg:px-8">
            <div className={`rv${ctaInView?" on":""}`}>
              <h2
                className="mb-4 font-bold text-primary-foreground"
                style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(1.8rem,4vw,2.6rem)" }}
              >
                {user ? t("cta.user.title") : t("cta.guest.title")}
              </h2>
              <p className="mx-auto mb-10 max-w-xl text-lg text-primary-foreground/80 leading-relaxed">
                {user ? t("cta.user.desc") : t("cta.guest.desc")}
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                {!user && (
                  <Link href={l("/connexion")}>
                    <Button size="lg" variant="secondary" className="cta-btn gap-2 rounded-full px-7">
                      <span>{t("cta.buttons.createAccount")}</span> <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
                <Link href={l("/contact")}>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-[#b87355] cta-btn gap-2 rounded-full px-7 border-white/30 text-white hover:bg-white/10 hover:text-white"
                  >
                    <span>{t("cta.buttons.contact")}</span> <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  )
}