// Root Layout
// User: Endawoke47
// Date: 2025-07-11 20:41:23 UTC

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProviders } from '../providers/app-providers';
import { CommandPaletteIndicator } from '../components/ui/CommandPaletteIndicator';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://counselflow.com'),
  title: 'CounselFlow Ultimate - AI-Powered Legal Practice Management',
  description: 'Transform your legal practice with AI-powered automation, intelligent workflows, and comprehensive matter management.',
  keywords: 'legal software, law firm management, AI legal tech, African legal software',
  authors: [{ name: 'Endawoke47' }],
  creator: 'Endawoke47',
  publisher: 'CounselFlow',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://counselflow.com',
    title: 'CounselFlow Ultimate',
    description: 'AI-Powered Legal Practice Management for African Law Firms',
    siteName: 'CounselFlow',
    images: [
      {
        url: 'https://counselflow.com/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CounselFlow Ultimate',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CounselFlow Ultimate',
    description: 'AI-Powered Legal Practice Management',
    images: ['https://counselflow.com/twitter-image.png'],
    creator: '@counselflow',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="theme-color" content="#14b8a6" />
      </head>
      <body className={inter.className}>
        <AppProviders>
          {children}
          <CommandPaletteIndicator />
        </AppProviders>
      </body>
    </html>
  );
}
