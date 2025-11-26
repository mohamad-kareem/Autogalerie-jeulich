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
import DiscountPopup from "./popup.jsx"; // Import the popup component
import ConsentBanner from "../helpers/ConsentBanner"; // adjust path if needed
import OpelPremiumAd from "../helpers/Ad2";
const Complete = () => {
  return (
    <main className="relative bg-black text-white">
      {/*  Grid SVG in the background */}
      <HeroSection />
      <Rating />
      <Reviews />
      <OpelPremiumAd />
      <LandingChoices />
      <RandomCarSlider />
      <LandingSlide />
      <WhyUs />
      <SellCarYourWay />
      <Footbar />
      <ConsentBanner />
    </main>
  );
};

export default Complete;
