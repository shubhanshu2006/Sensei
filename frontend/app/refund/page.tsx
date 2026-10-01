import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { RotateCcw, CheckCircle, AlertTriangle, Clock, HelpCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Cancellation & Refund Policy | Sensei",
  description: "Learn about the cancellation, return, and refund policies for Sensei interview practice credits.",
};

export default function RefundPolicyPage() {
  const lastUpdated = "September 30, 2026";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-[#fff7f2] via-slate-50 to-slate-50 pt-28 pb-20 px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-pink-500/10 text-orange-950 border border-orange-200/60 text-xs font-semibold uppercase tracking-wider">
              <RotateCcw className="h-3.5 w-3.5 text-orange-500" />
              Customer Protection &amp; Guarantees
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
              Cancellation &amp; Refund Policy
            </h1>
            <p className="text-slate-600 text-sm">
              Last updated: <span className="font-medium text-slate-900">{lastUpdated}</span>
            </p>
          </div>

          <Card className="p-8 sm:p-10 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                1. Overview of Digital Services
              </h2>
              <p>
                At <strong>Sensei</strong> (operated by <strong>Shubhanshu Singh</strong>), we prioritize transparency and candidate satisfaction. All purchases on our platform are for digital mock interview credits, software access, and automated scorecard evaluations. Because our services are delivered instantly in digital format, please review our refund and cancellation terms below.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                2. Refund Eligibility &amp; Timeline
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-orange-50/70 border border-orange-200/80 space-y-2">
                  <div className="flex items-center gap-2 text-orange-900 font-semibold">
                    <CheckCircle className="h-5 w-5 text-orange-500" />
                    Eligible for Full Refund
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Unused credits within <strong>7 days</strong> of purchase.</li>
                    <li>Accidental duplicate payments charged for the same package.</li>
                    <li>Technical failure on our platform that prevented interview completion and could not be recovered.</li>
                  </ul>
                </div>

                <div className="p-5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
                  <div className="flex items-center gap-2 text-amber-800 font-semibold">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                    Non-Refundable Situations
                  </div>
                  <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
                    <li>Credits that have already been consumed to initiate and conduct an interview session.</li>
                    <li>Refund requests submitted after 7 days from the transaction date.</li>
                    <li>Subjective dissatisfaction with scorecard results where the AI evaluation completed normally.</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                3. Order Cancellation Policy
              </h2>
              <p>
                Users may cancel an order at any point prior to final payment authorization on the payment gateway screen. Once payment is authorized and confirmed, practice credits are allotted to your account automatically within seconds. If you made an unintentional purchase and have not used the credits, you may request a cancellation and refund under our 7-day policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                4. Refund Processing Time &amp; Mode
              </h2>
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-sm">
                <div className="flex items-center gap-2 text-slate-900 font-semibold">
                  <Clock className="h-4 w-4 text-orange-500" />
                  Processing Window: 5 to 7 Business Days
                </div>
                <p className="text-slate-600 text-xs sm:text-sm">
                  Once your refund request is verified and approved by our support team, the refund is initiated immediately via our payment partner (<strong>Razorpay</strong>). The refunded amount will be credited directly back to the original source method (Bank Account, UPI, or Credit/Debit Card) within <strong>5–7 business days</strong>, depending on your issuing bank&apos;s settlement cycle.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                5. How to Initiate a Refund
              </h2>
              <p>
                To request a refund or cancellation, please email our support team at:
              </p>
              <div className="p-4 rounded-xl bg-white border-2 border-orange-500/20 text-sm space-y-2">
                <p className="font-semibold text-slate-900">
                  Email: <a href="mailto:shubhanshus450@gmail.com" className="text-orange-600 hover:text-pink-600 transition-colors font-medium underline">shubhanshus450@gmail.com</a>
                </p>
                <p className="text-slate-600 text-xs">
                  Please include:
                </p>
                <ul className="text-xs text-slate-600 list-disc pl-4 space-y-1">
                  <li>Your registered Sensei account email address.</li>
                  <li>The Razorpay Payment ID (e.g. <code>pay_...</code>) or transaction date.</li>
                  <li>A brief explanation of your reason for the refund request.</li>
                </ul>
              </div>
              <p className="text-xs text-slate-500">
                Our support desk reviews all refund inquiries within 24 business hours.
              </p>
            </section>

            {/* Merchant Details */}
            <section className="pt-4 border-t border-slate-200 space-y-2">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                6. Merchant Legal Entity
              </h2>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1">
                <p><strong>Legal Entity:</strong> Sensei (Operated by Shubhanshu Singh)</p>
                <p><strong>Business Category:</strong> Educational Technology / SaaS Platform</p>
                <p><strong>Support Contact:</strong> shubhanshus450@gmail.com</p>
                <p><strong>Operating Region:</strong> India</p>
              </div>
            </section>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
