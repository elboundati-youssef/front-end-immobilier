"use client"

import { useState } from "react"
import { MapPin, Phone, Mail, Clock, Check, Send, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import api from "@/services/api" // Assurez-vous que ce chemin est correct

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // État du formulaire
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
    sujet: "",
    message: ""
  })

  // Gestion des changements dans les inputs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  // Envoi du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      // Appel vers Laravel (Route: POST /api/contact)
      await api.post('/contact', formData)
      
      setSent(true)
      // Reset du formulaire (optionnel, car on affiche le message de succès)
      setFormData({ nom: "", prenom: "", email: "", telephone: "", sujet: "", message: "" })
      
    } catch (err) {
      console.error(err)
      setError("Une erreur est survenue lors de l'envoi. Veuillez réessayer.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="mb-12 text-center">
          <p className="mb-1 text-sm font-medium uppercase tracking-wider text-primary">Contact</p>
          <h1 className="mb-4 font-serif text-3xl font-bold text-foreground md:text-4xl">Contactez-nous</h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Une question, une suggestion ou besoin d&apos;aide ? Notre équipe est à votre disposition pour vous accompagner.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Contact Info */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-primary p-8 text-primary-foreground">
              <h2 className="mb-6 font-serif text-2xl font-bold">Nos coordonnées</h2>

              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Adresse</h3>
                    <p className="text-sm text-primary-foreground/80">123 Boulevard Mohammed V, Casablanca, Maroc</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Téléphone</h3>
                    <p className="text-sm text-primary-foreground/80">+212 5 22 00 00 00</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Email</h3>
                    <p className="text-sm text-primary-foreground/80">contact@immomaroc.ma</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-foreground/10">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Horaires</h3>
                    <p className="text-sm text-primary-foreground/80">Lun - Ven: 9h - 18h</p>
                    <p className="text-sm text-primary-foreground/80">Sam: 9h - 13h</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-border bg-card p-8">
              {sent ? (
                <div className="py-12 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Check className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mb-2 font-serif text-2xl font-bold text-foreground">Message envoyé !</h3>
                  <p className="mb-6 text-muted-foreground">
                    Nous avons bien reçu votre message. Nous vous répondrons dans les plus brefs délais.
                  </p>
                  <Button onClick={() => setSent(false)} variant="outline">
                    Envoyer un autre message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  
                  {error && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                        <AlertCircle className="h-4 w-4" /> {error}
                    </div>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">Nom</label>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        placeholder="Votre nom"
                        required
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-foreground">Prénom</label>
                      <input
                        type="text"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleChange}
                        placeholder="Votre prénom"
                        required
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="votre@email.com"
                      required
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Téléphone</label>
                    <input
                      type="tel"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      placeholder="+212 6 00 00 00 00"
                      required
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Sujet</label>
                    <select 
                        name="sujet"
                        value={formData.sujet}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Choisir un sujet</option>
                      <option value="Demande d'information">Demande d&apos;information</option>
                      <option value="Support technique">Support technique</option>
                      <option value="Partenariat">Partenariat</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={5}
                      placeholder="Votre message..."
                      required
                      className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <Button type="submit" className="gap-2" disabled={loading}>
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Envoi en cours...
                        </>
                    ) : (
                        <>
                            <Send className="h-4 w-4" /> Envoyer le message
                        </>
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
  )
}