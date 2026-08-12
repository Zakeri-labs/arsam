import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({ 
  subsets: ['latin'],
  variable: '--font-geist-sans',
});
const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ofogh.zakeri.dev'),
  title: 'ابوآرسام | Abu Arsam Corporate Services & Business Setup',
  description: 'Your premium partner for company formation, corporate residency, license renewal, VAT registration, and business setup services in the UAE and Oman. Professional support in English, Persian, and Arabic.',
  manifest: '/manifest.json',
  keywords: ['company registration UAE', 'business setup Dubai', 'Oman company formation', 'residency UAE', 'VAT registration', 'ابوآرسام', 'ثبت شرکت امارات', 'ثبت شرکت عمان'],
  authors: [{ name: 'ابوآرسام - Abu Arsam' }],
  openGraph: {
    title: 'ابوآرسام | Abu Arsam Corporate Services',
    description: 'Your premium partner for company formation, corporate residency, license renewal, VAT registration, and business setup services in the UAE and Oman.',
    url: 'https://ofogh.zakeri.dev',
    siteName: 'ابوآرسام - Abu Arsam',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 1000,
        alt: 'ابوآرسام - Abu Arsam Logo',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ابوآرسام | Abu Arsam Corporate Services',
    description: 'Your premium partner for company formation, corporate residency, and business setup in the UAE and Oman.',
    images: ['/logo.png'],
  },
  icons: {
    icon: '/favicon.png',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ابوآرسام',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#ffffff',
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${geist.variable} ${geistMono.variable} font-sans antialiased`}>
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
