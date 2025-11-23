import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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
}

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
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
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url || undefined,
      min_quantity: product.min_quantity,
    });
    toast.success(`${product.name} added to cart`);
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
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/shop" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Link>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full rounded-lg shadow-lg"
                />
              ) : (
                <div className="w-full h-96 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">No image available</span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full mb-4">
                  {product.category}
                </span>
                <h1 className="text-4xl font-bold text-foreground mb-2">{product.name}</h1>
                {product.pack_info && (
                  <p className="text-muted-foreground">{product.pack_info}</p>
                )}
              </div>

              <div>
                <span className="text-4xl font-bold text-primary">
                  R {product.price.toFixed(2)}
                </span>
              </div>

              <div>
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>

              {product.min_quantity > 1 && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Minimum order quantity: <span className="font-semibold">{product.min_quantity}</span>
                  </p>
                </div>
              )}

              <Button size="lg" className="w-full" onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
