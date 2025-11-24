import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, Users, Package, Settings, BarChart3, Tag, Star, MessageCircle, Send } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  pendingOrders: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    pendingOrders: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // Get order statistics using aggregation
    const { data: orderStats, error: orderError } = await supabase
      .rpc('get_order_statistics')
      .single();

    if (!orderError && orderStats) {
      setStats(prev => ({
        ...prev,
        totalRevenue: orderStats.total_revenue || 0,
        totalOrders: orderStats.total_orders || 0,
        pendingOrders: orderStats.pending_orders || 0,
      }));
    } else {
      // Fallback: Get limited orders for stats
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, status')
        .order('created_at', { ascending: false })
        .limit(1000); // Limit to most recent 1000 orders

      if (orders) {
        const revenue = orders.reduce((sum, order) => sum + Number(order.total_amount), 0);
        const pending = orders.filter(o => o.status === 'pending').length;

        setStats(prev => ({
          ...prev,
          totalRevenue: revenue,
          totalOrders: orders.length,
          pendingOrders: pending,
        }));
      }
    }

    // Get total customers count
    const { count } = await supabase
      .from('user_roles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    if (count !== null) {
      setStats(prev => ({ ...prev, totalCustomers: count }));
    }
  };

  const statCards = [
    {
      title: 'Total Revenue',
      value: `R ${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: 'text-blue-600',
    },
    {
      title: 'Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-purple-600',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Package,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-foreground mb-8">Admin Dashboard</h1>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <a href="/admin/analytics" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <BarChart3 className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold">Analytics</h3>
                  <p className="text-sm text-muted-foreground">View detailed reports</p>
                </a>
                <a href="/admin/products" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Package className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold">Products</h3>
                  <p className="text-sm text-muted-foreground">Add or edit products</p>
                </a>
                <a href="/admin/orders" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <ShoppingCart className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold">Orders</h3>
                  <p className="text-sm text-muted-foreground">Process orders</p>
                </a>
                <a href="/admin/customers" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Users className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold">Customers</h3>
                  <p className="text-sm text-muted-foreground">Manage customers</p>
                </a>
                <a href="/admin/coupons" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Tag className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold">Coupons</h3>
                  <p className="text-sm text-muted-foreground">Manage discounts</p>
                </a>
                <a href="/admin/reviews" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Star className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold">Reviews</h3>
                  <p className="text-sm text-muted-foreground">Moderate reviews</p>
                </a>
                <a href="/admin/telegram-chats" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <MessageCircle className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold">Telegram Chats</h3>
                  <p className="text-sm text-muted-foreground">Manage conversations</p>
                </a>
                <a href="/admin/telegram-customers" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Users className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold">Telegram Customers</h3>
                  <p className="text-sm text-muted-foreground">View bot users</p>
                </a>
                <a href="/admin/telegram-broadcast" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Send className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold">Broadcast</h3>
                  <p className="text-sm text-muted-foreground">Send messages</p>
                </a>
                <a href="/admin/delivery-options" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Package className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold">Delivery</h3>
                  <p className="text-sm text-muted-foreground">Configure delivery</p>
                </a>
                <a href="/admin/settings" className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <Settings className="h-8 w-8 mb-2 text-primary" />
                  <h3 className="font-semibold">Settings</h3>
                  <p className="text-sm text-muted-foreground">Configure system</p>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
