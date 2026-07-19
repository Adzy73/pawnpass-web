import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import PhoneShowcase from "@/components/PhoneShowcase";
import HowItWorks from "@/components/HowItWorks";
import PrivacyPromise from "@/components/PrivacyPromise";
import LockerSection from "@/components/LockerSection";
import RateCard from "@/components/RateCard";
import TrustSection from "@/components/TrustSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="flex-1">
      <Navbar />
      <Hero />
      <PhoneShowcase />
      <PrivacyPromise />
      <HowItWorks />
      <LockerSection />
      <RateCard />
      <TrustSection />
      <Footer />
    </main>
  );
}
