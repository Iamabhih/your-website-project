import { Button } from "@/components/ui/button";

const About = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-6">
                Our Story
              </span>
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                Bringing Nature's Best to You
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
              <Button 
                size="lg"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Read Our Full Story
              </Button>
            </div>
            
            <div className="relative animate-scale-in lg:animate-fade-in">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 p-8 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl md:text-7xl font-bold text-primary mb-4">5+</div>
                  <div className="text-xl text-foreground font-semibold mb-2">Years of Excellence</div>
                  <div className="text-muted-foreground">Trusted by thousands</div>
                  
                  <div className="mt-8 pt-8 border-t border-border">
                    <div className="text-5xl md:text-6xl font-bold text-primary mb-4">100%</div>
                    <div className="text-xl text-foreground font-semibold mb-2">Authentic Products</div>
                    <div className="text-muted-foreground">Quality guaranteed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
