import { FaSearch } from "react-icons/fa";
import { MdOutlineAttachMoney, MdVerified } from "react-icons/md";
import { IoIosArrowForward } from "react-icons/io";
import Image from "next/image";
import Marketing from "../(assets)/Marketing.png";
import Button from "./Button";
import Link from "next/link";

export default function SellCarYourWay() {
  return (
    <section className="max-w-[76rem] mx-auto px-4 sm:px-6 md:px-10 lg:px-16 py-12 bg-white relative shadow-even mb-8">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-red-50 filter blur-2xl opacity-20"></div>
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-blue-50 filter blur-2xl opacity-20"></div>
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Text content */}
        <div className="space-y-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 leading-tight mt-4">
            Kaufen oder verkaufen Sie Autos –<br />
          </h2>

          {/* Feature 1 */}
          <div className="flex items-start space-x-5 mt-6">
            <div className="flex-shrink-0 relative">
              <div className="absolute -inset-1 bg-red-100 rounded-lg transform rotate-3 opacity-30"></div>
              <div className="relative flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-gray-200 shadow-sm">
                <FaSearch className="text-red-600 text-base" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                Durchstöbern Sie unsere Autosammlung
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Entdecken Sie qualitativ hochwertige neue und gebrauchte Autos.
                Finden Sie das perfekte Fahrzeug für Ihren Lebensstil.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-start space-x-5 mt-6">
            <div className="flex-shrink-0 relative">
              <div className="absolute -inset-1 bg-blue-100 rounded-lg transform -rotate-3 opacity-30"></div>
              <div className="relative flex items-center justify-center w-10 h-10 bg-white rounded-lg border border-gray-200 shadow-sm">
                <MdOutlineAttachMoney className="text-green-600 text-lg" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-800">
                Verkaufen Sie uns Ihr Auto
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Erhalten Sie ein schnelles, faires Angebot von unserem Team.
                Kein Aufwand - wir kümmern uns um alles.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3 pt-4">
            <Link href="/gebrauchtwagen" passHref>
              <Button>
                <span>Jetzt entdecken</span>
                <IoIosArrowForward className="ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>

            <Link href="/kontakt" passHref>
              <Button
                bgColor="bg-black"
                textColor="text-white"
                hoverColor="hover:bg-red-950"
              >
                <span>Auto verkaufen</span>
                <IoIosArrowForward className="ml-1 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Image section */}
        <div className="relative w-full h-64 sm:h-80 md:h-96 lg:h-[350px]">
          <div className="relative w-full h-full rounded-lg overflow-hidden shadow-md">
            <Image
              src={Marketing}
              alt="Illustration von Auto kaufen und verkaufen"
              fill
              className="object-fill"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>

          {/* Labels on image */}
          <div className="absolute -bottom-3 -left-3 bg-white px-2.5 py-1.5 rounded-md shadow-sm border border-gray-200 transform -rotate-1">
            <div className="flex items-center">
              <div className="bg-green-100 p-1.5 rounded-sm mr-1.5">
                <FaSearch className="text-green-600 text-xl" />
              </div>
              <span className="text-xs font-medium text-gray-700">Kaufen</span>
            </div>
          </div>

          <div className="absolute -top-3 -right-3 bg-white px-2.5 py-1.5 rounded-md shadow-sm border border-gray-200 transform rotate-1">
            <div className="flex items-center">
              <div className="bg-blue-100 p-1.5 rounded-sm mr-1.5">
                <MdOutlineAttachMoney className="text-green-600 text-xl" />
              </div>
              <span className="text-xs font-medium text-gray-700">
                Verkaufen
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
