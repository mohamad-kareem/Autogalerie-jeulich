import Button from "./Button";
export default function VideoSection() {
  return (
    <section className="max-w-[76rem] mx-auto bg-white text-black py-10 px-4 sm:px-6 md:px-8 mb-8 shadow-even">
      <div className="max-w-[76rem] mx-auto mt-10 flex flex-col md:flex-row items-center justify-between gap-8 ">
        {/* Text and Button */}
        <div className="md:w-1/2 space-y-4 text-center md:text-left">
          <h2 className="text-3xl sm:text-4xl lg:text-3xl font-bold text-black">
            Entdecken Sie Autogalerie Jülich
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Ihr Traumauto wartet schon auf Sie – geprüfte Qualität und
            topaktuelle Modelle.
          </p>
          <div className="flex justify-center md:justify-self-start">
            <Button>Jetzt entdecken</Button>
          </div>
        </div>

        {/* Video */}
        <div className="md:w-1/2 w-full">
          <div
            className="relative overflow-hidden w-full border-2 border-black "
            style={{ aspectRatio: "16 / 9" }}
          >
            <iframe
              src="https://share.synthesia.io/embeds/videos/09e50cb5-fc03-4938-a8b0-5a3e562eabad"
              loading="lazy"
              title="Synthesia video player - Entdecken Sie Autogalerie Jülich: Ihr Auto wartet auf Sie"
              allowFullScreen
              allow="encrypted-media; fullscreen"
              className="absolute top-0 left-0 w-full h-full "
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
