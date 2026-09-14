import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.dist.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GitaMitra - Timeless Bhagavad Gita Wisdom & Spiritual Guidance",
  description: "Your personal spiritual companion inspired by the Bhagavad Gita.",
};

import { AuthProvider } from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeContext";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Martel:wght@400;600;700;800&family=Noto+Serif+Devanagari:wght@400;500;600;700;800&family=Rozha+One&family=Yatra+One&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-chariot-theme text-stone-900 dark:text-stone-100 transition-colors duration-200 selection:bg-amber-500/30">
        <ThemeProvider>
          <AuthProvider>
            <div className="flex-1 flex flex-col min-h-screen">
              {children}
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
