import Image from "next/image";
import CusReviews from "../../utils/CustomerReview";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function Reviews() {
  return (
    <section className="w-full bg-[#f5f5f2] py-10 sm:py-14">
      <div className="mx-auto max-w-[1180px] px-3 sm:px-6 lg:px-8">
        {/* HEADER */}
        <div className="mb-8 text-center sm:mb-10">
          <div className="mx-auto mb-3 h-[2px] w-10 bg-[#146c2e] sm:w-12" />

          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#146c2e] sm:text-[10px] sm:tracking-[0.32em]">
            Kundenstimmen
          </p>

          <h2 className="mt-2 text-[28px] font-black leading-[0.95] tracking-[-0.045em] text-[#07111f] sm:text-[38px] lg:text-[44px]">
            Vertrauen unserer Kunden
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-[13px] font-semibold leading-6 text-[#263126] sm:text-[14px] sm:leading-7">
            Lesen Sie echte Erfahrungen – direkt von Kunden, die unsere
            Dienstleistung getestet haben.
          </p>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {CusReviews.map((review, index) => (
            <div
              key={index}
              className="group flex h-full flex-col rounded-[20px] border border-white/70 bg-white p-5 shadow-xl shadow-black/10 transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl sm:p-6"
            >
              {/* STARS */}
              <div className="mb-3 flex items-center gap-1 text-[#146c2e]">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="h-4 w-4 fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* QUOTE */}
              <blockquote className="mb-4 border-l-[3px] border-[#146c2e] pl-4 text-[13px] font-semibold leading-6 text-[#263126] sm:text-sm">
                „{review.quote}"
              </blockquote>

              {/* USER INFO */}
              <div className="mt-auto flex items-center border-t border-black/5 pt-4">
                <div className="mr-3 h-11 w-11 overflow-hidden rounded-full border border-black/10 shadow-sm">
                  <Image
                    src={review.image}
                    alt={review.name}
                    width={44}
                    height={44}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                </div>

                <div>
                  <p className="text-sm font-black text-[#101510]">
                    {review.name}
                  </p>
                  <p className="text-xs font-semibold text-gray-500">
                    {review.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA BUTTON */}
        <div className="mt-8 flex justify-center sm:mt-10">
          <Link
            href="https://www.mobile.de/bewertungen/AutogalerieJuelich#1"
            className="inline-flex items-center gap-2 rounded-xl bg-[#146c2e] px-5 py-3 text-xs font-black text-white shadow-lg shadow-green-900/20 transition hover:bg-[#0f5724] sm:text-sm"
          >
            Eigene Bewertung hinterlassen
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
