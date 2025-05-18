import React from "react";

import VideoSection from "../VideoSection";
import HeroSection from "../Hero";
import SellCarYourWay from "../SellCarYourWay";
import LandingChoices from "../LandingChoices";
import Footbar from "../Footbar";
import LandingSlide from "../LandingSlide";
import WhyUs from "../WhyUs";
import Rating from "../Rating";
import Reviews from "../CustomerReviews";
const Complete = () => {
  return (
    <main className="relative">
      {/* Background SVG */}
      <div className="absolute inset-0 opacity-10 -z-10">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48cGF0aCBkPSJNNDAgMEwwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvc3ZnPg==')] bg-repeat"></div>
      </div>

      {/* Page Content */}
      <HeroSection />
      <LandingChoices />
      <LandingSlide />
      <Rating />
      <WhyUs />
      <SellCarYourWay />
      <Reviews />
      <Footbar />
    </main>
  );
};

export default Complete;
