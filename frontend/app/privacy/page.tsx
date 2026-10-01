import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { ShieldCheck, Lock, Eye, Server, RefreshCw, Mail } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Sensei",
  description: "Read how Sensei protects your personal data, audio recordings, and payment information.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "September 30, 2026";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-b from-[#fff7f2] via-slate-50 to-slate-50 pt-28 pb-20 px-6 sm:px-8 lg:px-12">
        <div className="max-w-4xl mx-auto space-y-10">
          {/* Header */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500/10 via-rose-500/10 to-pink-500/10 text-orange-950 border border-orange-200/60 text-xs font-semibold uppercase tracking-wider">
              <ShieldCheck className="h-3.5 w-3.5 text-orange-500" />
              Data Protection &amp; Trust
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-slate-600 text-sm">
              Last updated: <span className="font-medium text-slate-900">{lastUpdated}</span>
            </p>
          </div>

          <Card className="p-8 sm:p-10 bg-white border border-slate-200 shadow-sm rounded-2xl space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
            {/* Overview */}
            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                1. Introduction
              </h2>
              <p>
                Sensei (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), operated by <strong>Shubhanshu Singh</strong>, is committed to safeguarding your privacy. This Privacy Policy details how we collect, process, disclose, and protect personal and interview information when you access our platform at <strong>Sensei</strong> (&ldquo;Service&rdquo;).
              </p>
              <p>
                By accessing or using our Service, you consent to the practices described in this Privacy Policy. If you do not agree with this policy, please refrain from using the platform.
              </p>
            </section>

            {/* Information Collected */}
            <section className="space-y-4">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                2. Information We Collect
              </h2>
              <div className="space-y-3">
                <p>We collect only the information necessary to provide and refine our interview simulation services:</p>
                <ul className="list-disc pl-5 space-y-2 text-slate-600">
                  <li>
                    <strong className="text-slate-900">Account Credentials:</strong> Name, email address, and profile picture collected securely through our authentication provider (Clerk).
                  </li>
                  <li>
                    <strong className="text-slate-900">Interview Interactions & Audio:</strong> Audio recordings, transcripts, and code snippets generated during technical interview sessions to produce your instant evaluation scorecards.
                  </li>
                  <li>
                    <strong className="text-slate-900">Transaction & Payment Data:</strong> When purchasing interview credit packages, payments are processed securely through certified payment aggregators (<strong>Razorpay Software Private Limited</strong>). <em>We do not store your credit/debit card numbers, CVVs, or UPI PINs on our servers.</em> Razorpay securely processes this data under PCI-DSS compliance. We only receive payment confirmation IDs and credit allotment details.
                  </li>
                  <li>
                    <strong className="text-slate-900">Technical Device Data:</strong> IP address, browser type, and operating system collected for security, anti-abuse, and diagnostic purposes.
                  </li>
                </ul>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                3. How We Use Your Information
              </h2>
              <p>Your information is utilized strictly to:</p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li>Deliver real-time AI interview questions and evaluate performance metrics.</li>
                <li>Process payment transactions and accurately credit practice packages to your account.</li>
                <li>Maintain your historical scorecards and preparation progress over time.</li>
                <li>Prevent unauthorized account access, fraudulent transactions, or abuse of free trials.</li>
                <li>Provide prompt customer service and technical support.</li>
              </ul>
            </section>

            {/* Third-Party Service Providers */}
            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                4. Third-Party Service Providers
              </h2>
              <p>
                We do not sell, rent, or trade your personal data. We collaborate with trusted enterprise-grade infrastructure providers under strict confidentiality agreements:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-slate-600">
                <li><strong>Razorpay:</strong> Payment processing, fraud prevention, and transaction verification.</li>
                <li><strong>Clerk:</strong> User authentication and identity security.</li>
                <li><strong>Amazon Web Services (AWS S3):</strong> Encrypted cloud storage for session assets and scorecard data.</li>
                <li><strong>AI Inference Providers (Google / Groq):</strong> Processing interview context to generate realistic dialogue and evaluate technical correctness.</li>
              </ul>
            </section>

            {/* Data Retention & Security */}
            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                5. Data Security & Storage
              </h2>
              <p>
                We employ industry-standard 256-bit SSL/TLS encryption for all data transmitted between your browser and our servers. Access to interview logs and account records is restricted strictly to authorized administrative operations. While no system is impenetrable, we routinely update our security controls to prevent unauthorized access.
              </p>
            </section>

            {/* User Rights */}
            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                6. Your Privacy Rights
              </h2>
              <p>
                You retain complete control over your personal data. You have the right to request access to, rectification of, or permanent deletion of your account and interview history. To exercise any of these rights, contact us at <a href="mailto:shubhanshus450@gmail.com" className="text-orange-600 hover:text-pink-600 transition-colors font-medium underline">shubhanshus450@gmail.com</a>.
              </p>
            </section>

            {/* Policy Updates */}
            <section className="space-y-3">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                7. Changes to this Policy
              </h2>
              <p>
                We may modify this policy periodically to reflect operational, legal, or regulatory updates. Any changes will be posted with an updated &ldquo;Last updated&rdquo; timestamp at the top of this page.
              </p>
            </section>

            {/* Contact Information */}
            <section className="pt-4 border-t border-slate-200 space-y-2">
              <h2 className="font-serif text-2xl font-bold text-slate-900">
                8. Contact Our Privacy Officer
              </h2>
              <p>
                If you have questions regarding this Privacy Policy or your data, reach out directly:
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1">
                <p><strong>Legal Entity:</strong> Sensei (Operated by Shubhanshu Singh)</p>
                <p><strong>Business Category:</strong> Educational Technology / Software as a Service</p>
                <p><strong>Email:</strong> <a href="mailto:shubhanshus450@gmail.com" className="text-orange-600 hover:text-pink-600 transition-colors font-medium hover:underline">shubhanshus450@gmail.com</a></p>
                <p><strong>Location:</strong> India</p>
              </div>
            </section>
          </Card>
        </div>
      </main>
      <Footer />
    </>
  );
}
