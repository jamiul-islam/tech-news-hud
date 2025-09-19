import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { AppProviders } from '@/components/providers/app-providers';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'High-Signal News HUD',
  description:
    'Personal news heads-up display that blends your focus areas with high-signal stories from across the web.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} antialiased`}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
