"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronLeft, Download, FileText, Shield } from "lucide-react";

function Section({
  id,
  title,
  children,
  expanded,
  onToggle,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  expanded: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="border border-brown-700 rounded-xl overflow-hidden mb-3">
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between p-4 bg-brown-800/50"
      >
        <span className="font-medium text-brown-100">{title}</span>
        <ChevronDown
          className={`w-5 h-5 text-brown-500 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>
      {expanded && (
        <div className="p-4 border-t border-brown-700/50 text-sm text-brown-400 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

function TermsOfService({
  expandedSections,
  toggleSection,
}: {
  expandedSections: Record<string, boolean>;
  toggleSection: (id: string) => void;
}) {
  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-brown-50">Terms of Service</h2>
        <p className="text-sm text-brown-500 mt-1">
          Effective Date: January 31, 2026
        </p>
      </div>

      <p className="text-sm text-brown-400 mb-6 leading-relaxed">
        Welcome to GainsView. These Terms of Service govern your access to and
        use of the GainsView application and services. By using our Service, you
        agree to be bound by these Terms.
      </p>

      <Section
        id="terms-1"
        title="1. Acceptance of Terms"
        expanded={!!expandedSections["terms-1"]}
        onToggle={toggleSection}
      >
        By creating an account, accessing, or using GainsView, you acknowledge
        that you have read, understood, and agree to be bound by these Terms and
        our Privacy Policy. You must be at least 18 years old to use this
        Service.
      </Section>

      <Section
        id="terms-2"
        title="2. Description of Service"
        expanded={!!expandedSections["terms-2"]}
        onToggle={toggleSection}
      >
        <p className="mb-3">
          GainsView is an options trading journal and portfolio tracking
          application. The Service includes:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Trade logging and journaling features</li>
          <li>Profit and loss (P&L) tracking and analysis</li>
          <li>Market data display for reference purposes</li>
          <li>AI-powered trading assistant for educational purposes</li>
          <li>Options calculator and analysis tools</li>
        </ul>
      </Section>

      <Section
        id="terms-3"
        title="3. Important Disclaimers"
        expanded={!!expandedSections["terms-3"]}
        onToggle={toggleSection}
      >
        <p className="mb-3">
          <strong className="text-brown-200">Not Financial Advice:</strong>{" "}
          GainsView does not provide investment, financial, tax, or legal advice.
          The Service is for informational and educational purposes only.
        </p>
        <p className="mb-3">
          <strong className="text-brown-200">Market Data Delay:</strong> Market
          data may be delayed by up to 15 minutes. Do not rely on this data for
          real-time trading decisions.
        </p>
        <p>
          <strong className="text-brown-200">AI Limitations:</strong> The AI
          assistant is for educational purposes only and does not provide
          predictions or specific buy/sell recommendations.
        </p>
      </Section>

      <Section
        id="terms-4"
        title="4. User Accounts"
        expanded={!!expandedSections["terms-4"]}
        onToggle={toggleSection}
      >
        <p className="mb-3">
          <strong className="text-brown-200">Account Creation:</strong> You must
          provide accurate information during registration.
        </p>
        <p>
          <strong className="text-brown-200">Account Security:</strong> You are
          responsible for maintaining the confidentiality of your credentials and
          for all activities under your account.
        </p>
      </Section>

      <Section
        id="terms-5"
        title="5. Subscription and Payment"
        expanded={!!expandedSections["terms-5"]}
        onToggle={toggleSection}
      >
        <p className="mb-3">
          GainsView offers subscription-based access. Pricing details are
          available on our website.
        </p>
        <p className="mb-3">
          New users may be eligible for a free trial. At the end of the trial,
          your subscription will automatically convert to paid unless cancelled.
        </p>
        <p>
          Subscriptions are billed in advance on a recurring basis. All payments
          are non-refundable except as required by law.
        </p>
      </Section>

      <Section
        id="terms-6"
        title="6. Acceptable Use"
        expanded={!!expandedSections["terms-6"]}
        onToggle={toggleSection}
      >
        <p className="mb-3">You agree not to:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Use the Service for any illegal purpose</li>
          <li>Attempt unauthorized access to the Service</li>
          <li>Interfere with or disrupt the Service</li>
          <li>Copy, sell, or exploit any portion of the Service</li>
          <li>Share your account credentials with others</li>
        </ul>
      </Section>

      <Section
        id="terms-7"
        title="7. Intellectual Property"
        expanded={!!expandedSections["terms-7"]}
        onToggle={toggleSection}
      >
        The Service and its content are owned by GainsView and protected by
        intellectual property laws. You may not copy, modify, or create
        derivative works without permission.
      </Section>

      <Section
        id="terms-8"
        title="8. Limitation of Liability"
        expanded={!!expandedSections["terms-8"]}
        onToggle={toggleSection}
      >
        <p className="mb-3">
          To the maximum extent permitted by law, GainsView shall not be liable
          for any indirect, incidental, special, or consequential damages,
          including:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Your use or inability to use the Service</li>
          <li>Trading decisions based on Service information</li>
          <li>Unauthorized access to your data</li>
          <li>Errors or delays in the Service</li>
        </ul>
      </Section>

      <Section
        id="terms-9"
        title="9. Termination"
        expanded={!!expandedSections["terms-9"]}
        onToggle={toggleSection}
      >
        We may terminate your account immediately for conduct that violates
        these Terms. Upon termination, your right to use the Service will cease.
      </Section>

      <Section
        id="terms-10"
        title="10. Contact Information"
        expanded={!!expandedSections["terms-10"]}
        onToggle={toggleSection}
      >
        <p>For questions about these Terms, contact us at:</p>
        <p className="mt-2">
          <strong className="text-brown-200">Email:</strong> gainsview@gmail.com
        </p>
      </Section>

      <div className="mt-8 pt-6 border-t border-brown-700/50">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-brown-500">Download:</span>
          <a
            href="/documents/GainsView_Terms_of_Service.docx"
            download
            className="text-gold-400 hover:underline flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            Terms
          </a>
          <span className="text-brown-600">&bull;</span>
          <a
            href="/documents/GainsView_Privacy_Policy.docx"
            download
            className="text-gold-400 hover:underline flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            Privacy
          </a>
        </div>
      </div>

      <p className="text-center text-xs text-brown-600 mt-6">
        &copy; 2026 GainsView. All rights reserved.
      </p>
    </div>
  );
}

function PrivacyPolicy({
  expandedSections,
  toggleSection,
}: {
  expandedSections: Record<string, boolean>;
  toggleSection: (id: string) => void;
}) {
  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-brown-50">Privacy Policy</h2>
        <p className="text-sm text-brown-500 mt-1">
          Effective Date: January 31, 2026
        </p>
      </div>

      <p className="text-sm text-brown-400 mb-6 leading-relaxed">
        GainsView is committed to protecting your privacy. This Privacy Policy
        explains how we collect, use, and safeguard your information when you use
        our Service.
      </p>

      <Section
        id="privacy-1"
        title="1. Information We Collect"
        expanded={!!expandedSections["privacy-1"]}
        onToggle={toggleSection}
      >
        <p className="mb-3">
          <strong className="text-brown-200">Information You Provide:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 mb-3">
          <li>Account information (name, email, password)</li>
          <li>Profile information (picture, preferences)</li>
          <li>Trading data (logs, journal entries, P&L)</li>
          <li>Payment information (via Stripe)</li>
          <li>Support communications</li>
        </ul>
        <p className="mb-3">
          <strong className="text-brown-200">
            Information Collected Automatically:
          </strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Device information</li>
          <li>Usage data and interaction patterns</li>
          <li>General location (via IP address)</li>
          <li>Log data</li>
        </ul>
      </Section>

      <Section
        id="privacy-2"
        title="2. How We Use Your Information"
        expanded={!!expandedSections["privacy-2"]}
        onToggle={toggleSection}
      >
        <ul className="list-disc list-inside space-y-1">
          <li>To provide and operate the Service</li>
          <li>To personalize your experience</li>
          <li>To analyze and improve the Service</li>
          <li>To send service updates and security alerts</li>
          <li>To detect and prevent fraud</li>
          <li>To comply with legal requirements</li>
        </ul>
      </Section>

      <Section
        id="privacy-3"
        title="3. Data Storage and Security"
        expanded={!!expandedSections["privacy-3"]}
        onToggle={toggleSection}
      >
        <p className="mb-3">
          Your data is stored on secure servers. We implement security measures
          including:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>SSL/TLS encryption in transit</li>
          <li>Encryption of sensitive data at rest</li>
          <li>Regular security assessments</li>
          <li>Access controls and authentication</li>
          <li>Secure password hashing</li>
        </ul>
      </Section>

      <Section
        id="privacy-4"
        title="4. Information Sharing"
        expanded={!!expandedSections["privacy-4"]}
        onToggle={toggleSection}
      >
        <p className="mb-3">
          We do not sell your personal information. We may share data with:
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Service providers (Stripe, Clerk, Supabase)</li>
          <li>When required by law</li>
          <li>To protect rights and safety</li>
          <li>In connection with business transfers</li>
        </ul>
      </Section>

      <Section
        id="privacy-5"
        title="5. Third-Party Services"
        expanded={!!expandedSections["privacy-5"]}
        onToggle={toggleSection}
      >
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong className="text-brown-200">Clerk:</strong> Authentication
          </li>
          <li>
            <strong className="text-brown-200">Stripe:</strong> Payment
            processing
          </li>
          <li>
            <strong className="text-brown-200">Supabase:</strong> Data storage
          </li>
          <li>
            <strong className="text-brown-200">Tradier/Polygon:</strong> Market
            data
          </li>
          <li>
            <strong className="text-brown-200">Groq:</strong> AI assistant
          </li>
        </ul>
      </Section>

      <Section
        id="privacy-6"
        title="6. Your Rights and Choices"
        expanded={!!expandedSections["privacy-6"]}
        onToggle={toggleSection}
      >
        <p className="mb-3">
          <strong className="text-brown-200">Access & Update:</strong> Manage
          your information in account settings.
        </p>
        <p className="mb-3">
          <strong className="text-brown-200">Data Export:</strong> Export your
          trading data anytime.
        </p>
        <p className="mb-3">
          <strong className="text-brown-200">Account Deletion:</strong> Request
          deletion at gainsview@gmail.com (processed within 30 days).
        </p>
        <p>
          <strong className="text-brown-200">Communications:</strong> Opt out of
          non-essential emails in settings.
        </p>
      </Section>

      <Section
        id="privacy-7"
        title="7. Cookies and Tracking"
        expanded={!!expandedSections["privacy-7"]}
        onToggle={toggleSection}
      >
        <p className="mb-3">We use cookies for:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Essential functionality</li>
          <li>Remembering preferences</li>
          <li>Analytics and improvements</li>
        </ul>
        <p className="mt-3">
          You can control cookies through browser settings.
        </p>
      </Section>

      <Section
        id="privacy-8"
        title="8. Data Retention"
        expanded={!!expandedSections["privacy-8"]}
        onToggle={toggleSection}
      >
        We retain your information while your account is active. After deletion,
        some data may be retained as required by law or for legitimate business
        purposes.
      </Section>

      <Section
        id="privacy-9"
        title="9. Children's Privacy"
        expanded={!!expandedSections["privacy-9"]}
        onToggle={toggleSection}
      >
        The Service is not intended for users under 18. We do not knowingly
        collect information from children.
      </Section>

      <Section
        id="privacy-10"
        title="10. Contact Us"
        expanded={!!expandedSections["privacy-10"]}
        onToggle={toggleSection}
      >
        <p>For questions about this Privacy Policy, contact us at:</p>
        <p className="mt-2">
          <strong className="text-brown-200">Email:</strong> gainsview@gmail.com
        </p>
      </Section>

      <div className="mt-8 pt-6 border-t border-brown-700/50">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-brown-500">Download:</span>
          <a
            href="/documents/GainsView_Terms_of_Service.docx"
            download
            className="text-gold-400 hover:underline flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            Terms
          </a>
          <span className="text-brown-600">&bull;</span>
          <a
            href="/documents/GainsView_Privacy_Policy.docx"
            download
            className="text-gold-400 hover:underline flex items-center gap-1"
          >
            <Download className="w-3 h-3" />
            Privacy
          </a>
        </div>
      </div>

      <p className="text-center text-xs text-brown-600 mt-6">
        &copy; 2026 GainsView. All rights reserved.
      </p>
    </div>
  );
}

export default function TermsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"terms" | "privacy">("terms");
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brown-950 via-brown-900 to-brown-950 text-brown-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-brown-950/90 backdrop-blur-sm border-b border-brown-700/50 px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 -ml-2">
              <ChevronLeft className="w-6 h-6 text-brown-100" />
            </button>
            <h1 className="text-lg font-bold text-brown-50">
              Terms & Privacy
            </h1>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setActiveTab("terms")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-colors ${
                activeTab === "terms"
                  ? "bg-gold-400 text-brown-950"
                  : "bg-brown-800/50 text-brown-400 border border-brown-700"
              }`}
            >
              <FileText className="w-4 h-4" />
              Terms of Service
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-colors ${
                activeTab === "privacy"
                  ? "bg-gold-400 text-brown-950"
                  : "bg-brown-800/50 text-brown-400 border border-brown-700"
              }`}
            >
              <Shield className="w-4 h-4" />
              Privacy Policy
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto">
        {activeTab === "terms" ? (
          <TermsOfService
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
        ) : (
          <PrivacyPolicy
            expandedSections={expandedSections}
            toggleSection={toggleSection}
          />
        )}
      </div>
    </div>
  );
}
