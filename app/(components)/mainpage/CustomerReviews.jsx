import Image from "next/image";
import CusReviews from "../../utils/CustomerReview";
import Link from "next/link";

export default function Reviews() {
  return (
    <section className="relative w-full py-16 px-4 sm:px-6 lg:px-12 bg-white overflow-hidden">
      {/* THEME GLOWS (same colors as Login/Forgot/Reset) */}
      <div className="absolute top-0 left-1/3 w-72 h-72 bg-blue-500/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-sky-400/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto">
        {/* HEADER */}
        <div className="text-center mb-12">
          <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
            Kundenstimmen
          </span>

          <h2 className="mt-3 text-3xl sm:text-4xl md:text-5xl font-bold text-slate-600 tracking-tight">
            Vertrauen unserer Kunden
          </h2>

          <p className="mt-4 text-sm sm:text-base max-w-xl mx-auto text-slate-600 leading-relaxed">
            Lesen Sie echte Erfahrungen – direkt von Kunden, die unsere
            Dienstleistung getestet haben.
          </p>
        </div>

        {/* GRID — NEW BLUE THEME DESIGN */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
          {CusReviews.map((review, index) => (
            <div
              key={index}
              className="group flex flex-col h-full rounded-2xl border border-slate-200 bg-white shadow-[0_4px_30px_rgba(0,0,0,0.04)] backdrop-blur-sm p-6 transition-all duration-200 hover:shadow-[0_6px_35px_rgba(0,0,0,0.08)] hover:-translate-y-1"
            >
              {/* STARS */}
              <div className="flex items-center gap-1 mb-3">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-4 h-4 fill-blue-600"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* QUOTE */}
              <blockquote className="text-sm sm:text-base text-slate-700 leading-relaxed mb-4 border-l-4 border-blue-500/70 pl-4 italic">
                “{review.quote}”
              </blockquote>

              {/* USER INFO */}
              <div className="mt-auto flex items-center">
                <div className="mr-3 h-11 w-11 rounded-full overflow-hidden border border-slate-200 shadow-sm">
                  <Image
                    src={review.image}
                    alt={review.name}
                    width={44}
                    height={44}
                    className="object-cover w-full h-full"
                    unoptimized
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {review.name}
                  </p>
                  <p className="text-xs text-slate-500">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA BUTTON – BLUE THEME */}
        <div className="flex justify-center mt-12">
          <Link
            href="https://www.mobile.de/bewertungen/AutogalerieJuelich#1"
            className="inline-flex"
          >
            <button className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-slate-800 to-slate-600 text-white text-sm font-medium shadow-md hover:opacity-90 transition">
              Eigene Bewertung hinterlassen
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
