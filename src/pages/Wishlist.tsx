import { Link } from 'react-router-dom';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, Trash2, Heart } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function Wishlist() {
  const { user } = useAuth();
  const { wishlistItems, loading, removeFromWishlist } = useWishlist();
  const addItem = useCartStore((state) => state.addItem);

  const handleAddToCart = (item: any) => {
    if (!item.product) return;

    addItem({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      image_url: item.product.image_url || undefined,
      min_quantity: 1,
    });
    toast.success(`${item.product.name} added to cart`);
  };

  const handleRemove = (productId: string, variantId?: string) => {
    removeFromWishlist(productId, variantId);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="h-8 w-8 text-primary fill-primary" />
            <h1 className="text-4xl font-bold text-foreground">My Wishlist</h1>
          </div>

          {!user && (
            <Card className="mb-6 bg-muted/50">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground">
                  <Link to="/auth" className="text-primary hover:underline font-semibold">
                    Sign in
                  </Link>{' '}
                  to sync your wishlist across devices
                </p>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading wishlist...</p>
            </div>
          ) : wishlistItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-xl font-semibold mb-2">Your wishlist is empty</p>
                <p className="text-muted-foreground mb-6">
                  Add products you love to keep track of them
                </p>
                <Link to="/shop">
                  <Button>Start Shopping</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {wishlistItems.map((item) => (
                <Card key={item.id} className="overflow-hidden group">
                  <Link to={`/product/${item.product_id}`}>
                    <div className="aspect-square overflow-hidden bg-muted">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-muted-foreground">No image</span>
                        </div>
                      )}
                    </div>
                  </Link>

                  <CardContent className="p-4 space-y-3">
                    <Link to={`/product/${item.product_id}`}>
                      <div>
                        <span className="text-xs text-muted-foreground">
                          {item.product?.category}
                        </span>
                        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                          {item.product?.name}
                        </h3>
                      </div>
                    </Link>

                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-primary">
                        R {item.product?.price.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAddToCart(item)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-1" />
                        Add to Cart
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemove(item.product_id, item.variant_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {item.added_at && (
                      <p className="text-xs text-muted-foreground">
                        Added {new Date(item.added_at).toLocaleDateString('en-ZA')}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
