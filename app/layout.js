import "./globals.css";
import NavBar from "./(components)/NavBar";
import SessionWrapper from "@/app/(components)/SessionWrapper";
import { Toaster } from "react-hot-toast";
export const metadata = {
  title: "Autogalerie Jülich",
  description:
    "Premium Fahrzeugflotte · Standort. Alte Dürenerstraße 4, 52428 Jülich · Telefon. +49 2461 9163780 · Email. info@autogalerie-juelich.de",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
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
