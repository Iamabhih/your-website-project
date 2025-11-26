import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductVariantSelector from '@/components/ProductVariantSelector';
import WishlistButton from '@/components/WishlistButton';
import ProductStructuredData from '@/components/ProductStructuredData';

interface ProductVariant {
  id: string;
  variant_name: string;
  price_adjustment: number;
  stock_quantity: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image_url: string | null;
  pack_info: string | null;
  min_quantity: number;
  stock_quantity: number;
  has_variants: boolean;
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      setProduct(data);
    }
    setLoading(false);
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Check if product has variants and one is selected
    if (product.has_variants) {
      if (!selectedVariant) {
        toast.error('Please select all product options');
        return;
      }
      if (selectedVariant.stock_quantity === 0) {
        toast.error('This variant is out of stock');
        return;
      }
    }

    const finalPrice = selectedVariant
      ? product.price + selectedVariant.price_adjustment
      : product.price;

    const itemName = selectedVariant
      ? `${product.name} - ${selectedVariant.variant_name}`
      : product.name;

    addItem({
      id: product.id,
      productId: product.id,
      name: itemName,
      price: finalPrice,
      image_url: product.image_url || undefined,
      min_quantity: product.min_quantity,
    });
    toast.success(`${itemName} added to cart`);
  };

  const canAddToCart = () => {
    if (!product) return false;
    if (product.has_variants) {
      return selectedVariant !== null && selectedVariant.stock_quantity > 0;
    }
    return product.stock_quantity > 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Product not found</p>
            <Link to="/shop">
              <Button>Back to Shop</Button>
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <ProductStructuredData product={product} />

      <main className="flex-1 py-6 sm:py-8 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/shop" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 sm:mb-6 md:mb-8 text-sm sm:text-base">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Link>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12">
            <div>
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full h-64 sm:h-80 md:h-96 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
            </div>

            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              <div>
                <span className="inline-block px-2 sm:px-3 py-1 bg-primary/10 text-primary text-xs sm:text-sm font-medium rounded-full mb-2 sm:mb-4">
                  {product.category}
                </span>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-1 sm:mb-2">{product.name}</h1>
                {product.pack_info && (
                  <p className="text-sm sm:text-base text-muted-foreground">{product.pack_info}</p>
                )}
              </div>

              {/* Price or Variant Selector */}
              {product.has_variants ? (
                <ProductVariantSelector
                  productId={product.id}
                  basePrice={product.price}
                  onVariantChange={setSelectedVariant}
                />
              ) : (
                <div>
                  <span className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                    R {product.price.toFixed(2)}
                  </span>
                </div>
              )}

              <div>
                <h2 className="text-base sm:text-lg font-semibold mb-1 sm:mb-2">Description</h2>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {product.min_quantity > 1 && (
                <div className="p-3 sm:p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Minimum order quantity: <span className="font-semibold">{product.min_quantity}</span>
                  </p>
                </div>
              )}

              <div className="flex gap-2 sm:gap-3">
                <Button
                  size="lg"
                  className="flex-1 text-sm sm:text-base"
                  onClick={handleAddToCart}
                  disabled={!canAddToCart()}
                >
                  <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  {canAddToCart() ? 'Add to Cart' : 'Out of Stock'}
                </Button>
                <WishlistButton
                  productId={product.id}
                  size="lg"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
