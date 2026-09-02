import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from 'next/link';
import Navbar from '@/components/Navbar';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Linkin Park E-store",
  description: "School project :)",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Passar på att sätta suppressHydrationWarning här nu i både html och body, som i Florilegium och min PokémonCollection Next.js re-build
    <html lang="sv" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-ink text-bone">

        {/* Frakt-baren högst upp, precis som i den riktiga butiken */}
        <div className="bg-teal py-2.5 text-center">
          <p className="lp-eyebrow px-4">
            Frakt till hela Norden. Fraktavgifter tillkommer i kassan.
          </p>
        </div>

        <Navbar />

        <main className="flex-1">
          {children}
        </main>

        <footer className="mt-24 border-t border-line bg-surface">
          <div className="lp-container-wide flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xl font-bold uppercase tracking-tight">Linkin Park</p>
            <Link href="/about" className="text-xs text-muted underline-offset-4 transition-colors hover:text-bone hover:underline">
              Skolprojekt av Steven Lomon Lennartsson · Systemutveckling FSU25D
            </Link>
          </div>
        </footer>
      </body>
    </html>
  )
};
