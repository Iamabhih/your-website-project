import { Card, CardContent } from "@/components/ui/card";
import oilsImage from "@/assets/product-oils.jpg";
import gummiesImage from "@/assets/product-gummies.jpg";
import topicalsImage from "@/assets/product-topicals.jpg";
import { Droplet, Candy, Sparkles } from "lucide-react";

const products = [
  {
    title: "CBD Oils",
    description: "Pure, concentrated CBD oil tinctures for precise dosing and fast relief.",
    image: oilsImage,
    icon: Droplet,
  },
  {
    title: "CBD Gummies",
    description: "Delicious, convenient gummies perfect for daily wellness on the go.",
    image: gummiesImage,
    icon: Candy,
  },
  {
    title: "CBD Topicals",
    description: "Soothing creams and balms for targeted relief where you need it most.",
    image: topicalsImage,
    icon: Sparkles,
  },
];

const Products = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our Premium Collection
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our carefully curated selection of CBD products, each crafted with quality and your wellness in mind.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <Card 
              key={product.title}
              className="group overflow-hidden border-border hover:shadow-lg transition-all duration-300 animate-scale-in bg-gradient-to-b from-card to-muted"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden aspect-square">
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8">
                    <product.icon className="h-12 w-12 text-primary-foreground animate-float" />
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    {product.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {product.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Products;
