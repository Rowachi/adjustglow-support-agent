import { Nav } from "@/components/Nav";
import { Hero } from "@/components/Hero";
import { ProofStats } from "@/components/ProofStats";
import { ReviewSync } from "@/components/ReviewSync";
import { HowItWorks } from "@/components/HowItWorks";
import { Services } from "@/components/Services";
import { Impact } from "@/components/Impact";
import { Pricing } from "@/components/Pricing";
import { Faq } from "@/components/Faq";
import { CtaBand } from "@/components/CtaBand";
import { Footer } from "@/components/Footer";
import { ChatWidget } from "@/components/ChatWidget";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ProofStats />
        <ReviewSync />
        <HowItWorks />
        <Services />
        <Impact />
        <Pricing />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
