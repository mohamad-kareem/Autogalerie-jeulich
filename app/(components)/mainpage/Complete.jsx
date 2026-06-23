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
import FloatingContact from "../helpers/FloatingContact";
import AdvertisementVideo from "./AdvertisementVideo";
const Complete = () => {
  return (
    <main className="relative bg-black text-white">
      <div className="relative">
        <div
          className="
            absolute
            top-5
            z-20
            hidden
            min-[1680px]:block
          "
          style={{
            left: "calc(50% - 590px - 270px)",
          }}
        >
          <SideAd />
        </div>

        <HeroSection />
      </div>

      <MovingWords />
      <Rating />
      <ConsentBanner />
      <AdvertisementVideo />
      <LandingChoices />
      <RandomCarSlider />
      <SellCarYourWay />
      <Footbar />

      {/* Floating contact widget */}
      <FloatingContact />
    </main>
  );
};

export default Complete;
