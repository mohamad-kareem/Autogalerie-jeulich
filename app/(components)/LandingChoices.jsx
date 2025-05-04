import Button from "./Button";
import Link from "next/link";
export default function LandingSection() {
  return (
    <section className="bg-white max-w-[76rem] mx-auto  px-4 sm:px-6 md:px- shadow-even mb-8 ">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Explore Vehicles Card */}
        <div className=" p-4 sm:p-5 md:p-6 lg:p-8  flex flex-col justify-between">
          <div>
            <h2 className="text-xl sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
              Bereit für eine neue Fahrt?
            </h2>

            <ul className="text-gray-700 space-y-2 mb-6 text-sm sm:text-base">
              <li>✔ Sieh dir die neuesten Modelle an</li>
              <li>✔ Vergleiche Fahrzeuge nebeneinander</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/gebrauchtwagen" passHref>
              <Button as="a">🔍 Gebrauchtwagen suchen</Button>
            </Link>
          </div>
        </div>

        {/* Featured Brand Card */}
        <div className=" p-4 sm:p-5 md:p-6 lg:p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-xl sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
              Vergleiche Fahrzeuge ganz einfach
            </h2>

            <ul className="text-gray-700 space-y-2 mb-6 text-sm sm:text-base">
              <li>✔ Modelle nebeneinander darstellen</li>
              <li>✔ Unterschiede schnell erkennen</li>
            </ul>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link href="/vergleich" passHref>
              <Button
                bgColor="bg-white"
                textColor="text-black"
                className=" border-2 border-black px-4 py-2 rounded-lg transition text-sm sm:text-base"
              >
                Vergleiche Autos ↔
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
