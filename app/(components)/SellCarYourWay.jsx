import { FaSearch } from "react-icons/fa";
import { MdOutlineAttachMoney } from "react-icons/md";
import Image from "next/image";
import Marketing from "../(assets)/Marketing.png";
import Button from "./Button";
import Link from "next/link";
export default function SellCarYourWay() {
  return (
    <section className="max-w-[76rem] mx-auto bg-white text-black py-10 px-4 sm:px-6 md:px-8 mb-8 shadow-even">
      <div className=" grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Text content */}
        <div>
          <h2 className="text-2xl sm:text-3xl md:text-2xl font-bold mb-6 text-black">
            Kaufen oder verkaufen Sie Autos – alles an einem Ort
          </h2>

          <div className="flex items-start gap-4 mb-6">
            <div className="bg-red-500 p-4 rounded-full">
              <FaSearch className="text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-lg md:text-xl font-semibold text-black">
                Durchstöbern Sie unsere Autosammlung
              </h3>
              <p className="text-sm sm:text-sm text-gray-700">
                Entdecken Sie qualitativ hochwertige neue und gebrauchte Autos.
                Finden Sie das perfekte Fahrzeug, das zu Ihrem Lebensstil und
                Budget passt.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 mb-6">
            <div className="bg-red-500 p-4 rounded-full">
              <MdOutlineAttachMoney className="text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-lg md:text-xl font-semibold text-black">
                Verkaufen Sie uns Ihr Auto
              </h3>
              <p className="text-sm sm:text-sm text-gray-700">
                Erhalten Sie ein schnelles, faires Angebot von unserem Team.
                Kein Aufwand. Laden Sie einfach die Details Ihres Autos hoch und
                wir kümmern uns um den Rest.
              </p>
            </div>
          </div>

          <div className="flex gap-4 sm:flex-col md:flex-row">
            <Link href="/gebrauchtwagen" passHref>
              <Button>Jetzt entdecken</Button>
            </Link>

            <Link href="/kontakt">
              <Button
                bgColor="bg-white"
                textColor="text-black"
                className=" border-2 border-black px-4 py-2 rounded-lg transition text-sm sm:text-base"
              >
                Auto verkaufen
              </Button>
            </Link>
          </div>
        </div>

        {/* Illustration */}
        <div className="flex justify-center mt-8 md:mt-0">
          <Image
            src={Marketing}
            alt="Illustration von Auto kaufen und verkaufen"
            width={400}
            height={300}
            className="w-full max-w-md"
          />
        </div>
      </div>
    </section>
  );
}
