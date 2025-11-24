import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PolicyContactInfo } from "@/components/PolicyContactInfo";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Link to="/" className="inline-flex items-center text-primary hover:underline mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold text-foreground mb-6">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Acceptance of Terms</h2>
              <p className="text-foreground/90">
                By accessing and using Ideal Smoke Supply's website and services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Age Requirements</h2>
              <p className="text-foreground/90">
                You must be at least 18 years old to use our services and purchase products. By using this website, you represent and warrant that you meet this age requirement. We reserve the right to request proof of age at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Account Responsibilities</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You agree to provide accurate, current, and complete information</li>
                <li>You are responsible for all activities under your account</li>
                <li>You must notify us immediately of any unauthorized use</li>
                <li>We reserve the right to suspend or terminate accounts at our discretion</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Product Usage and Safety</h2>
              <p className="text-foreground/90">
                All products sold are intended for adult use only. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>Use products responsibly and in accordance with applicable laws</li>
                <li>Not resell products to minors</li>
                <li>Read and follow all product instructions and warnings</li>
                <li>Assume all risks associated with product use</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Orders and Payment</h2>
              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Order Acceptance</h3>
              <p className="text-foreground/90">
                All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Pricing</h3>
              <p className="text-foreground/90">
                Prices are subject to change without notice. We strive to display accurate pricing but errors may occur. In case of a pricing error, we will contact you before processing your order.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Payment</h3>
              <p className="text-foreground/90">
                Payment must be received before order fulfillment. We accept payment through PayFast and other authorized payment methods.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Shipping and Delivery</h2>
              <p className="text-foreground/90">
                Delivery times are estimates and not guaranteed. We are not responsible for delays caused by courier services or circumstances beyond our control. See our <Link to="/return-policy" className="text-primary hover:underline">Return Policy</Link> for more details.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Intellectual Property</h2>
              <p className="text-foreground/90">
                All content on this website, including text, graphics, logos, images, and software, is the property of Ideal Smoke Supply and protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Limitation of Liability</h2>
              <p className="text-foreground/90">
                To the maximum extent permitted by law, Ideal Smoke Supply shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our services or products. Our total liability shall not exceed the amount paid for the product in question.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Indemnification</h2>
              <p className="text-foreground/90">
                You agree to indemnify and hold harmless Ideal Smoke Supply from any claims, damages, losses, or expenses arising from your violation of these Terms or misuse of products.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Prohibited Activities</h2>
              <p className="text-foreground/90">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>Use the website for any illegal purpose</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the proper functioning of the website</li>
                <li>Collect user information without consent</li>
                <li>Impersonate any person or entity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">11. Governing Law</h2>
              <p className="text-foreground/90">
                These Terms are governed by the laws of South Africa. Any disputes shall be resolved in the courts of South Africa.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">12. Changes to Terms</h2>
              <p className="text-foreground/90">
                We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting. Your continued use of the website constitutes acceptance of modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">13. Contact Information</h2>
              <p className="text-foreground/90">
                For questions about these Terms of Service, contact us:
              </p>
              <PolicyContactInfo />
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
