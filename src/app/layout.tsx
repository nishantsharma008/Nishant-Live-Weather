import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// ✅✅✅ FIXED - Added '/app/' to match actual file location ✅✅✅
import { LocationProvider } from "@/app/context/LocationContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ============================================
// ✅✅✅ UPDATED METADATA - NS' Weather ✅✅✅
// ============================================
export const metadata: Metadata = {
  // ✅ CHANGED: Your custom tab name
  title: "NS - Weather",
  
  description: "AI-Powered Real-time Weather Dashboard by Nishant Sharma",
  
  // ✅ NEW: Custom weather icon
  icons: {
    icon: [
      { url: "/weather.png", sizes: "32x32", type: "image/png" },
    ],
    shortcut: "/weather.png",
    apple: "/weather.png",
  },
  
  // ✅ BONUS: Better social sharing preview
  openGraph: {
    title: "NS' Weather",
    description: "Real-time Weather Dashboard - AI-Powered • Global Coverage • Live Updates",
    type: "website",
    siteName: "NS Weather",
  },
  
  // ✅ BONUS: Theme color for mobile browsers
  themeColor: "#000000",
  
  keywords: ["weather", "forecast", "real-time", "temperature", "rain", "climate"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LocationProvider>
          {children}
        </LocationProvider>
      </body>
    </html>
  );
}