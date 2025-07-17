"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";

export default function InfoBar() {
  const items = [
    {
      icon: <MapPin size={20} className="text-red-500" />,
      title: "Standort",
      content: "Alte Dürenerstraße 4, 52428 Jülich",
      link: "/kontakt#map",
    },
    {
      icon: <Phone size={20} className="text-red-500" />,
      title: "Telefon",
      content: "+49 2461 9163780",
      link: "tel:+4924619163780",
    },
    {
      icon: <Mail size={20} className="text-red-500" />,
      title: "E-Mail",
      content: "autogalerie.jülich@web.de",
      link: "mailto:autogalerie.jülich@web.de",
    },
  ];

  return (
    <section className="bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
        {items.map((item, index) => (
          <Link key={index} href={item.link} className="group">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.25 }}
              className="flex items-center gap-3 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl hover:border-red-500/30 transition-all duration-300 hover:shadow-lg"
            >
              <div className="w-8 h-8 rounded-md bg-white/10 flex items-center justify-center">
                {item.icon}
              </div>
              <div className="text-white">
                <p className="text-[11px] sm:text-xs text-white/60">
                  {item.title}
                </p>
                <p className="text-sm sm:text-base font-medium group-hover:text-red-500 transition-colors duration-300 leading-snug">
                  {item.content}
                </p>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </section>
  );
}
