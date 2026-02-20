import Link from "next/link";
import type { Metadata } from "next";
export const metadata: Metadata = {
    title: "Terms of Service - Fynt",
    description: "Fynt Terms of Service",
};
export default function TermsOfService() {
    return (<main className="min-h-screen bg-[#151515] text-white">
      <div className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors mb-12">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Home
        </Link>

        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Terms of Service
        </h1>
        <p className="text-white/50 text-sm mb-16">
          Last updated: February 18, 2026
        </p>

        <div className="space-y-10 text-white/70 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Fynt&apos;s workflow automation platform
              (&ldquo;Service&rdquo;), you agree to be bound by these Terms of
              Service. If you do not agree to these terms, you may not use the
              Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              2. Description of Service
            </h2>
            <p>
              Fynt provides a visual workflow automation platform that allows
              users to create, configure, and execute automated workflows
              connecting various services and APIs. The Service includes workflow
              building tools, execution engines, credential management, and
              related features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              3. Account Registration
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                You must provide accurate and complete information when creating
                an account.
              </li>
              <li>
                You are responsible for maintaining the security of your account
                credentials.
              </li>
              <li>
                You must notify us immediately of any unauthorized use of your
                account.
              </li>
              <li>
                You must be at least 18 years old to create an account and use
                the Service.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              4. Acceptable Use
            </h2>
            <p className="mb-3">You agree not to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Violate any applicable laws, regulations, or third-party rights.
              </li>
              <li>
                Send spam, phishing messages, or other unsolicited
                communications.
              </li>
              <li>
                Distribute malware, viruses, or any other harmful software.
              </li>
              <li>
                Attempt to gain unauthorized access to other users&apos;
                accounts or data.
              </li>
              <li>
                Overload, disrupt, or interfere with the Service or its
                infrastructure.
              </li>
              <li>
                Scrape, crawl, or use automated means to access the Service
                beyond normal API usage.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              5. Intellectual Property
            </h2>
            <p>
              The Service, including its design, features, and content, is owned
              by Fynt and protected by intellectual property laws. You retain
              ownership of the workflows and data you create using the Service.
              By using the Service, you grant us a limited license to process
              your data as necessary to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              6. Third-Party Integrations
            </h2>
            <p>
              The Service allows you to connect with third-party services and
              APIs. Your use of these integrations is subject to the respective
              third party&apos;s terms and policies. Fynt is not responsible
              for the availability, accuracy, or practices of any third-party
              services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              7. Credentials & API Keys
            </h2>
            <p>
              You are responsible for any credentials or API keys you store on
              the platform. While we encrypt and protect stored credentials, you
              should only store credentials with the minimum permissions
              necessary for your workflows. Fynt is not liable for any
              damages resulting from compromised third-party credentials.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              8. Service Availability
            </h2>
            <p>
              We strive to maintain high availability of the Service but do not
              guarantee uninterrupted access. We may perform maintenance,
              updates, or modifications to the Service that could result in
              temporary downtime. We will make reasonable efforts to provide
              advance notice of planned maintenance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              9. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by law, Fynt shall not be
              liable for any indirect, incidental, special, consequential, or
              punitive damages, including loss of profits, data, or business
              opportunities, arising from your use of the Service. Our total
              liability shall not exceed the amount you paid for the Service in
              the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              10. Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your account if you
              violate these Terms. You may terminate your account at any time.
              Upon termination, your right to use the Service will cease, and we
              may delete your data in accordance with our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              11. Changes to Terms
            </h2>
            <p>
              We may modify these Terms at any time. We will notify you of
              material changes by posting updated Terms on this page and updating
              the &ldquo;Last updated&rdquo; date. Continued use of the Service
              after changes constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">
              12. Contact Us
            </h2>
            <p>
              If you have any questions about these Terms, please contact us at{" "}
              <a href="mailto:legal@fynt.com" className="text-[#F04D26] hover:underline">
                legal@fynt.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>);
}
