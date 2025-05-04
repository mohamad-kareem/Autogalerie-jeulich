import Image from "next/image";
import CusReviews from "../utils/CustomerReview";

export default function Reviews() {
  return (
    <section className="max-w-[76rem] mx-auto py-16 px-4 sm:px-6 md:px-8 text-center bg-white">
      <h4 className="text-sm tracking-widest text-red-600 uppercase mb-2">
        Unsere Bewertung
      </h4>
      <h2 className="text-3xl sm:text-4xl font-bold mb-4">
        Was sagen unsere Kunden?
      </h2>
      <p className="text-gray-600 mb-12 text-sm sm:text-base">
        Hier sind einige Kommentare von unseren Kunden – werde einer von ihnen!
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
        {CusReviews.map((item, index) => (
          <div
            key={index}
            className="flex flex-col items-center relative h-full transition-transform transform hover:scale-105"
          >
            {/* Comment Box with Arrow */}
            <div
              className={`relative p-5 rounded-lg shadow-md ${item.bg} max-w-sm min-h-[220px]`}
            >
              <p className="text-lg sm:text-xl leading-relaxed italic z-10 relative line-clamp-8">
                &ldquo;{item.quote}&rdquo;
              </p>

              {/* Arrow (attached to box) */}
              <div
                className={`absolute bottom-[-10px] left-1/2 transform -translate-x-1/2 w-0 h-0 
                border-l-[12px] border-r-[12px] border-t-[12px] 
                border-l-transparent border-r-transparent 
                ${
                  item.bg.includes("red")
                    ? "border-t-red-600"
                    : "border-t-gray-100"
                }`}
              />
            </div>

            {/* User Image below arrow */}
            <div className="mt-6">
              <Image
                src={item.image}
                alt={item.name}
                width={60}
                height={60}
                className="rounded-full border-4 border-gray-100 shadow-md"
              />
            </div>

            {/* Name + Role */}
            <div className="mt-4 text-center">
              <p className="font-semibold text-base sm:text-lg">{item.name}</p>
              <p className="text-sm text-gray-500">{item.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
