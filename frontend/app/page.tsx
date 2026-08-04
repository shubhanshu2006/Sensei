import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import BentoGrid from '@/components/BentoGrid';
import Features from '@/components/Features';
import TwoPathways from '@/components/TwoPathways';
import Testimonials from '@/components/Testimonials';
import Pricing from '@/components/Pricing';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden">
        <Hero />
        <div id="platform">
          <BentoGrid />
        </div>
        <div id="features">
          <Features />
        </div>
        <TwoPathways />
        <Testimonials />
        <div id="pricing">
          <Pricing />
        </div>
        <CTA />
      </main>
      <Footer />
    </>
  );
}
