import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
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
      <Card className="h-full hover:shadow-lg transition-shadow duration-300 group">
        <CardContent className="p-0">
          {image_url ? (
            <div className="relative overflow-hidden rounded-t-lg h-48 sm:h-56 md:h-64">
              <img
                src={image_url}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
              <div className="absolute top-2 right-2 z-10">
                <WishlistButton productId={id} />
              </div>
            </div>
          ) : (
            <div className="relative h-48 sm:h-56 md:h-64 bg-muted rounded-t-lg flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
              <div className="absolute top-2 right-2 z-10">
                <WishlistButton productId={id} />
              </div>
            </div>
          )}

          <div className="p-4 sm:p-5 md:p-6">
            <h3 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-foreground line-clamp-2">{name}</h3>
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
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Min: {min_quantity}
                </span>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-4 sm:p-5 md:p-6 pt-0">
          <Button
            className="w-full text-sm sm:text-base"
            onClick={handleAddToCart}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
