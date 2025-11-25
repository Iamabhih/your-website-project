import { Card, CardContent } from "@/components/ui/card";
import { useCollections } from "@/hooks/useCollections";
import { Loader2, Tag } from "lucide-react";
import { Link } from "react-router-dom";

const Products = () => {
  const { data: collections, isLoading, error } = useCollections();

  if (isLoading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !collections || collections.length === 0) {
    return null; // Don't render section if no collections configured
  }

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Our Premium Collection
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Explore our carefully curated selection of products, each crafted with quality and your needs in mind.
          </p>
        </div>

        <div className={`grid gap-8 ${
          collections.length === 1 ? 'md:grid-cols-1 max-w-md mx-auto' :
          collections.length === 2 ? 'md:grid-cols-2 max-w-2xl mx-auto' :
          collections.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
          'md:grid-cols-3'
        }`}>
          {collections.map((collection, index) => (
            <Link
              to={`/shop?category=${encodeURIComponent(collection.name)}`}
              key={collection.slug || collection.name}
            >
              <Card
                className="group overflow-hidden border-border hover:shadow-lg transition-all duration-300 animate-scale-in bg-gradient-to-b from-card to-muted cursor-pointer"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-0">
                  <div className="relative overflow-hidden aspect-square">
                    {collection.image_url ? (
                      <img
                        src={collection.image_url}
                        alt={collection.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Tag className="h-16 w-16 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-8">
                      <span className="text-primary-foreground font-semibold">
                        Shop Now
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-foreground mb-3">
                      {collection.name}
                    </h3>
                    {collection.description && (
                      <p className="text-muted-foreground leading-relaxed line-clamp-2">
                        {collection.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Products;
