import React from "react";
import VideoSection from "./VideoSection";
import HeroSection from "./Hero";
import SellCarYourWay from "./SellCarYourWay";
import LandingChoices from "./LandingChoices";
import Footbar from "./Footbar";
import LandingSlide from "./LandingSlide";
import WhyUs from "./WhyUs";
import Rating from "./Rating";
import Reviews from "./CustomerReviews";
import GridBackground from "../helpers/Grid";
import RandomCarSlider from "./RandomCarSlider";
import DiscountPopup from "./popup.jsx";
import ConsentBanner from "../helpers/ConsentBanner";
import MovingWords from "./movingwords";
import SideAd from "../helpers/SideAd";

const Complete = () => {
  return (
    <main className="relative bg-black text-white">
      <div className="relative">
        {/* Independent left-side advertisement */}
        <div
          className="
            absolute
            top-5
            z-20
            hidden
            min-[1680px]:block
          "
          style={{
            right: "calc(50% - 590px - 270px)",
          }}
        >
          <SideAd />
        </div>

        {/* Your original Hero is unchanged */}
        <HeroSection />
      </div>

      <MovingWords />
      <Rating />
      <ConsentBanner />
      <LandingChoices />
      <RandomCarSlider />
      <SellCarYourWay />
      <Footbar />
    </main>
  );
};

export default Complete;
