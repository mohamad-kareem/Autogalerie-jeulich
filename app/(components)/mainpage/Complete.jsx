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
import GridBackground from "../helpers/Grid"; // Adjust path if needed
import RandomCarSlider from "./RandomCarSlider";

const Complete = () => {
  return (
    <main className="relative bg-black text-white">
      <GridBackground /> {/* ⬅️ Grid SVG in the background */}
      <HeroSection />
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
