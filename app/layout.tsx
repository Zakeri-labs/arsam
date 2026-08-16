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

const getSiteUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'https://abuarsam.vercel.app';
};

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'ابوآرسام (با مدیریت رضا اماره) | ثبت شرکت و خدمات اداری امارات و عمان',
  description: 'گروه ابوآرسام با مدیریت رضا اماره، همراه مطمئن شما برای ثبت شرکت، اخذ اقامت، تمدید لایسنس، امور مالیاتی، حساب بانکی و راه‌اندازی کسب‌وکار در امارات و عمان.',
  manifest: '/manifest.json',
  keywords: [
    'ابوآرسام',
    'ABU ARSAM',
    'رضا اماره',
    'Reza Amareh',
    'ثبت شرکت امارات',
    'ثبت شرکت عمان',
    'ثبت شرکت دبی',
    'اخذ اقامت امارات',
    'اقامت عمان',
    'امور مالیاتی امارات',
    'افتتاح حساب شرکتی',
    'Company Registration UAE',
    'Business Setup Dubai',
    'Oman Company Formation',
  ],
  authors: [{ name: 'ابوآرسام - Abu Arsam (رضا اماره)' }],
  openGraph: {
    title: 'ابوآرسام (با مدیریت رضا اماره) | ثبت شرکت و خدمات اداری امارات و عمان',
    description: 'گروه ابوآرسام با مدیریت رضا اماره، همراه مطمئن شما برای ثبت شرکت، اخذ اقامت، تمدید لایسنس، امور مالیاتی، افتتاح حساب شرکتی و خدمات راه‌اندازی کسب‌وکار در امارات و عمان.',
    url: siteUrl,
    siteName: 'ابوآرسام - Abu Arsam',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        secureUrl: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: 'ابوآرسام | ABU ARSAM - با مدیریت رضا اماره',
      }
    ],
    locale: 'fa_IR',
    alternateLocale: ['en_US', 'ar_SA'],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ابوآرسام (با مدیریت رضا اماره) | ثبت شرکت و خدمات اداری امارات و عمان',
    description: 'گروه ابوآرسام با مدیریت رضا اماره، همراه مطمئن شما برای ثبت شرکت، اخذ اقامت، تمدید لایسنس و امور مالیاتی در امارات و عمان.',
    images: [`${siteUrl}/og-image.png`],
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
