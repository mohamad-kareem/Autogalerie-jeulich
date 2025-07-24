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
import AdPromotion from "../helpers/AdPromotion";
const Complete = () => {
  return (
    <main className="relative bg-black text-white">
      {/*  Grid SVG in the background */}
      <HeroSection />
      <DiscountPopup />
      <AdPromotion />
      <LandingChoices />
      <RandomCarSlider />
      <Rating />
      <LandingSlide />
      <WhyUs />
      <SellCarYourWay />
      <Reviews />
      <Footbar />
    </main>
  );
};

export default Complete;
