import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = {
    title: "Privacy Policy - Fynt",
    description: "Fynt Privacy Policy",
};
export default function PrivacyPolicy() {
    return (<main className="min-h-screen bg-[#151515] text-white">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-12">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-white/50 text-sm mb-16">
          Last updated: February 18, 2026
        </p>

        <div className="space-y-10 text-white/70 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              1. Introduction
            </h2>
            <p>
              Welcome to Fynt. We respect your privacy and are committed to
              protecting your personal data. This Privacy Policy explains how we
              collect, use, disclose, and safeguard your information when you use
              our workflow automation platform and related services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              2. Information We Collect
            </h2>
            <p className="mb-3">
              We may collect the following types of information:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white/90">Account Information:</strong>{" "}
                Name, email address, and password when you create an account.
              </li>
              <li>
                <strong className="text-white/90">Usage Data:</strong>{" "}
                Information about how you interact with our platform, including
                workflows created, execution history, and feature usage.
              </li>
              <li>
                <strong className="text-white/90">Workflow Data:</strong> The
                content and configuration of workflows you create, including any
                credentials or API keys you store for integrations.
              </li>
              <li>
                <strong className="text-white/90">Technical Data:</strong> IP
                address, browser type, device information, and operating system.
              </li>
              <li>
                <strong className="text-white/90">Cookies:</strong> We use
                cookies and similar tracking technologies to maintain your
                session and improve your experience.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              3. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide, operate, and maintain our platform.</li>
              <li>To authenticate your identity and manage your account.</li>
              <li>
                To execute your workflows and process integrations on your
                behalf.
              </li>
              <li>
                To improve and personalize your experience on our platform.
              </li>
              <li>
                To communicate with you about updates, security alerts, and
                support.
              </li>
              <li>To detect, prevent, and address technical issues or abuse.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              4. Data Sharing & Third Parties
            </h2>
            <p className="mb-3">
              We do not sell your personal data. We may share information with
              third parties only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white/90">Service Providers:</strong>{" "}
                Trusted partners who help us operate our platform (e.g., cloud
                hosting, analytics).
              </li>
              <li>
                <strong className="text-white/90">Integrations:</strong> When
                you connect third-party services to your workflows, data is
                shared as necessary to execute those integrations.
              </li>
              <li>
                <strong className="text-white/90">Legal Requirements:</strong>{" "}
                When required by law, regulation, or legal process.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              5. Data Security
            </h2>
            <p>
              We implement industry-standard security measures to protect your
              data, including encryption in transit and at rest. Credentials and
              API keys stored on our platform are encrypted. However, no method
              of transmission over the Internet is 100% secure, and we cannot
              guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              6. Data Retention
            </h2>
            <p>
              We retain your personal data for as long as your account is active
              or as needed to provide you services. You may request deletion of
              your account and associated data at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              7. Your Rights
            </h2>
            <p className="mb-3">
              Depending on your jurisdiction, you may have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access and receive a copy of your personal data.</li>
              <li>Rectify inaccurate or incomplete data.</li>
              <li>Request deletion of your personal data.</li>
              <li>Object to or restrict processing of your data.</li>
              <li>Data portability.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              8. Cookies
            </h2>
            <p>
              We use essential cookies to maintain your authentication session
              and preferences. We may also use analytics cookies to understand
              how our platform is used. You can manage cookie preferences through
              your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              9. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by posting the updated policy on
              this page and updating the &ldquo;Last updated&rdquo; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              10. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at{" "}
              <a href="mailto:privacy@fynt.com" className="text-[#F04D26] hover:underline">
                privacy@fynt.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>);
}
