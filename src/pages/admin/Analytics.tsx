import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  Download,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { toast } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface SalesData {
  date: string;
  revenue: number;
  orders: number;
}

interface ProductSales {
  name: string;
  revenue: number;
  quantity: number;
}

interface CategorySales {
  category: string;
  value: number;
}

interface CustomerMetric {
  email: string;
  total_spent: number;
  order_count: number;
  avg_order_value: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState('30');
  const [loading, setLoading] = useState(true);

  // Metrics
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [revenueGrowth, setRevenueGrowth] = useState(0);
  const [ordersGrowth, setOrdersGrowth] = useState(0);

  // Charts data
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [productSales, setProductSales] = useState<ProductSales[]>([]);
  const [categorySales, setCategorySales] = useState<CategorySales[]>([]);
  const [topCustomers, setTopCustomers] = useState<CustomerMetric[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const days = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get orders in date range
      const { data: orders, error } = await supabase
        .from('orders')
        .select('*, order_items(quantity, price, products(name, category))')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Calculate metrics
      const revenue = orders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const orderCount = orders?.length || 0;
      const avgOrder = orderCount > 0 ? revenue / orderCount : 0;

      setTotalRevenue(revenue);
      setTotalOrders(orderCount);
      setAvgOrderValue(avgOrder);

      // Calculate growth (compare to previous period)
      const prevStartDate = new Date(startDate);
      prevStartDate.setDate(prevStartDate.getDate() - days);

      const { data: prevOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .gte('created_at', prevStartDate.toISOString())
        .lt('created_at', startDate.toISOString());

      const prevRevenue = prevOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
      const prevOrderCount = prevOrders?.length || 0;

      const revGrowth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
      const ordGrowth = prevOrderCount > 0 ? ((orderCount - prevOrderCount) / prevOrderCount) * 100 : 0;

      setRevenueGrowth(revGrowth);
      setOrdersGrowth(ordGrowth);

      // Sales over time
      const salesByDate: { [key: string]: SalesData } = {};
      orders?.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('en-ZA');
        if (!salesByDate[date]) {
          salesByDate[date] = { date, revenue: 0, orders: 0 };
        }
        salesByDate[date].revenue += Number(order.total_amount);
        salesByDate[date].orders += 1;
      });
      setSalesData(Object.values(salesByDate));

      // Product sales
      const productSalesMap: { [key: string]: ProductSales } = {};
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const name = item.products?.name || 'Unknown';
          if (!productSalesMap[name]) {
            productSalesMap[name] = { name, revenue: 0, quantity: 0 };
          }
          productSalesMap[name].revenue += Number(item.price) * Number(item.quantity);
          productSalesMap[name].quantity += Number(item.quantity);
        });
      });
      const sortedProducts = Object.values(productSalesMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      setProductSales(sortedProducts);

      // Category sales
      const categorySalesMap: { [key: string]: number } = {};
      orders?.forEach(order => {
        order.order_items?.forEach((item: any) => {
          const category = item.products?.category || 'Other';
          categorySalesMap[category] = (categorySalesMap[category] || 0) + (Number(item.price) * Number(item.quantity));
        });
      });
      const categoryData = Object.entries(categorySalesMap).map(([category, value]) => ({
        category,
        value
      }));
      setCategorySales(categoryData);

      // Top customers
      const { data: customers } = await supabase
        .from('orders')
        .select('customer_email, total_amount')
        .gte('created_at', startDate.toISOString());

      const customerMap: { [key: string]: { total: number; count: number } } = {};
      customers?.forEach(order => {
        const email = order.customer_email;
        if (!customerMap[email]) {
          customerMap[email] = { total: 0, count: 0 };
        }
        customerMap[email].total += Number(order.total_amount);
        customerMap[email].count += 1;
      });

      const topCustomersData = Object.entries(customerMap)
        .map(([email, data]) => ({
          email,
          total_spent: data.total,
          order_count: data.count,
          avg_order_value: data.total / data.count
        }))
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 10);

      setTopCustomers(topCustomersData);

    } catch (error: any) {
      toast.error('Failed to load analytics: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Create CSV
    const headers = ['Date', 'Revenue', 'Orders'];
    const rows = salesData.map(d => [d.date, d.revenue.toFixed(2), d.orders]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateRange}days.csv`;
    a.click();
    toast.success('Analytics exported!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold">Analytics Dashboard</h1>
            <div className="flex gap-4">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px]">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="365">Last year</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportData} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R {totalRevenue.toFixed(2)}</div>
                <div className={`text-xs flex items-center ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {revenueGrowth >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                  {Math.abs(revenueGrowth).toFixed(1)}% from last period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalOrders}</div>
                <div className={`text-xs flex items-center ${ordersGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {ordersGrowth >= 0 ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                  {Math.abs(ordersGrowth).toFixed(1)}% from last period
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R {avgOrderValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Per transaction</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Top Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{topCustomers.length}</div>
                <p className="text-xs text-muted-foreground">Active buyers</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Over Time</CardTitle>
                  <CardDescription>Daily revenue and order trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Revenue (R)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Orders Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Orders Over Time</CardTitle>
                    <CardDescription>Daily order volume</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={salesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="orders" fill="#3b82f6" name="Orders" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Category Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sales by Category</CardTitle>
                    <CardDescription>Revenue distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categorySales}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categorySales.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <CardTitle>Top Selling Products</CardTitle>
                  <CardDescription>Best performing products by revenue</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {productSales.map((product, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold">{product.name}</p>
                              <p className="text-sm text-muted-foreground">{product.quantity} units sold</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">R {product.revenue.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            R {(product.revenue / product.quantity).toFixed(2)} avg
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Customers Tab */}
            <TabsContent value="customers">
              <Card>
                <CardHeader>
                  <CardTitle>Top Customers</CardTitle>
                  <CardDescription>Customers by total spend</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topCustomers.map((customer, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold">{customer.email}</p>
                              <p className="text-sm text-muted-foreground">{customer.order_count} orders</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">R {customer.total_spent.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            R {customer.avg_order_value.toFixed(2)} avg order
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
