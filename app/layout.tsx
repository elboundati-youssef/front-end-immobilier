import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { ChatbotWidget } from '@/components/chatbot-widget' // <-- Ajout de l'import

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: 'ImmoMaroc - Plateforme Immobiliere',
  description: 'Trouvez votre bien immobilier ideal. Vente, location, appartements, villas, terrains et bureaux.',
   icons: {
    icon: '/immomaroc.png',
    shortcut: '/immomaroc.png',
    apple: '/immomaroc.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        {children}
        
        {/* Intégration globale du Chatbot pour qu'il s'affiche sur toutes les pages */}
        <ChatbotWidget />
      </body>
    </html>
  )
}