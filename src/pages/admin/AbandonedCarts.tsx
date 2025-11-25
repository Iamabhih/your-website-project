import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ShoppingCart, DollarSign, Bell, CheckCircle2, Trash2, Send, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface AbandonedCart {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  telegram_chat_id: string | null;
  cart_items: CartItem[];
  total_amount: number;
  created_at: string;
  reminded_at: string | null;
  recovered: boolean;
}

export default function AbandonedCarts() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    value: 0,
    reminded: 0,
    recovered: 0,
  });

  useEffect(() => {
    loadCarts();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [carts]);

  const loadCarts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCarts((data || []) as unknown as AbandonedCart[]);
    } catch (error: any) {
      console.error('Error loading abandoned carts:', error);
      toast.error('Failed to load abandoned carts');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    setStats({
      total: carts.length,
      value: carts.reduce((sum, cart) => sum + Number(cart.total_amount), 0),
      reminded: carts.filter(c => c.reminded_at !== null).length,
      recovered: carts.filter(c => c.recovered).length,
    });
  };

  const sendReminder = async (cart: AbandonedCart) => {
    if (!cart.telegram_chat_id) {
      toast.error('Customer does not have Telegram linked');
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('check-abandoned-carts', {
        body: { cartId: cart.id }
      });

      if (error) throw error;

      toast.success('Reminder sent successfully');
      loadCarts();
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast.error('Failed to send reminder');
    }
  };

  const markAsRecovered = async (cartId: string) => {
    try {
      const { error } = await supabase
        .from('abandoned_carts')
        .update({ recovered: true })
        .eq('id', cartId);

      if (error) throw error;

      toast.success('Cart marked as recovered');
      loadCarts();
    } catch (error: any) {
      console.error('Error marking cart as recovered:', error);
      toast.error('Failed to mark as recovered');
    }
  };

  const deleteCart = async (cartId: string) => {
    if (!confirm('Are you sure you want to delete this abandoned cart?')) return;

    try {
      const { error } = await supabase
        .from('abandoned_carts')
        .delete()
        .eq('id', cartId);

      if (error) throw error;

      toast.success('Cart deleted successfully');
      loadCarts();
    } catch (error: any) {
      console.error('Error deleting cart:', error);
      toast.error('Failed to delete cart');
    }
  };

  const filteredCarts = carts.filter(cart => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'new') return !cart.reminded_at && !cart.recovered;
    if (filterStatus === 'reminded') return cart.reminded_at && !cart.recovered;
    if (filterStatus === 'recovered') return cart.recovered;
    return true;
  });

  const getStatusBadge = (cart: AbandonedCart) => {
    if (cart.recovered) {
      return <Badge variant="default" className="bg-success">Recovered</Badge>;
    }
    if (cart.reminded_at) {
      return <Badge variant="secondary">Reminded</Badge>;
    }
    return <Badge variant="outline">New</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-foreground">Abandoned Carts</h1>
          <Button onClick={loadCarts} variant="outline" size="sm">
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Abandoned</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R {stats.value.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reminded</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.reminded}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recovered</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recovered}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total > 0 ? ((stats.recovered / stats.total) * 100).toFixed(1) : 0}% recovery rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex gap-4 items-center">
          <label className="text-sm font-medium">Filter by status:</label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Carts</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="reminded">Reminded</SelectItem>
              <SelectItem value="recovered">Recovered</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Carts List */}
        {loading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Loading abandoned carts...</p>
            </CardContent>
          </Card>
        ) : filteredCarts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No abandoned carts found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredCarts.map((cart) => (
              <Card key={cart.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">
                          {cart.customer_name || 'Anonymous Customer'}
                        </h3>
                        {getStatusBadge(cart)}
                        {cart.telegram_chat_id && (
                          <Badge variant="outline" className="gap-1">
                            <MessageCircle className="h-3 w-3" />
                            Telegram Linked
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        {cart.customer_email && <p>Email: {cart.customer_email}</p>}
                        {cart.customer_phone && <p>Phone: {cart.customer_phone}</p>}
                        <p>Created: {format(new Date(cart.created_at), 'PPp')}</p>
                        {cart.reminded_at && (
                          <p>Reminded: {format(new Date(cart.reminded_at), 'PPp')}</p>
                        )}
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">Cart Items:</p>
                        <div className="flex flex-wrap gap-2">
                          {cart.cart_items.map((item: any, idx: number) => (
                            <Badge key={idx} variant="secondary">
                              {item.name} x{item.quantity}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <p className="text-lg font-semibold text-primary">
                        Total: R {Number(cart.total_amount).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2">
                      {!cart.recovered && cart.telegram_chat_id && (
                        <Button
                          onClick={() => sendReminder(cart)}
                          variant="default"
                          size="sm"
                          className="gap-2"
                        >
                          <Send className="h-4 w-4" />
                          Send Reminder
                        </Button>
                      )}
                      {!cart.recovered && (
                        <Button
                          onClick={() => markAsRecovered(cart.id)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark Recovered
                        </Button>
                      )}
                      <Button
                        onClick={() => deleteCart(cart.id)}
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
