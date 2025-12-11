import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "@/styles/accessibility.css";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import ErrorBoundary from "@/components/error-boundary";
import { getConfig } from "@/lib/config";
import { AgeVerificationProvider } from "@/components/auth/age-verification-provider";
import { GDPRProvider } from "@/components/gdpr/gdpr-provider";
import { AccessibilityProvider } from "@/components/accessibility/AccessibilityProvider";
import { LazyLoadingWrapper } from "@/lib/lazy-loading-wrapper";
import { AssetOptimizer, EXTERNAL_RESOURCE_HINTS, CriticalAssetPreloader } from "@/components/performance/asset-optimizer";
import { FontOptimizer, DEFAULT_FONTS, CriticalFontLoader } from "@/components/performance/font-optimizer";
import { ImagePreloader } from "@/components/performance/asset-optimizer";
import { ServiceWorkerRegistration } from "@/components/service-worker/registration";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Validate environment configuration on startup
getConfig();

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voltage - Complete Soda & Energy Drink Platform",
  description: "Create EU-compliant classic sodas, energy drinks, and hybrid recipes at home with precision recipes, safety verification, and global marketplace integration.",
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  keywords: ['soda', 'energy drink', 'DIY', 'recipes', 'caffeine', 'home brewing', 'classic cola', 'lemon-lime', 'hybrid drinks'],
  authors: [{ name: 'Voltage Platform Team' }],
  creator: 'Voltage Platform',
  publisher: 'Voltage Platform',
  openGraph: {
    title: 'Voltage - Complete Soda & Energy Drink Platform',
    description: 'Create EU-compliant classic sodas, energy drinks, and hybrid recipes at home',
    type: 'website',
    locale: 'en_US',
  },
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

        <AssetOptimizer
          resourceHints={EXTERNAL_RESOURCE_HINTS}
          criticalAssets={[
            '/_next/static/css/app/layout.css',
            '/fonts/inter-400.woff2',
            '/fonts/inter-500.woff2',
            '/fonts/inter-600.woff2',
          ]}
          prefetchImages={[
            '/file.svg',
            '/globe.svg',
            '/next.svg',
          ]}
          enableResourceHints={true}
          enablePrefetching={true}
        >
          <FontOptimizer
            fonts={DEFAULT_FONTS}
            enablePreloading={true}
            enableFontDisplaySwap={true}
          >
            <GDPRProvider>
              <AgeVerificationProvider>
                <AccessibilityProvider>
                  {/* Service Worker Registration */}
                <ServiceWorkerRegistration
                  showUpdateNotification={true}
                  autoUpdate={false}
                  config={{
                    onUpdate: (registration) => {
                      console.log('Service Worker update available');
                    },
                    onSuccess: (registration) => {
                      console.log('Service Worker registered successfully');
                    },
                    onOfflineReady: () => {
                      console.log('App is ready for offline use');
                    }
                  }}
                />
            <Header />
            <main id="main-content" className="flex-1 container mx-auto px-4 py-8 relative z-10">
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </main>
            <Footer />
            
            {/* Lazy load heavy analytics and tracking components */}
            <Suspense fallback={<div className="fixed bottom-4 right-4 z-50" />}>
              <LazyLoadingWrapper>
                {/* Analytics will be loaded dynamically */}
                <div id="analytics-placeholder" />
              </LazyLoadingWrapper>
            </Suspense>
            
            {/* Lazy load performance monitoring */}
            <Suspense fallback={null}>
              <LazyLoadingWrapper>
                {/* Web Vitals will be loaded dynamically */}
                <div id="webvitals-placeholder" />
              </LazyLoadingWrapper>
            </Suspense>
                </AccessibilityProvider>
              </AgeVerificationProvider>
            </GDPRProvider>

            {/* Offline Indicator */}
            <OfflineIndicator />
          </FontOptimizer>
        </AssetOptimizer>
      </body>
    </html>
  );
}
