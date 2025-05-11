"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";

export default function InfoBar() {
  return (
    <div className="bg-black/95 backdrop-blur-xl border-t border-white/10 mb-30">
      <div className="container mx-auto py-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          {
            icon: <MapPin size={24} className="text-red-500" />,
            title: "Standort",
            content: "Alte Dürenerstraße 4, 52428 Jülich",
            link: "/kontakt#map",
          },
          {
            icon: <Phone size={24} className="text-red-500" />,
            title: "Telefon",
            content: "+49 2461 9163780",
            link: "tel:+4924619163780",
          },
          {
            icon: <Mail size={24} className="text-red-500" />,
            title: "Email",
            content: "info@autogalerie-juelich.de",
            link: "mailto:info@autogalerie-juelich.de",
          },
        ].map((item, index) => (
          <Link
            key={index}
            href={item.link}
            className="group flex items-center gap-6 transition-all duration-300 hover:translate-x-2"
          >
            <motion.div
              className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 group-hover:border-red-500/30 transition-all duration-300"
              whileHover={{ rotate: 5, scale: 1.05 }}
            >
              {item.icon}
            </motion.div>
            <div>
              <p className="text-sm text-white/70">{item.title}</p>
              <p className="text-lg text-white font-medium group-hover:text-red-500 transition-colors duration-300">
                {item.content}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
