import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Truck, Zap, Laptop, Clock, ShieldCheck, Mail } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Shipping & Delivery Policy | Sensei",
  description: "Learn about the instant digital delivery and fulfillment terms for Sensei interview credits.",
};

export default function ShippingPolicyPage() {
  const lastUpdated = "September 30, 2026";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-[#fff7f2] via-slate-50 to-slate-50 pt-28 pb-20 px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-pink-500/10 text-orange-950 border border-orange-200/60 text-xs font-semibold uppercase tracking-wider">
              <Truck className="h-3.5 w-3.5 text-orange-500" />
              Digital Fulfillment &amp; Service Delivery
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
              Shipping &amp; Delivery Policy
            </h1>
            <p className="text-slate-600 text-sm">
              Last updated: <span className="font-medium text-slate-900">{lastUpdated}</span>
            </p>
          </div>

          <Card className="p-8 sm:p-10 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                1. Digital Services Declaration
              </h2>
              <div className="p-5 rounded-xl bg-orange-50/70 border border-orange-200/80 flex items-start gap-4">
                <Laptop className="h-6 w-6 text-orange-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-semibold text-orange-950">
                    100% Digital Delivery — No Physical Shipments
                  </p>
                  <p className="text-orange-950/80">
                    <strong>Sensei</strong> (operated by <strong>Shubhanshu Singh</strong>) provides purely electronic software-as-a-service (SaaS) and educational interview preparation tools. <strong>No tangible or physical goods are shipped or handled through courier partners.</strong>
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                2. Method of Delivery &amp; Turnaround Time
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                    <Zap className="h-4 w-4 text-orange-500" />
                    Delivery Timeline: Instant (Within Seconds)
                  </div>
                  <p className="text-xs text-slate-600">
                    All practice interview credit packages are fulfilled <strong>immediately</strong> upon successful confirmation of payment by Razorpay. Your candidate account balance will reflect the new credits in real time without any delay.
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center gap-2 text-slate-900 font-semibold text-sm">
                    <Clock className="h-4 w-4 text-pink-500" />
                    24/7 Unrestricted Availability
                  </div>
                  <p className="text-xs text-slate-600">
                    Because delivery is fully automated via cloud infrastructure, interview sessions and credits can be purchased and accessed 24 hours a day, 7 days a week, 365 days a year from anywhere in the world.
                  </p>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                3. Delivery Confirmation &amp; Receipts
              </h2>
              <p>Upon transaction completion:</p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>You will receive an on-screen confirmation and instant balance refresh on your Candidate Dashboard.</li>
                <li>An official digital payment receipt containing the payment ID and order details is provided via Razorpay and sent to your registered email address.</li>
                <li>Your interview history, remaining credits, and scorecard analytics remain permanently accessible within your private candidate portal.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                4. Resolution for Non-Delivery / Network Latency
              </h2>
              <p>
                In rare instances of banking network delay or temporary connectivity drops where your bank account is debited but your credits do not update immediately:
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-2">
                <p className="font-medium text-slate-800">
                  Please email our support team with your payment transaction ID:
                </p>
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:shubhanshus450@gmail.com" className="text-orange-600 hover:text-pink-600 transition-colors font-medium underline">
                    shubhanshus450@gmail.com
                  </a>
                </p>
                <p className="text-xs text-slate-500">
                  Our system verifies all pending transactions directly with Razorpay, and any missing credits are manually synchronized within <strong>1 to 4 hours</strong> of reporting.
                </p>
              </div>
            </section>

            <section className="pt-4 border-t border-slate-200 space-y-2">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                5. Merchant Identification
              </h2>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1">
                <p><strong>Legal Entity Name:</strong> Sensei (Operated by Shubhanshu Singh)</p>
                <p><strong>Nature of Business:</strong> Educational Technology / SaaS Digital Products</p>
                <p><strong>Support Contact:</strong> shubhanshus450@gmail.com</p>
                <p><strong>Jurisdiction:</strong> India</p>
              </div>
            </section>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
