import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Award, Shield, Clock } from "lucide-react";

const About = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="animate-fade-in">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6 border border-primary/20">
                <Award className="h-4 w-4" />
                Our Story
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                Your Trusted <span className="text-primary">Smoke Shop</span> Partner
              </h2>
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                At Ideal Smoke Supply, we believe in providing the finest vaping and smoking products.
                Founded by enthusiasts who understand the importance of quality and reliability,
                we're dedicated to making premium vaping products accessible to everyone.
              </p>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Every product in our collection is carefully selected and tested to ensure it meets our
                rigorous standards for quality, performance, and safety. We partner with trusted manufacturers
                and use best practices because we care about your satisfaction and experience.
              </p>

              {/* Feature badges */}
              <div className="flex flex-wrap gap-4 mb-8">
                <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border shadow-sm">
                  <Shield className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Quality Assured</span>
                </div>
                <div className="flex items-center gap-2 bg-card px-4 py-2 rounded-lg border shadow-sm">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">Fast Shipping</span>
                </div>
              </div>

              <Button
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 group"
                asChild
              >
                <Link to="/about">
                  Read Our Full Story
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>

            <div className="relative animate-scale-in lg:animate-fade-in">
              {/* Decorative background ring */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 blur-xl opacity-50" />

              <div className="relative aspect-square rounded-3xl bg-gradient-to-br from-card via-card to-muted p-8 flex items-center justify-center border shadow-xl overflow-hidden">
                {/* Inner decorative pattern */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(139,154,109,0.1),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(139,154,109,0.08),transparent_50%)]" />

                <div className="text-center relative z-10">
                  {/* Stats card 1 */}
                  <div className="relative">
                    <div className="text-6xl md:text-7xl font-bold bg-gradient-to-br from-primary to-primary-dark bg-clip-text text-transparent mb-3">
                      5+
                    </div>
                    <div className="text-xl text-foreground font-semibold mb-1">Years of Excellence</div>
                    <div className="text-muted-foreground text-sm">Trusted by thousands</div>
                  </div>

                  {/* Decorative divider */}
                  <div className="my-8 flex items-center gap-4">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                    <div className="w-2 h-2 rounded-full bg-primary/50" />
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                  </div>

                  {/* Stats card 2 */}
                  <div className="relative">
                    <div className="text-5xl md:text-6xl font-bold bg-gradient-to-br from-primary to-primary-dark bg-clip-text text-transparent mb-3">
                      100%
                    </div>
                    <div className="text-xl text-foreground font-semibold mb-1">Authentic Products</div>
                    <div className="text-muted-foreground text-sm">Quality guaranteed</div>
                  </div>
                </div>

                {/* Corner decorations */}
                <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-primary/30 rounded-tl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-primary/30 rounded-br-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
