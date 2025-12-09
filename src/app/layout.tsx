import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import ErrorBoundary from "@/components/error-boundary";
import { getConfig } from "@/lib/config";
import { Analytics } from '@vercel/analytics/react';
import { AgeVerificationProvider } from "@/components/auth/age-verification-provider";
import { GDPRProvider } from "@/components/gdpr/gdpr-provider";
import { WebVitalsTracker } from "@/components/performance/web-vitals-tracker";

// Validate environment configuration on startup
const config = getConfig();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DIY Energy Drink Guide - Netherlands",
  description: "Safe, EU-compliant guide for making custom energy drinks at home",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col relative overflow-x-hidden`}
      >
        {/* Skip Navigation Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          Skip to main content
        </a>

        {/* Global Background Effects */}
        <div className="fixed inset-0 z-[-1] bg-background">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
          <div className="absolute right-0 bottom-0 -z-10 h-[500px] w-[500px] rounded-full bg-chart-2/10 opacity-20 blur-[120px]"></div>
        </div>

        <GDPRProvider>
          <AgeVerificationProvider>
            <Header />
            <main id="main-content" className="flex-1 container mx-auto px-4 py-8 relative z-10">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
            <Footer />
          </AgeVerificationProvider>
        <Analytics />
        <WebVitalsTracker />
        </GDPRProvider>
        <Analytics />
      </body>
    </html>
  );
}
