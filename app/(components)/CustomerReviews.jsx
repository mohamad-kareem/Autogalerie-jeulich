import Image from "next/image";
import CusReviews from "../utils/CustomerReview";
import Button from "./Button";
export default function Reviews() {
  return (
    <section className="max-w-[76rem] mx-auto px-4 sm:px-6 md:px-8 text-center bg-white">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-semibold tracking-widest text-red-500 uppercase mb-3 relative pl-8 before:absolute before:left-0 before:top-1/2 before:w-6 before:h-0.5 before:bg-red-500">
            Kundenstimmen
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Vertrauen, das <span className="text-red-600">überzeugt</span>
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-600 leading-relaxed">
            Lesen Sie, was unsere zufriedenen Kunden über ihre Erfahrungen
            berichten – und werden auch Sie Teil unserer Erfolgsgeschichte.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {CusReviews.map((review, index) => (
            <div
              key={index}
              className={`${review.bg} p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border-l-4 border-red-500`}
            >
              <div className="flex items-center mb-4">
                <div className="text-yellow-400 flex">
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
              </div>
              <blockquote className="text-gray-700 mb-6 italic">
                "{review.quote}"
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-gray-200 mr-4 overflow-hidden">
                  <Image
                    src={review.image}
                    alt={review.name}
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{review.name}</h4>
                  <p className="text-sm text-gray-500">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Button className="px-8 py-3 rounded-2xl">
            Eigene Bewertung hinterlassen
          </Button>
        </div>
      </div>
    </section>
  );
}
