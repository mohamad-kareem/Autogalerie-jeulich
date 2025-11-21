import Image from "next/image";
import CusReviews from "../../utils/CustomerReview";
import Button from "../helpers/Button";
import Link from "next/link";

export default function Reviews() {
  return (
    <section className="w-full bg-white border-t border-gray-100 py-14 px-4 sm:px-6 lg:px-16">
      <div className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500">
            Kundenstimmen
          </span>
          <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-900">
            Vertrauen unserer Kunden
          </h2>
          <p className="mt-3 max-w-xl mx-auto text-sm sm:text-base text-gray-600 leading-relaxed">
            Echte Erfahrungen, echte Zufriedenheit – lesen Sie, was unsere
            Kunden über uns sagen.
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
          {CusReviews.map((review, index) => (
            <article
              key={index}
              className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
            >
              {/* Stars */}
              <div className="mb-3 flex items-center gap-1 text-gray-700">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="h-4 w-4 fill-gray-800 text-gray-800"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <blockquote className="mb-4 flex-1 text-sm sm:text-base text-gray-700 leading-relaxed">
                “{review.quote}”
              </blockquote>

              {/* Reviewer Info */}
              <div className="mt-2 flex items-center">
                <div className="mr-3 h-10 w-10 overflow-hidden rounded-full bg-gray-200">
                  <Image
                    src={review.image}
                    alt={review.name}
                    width={40}
                    height={40}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {review.name}
                  </h4>
                  <p className="text-xs text-gray-500">{review.role}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* CTA Button */}
        <div className="mt-10 flex items-center justify-center">
          <Link
            href="https://www.mobile.de/bewertungen/AutogalerieJuelich#1"
            className="inline-flex"
          >
            <button className="px-6 py-2 rounded-lg bg-slate-800 text-sm font-medium text-white hover:bg-slate-900 cursor-pointer">
              Eigene Bewertung hinterlassen
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
