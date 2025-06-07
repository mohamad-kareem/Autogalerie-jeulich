import Image from "next/image";
import CusReviews from "../../utils/CustomerReview";
import Button from "../helpers/Button";
import Link from "next/link";

export default function Reviews() {
  return (
    <section className="w-full py-8 shadow-even px-2 sm:px-4 lg:px-12 pt-16 mb-25">
      <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1750px] mx-auto">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12">
          <span className="relative inline-block text-[10px] font-semibold uppercase tracking-widest text-red-500 mb-2 pl-6 before:content-[''] before:absolute before:left-0 before:top-1/2 before:w-5 before:h-0.5 before:bg-red-500">
            Kundenstimmen
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-300 mb-3">
            Vertrauen, das <span className="text-red-600">überzeugt</span>
          </h2>
          <p className="text-sm sm:text-base text-gray-700 max-w-xl mx-auto leading-relaxed">
            Unsere Kunden sind begeistert – lesen Sie ihre Erfahrungen.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {CusReviews.map((review, index) => (
            <div
              key={index}
              className={`border-l-4 border-red-500 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-3 sm:p-4 ${review.bg}`}
            >
              {/* Stars */}
              <div className="flex items-center text-yellow-400 mb-2">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="italic text-gray-700 mb-3 sm:mb-4">
                "{review.quote}"
              </blockquote>

              {/* Reviewer Info */}
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-gray-200">
                  <Image
                    src={review.image}
                    alt={review.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {review.name}
                  </h4>
                  <p className="text-xs text-gray-500">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center items-center text-center mt-8 md:mt-12">
          <Button className="px-6 py-2 rounded-xl">
            <Link
              href="https://www.mobile.de/bewertungen/AutogalerieJuelich#1"
              className="text-white font-semibold text-sm"
            >
              Eigene Bewertung hinterlassen
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
