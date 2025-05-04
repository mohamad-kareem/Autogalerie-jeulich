import Image from "next/image";
import Hero2 from "../../(assets)/Hero2.jpeg";
import Footbar from "@/app/(components)/Footbar";
import ContactForm from "./ContactForm";

export default function ContactPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative bg-black">
        <div className="absolute inset-0 overflow-hidden opacity-60">
          <Image
            src={Hero2}
            alt="Dealership Showroom"
            className="object-cover"
            priority
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-4xl">
            Kontaktieren Sie uns
          </h1>
          <p className="mt-6 text-xl text-red-200 max-w-3xl mx-auto">
            Wir beraten Sie gerne persönlich zu Ihrem nächsten Fahrzeug.
          </p>
        </div>
      </div>

      {/* Contact Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <ContactForm />
      </div>

      <Footbar />
    </div>
  );
}
