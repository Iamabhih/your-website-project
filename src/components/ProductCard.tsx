import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import WishlistButton from '@/components/WishlistButton';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  pack_info?: string;
  min_quantity: number;
}

export default function ProductCard({
  id,
  name,
  description,
  price,
  image_url,
  pack_info,
  min_quantity,
}: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ id, productId: id, name, price, image_url, min_quantity });
    toast.success(`${name} added to cart`);
  };

  return (
    <Link to={`/product/${id}`}>
      <Card className="h-full hover:shadow-xl hover:shadow-primary/10 transition-all duration-500 group border-border/50 hover:border-primary/30 overflow-hidden">
        <CardContent className="p-0">
          {image_url ? (
            <div className="relative overflow-hidden rounded-t-lg h-48 sm:h-56 md:h-64">
              <img
                src={image_url}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 ease-out"
              />
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Quick view indicator */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 shadow-lg">
                  <Eye className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Quick View</span>
                </div>
              </div>

              <div className="absolute top-2 right-2 z-10">
                <WishlistButton productId={id} />
              </div>
            </div>
          ) : (
            <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-br from-muted to-muted/50 rounded-t-lg flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,154,109,0.1),transparent_70%)]" />
              <span className="text-muted-foreground">No image</span>
              <div className="absolute top-2 right-2 z-10">
                <WishlistButton productId={id} />
              </div>
            </div>
          )}

          <div className="p-4 sm:p-5 md:p-6 relative">
            {/* Subtle top border accent */}
            <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

            <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-foreground line-clamp-2 group-hover:text-primary transition-colors duration-300">{name}</h3>
            {pack_info && (
              <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">{pack_info}</p>
            )}
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 sm:mb-4 hidden sm:block">
              {description}
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xl sm:text-2xl font-bold text-primary">
                R {price.toFixed(2)}
              </span>
              {min_quantity > 1 && (
                <span className="text-xs sm:text-sm text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  Min: {min_quantity}
                </span>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 sm:p-5 md:p-6 pt-0">
          <Button
            className="w-full text-sm sm:text-base group/btn hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="mr-2 h-4 w-4 group-hover/btn:scale-110 transition-transform" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
