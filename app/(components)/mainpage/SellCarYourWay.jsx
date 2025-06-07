"use client";

import { FaSearch } from "react-icons/fa";
import { MdOutlineAttachMoney } from "react-icons/md";
import { IoIosArrowForward } from "react-icons/io";
import Image from "next/image";
import Marketing from "../../(assets)/Marketing.png";
import Button from "../helpers/Button";
import Link from "next/link";

export default function SellCarYourWay() {
  return (
    <section className="relative w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1750px] mx-auto py-8 px-2 sm:px-4 lg:px-12 pt-20 pb-30 overflow-hidden shadow-even">
      {/* Glow Effects */}
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
        {/* Text Section */}
        <div className="space-y-4 sm:space-y-5">
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-tight mt-2">
            Kaufen oder verkaufen Sie Autos –
          </h2>

          {/* Feature 1 */}
          <div className="flex items-start space-x-4 sm:space-x-5 mt-4">
            <div className="flex-shrink-0 relative">
              <div className="absolute -inset-1 bg-red-100 rounded-lg transform rotate-3 opacity-30"></div>
              <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-lg border border-gray-200 shadow-sm">
                <FaSearch className="text-red-600 text-sm sm:text-base" />
              </div>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white">
                Durchstöbern Sie unsere Autosammlung
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Entdecken Sie qualitativ hochwertige neue und gebrauchte Autos.
                Finden Sie das perfekte Fahrzeug für Ihren Lebensstil.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-start space-x-4 sm:space-x-5 mt-4">
            <div className="flex-shrink-0 relative">
              <div className="absolute -inset-1 bg-blue-100 rounded-lg transform -rotate-3 opacity-30"></div>
              <div className="relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-white rounded-lg border border-gray-200 shadow-sm">
                <MdOutlineAttachMoney className="text-green-600 text-base sm:text-lg" />
              </div>
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white">
                Verkaufen Sie uns Ihr Auto
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Erhalten Sie ein schnelles, faires Angebot von unserem Team.
                Kein Aufwand – wir kümmern uns um alles.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3 pt-3">
            <Link href="/gebrauchtwagen" passHref>
              <Button className="text-sm sm:text-base px-4 py-2">
                <span>Jetzt entdecken</span>
                <IoIosArrowForward className="ml-1 text-sm sm:text-base transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/Autoverkaufen" passHref>
              <Button
                bgColor="bg-white"
                textColor="text-black"
                hoverColor="hover:bg-red-950"
                className="text-sm sm:text-base px-4 py-2"
              >
                <span>Auto verkaufen</span>
                <IoIosArrowForward className="ml-1 text-sm sm:text-base transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Image Section */}
        <div className="relative w-full h-60 sm:h-60 md:h-72 lg:h-[300px] mt-20">
          <div className="relative w-full h-full rounded-lg overflow-hidden shadow-md">
            <Image
              src={Marketing}
              alt="Illustration von Auto kaufen und verkaufen"
              fill
              className="object-contain"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>

          {/* Bottom Left Label */}
          <div className="absolute -bottom-0 left-18 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-200 transform -rotate-1">
            <div className="flex items-center">
              <div className="bg-green-100 p-1 rounded-sm mr-1">
                <FaSearch className="text-green-600 text-lg sm:text-xl" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-gray-700">
                Kaufen
              </span>
            </div>
          </div>

          {/* Top Right Label */}
          <div className="absolute -top-0 right-18 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-200 transform rotate-1">
            <div className="flex items-center">
              <div className="bg-blue-100 p-1 rounded-sm mr-1">
                <MdOutlineAttachMoney className="text-green-600 text-lg sm:text-xl" />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-gray-700">
                Verkaufen
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
