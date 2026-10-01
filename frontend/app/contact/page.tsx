import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Mail, MapPin, Clock, Building2, MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Contact Us | Sensei",
  description: "Contact the Sensei team for customer support, inquiries, billing questions, or feedback.",
};

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-[#fff7f2] via-slate-50 to-slate-50 pt-28 pb-20 px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-pink-500/10 text-orange-950 border border-orange-200/60 text-xs font-semibold uppercase tracking-wider">
              <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
              Customer Support &amp; Inquiries
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
              Contact Us
            </h1>
            <p className="text-slate-600 text-sm sm:text-base max-w-xl">
              Have questions about your credits, interview sessions, technical queries, or refunds? Our support team is here to help.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Merchant Details Card */}
            <Card className="p-8 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-6">
              <h2 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-5 w-5 text-orange-500" />
                Merchant &amp; Legal Details
              </h2>

              <div className="space-y-4 text-sm">
                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Legal Business Name
                  </span>
                  <p className="font-semibold text-slate-800 text-base">
                    Sensei (Operated by Shubhanshu Singh)
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Business Category
                  </span>
                  <p className="text-slate-700">
                    Educational Technology (EdTech) / Software as a Service (SaaS)
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Operational Address
                  </span>
                  <p className="text-slate-700 flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>India</span>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Primary Email
                  </span>
                  <p className="text-slate-700 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-orange-500 shrink-0" />
                    <a
                      href="mailto:shubhanshus450@gmail.com"
                      className="text-orange-600 hover:text-pink-600 font-medium transition-colors hover:underline"
                    >
                      shubhanshus450@gmail.com
                    </a>
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Operating Hours
                  </span>
                  <p className="text-slate-700 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                    Monday – Saturday: 9:00 AM – 6:00 PM IST
                  </p>
                </div>
              </div>
            </Card>

            {/* Quick Inquiries / Help Card */}
            <Card className="p-8 bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <h2 className="font-serif text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-pink-500" />
                  Support Assistance
                </h2>

                <p className="text-sm text-slate-600 leading-relaxed">
                  For account assistance, refund requests, or payment issues, please drop us an email with your transaction ID. We aim to reply to all queries within <strong>24 business hours</strong>.
                </p>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                  <p className="font-semibold text-slate-800">
                    When emailing support, please include:
                  </p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Your registered email address</li>
                    <li>Payment / Razorpay Transaction ID (if applicable)</li>
                    <li>A brief description or screenshot of the issue</li>
                  </ul>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <a
                  href="mailto:shubhanshus450@gmail.com"
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:opacity-95 text-white font-medium text-sm transition-all shadow-md shadow-orange-500/20"
                >
                  <Mail className="h-4 w-4" />
                  Send an Email
                </a>
              </div>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
