import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-natural-deep via-primary to-primary/80">
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-tr from-black/20 via-transparent to-secondary/10" />

      {/* Decorative pattern overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_20%,rgba(255,255,255,0.08),transparent_40%)]" />
      </div>

      {/* Floating decorative elements */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Large floating circle */}
        <div className="absolute -top-20 -right-20 w-96 h-96 rounded-full bg-secondary/10 blur-3xl animate-float" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-white/5 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

        {/* Floating shapes */}
        <div className="absolute top-1/4 right-1/4 w-4 h-4 rounded-full bg-secondary/40 animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="absolute top-1/3 right-1/3 w-3 h-3 rounded-full bg-white/30 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 right-1/5 w-5 h-5 rounded-full bg-secondary/30 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-2/3 left-1/4 w-2 h-2 rounded-full bg-white/40 animate-float" style={{ animationDelay: '0.8s' }} />

        {/* Decorative lines */}
        <div className="hidden lg:block absolute top-1/2 right-10 w-32 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        <div className="hidden lg:block absolute bottom-1/3 right-20 w-24 h-px bg-gradient-to-r from-transparent via-secondary/30 to-transparent" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl animate-fade-in-up">
          {/* Premium badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <Sparkles className="h-4 w-4 text-secondary" />
            <span className="text-sm font-medium text-white/90">Premium Quality Products</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
            Premium Smoke Supply,
            <br />
            <span className="text-secondary drop-shadow-lg">Quality You Can Trust</span>
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 leading-relaxed max-w-2xl">
            Discover premium smoking accessories, glass pieces, vapes, and more.
            Your one-stop shop for all your smoking needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-secondary text-secondary-foreground hover:bg-secondary/90 text-lg px-8 py-6 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
              asChild
            >
              <Link to="/shop">
                Shop Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 text-primary-foreground border-white/30 hover:bg-white hover:text-primary text-lg px-8 py-6 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
              asChild
            >
              <Link to="/about">
                Learn More
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap gap-6 mt-12 pt-8 border-t border-white/10">
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm">Fast Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
              <span className="text-sm">100% Authentic</span>
            </div>
            <div className="flex items-center gap-2 text-white/80">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" style={{ animationDelay: '1s' }} />
              <span className="text-sm">Secure Payment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative bottom gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent z-10" />
    </section>
  );
};

export default Hero;
