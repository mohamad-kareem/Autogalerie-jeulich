import "./globals.css";
import NavBar from "./(components)/Nav/NavBar";
import SessionWrapper from "@/app/(components)/helpers/SessionWrapper";
import { Toaster } from "react-hot-toast";
import PageLogger from "@/app/(components)/PageLogger";
import LayoutWrapper from "@/app/(components)/helpers/LayoutWrapper";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
});

export const metadata = {
  title: "Autogalerie Jülich",
  description:
    "Premium Fahrzeugflotte · Standort. Alte Dürenerstraße 4, 52428 Jülich · Telefon. +49 2461 9163780 · Email. info@autogalerie-juelich.de",
  icons: {
    icon: "/smcar.png",
    shortcut: "/smcar.png",
    apple: "/smcar.png",
  },
  openGraph: {
    title: "Autogalerie Jülich",
    description: "Premium Fahrzeugflotte in Jülich · Jetzt entdecken!",
    images: [
      {
        url: "dacia4.png",
        width: 1200,
        height: 630,
        alt: "Autogalerie Jülich Logo",
      },
    ],
  },
  metadataBase: new URL("https://autogaleriejülich.de"),
};

/**
 * ✅ Force a desktop-like viewport on mobile
 * - Mobile will render pages as "desktop size"
 * - Users can pinch-zoom if they want
 *
 * Tune initialScale:
 * - bigger UI: 0.40
 * - smaller UI: 0.30
 */
export const viewport = {
  width: 1200,
  initialScale: 0.3,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={playfair.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0F4C81" />
      </head>

      <body>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 5000,
            style: {
              background: "#333",
              color: "#fff",
            },
          }}
        />

        <SessionWrapper>
          <NavBar />
          <LayoutWrapper>{children}</LayoutWrapper>
          <PageLogger />
        </SessionWrapper>
      </body>
    </html>
  );
}
