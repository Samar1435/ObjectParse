import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { CookieConsentBanner } from "@/components/consent/cookie-consent-banner";
import { SITE_SCALE_STORAGE_KEY } from "@/hooks/use-font-scale";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site-config";
import { ADSENSE_CLIENT_ID } from "@/lib/ads-config";

const fontSans = Inter({
  variable: "--font-sans-ui",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Objectparse — Free Online JSON, JWT & Base64 Tools",
    template: "%s | Objectparse",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "json formatter",
    "json validator",
    "json parser online",
    "jwt decoder",
    "jwt debugger",
    "jwt.io alternative",
    "base64 encode online",
    "base64 decode online",
    "developer tools online",
  ],
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME }],
  referrer: "origin-when-cross-origin",
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: "Objectparse — Free Online JSON, JWT & Base64 Tools",
    description: SITE_DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Objectparse — Free Online JSON, JWT & Base64 Tools",
    description: SITE_DESCRIPTION,
  },
  other: {
    "google-adsense-account": ADSENSE_CLIENT_ID,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <Script id="site-scale-init" strategy="beforeInteractive">
          {`(function(){try{var s=localStorage.getItem(${JSON.stringify(SITE_SCALE_STORAGE_KEY)});if(s){document.documentElement.style.fontSize=s+"%";}}catch(e){}})();`}
        </Script>
        {ADSENSE_CLIENT_ID ? (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        ) : null}
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <SiteHeader />
            <main className="flex flex-1 flex-col">{children}</main>
            <SiteFooter />
            <Toaster />
            <CookieConsentBanner />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
