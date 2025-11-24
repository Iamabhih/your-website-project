import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PolicyContactInfo } from "@/components/PolicyContactInfo";
import { ArrowLeft } from "lucide-react";

export default function ReturnPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Link to="/" className="inline-flex items-center text-primary hover:underline mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold text-foreground mb-6">Return & Refund Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. Return Window</h2>
              <p className="text-foreground/90">
                You have <strong>14 days</strong> from the date of delivery to initiate a return for eligible products. Returns requested after this period will not be accepted.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Eligible Products for Return</h2>
              <p className="text-foreground/90">Products must meet the following conditions:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>Unopened and unused in original packaging</li>
                <li>All seals intact (for hygiene and safety reasons)</li>
                <li>Include all original accessories and documentation</li>
                <li>Not damaged or modified by the customer</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Non-Returnable Items</h2>
              <p className="text-foreground/90">The following items cannot be returned:</p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>Opened vape liquids or e-juices (for health and safety)</li>
                <li>Used or opened disposable vapes</li>
                <li>Personalized or custom-made items</li>
                <li>Sale or clearance items (unless defective)</li>
                <li>Gift cards or vouchers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. Defective or Damaged Items</h2>
              <p className="text-foreground/90">
                If you receive a defective or damaged product:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>Contact us within <strong>48 hours</strong> of delivery</li>
                <li>Provide photos of the damage or defect</li>
                <li>Include your order number and description of the issue</li>
                <li>We will arrange a replacement or full refund at no cost to you</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. How to Initiate a Return</h2>
              <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
                <li>Contact our support team at <strong>returns@idealsmokesupply.com</strong></li>
                <li>Provide your order number and reason for return</li>
                <li>Wait for return authorization and shipping instructions</li>
                <li>Pack the item securely in its original packaging</li>
                <li>Ship the item to the address provided</li>
              </ol>
              <p className="text-foreground/90 mt-4">
                <strong>Important:</strong> Do not ship items back without prior authorization. Unauthorized returns will not be accepted.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Return Shipping Costs</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li><strong>Customer's responsibility:</strong> If returning for change of mind, you cover shipping costs</li>
                <li><strong>Our responsibility:</strong> If item is defective or we sent the wrong product, we cover shipping</li>
                <li>We recommend using tracked shipping for returns</li>
                <li>Ideal Smoke Supply is not responsible for lost return packages</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Refund Process</h2>
              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Timeline</h3>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>We inspect returned items within 3-5 business days of receipt</li>
                <li>Approved refunds are processed within 5-7 business days</li>
                <li>Refund appears in your account based on your payment provider (3-10 business days)</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Refund Method</h3>
              <p className="text-foreground/90">
                Refunds are issued to the original payment method. If this is not possible, we will contact you to arrange an alternative.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Partial Refunds</h3>
              <p className="text-foreground/90">
                Partial refunds may be issued if items are returned not in their original condition, damaged, or with missing parts not due to our error.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Exchanges</h2>
              <p className="text-foreground/90">
                We currently do not offer direct exchanges. If you need a different product:
              </p>
              <ol className="list-decimal pl-6 space-y-2 text-foreground/90">
                <li>Return the original item for a refund</li>
                <li>Place a new order for the desired product</li>
              </ol>
              <p className="text-foreground/90 mt-4">
                For defective items, we will send a replacement immediately upon verification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. Warranty Information</h2>
              <p className="text-foreground/90">
                Hardware products (devices, batteries, etc.) come with manufacturer warranties. Warranty terms vary by product and manufacturer. Contact us for specific warranty information for your product.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact Us</h2>
              <p className="text-foreground/90">
                For return inquiries or assistance:
              </p>
              <PolicyContactInfo />
            </section>

            <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
              <p className="text-foreground/90">
                <strong>Note:</strong> This return policy complies with South African Consumer Protection Act (CPA) regulations. Your statutory rights are not affected by this policy.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
