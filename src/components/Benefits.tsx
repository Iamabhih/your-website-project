import { Shield, Leaf, Award, HeartPulse } from "lucide-react";

const benefits = [
  {
    icon: Shield,
    title: "Lab Tested",
    description: "Every product undergoes rigorous third-party lab testing for purity and potency.",
  },
  {
    icon: Leaf,
    title: "100% Organic",
    description: "Sourced from premium organic hemp farms with sustainable farming practices.",
  },
  {
    icon: Award,
    title: "Premium Quality",
    description: "Crafted with care using the finest ingredients and industry-leading standards.",
  },
  {
    icon: HeartPulse,
    title: "Wellness Focused",
    description: "Designed to support your natural health and wellbeing journey every day.",
  },
];

const Benefits = () => {
  return (
    <section className="py-20 bg-muted/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Why Choose Nippy's?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We're committed to delivering the highest quality CBD products with complete transparency and care.
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
