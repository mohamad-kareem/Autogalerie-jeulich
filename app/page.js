import NavBar from "./(components)/NavBar";
import VideoSection from "./(components)/VideoSection";
import HeroSection from "./(components)/Hero";
import SellCarYourWay from "./(components)/SellCarYourWay";
import LandingChoices from "./(components)/LandingChoices";
import Footbar from "./(components)/Footbar";
import LandingSlide from "./(components)/LandingSlide";
import WhyUs from "./(components)/WhyUs";
import Rating from "./(components)/Rating";
import Reviews from "./(components)/CustomerReviews";
export default function Home() {
  return (
    <div>
      <NavBar />
      <main className="pt-16">
        <HeroSection />
        <LandingChoices />
        <LandingSlide />
        <Rating />
        <WhyUs />
        <SellCarYourWay />

        <Reviews />
        <Footbar />
      </main>
    </div>
  );
}
