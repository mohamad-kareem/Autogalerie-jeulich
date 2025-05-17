import "./globals.css";
import NavBar from "./(components)/NavBar";
import SessionWrapper from "@/app/(components)/SessionWrapper";
import { Toaster } from "react-hot-toast";
export const metadata = {
  title: "Autogalerie Jülich",
  description:
    "Premium Fahrzeugflotte · Standort. Alte Dürenerstraße 4, 52428 Jülich · Telefon. +49 2461 9163780 · Email. info@autogalerie-juelich.de",
  icons: {
    icon: "/mylogo.png",
    shortcut: "/mylogo.png",
    apple: "/mylogo.png",
  },
  openGraph: {
    title: "Autogalerie Jülich",
    description: "Premium Fahrzeugflotte in Jülich · Jetzt entdecken!",
    images: [
      {
        url: "/mylogo.png",
        width: 1200,
        height: 630,
        alt: "Autogalerie Jülich Logo",
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/mylogo.png" sizes="32x32" type="image/png" />
        <link rel="shortcut icon" href="/mylogo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/mylogo.png" />
        <link rel="canonical" href="https://autogaleriejülich.de/" />
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
          {children}
        </SessionWrapper>
      </body>
    </html>
  );
}
