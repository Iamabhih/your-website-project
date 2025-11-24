import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Link to="/" className="inline-flex items-center text-primary hover:underline mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold text-foreground mb-6">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Introduction</h2>
              <p className="text-foreground/90">
                Ideal Smoke Supply ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Personal Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>Name, email address, phone number</li>
                <li>Delivery address and billing information</li>
                <li>Order history and preferences</li>
                <li>Age verification data</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Pages visited and time spent on site</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>Process and fulfill your orders</li>
                <li>Communicate about your orders and account</li>
                <li>Send promotional emails (with your consent)</li>
                <li>Improve our website and services</li>
                <li>Comply with legal obligations</li>
                <li>Prevent fraud and maintain security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-foreground/90">We may share your information with:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li><strong>Service Providers:</strong> Payment processors, shipping companies, email services</li>
                <li><strong>Legal Compliance:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets</li>
              </ul>
              <p className="text-foreground/90 mt-4">
                We do not sell your personal information to third parties for marketing purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Cookies and Tracking</h2>
              <p className="text-foreground/90">
                We use cookies and similar technologies to enhance your experience. You can control cookie preferences through your browser settings. For more details, see our <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Security</h2>
              <p className="text-foreground/90">
                We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Your Rights</h2>
              <p className="text-foreground/90">Under POPIA (Protection of Personal Information Act) and GDPR, you have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to processing</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Children's Privacy</h2>
              <p className="text-foreground/90">
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Changes to This Policy</h2>
              <p className="text-foreground/90">
                We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact Us</h2>
              <p className="text-foreground/90">
                If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg mt-4">
                <p className="text-foreground/90">
                  <strong>Email:</strong> privacy@idealsmokesupply.com<br />
                  <strong>Phone:</strong> +27 XX XXX XXXX<br />
                  <strong>Address:</strong> [Your Business Address], South Africa
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
