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
  title: 'AL UFUQ AL DAHABI | Business Services in UAE & Oman',
  description: 'Your trusted partner for company registration, residency, license renewal, VAT registration, and business services in UAE and Oman. Professional support in English, Persian, and Arabic.',
  keywords: ['company registration UAE', 'business setup Dubai', 'Oman company formation', 'residency UAE', 'VAT registration', 'الافق الذهبی', 'ثبت شرکت امارات', 'ثبت شرکت عمان'],
  authors: [{ name: 'AL UFUQ AL DAHABI' }],
  openGraph: {
    title: 'AL UFUQ AL DAHABI | Business Services in UAE & Oman',
    description: 'Your trusted partner for company registration, residency, and business services in UAE and Oman.',
    type: 'website',
  },
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
