"use client";

import Image from "next/image";

export default function SideAd() {
  return (
    <aside className="w-[250px] overflow-hidden rounded-[18px] shadow-[0_20px_55px_rgba(15,23,42,0.16)]">
      <Image
        src="/jeep-side-ad.png"
        alt="Jeep Compass Angebot – Autogalerie Jülich"
        width={1122}
        height={1802}
        priority
        sizes="250px"
        className="h-auto w-full object-cover"
      />
    </aside>
  );
}
