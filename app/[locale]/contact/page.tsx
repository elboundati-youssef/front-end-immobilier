"use client"

import { useState, useEffect, useRef } from "react"
import { useTranslations } from "next-intl" // 🌟 IMPORT NEXT-INTL
import { MapPin, Phone, Mail, Clock, Check, Send, Loader2, AlertCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import api from "@/services/api"

/* ─── Hook intersection observer ─── */
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

/* ─── Particules fixes ─── */
const PARTICLES = [
  { left: 8,  top: 12, delay: 0.0, dur: 7.2, w: 5, h: 4, op: 0.20 },
  { left: 22, top: 60, delay: 1.4, dur: 9.0, w: 4, h: 6, op: 0.15 },
  { left: 40, top: 25, delay: 2.6, dur: 6.8, w: 6, h: 5, op: 0.18 },
  { left: 58, top: 75, delay: 0.8, dur: 8.5, w: 5, h: 7, op: 0.12 },
  { left: 72, top: 40, delay: 3.2, dur: 10.1,w: 4, h: 4, op: 0.20 },
  { left: 88, top: 18, delay: 1.7, dur: 7.4, w: 6, h: 5, op: 0.14 },
  { left: 15, top: 85, delay: 4.1, dur: 9.7, w: 5, h: 6, op: 0.16 },
  { left: 50, top: 50, delay: 2.0, dur: 11.2,w: 7, h: 4, op: 0.10 },
]

export default function ContactPage() {
  const t = useTranslations("ContactPage") // 🌟 INITIALISATION TRADUCTION

  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [headerVisible, setHeaderVisible] = useState(false)
  const [focusedField, setFocusedField] = useState<string | null>(null)

  const { ref: infoRef, inView: infoInView } = useInView()
  const { ref: formRef, inView: formInView } = useInView()

  const [formData, setFormData] = useState({
    nom: "", prenom: "", email: "", telephone: "", sujet: "", message: ""
  })

  useEffect(() => {
    const timer = setTimeout(() => setHeaderVisible(true), 80)
    return () => clearTimeout(timer)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      await api.post('/contact', formData)
      setSent(true)
      setFormData({ nom: "", prenom: "", email: "", telephone: "", sujet: "", message: "" })
    } catch (err) {
      console.error(err)
      setError(t("form.error")) // Traduction de l'erreur
    } finally {
      setLoading(false)
    }
  }

  // 🌟 Traduction des informations de contact
  const contactItems = [
    { icon: MapPin, label: t("info.addressLabel"), lines: [t("info.addressLine1"), t("info.addressLine2")] },
    { icon: Phone, label: t("info.phoneLabel"), lines: [t("info.phoneVal")] },
    { icon: Mail,  label: t("info.emailLabel"), lines: [t("info.emailVal")] },
    { icon: Clock, label: t("info.hoursLabel"), lines: [t("info.hoursLine1"), t("info.hoursLine2")] },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        :root { --ease-expo: cubic-bezier(0.16,1,0.3,1); }
        .reveal { opacity:0; transform:translateY(32px); transition:opacity .7s var(--ease-expo), transform .7s var(--ease-expo); }
        .reveal.visible { opacity:1; transform:none; }
        .reveal-delay-1 { transition-delay:80ms; } .reveal-delay-2 { transition-delay:160ms; } .reveal-delay-3 { transition-delay:240ms; } .reveal-delay-4 { transition-delay:320ms; }
        .h-word { display:inline-block; opacity:0; transform:translateY(40px); transition:opacity .7s var(--ease-expo),transform .7s var(--ease-expo); }
        .h-visible .h-word { opacity:1; transform:none; }
        .cp { position:absolute; border-radius:50%; background:var(--primary); animation:cpFloat var(--dur,8s) ease-in-out infinite alternate; }
        @keyframes cpFloat { 0% { transform:translateY(0) scale(1); } 100% { transform:translateY(-28px) scale(1.2); } }
        .info-card { transition:transform .3s var(--ease-expo),box-shadow .3s ease; }
        .info-card:hover { transform:translateX(4px); }
        .field-wrap { position:relative; }
        .field-wrap::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:var(--primary); transform:scaleX(0); transform-origin:left; transition:transform .35s var(--ease-expo); border-radius:0 0 2px 2px; }
        .field-wrap.focused::after { transform:scaleX(1); }
        .c-input { width:100%; border:1px solid hsl(var(--border)); border-radius:10px; background:hsl(var(--background)); padding:12px 16px; font-size:.875rem; color:hsl(var(--foreground)); outline:none; transition:border-color .25s, box-shadow .25s; font-family: 'DM Sans', sans-serif; }
        .c-input::placeholder { color:hsl(var(--muted-foreground)); }
        .c-input:focus { border-color:hsl(var(--primary)); box-shadow:0 0 0 3px hsl(var(--primary)/.12); }
        .c-input.has-value { border-color:hsl(var(--primary)/.5); }
        @keyframes popIn { 0% { transform:scale(0.7); opacity:0; } 70% { transform:scale(1.1); } 100% { transform:scale(1); opacity:1; } }
        .pop-in { animation:popIn .5s var(--ease-expo) forwards; }
        @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        .shimmer-line { height:1px; background:linear-gradient(90deg,transparent,rgba(255,255,255,.35),transparent); background-size:200% auto; animation:shimmer 2.5s linear infinite; }
        .btn-send { transition:transform .25s var(--ease-expo),box-shadow .25s; }
        .btn-send:not(:disabled):hover { transform:translateY(-2px); box-shadow:0 8px 24px hsl(var(--primary)/.3); }
        .btn-send:not(:disabled):active { transform:translateY(0); }
        @keyframes spin360 { to{transform:rotate(360deg);} }
        .spin { animation:spin360 .7s linear infinite; }
      `}</style>

      <div className="min-h-screen bg-background" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Navbar />

        {/* ── Header ── */}
        <div className="relative overflow-hidden bg-primary py-20">
          {PARTICLES.map((p, i) => (
            <span key={i} className="cp" style={{ left:`${p.left}%`, top:`${p.top}%`, animationDelay:`${p.delay}s`, ["--dur" as any]:`${p.dur}s`, width:`${p.w}px`, height:`${p.h}px`, opacity:p.op }} />
          ))}
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -left-8 bottom-0 h-40 w-40 rounded-full border border-white/10" />

          <div className={`relative mx-auto max-w-7xl px-4 text-center lg:px-8 ${headerVisible ? "h-visible" : ""}`}>
            <p className="mb-3 text-sm font-medium uppercase tracking-widest text-primary-foreground/60" style={{ opacity:headerVisible?1:0, transition:"opacity .6s ease .1s" }}>
              {t("hero.subtitle")}
            </p>
            <h1 className="mb-4 font-bold text-primary-foreground" style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"clamp(2rem,5vw,3.2rem)", lineHeight:1.1 }}>
              {t("hero.title").split("|").map((w, i) => (
                <span key={i} className="h-word" style={{ transitionDelay:`${i*130+200}ms`, marginRight:"0.2em" }}>{w}</span>
              ))}
            </h1>
            <div className="shimmer-line mx-auto my-5 w-16" />
            <p className="mx-auto max-w-xl text-primary-foreground/75 leading-relaxed" style={{ opacity:headerVisible?1:0, transform:headerVisible?"none":"translateY(16px)", transition:"all .7s var(--ease-expo) .5s" }}>
              {t("hero.desc1")}<br/>{t("hero.desc2")}
            </p>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="mx-auto max-w-7xl px-4 py-16 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-5">

            {/* ── Info Card ── */}
            <div className="lg:col-span-2" ref={infoRef}>
              <div className={`reveal${infoInView?" visible":""} rounded-2xl bg-primary p-8 text-primary-foreground h-full relative overflow-hidden`}>
                <div className="pointer-events-none absolute -right-12 -bottom-12 h-48 w-48 rounded-full border border-white/10" />
                <div className="pointer-events-none absolute right-8 top-8 h-20 w-20 rounded-full bg-white/5" />

                <h2 className="mb-8 font-bold" style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"1.6rem" }}>
                  {t("info.title")}
                </h2>

                <div className="flex flex-col gap-5 relative">
                  {contactItems.map(({ icon: Icon, label, lines }, i) => (
                    <div key={label} className={`info-card flex items-start gap-4 reveal${infoInView?" visible":""} reveal-delay-${i+1}`}>
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-foreground/10 backdrop-blur-sm">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm mb-0.5">{label}</h3>
                        {lines.map((l, j) => (
                          <p key={j} className="text-sm text-primary-foreground/75">{l}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="shimmer-line mt-10 w-full" />
                <p className="mt-4 text-xs text-primary-foreground/50 text-center">{t("info.guarantee")}</p>
              </div>
            </div>

            {/* ── Form Card ── */}
            <div className="lg:col-span-3" ref={formRef}>
              <div className={`reveal${formInView?" visible":""} rounded-2xl border border-border bg-card p-8 shadow-sm`}>
                {sent ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center pop-in">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                      <Check className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="mb-2 font-bold text-foreground" style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"1.8rem" }}>
                      {t("form.successTitle")}
                    </h3>
                    <p className="mb-8 max-w-sm text-muted-foreground leading-relaxed">
                      {t("form.successDesc")}
                    </p>
                    <Button onClick={() => setSent(false)} variant="outline" className="gap-2 rounded-full px-6">
                      <span>{t("form.successButton")}</span> <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                    <div className="mb-2">
                      <h2 className="font-bold text-foreground" style={{ fontFamily:"'Cormorant Garamond', serif", fontSize:"1.5rem" }}>
                        {t("form.title")}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">{t("form.subtitle")}</p>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-4 text-sm text-destructive border border-destructive/20">
                        <AlertCircle className="h-4 w-4 shrink-0" /> <span>{error}</span>
                      </div>
                    )}

                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        { name:"nom",    label: t("form.lastName"),  placeholder: t("form.lastNamePlaceholder"),  type:"text" },
                        { name:"prenom", label: t("form.firstName"), placeholder: t("form.firstNamePlaceholder"), type:"text" },
                      ].map(({ name, label, placeholder, type }) => (
                        <div key={name}>
                          <label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
                          <div className={`field-wrap${focusedField===name?" focused":""}`}>
                            <input
                              type={type} name={name}
                              value={formData[name as keyof typeof formData]}
                              onChange={handleChange}
                              onFocus={() => setFocusedField(name)}
                              onBlur={() => setFocusedField(null)}
                              placeholder={placeholder}
                              required
                              className={`c-input${formData[name as keyof typeof formData]?" has-value":""}`}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">{t("form.email")}</label>
                      <div className={`field-wrap${focusedField==="email"?" focused":""}`}>
                        <input
                          type="email" name="email"
                          value={formData.email} onChange={handleChange}
                          onFocus={() => setFocusedField("email")}
                          onBlur={() => setFocusedField(null)}
                          placeholder={t("form.emailPlaceholder")} required
                          className={`c-input${formData.email?" has-value":""}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">{t("form.phone")}</label>
                      <div className={`field-wrap${focusedField==="telephone"?" focused":""}`}>
                        <input
                          type="tel" name="telephone"
                          value={formData.telephone} onChange={handleChange}
                          onFocus={() => setFocusedField("telephone")}
                          onBlur={() => setFocusedField(null)}
                          placeholder={t("form.phonePlaceholder")} required
                          className={`c-input${formData.telephone?" has-value":""}`}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">{t("form.subject")}</label>
                      <div className={`field-wrap${focusedField==="sujet"?" focused":""}`}>
                        <select
                          name="sujet" value={formData.sujet} onChange={handleChange}
                          onFocus={() => setFocusedField("sujet")}
                          onBlur={() => setFocusedField(null)}
                          required
                          className={`c-input${formData.sujet?" has-value":""}`}
                        >
                          <option value="">{t("form.subjectPlaceholder")}</option>
                          <option value="Demande d'information">{t("form.subj1")}</option>
                          <option value="Support technique">{t("form.subj2")}</option>
                          <option value="Partenariat">{t("form.subj3")}</option>
                          <option value="Autre">{t("form.subj4")}</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">{t("form.message")}</label>
                      <div className={`field-wrap${focusedField==="message"?" focused":""}`}>
                        <textarea
                          name="message" value={formData.message} onChange={handleChange}
                          onFocus={() => setFocusedField("message")}
                          onBlur={() => setFocusedField(null)}
                          rows={5} placeholder={t("form.messagePlaceholder")} required
                          className={`c-input resize-none${formData.message?" has-value":""}`}
                        />
                      </div>
                      <p className="mt-1 text-right text-xs text-muted-foreground">
                        <span>{formData.message.length}</span> <span>{formData.message.length !== 1 ? t("form.charsPlural") : t("form.charSingular")}</span>
                      </p>
                    </div>

                    <Button type="submit" className="btn-send mt-1 gap-2 rounded-xl py-3 text-base" disabled={loading}>
                      {loading ? (
                        <><Loader2 className="h-4 w-4 spin" /> <span>{t("form.sending")}</span></>
                      ) : (
                        <><Send className="h-4 w-4" /> <span>{t("form.sendBtn")}</span></>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  )
}