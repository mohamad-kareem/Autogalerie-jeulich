"use client";

const WORDS = [
  "TÜV",
  "Finanzierung",
  "Mercedes",
  "Ford",
  "Fiat",
  "BMW",
  "Audi",
  "Volkswagen",
  "Ankauf",
  "Verkauf",
  "Garantie",
  "Zulassung",
  "Service",
  "Probefahrt",
];

export default function MovingWords() {
  return (
    <section className="w-full overflow-hidden bg-[#f5f5f2] py-5 sm:py-7">
      <style jsx>{`
        @keyframes marqueeMove {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(-50%);
          }
        }

        .marquee-track {
          animation: marqueeMove 32s linear infinite;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }
      `}</style>

      <div className="relative overflow-hidden bg-[#fff0e2] py-4 sm:py-5">
        <div className="marquee-track flex w-max items-center whitespace-nowrap">
          {[...WORDS, ...WORDS, ...WORDS].map((word, index) => (
            <div
              key={index}
              className="flex items-center text-[11px] font-medium uppercase tracking-[0.24em] text-[#101510]/60 sm:text-xs"
            >
              <span>{word}</span>

              <span className="mx-7 text-[#d97706]/50 sm:mx-9">•</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
