import { Shield, Package, Truck, Headphones } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Authentic Products",
    description: "100% genuine products from trusted manufacturers. Quality guaranteed on every purchase.",
  },
  {
    icon: Package,
    title: "Wide Selection",
    description: "Glass pipes, bongs, grinders, vapes, and smoking accessories. Everything you need in one place.",
  },
  {
    icon: Truck,
    title: "Fast Shipping",
    description: "Quick and discreet delivery across South Africa. Track your order every step of the way.",
  },
  {
    icon: Headphones,
    title: "Expert Support",
    description: "Knowledgeable team ready to help you find the perfect products for your needs.",
  },
];

const Benefits = () => {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why Choose Ideal Smoke Supply?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your trusted source for premium smoking accessories and supplies with exceptional service.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={benefit.title}
              className="text-center group animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 group-hover:bg-primary group-hover:scale-110 transition-all duration-300 mb-6">
                <benefit.icon className="h-10 w-10 text-primary group-hover:text-primary-foreground transition-colors duration-300" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">
                {benefit.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
