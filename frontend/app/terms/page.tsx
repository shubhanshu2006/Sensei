import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { FileText, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions | Sensei",
  description: "Review the terms and conditions governing the use of Sensei interview practice platform.",
};

export default function TermsPage() {
  const lastUpdated = "September 30, 2026";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-[#fff7f2] via-slate-50 to-slate-50 pt-28 pb-20 px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-pink-500/10 text-orange-950 border border-orange-200/60 text-xs font-semibold uppercase tracking-wider">
              <FileText className="h-3.5 w-3.5 text-orange-500" />
              Legal Agreement
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
              Terms &amp; Conditions
            </h1>
            <p className="text-slate-600 text-sm">
              Last updated: <span className="font-medium text-slate-900">{lastUpdated}</span>
            </p>
          </div>

          <Card className="p-8 sm:p-10 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                1. Agreement to Terms
              </h2>
              <p>
                These Terms and Conditions constitute a legally binding agreement made between you (&ldquo;User&rdquo; or &ldquo;Candidate&rdquo;) and <strong>Sensei</strong>, operated by <strong>Shubhanshu Singh</strong> (&ldquo;Company&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), concerning your access to and use of the Sensei web application and digital interview simulation services.
              </p>
              <p>
                By creating an account or purchasing practice interview credits, you agree that you have read, understood, and agree to be bound by all of these Terms and Conditions. If you do not agree, you are expressly prohibited from using the platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                2. Business Category &amp; Nature of Services
              </h2>
              <p>
                Sensei operates within the <strong>Educational Technology (EdTech) / Software as a Service (SaaS)</strong> category. We provide users with digital AI-powered mock interview practice, technical evaluation feedback, and interview scorecard analytics. <em>All services and credit packages provided are 100% digital goods and software services. No physical products are manufactured, handled, or shipped.</em>
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                3. User Accounts &amp; Eligibility
              </h2>
              <p>
                To access interview practice sessions, you must register an account using authentic identity details. You are responsible for safeguarding your login credentials. You may not share accounts or resell practice credits to third parties. We reserve the right to suspend or terminate accounts engaging in abusive conduct, reverse engineering, or fraudulent activity.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                4. Practice Credits &amp; Payments
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>
                  <strong className="text-slate-900">Pricing:</strong> Credit packages are clearly listed in Indian National Rupees (INR) on our pricing page and checkout dialogs. All pricing is inclusive of applicable digital taxes unless stated otherwise.
                </li>
                <li>
                  <strong className="text-slate-900">Delivery of Credits:</strong> Upon successful transaction authorization by our payment gateway (Razorpay), purchased credits are allotted digitally and instantly to your active profile.
                </li>
                <li>
                  <strong className="text-slate-900">Credit Expiry:</strong> Purchased practice credits do not expire and remain associated with your profile until consumed during interview sessions.
                </li>
                <li>
                  <strong className="text-slate-900">Non-Transferability:</strong> Credits are tied exclusively to your registered account and cannot be transferred, exchanged for cash, or assigned to another individual.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                5. Intellectual Property Rights
              </h2>
              <p>
                The Sensei platform, including its source code, audio evaluation algorithms, user interfaces, branding, and proprietary rubric models, is the intellectual property of Sensei and its operator. You are granted a limited, non-exclusive, non-transferable license to utilize the platform for personal technical interview preparation.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                6. Disclaimer &amp; Limitations of Liability
              </h2>
              <p>
                Sensei provides mock interview simulations for educational and self-improvement purposes only. While our questions and rubrics are benchmarked against industry standards, we do not guarantee job offers, hiring outcomes, or employment with any particular organization. In no event shall Sensei or its operator be liable for any indirect, consequential, or punitive damages arising from the use of the platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                7. Governing Law &amp; Dispute Resolution
              </h2>
              <p>
                These Terms shall be governed and construed in accordance with the laws of <strong>India</strong>. Any legal action or dispute arising in connection with these terms shall be subject to the exclusive jurisdiction of the competent courts in India.
              </p>
            </section>

            <section className="pt-4 border-t border-slate-200 space-y-2">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                8. Contact Information
              </h2>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1">
                <p><strong>Legal Entity:</strong> Sensei (Operated by Shubhanshu Singh)</p>
                <p><strong>Inquiries &amp; Support:</strong> <a href="mailto:shubhanshus450@gmail.com" className="text-orange-600 hover:text-pink-600 transition-colors font-medium hover:underline">shubhanshus450@gmail.com</a></p>
                <p><strong>Country:</strong> India</p>
              </div>
            </section>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
