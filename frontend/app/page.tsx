import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import BentoGrid from '@/components/BentoGrid';
import Testimonials from '@/components/Testimonials';
import Pricing from '@/components/Pricing';
import CTA from '@/components/CTA';
import Footer from '@/components/Footer';

export default async function Home() {
  const { userId, sessionClaims } = await auth();
  if (userId) {
    const claims = sessionClaims as any;
    const role =
      claims?.role ||
      claims?.publicMetadata?.role ||
      claims?.public_metadata?.role;
    const roleUpper = typeof role === 'string' ? role.toUpperCase() : '';
    if (roleUpper === 'PLATFORM_ADMIN' || roleUpper === 'ADMIN' || roleUpper === 'SUPER_ADMIN') {
      redirect('/admin/dashboard');
    }
    redirect('/candidate/dashboard');
  }

  return (
    <>
      <Navbar />
      <main className="overflow-x-hidden">
        <Hero />
        <div id="platform">
          <BentoGrid />
        </div>
        <div id="testimonials">
          <Testimonials />
        </div>
        <div id="pricing">
          <Pricing />
        </div>
        <CTA />
      </main>
      <Footer />
    </>
  );
}
