import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { ChatbotWidget } from '@/components/chatbot-widget' 

import '../globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata: Metadata = {
  title: 'ConceptImmo - Plateforme Immobiliere',
  description: 'Trouvez votre bien immobilier ideal.',
  icons: {
    icon: '/immomaroc.png',
    apple: '/immomaroc.png'
  },
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages({locale:locale});
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir}>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        {/* 🌟 C'est ici ! Ajoute locale={locale} 👇 */}
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
          <ChatbotWidget />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}