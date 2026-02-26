"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl" // 🌟 IMPORT NEXT-INTL
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/services/api"

// Types pour structurer nos messages
type MessageType = {
  id: string;
  sender: "user" | "bot";
  text: string;
  quickActions?: string[]; 
  properties?: any[]; 
}

const API_URL = "http://127.0.0.1:8000";

export function ChatbotWidget() {
  const t = useTranslations("Chatbot") // 🌟 INITIALISATION TRADUCTION
  const pathname = usePathname()
  const currentLocale = pathname.split("/")[1] || "fr"
  const l = (path: string) => `/${currentLocale}${path}`

  const [isOpen, setIsOpen] = useState(false)
  const [inputText, setInputText] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<MessageType[]>([])

  // 🌟 RECHARGE LES MESSAGES QUAND LA LANGUE CHANGE (t) 🌟
  useEffect(() => {
    setMessages([
      {
        id: "1",
        sender: "bot",
        text: t("initialMessage"),
        quickActions: [t("actions.find"), t("actions.publish"), t("actions.contact")]
      }
    ])
  }, [t])

  // Scroll automatique vers le bas à chaque nouveau message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen])

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return

    // 1. Ajouter le message de l'utilisateur
    const newUserMsg: MessageType = { id: Date.now().toString(), sender: "user", text }
    setMessages(prev => [...prev, newUserMsg])
    setInputText("")
    setIsLoading(true)

    try {
      // 2. VRAI APPEL API VERS TON BACKEND LARAVEL
      const response = await api.post('/chatbot', { message: text });
      
      // 3. Récupération et formatage de la réponse
      const botResponse: MessageType = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: response.data.text, // Le texte généré par le ChatbotController (déjà traduit)
        quickActions: response.data.quickActions || [], 
        properties: response.data.properties || null, 
      }

      setMessages(prev => [...prev, botResponse])
      
    } catch (error) {
      console.error("Erreur de connexion au chatbot :", error)
      
      // Message de secours en cas de bug du serveur
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: t("error")
      }])
    } finally {
      setIsLoading(false)
    }
  }

  // Permet de gérer la touche Entrée
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSendMessage(inputText)
    }
  }

  // Formatage de l'image (identique à ton dashboard)
  const getImageUrl = (imagesData: any) => {
    if (!imagesData) return "/placeholder.jpg";
    let images = typeof imagesData === 'string' ? JSON.parse(imagesData) : imagesData;
    let imagePath = (Array.isArray(images) && images.length > 0) ? images[0] : "/placeholder.jpg";
    if (imagePath.startsWith("http") || imagePath.startsWith("/images")) return imagePath;
    return `${API_URL}${imagePath}`;
  }

  return (
    <>
      {/* BOUTON FLOTTANT */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-transform hover:scale-110 ${isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}`}
      >
        <MessageSquare className="h-6 w-6" />
        {/* Petit point de notification */}
        <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
        </span>
      </button>

      {/* FENÊTRE DU CHATBOT */}
      <div 
        className={`fixed bottom-6 right-6 z-50 flex w-[350px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
        style={{ height: '600px', maxHeight: 'calc(100vh - 4rem)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-primary p-4 text-primary-foreground">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">{t("title")}</h3>
              <p className="text-xs text-primary-foreground/80 flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-400 inline-block"></span> {t("online")}
              </p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="rounded-full p-1 hover:bg-white/20 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Zone des messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/20">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-3 text-sm shadow-sm ${
                msg.sender === 'user' 
                ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                : 'bg-card border border-border text-foreground rounded-tl-sm'
              }`}>
                {msg.text}
              </div>

              {/* Affichage des actions rapides (Boutons) */}
              {msg.quickActions && msg.quickActions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
                  {msg.quickActions.map((action, idx) => (
                    <button 
                      key={idx}
                      onClick={() => handleSendMessage(action)}
                      className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}

              {/* Affichage des biens (Cartes magiques) */}
              {msg.properties && msg.properties.length > 0 && (
                <div className="mt-3 flex max-w-[90%] gap-3 overflow-x-auto pb-2 snap-x">
                  {msg.properties.map((property) => (
                    <Link href={l(`/biens/${property.slug || property.id}`)} key={property.id} className="min-w-[200px] shrink-0 snap-start overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:border-primary transition-colors block">
                      <div className="relative h-24 w-full bg-muted">
                        <Image src={getImageUrl(property.images)} alt={property.title} fill className="object-cover" unoptimized />
                      </div>
                      <div className="p-2.5">
                        <h4 className="font-semibold text-xs line-clamp-1">{property.title}</h4>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1 mb-1"><MapPin className="h-3 w-3" /> {property.city}</p>
                        <p className="font-bold text-primary text-sm">{property.price} DH</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Indicateur de frappe */}
          {isLoading && (
            <div className="flex items-start">
              <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-card border border-border p-4 shadow-sm flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce delay-75"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground animate-bounce delay-150"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-border bg-card p-3">
          <div className="flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-2 py-1 focus-within:ring-1 focus-within:ring-primary focus-within:bg-card transition-all">
            <input 
              type="text"
              placeholder={t("placeholder")}
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <Button 
              size="icon" 
              className="h-8 w-8 shrink-0 rounded-full" 
              onClick={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}