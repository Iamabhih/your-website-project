import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Leaf, Shield, Truck, Award } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-br from-primary/10 via-background to-secondary/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="text-center">
              <Leaf className="h-16 w-16 text-primary mx-auto mb-6" />
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
                About Ideal Smoke Supply
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Your trusted partner in premium smoking and vaping products since 2024
              </p>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <h2 className="text-3xl font-bold text-foreground mb-6">Our Story</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground leading-relaxed mb-4">
                Ideal Smoke Supply was founded with a simple mission: to provide high-quality 
                smoking and vaping products to our community. We believe in offering only the 
                finest products that we would use ourselves.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Our team carefully selects every product in our catalog, ensuring quality, 
                authenticity, and value for money. From glass pipes to premium smoking accessories, 
                we stand behind everything we sell.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
            <h2 className="text-3xl font-bold text-foreground mb-12 text-center">
              Why Choose Us
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Quality Products</h3>
                <p className="text-muted-foreground">
                  Only the finest, authentic products make it to our shelves
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Secure Shopping</h3>
                <p className="text-muted-foreground">
                  Your data and payment information is always protected
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                <p className="text-muted-foreground">
                  Quick and reliable shipping across South Africa
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Leaf className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Expert Support</h3>
                <p className="text-muted-foreground">
                  Knowledgeable team ready to help with your questions
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Questions or Concerns?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Our team is here to help. Reach out anytime.
            </p>
            <a 
              href="/support" 
              className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
            >
              Contact Support
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}