import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface DeliveryOption {
  id: string;
  name: string;
  description: string | null;
  cost: number;
  estimated_days: number;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [deliveryOptions, setDeliveryOptions] = useState<DeliveryOption[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOption | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/shop');
    }
    loadDeliveryOptions();
  }, [items]);

  const loadDeliveryOptions = async () => {
    const { data } = await supabase
      .from('delivery_options')
      .select('*')
      .eq('is_active', true)
      .order('cost');

    if (data) {
      setDeliveryOptions(data);
      if (data.length > 0) {
        setSelectedDelivery(data[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDelivery) {
      toast.error('Please select a delivery method');
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const orderData = {
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url,
      })),
      customerName: formData.get('name') as string,
      customerEmail: formData.get('email') as string,
      customerPhone: formData.get('phone') as string,
      deliveryAddress: formData.get('address') as string,
      deliveryMethod: selectedDelivery.name,
      deliveryNotes: formData.get('notes') as string || '',
      deliveryPrice: selectedDelivery.cost,
      totalAmount: getTotalPrice() + selectedDelivery.cost,
    };

    // Create order in database
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        customer_name: orderData.customerName,
        customer_email: orderData.customerEmail,
        customer_phone: orderData.customerPhone,
        delivery_address: orderData.deliveryAddress,
        delivery_method: orderData.deliveryMethod,
        delivery_notes: orderData.deliveryNotes,
        delivery_price: orderData.deliveryPrice,
        total_amount: orderData.totalAmount,
        status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (error || !order) {
      toast.error('Failed to create order');
      setLoading(false);
      return;
    }

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.id,
      product_name: item.name,
      quantity: item.quantity,
      price: item.price,
      image_url: item.image_url,
    }));

    await supabase.from('order_items').insert(orderItems);

    // Clear cart and redirect
    clearCart();
    toast.success('Order placed successfully!');
    navigate(`/order-confirmation/${order.id}`);
    setLoading(false);
  };

  const subtotal = getTotalPrice();
  const deliveryCost = selectedDelivery?.cost || 0;
  const total = subtotal + deliveryCost;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="text-4xl font-bold text-foreground mb-8">Checkout</h1>

          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" name="name" required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" required />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" name="phone" type="tel" required />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Delivery Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="address">Full Address *</Label>
                    <Textarea id="address" name="address" rows={3} required />
                  </div>
                  <div>
                    <Label htmlFor="notes">Delivery Notes (Optional)</Label>
                    <Textarea id="notes" name="notes" rows={2} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Delivery Method</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {deliveryOptions.map((option) => (
                      <div
                        key={option.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedDelivery?.id === option.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedDelivery(option)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{option.name}</p>
                            {option.description && (
                              <p className="text-sm text-muted-foreground">{option.description}</p>
                            )}
                            <p className="text-sm text-muted-foreground mt-1">
                              Estimated: {option.estimated_days} days
                            </p>
                          </div>
                          <p className="font-semibold">R {option.cost.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {item.name} x {item.quantity}
                        </span>
                        <span>R {(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>R {subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery</span>
                      <span>R {deliveryCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total</span>
                      <span>R {total.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    {loading ? 'Processing...' : 'Place Order'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
