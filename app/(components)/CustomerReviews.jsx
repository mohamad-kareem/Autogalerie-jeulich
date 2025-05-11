import Image from "next/image";
import CusReviews from "../utils/CustomerReview";
import Button from "./Button";
import Link from "next/link";

export default function Reviews() {
  return (
    <section className="w-full bg-white py-12 shadow-even mb-8 px-4 sm:px-6 lg:px-16">
      <div className="max-w-[76rem] mx-auto">
        {/* Header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="relative inline-block text-xs font-semibold uppercase tracking-widest text-red-500 mb-3 pl-8 before:content-[''] before:absolute before:left-0 before:top-1/2 before:w-6 before:h-0.5 before:bg-red-500">
            Kundenstimmen
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Vertrauen, das <span className="text-red-600">überzeugt</span>
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Lesen Sie, was unsere zufriedenen Kunden über ihre Erfahrungen
            berichten – und werden auch Sie Teil unserer Erfolgsgeschichte.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {CusReviews.map((review, index) => (
            <div
              key={index}
              className={`border-l-4 border-red-500 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-4 sm:p-6 ${review.bg}`}
            >
              {/* Stars */}
              <div className="flex items-center text-yellow-400 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="italic text-gray-700 mb-4 sm:mb-6">
                "{review.quote}"
              </blockquote>

              {/* Reviewer Info */}
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full overflow-hidden mr-4 bg-gray-200">
                  <Image
                    src={review.image}
                    alt={review.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">
                    {review.name}
                  </h4>
                  <p className="text-sm text-gray-500">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Button */}
        <div className="flex justify-center items-centertext-center mt-12 md:mt-16">
          <Button className="px-8 py-3 rounded-2xl">
            <Link
              href="https://www.mobile.de/bewertungen/AutogalerieJuelich#1"
              className="text-white font-semibold"
            >
              Eigene Bewertung hinterlassen
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
