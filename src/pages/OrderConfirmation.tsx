import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: string;
  created_at: string;
}

export default function OrderConfirmation() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (id) {
      loadOrder();
    }
  }, [id]);

  const loadOrder = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (data) {
      setOrder(data);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p>Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-success/10 dark:bg-success/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <CardTitle className="text-3xl">Order Confirmed!</CardTitle>
              <p className="text-muted-foreground mt-2">
                Thank you for your order, {order.customer_name}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-t border-b py-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-sm">{order.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-semibold">R {order.total_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span className="capitalize font-semibold">{order.status}</span>
                </div>
              </div>

              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  A confirmation email has been sent to {order.customer_email}
                </p>
                <p className="text-sm text-muted-foreground">
                  You can track your order status in your account
                </p>
              </div>

              <div className="flex gap-4">
                <Link to="/my-orders" className="flex-1">
                  <Button variant="outline" className="w-full">
                    View My Orders
                  </Button>
                </Link>
                <Link to="/shop" className="flex-1">
                  <Button className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
