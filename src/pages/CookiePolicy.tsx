import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { PolicyContactInfo } from "@/components/PolicyContactInfo";
import { ArrowLeft } from "lucide-react";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <Link to="/" className="inline-flex items-center text-primary hover:underline mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          <h1 className="text-4xl font-bold text-foreground mb-6">Cookie Policy</h1>
          <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>

          <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">1. What Are Cookies?</h2>
              <p className="text-foreground/90">
                Cookies are small text files stored on your device when you visit our website. They help us provide you with a better experience by remembering your preferences and understanding how you use our site.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">2. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Essential Cookies</h3>
              <p className="text-foreground/90">
                These cookies are necessary for the website to function properly. They enable basic features like page navigation, shopping cart functionality, and secure areas access.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li><strong>Session cookies:</strong> Maintain your shopping cart and login status</li>
                <li><strong>Security cookies:</strong> Authenticate users and prevent fraud</li>
                <li><strong>Age verification:</strong> Remember your age verification consent</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Functional Cookies</h3>
              <p className="text-foreground/90">
                These cookies allow the website to remember choices you make (such as your preferred language or region) and provide enhanced, personalized features.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>User preferences and settings</li>
                <li>Recently viewed products</li>
                <li>Shopping cart persistence</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Analytics Cookies</h3>
              <p className="text-foreground/90">
                These cookies help us understand how visitors interact with our website by collecting and reporting information anonymously.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>Page views and visitor counts</li>
                <li>Traffic sources</li>
                <li>Time spent on pages</li>
                <li>Click patterns and navigation paths</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Marketing Cookies</h3>
              <p className="text-foreground/90">
                These cookies track your browsing habits to deliver advertisements relevant to you and your interests.
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>Targeted advertising</li>
                <li>Social media integration</li>
                <li>Conversion tracking</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">3. Third-Party Cookies</h2>
              <p className="text-foreground/90">
                We use services from trusted third parties that may set cookies on our website:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li><strong>PayFast:</strong> Payment processing</li>
                <li><strong>Supabase:</strong> Authentication and data storage</li>
                <li><strong>Google Analytics:</strong> Website analytics (if applicable)</li>
                <li><strong>Social Media Platforms:</strong> Social sharing features</li>
              </ul>
              <p className="text-foreground/90 mt-4">
                These third parties have their own privacy policies regarding how they use cookies.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">4. How We Use Cookies</h2>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>Keep you signed in to your account</li>
                <li>Remember items in your shopping cart</li>
                <li>Understand and improve website performance</li>
                <li>Personalize content and recommendations</li>
                <li>Verify your age (18+ requirement)</li>
                <li>Prevent fraud and enhance security</li>
                <li>Analyze traffic and user behavior</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">5. Cookie Duration</h2>
              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Session Cookies</h3>
              <p className="text-foreground/90">
                Temporary cookies that expire when you close your browser.
              </p>

              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Persistent Cookies</h3>
              <p className="text-foreground/90">
                Remain on your device for a set period (ranging from days to years) or until manually deleted.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">6. Managing Your Cookie Preferences</h2>
              
              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Browser Settings</h3>
              <p className="text-foreground/90">
                Most browsers allow you to control cookies through their settings:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
                <li><strong>Firefox:</strong> Options → Privacy & Security → Cookies</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">Impact of Disabling Cookies</h3>
              <p className="text-foreground/90">
                Disabling cookies may affect your experience:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-foreground/90">
                <li>You may need to log in more frequently</li>
                <li>Shopping cart may not work properly</li>
                <li>Some features may be unavailable</li>
                <li>Personalized content will not be displayed</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">7. Do Not Track (DNT)</h2>
              <p className="text-foreground/90">
                We respect Do Not Track signals. When a DNT signal is detected, we adjust our tracking accordingly. However, some third-party services may not honor DNT requests.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">8. Updates to This Policy</h2>
              <p className="text-foreground/90">
                We may update this Cookie Policy from time to time. Any changes will be posted on this page with an updated "Last updated" date. We encourage you to review this policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">9. More Information</h2>
              <p className="text-foreground/90">
                For more details about how we handle your personal data, please refer to our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact Us</h2>
              <p className="text-foreground/90">
                If you have questions about our use of cookies:
              </p>
              <PolicyContactInfo />
            </section>

            <div className="bg-primary/10 border-l-4 border-primary p-4 rounded">
              <p className="text-foreground/90">
                <strong>Your Consent:</strong> By continuing to use our website, you consent to our use of cookies as described in this policy.
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
