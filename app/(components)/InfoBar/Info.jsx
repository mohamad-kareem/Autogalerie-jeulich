"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Phone, Mail } from "lucide-react";

export default function InfoBar() {
  const items = [
    {
      icon: <MapPin size={26} className="text-red-500" />,
      title: "Standort",
      content: "Alte Dürenerstraße 4, 52428 Jülich",
      link: "/kontakt#map",
    },
    {
      icon: <Phone size={26} className="text-red-500" />,
      title: "Telefon",
      content: "+49 2461 9163780",
      link: "tel:+4924619163780",
    },
    {
      icon: <Mail size={26} className="text-red-500" />,
      title: "E-Mail",
      content: "autogalerie.jülich@web.de",
      link: "mailto:autogalerie.jülich@web.de",
    },
  ];

  return (
    <section className="bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {items.map((item, index) => (
          <Link key={index} href={item.link} className="group">
            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 bg-white/5 border border-white/10 rounded-xl hover:border-red-500/30 transition-all duration-300 hover:shadow-lg"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-white/10">
                {item.icon}
              </div>
              <div className="text-white">
                <p className="text-sm text-white/70">{item.title}</p>
                <p className="text-base font-medium group-hover:text-red-500 transition-colors duration-300">
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
