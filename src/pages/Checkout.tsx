import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCartStore } from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Lock, ShieldCheck, Truck, Package, Tag, CheckCircle2 } from 'lucide-react';
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
  const [loadingDelivery, setLoadingDelivery] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState(0);
  
  // PayFast settings
  const [payfastSettings, setPayfastSettings] = useState<any>(null);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/shop');
      return;
    }
    loadDeliveryOptions();
    loadPayfastSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadPayfastSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['payfast_mode', 'payfast_merchant_id', 'payfast_merchant_key']);

      if (error) throw error;

      const settings = data?.reduce((acc, s) => {
        acc[s.key] = typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
        return acc;
      }, {} as Record<string, any>) || {};

      setPayfastSettings(settings);
    } catch (error) {
      console.error('Error loading PayFast settings:', error);
      toast.error('Payment configuration error. Please contact support.');
    }
  };

  const loadDeliveryOptions = async () => {
    try {
      setLoadingDelivery(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('delivery_options')
        .select('*')
        .eq('is_active', true)
        .order('cost');

      if (fetchError) {
        throw new Error(`Failed to load delivery options: ${fetchError.message}`);
      }

      if (!data || data.length === 0) {
        throw new Error('No delivery options available. Please contact support.');
      }

      setDeliveryOptions(data);
      setSelectedDelivery(data[0]);
    } catch (err: any) {
      console.error('Error loading delivery options:', err);
      setError(err.message || 'Failed to load delivery options');
      toast.error(err.message || 'Failed to load delivery options');
    } finally {
      setLoadingDelivery(false);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        _coupon_code: couponCode.trim().toUpperCase(),
        _customer_email: '', // Will be filled at order time
        _cart_total: getTotalPrice() + (selectedDelivery?.cost || 0)
      });

      if (error) throw error;

      const result = data as any;
      if (!result || !result.valid) {
        toast.error(result?.message || 'Invalid coupon code');
        return;
      }

      setAppliedCoupon(result.coupon);
      setDiscount(result.discount_amount);
      toast.success(`Coupon applied! You saved R${result.discount_amount.toFixed(2)}`);
    } catch (error: any) {
      console.error('Coupon validation error:', error);
      toast.error('Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
    toast.success('Coupon removed');
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate PayFast settings
    if (!payfastSettings?.payfast_merchant_id || !payfastSettings?.payfast_merchant_key) {
      toast.error('Payment system not configured. Please contact support.');
      return;
    }

    // Validate delivery selection
    if (!selectedDelivery) {
      toast.error('Please select a delivery method');
      return;
    }

    // Validate cart
    if (items.length === 0) {
      toast.error('Your cart is empty');
      navigate('/shop');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);

      // Validate form fields
      const name = formData.get('name') as string;
      const email = formData.get('email') as string;
      const phone = formData.get('phone') as string;
      const address = formData.get('address') as string;

      if (!name || !email || !phone || !address) {
        throw new Error('Please fill in all required fields');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Please enter a valid email address');
      }

      const totalAmount = getTotalPrice() + selectedDelivery.cost - discount;

      // Create order in database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([{
          customer_name: name.trim(),
          customer_email: email.trim().toLowerCase(),
          customer_phone: phone.trim(),
          delivery_address: address.trim(),
          delivery_method: selectedDelivery.name,
          delivery_notes: formData.get('notes') as string || null,
          delivery_price: selectedDelivery.cost,
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'pending',
        }])
        .select()
        .single();

      if (orderError || !order) {
        console.error('Order creation error:', orderError);
        throw new Error('Failed to create order');
      }

      // Create order items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        price: item.price,
        quantity: item.quantity,
        image_url: item.image_url,
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Order items error:', itemsError);
      }

      // Prepare PayFast payment data
      const mode = payfastSettings.payfast_mode || 'sandbox';
      const payfastUrl = mode === 'live'
        ? 'https://www.payfast.co.za/eng/process'
        : 'https://sandbox.payfast.co.za/eng/process';

      const baseUrl = window.location.origin;
      const paymentData = {
        merchant_id: payfastSettings.payfast_merchant_id,
        merchant_key: payfastSettings.payfast_merchant_key,
        return_url: `${baseUrl}/payment-success?order_id=${order.id}`,
        cancel_url: `${baseUrl}/payment-cancelled?order_id=${order.id}`,
        notify_url: `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/payfast-notify`,
        name_first: name.split(' ')[0] || name,
        name_last: name.split(' ').slice(1).join(' ') || '',
        email_address: email.trim().toLowerCase(),
        cell_number: phone.trim(),
        m_payment_id: order.id,
        amount: totalAmount.toFixed(2),
        item_name: `Order #${order.id.slice(0, 8)}`,
        item_description: `${items.length} item(s)`,
      };

      // Clear cart before redirecting to payment
      clearCart();

      // Create a form and submit it to PayFast
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = payfastUrl;

      Object.entries(paymentData).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value as string;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error: any) {
      console.error('Order error:', error);
      const errorMessage = error.message || 'Failed to place order. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  const subtotal = getTotalPrice();
  const deliveryCost = selectedDelivery?.cost || 0;
  const total = subtotal + deliveryCost - discount;

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
                  {loadingDelivery ? (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">Loading delivery options...</p>
                    </div>
                  ) : error ? (
                    <div className="py-8 text-center">
                      <p className="text-destructive mb-4">{error}</p>
                      <Button onClick={loadDeliveryOptions} variant="outline" size="sm">
                        Retry
                      </Button>
                    </div>
                  ) : deliveryOptions.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-muted-foreground">No delivery options available</p>
                    </div>
                  ) : (
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
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              {/* Trust Badges */}
              <Card>
                <CardContent className="py-4">
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground justify-center">
                    <div className="flex items-center gap-1">
                      <Lock className="h-3 w-3" />
                      <span>Secure Checkout</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      <span>Data Protected</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Truck className="h-3 w-3" />
                      <span>Fast Delivery</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

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

                  {/* Coupon Section */}
                  <div className="border-t pt-4">
                    {appliedCoupon ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium">{appliedCoupon.code}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={removeCoupon}
                          >
                            Remove
                          </Button>
                        </div>
                        <p className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Coupon applied successfully!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label htmlFor="coupon" className="text-sm flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          Have a coupon code?
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="coupon"
                            placeholder="Enter code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={applyCoupon}
                            disabled={couponLoading}
                          >
                            {couponLoading ? 'Checking...' : 'Apply'}
                          </Button>
                        </div>
                      </div>
                    )}
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
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount</span>
                        <span>-R {discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total</span>
                      <span>R {total.toFixed(2)}</span>
                    </div>
                    {discount > 0 && (
                      <p className="text-xs text-green-600 text-right">
                        You saved R {discount.toFixed(2)}!
                      </p>
                    )}
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={loading}>
                    <Lock className="h-4 w-4 mr-2" />
                    {loading ? 'Processing...' : 'Place Secure Order'}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Your payment information is secure and encrypted
                  </p>
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
