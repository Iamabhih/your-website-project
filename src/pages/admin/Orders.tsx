import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  Search,
  Download,
  Loader2,
  Package,
  ChevronLeft,
  ChevronRight,
  Eye,
  Mail,
  Phone,
  MapPin,
  Truck,
  Calendar,
  CreditCard,
  RefreshCw
} from 'lucide-react';

interface OrderItem {
  id: string;
  product_name: string;
  price: number;
  quantity: number;
  image_url: string | null;
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  delivery_method: string;
  delivery_price: number | null;
  delivery_notes: string | null;
  total_amount: number;
  status: string;
  payment_status: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'processing', label: 'Processing', color: 'bg-blue-100 text-blue-800' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-800' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPayment, setFilterPayment] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Order detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Bulk operations
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, filterStatus, filterPayment, searchQuery, dateRange]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setOrders(data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.id.toLowerCase().includes(query) ||
        o.customer_name.toLowerCase().includes(query) ||
        o.customer_email.toLowerCase().includes(query) ||
        o.customer_phone.includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(o => o.status === filterStatus);
    }

    // Payment status filter
    if (filterPayment !== 'all') {
      filtered = filtered.filter(o => o.payment_status === filterPayment);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'quarter':
          startDate = new Date(now.setMonth(now.getMonth() - 3));
          break;
        default:
          startDate = new Date(0);
      }

      filtered = filtered.filter(o => new Date(o.created_at) >= startDate);
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const loadOrderItems = async (orderId: string) => {
    try {
      setLoadingItems(true);
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      setOrderItems(data || []);
    } catch (error) {
      toast.error('Failed to load order items');
    } finally {
      setLoadingItems(false);
    }
  };

  const openOrderDetail = async (order: Order) => {
    setSelectedOrder(order);
    await loadOrderItems(order.id);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus as Database['public']['Enums']['order_status'] })
        .eq('id', orderId);

      if (error) throw error;
      toast.success('Order status updated');
      loadOrders();

      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      toast.error('Failed to update order status');
    }
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    if (selectedOrders.size === 0) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus as Database['public']['Enums']['order_status'] })
        .in('id', Array.from(selectedOrders));

      if (error) throw error;
      toast.success(`${selectedOrders.size} orders updated`);
      setSelectedOrders(new Set());
      loadOrders();
    } catch (error) {
      toast.error('Failed to update orders');
    }
  };

  const exportToCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Email', 'Phone', 'Total', 'Status', 'Payment', 'Delivery Method'];
    const rows = filteredOrders.map(o => [
      o.id.slice(0, 8),
      new Date(o.created_at).toLocaleString('en-ZA'),
      o.customer_name,
      o.customer_email,
      o.customer_phone,
      o.total_amount.toFixed(2),
      o.status,
      o.payment_status,
      o.delivery_method
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Orders exported');
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === paginatedOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(paginatedOrders.map(o => o.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedOrders);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedOrders(newSelected);
  };

  const getStatusBadge = (status: string) => {
    const option = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <Badge variant="secondary" className={option?.color || ''}>
        {option?.label || status}
      </Badge>
    );
  };

  const getPaymentBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    };
    return (
      <Badge variant="secondary" className={colors[status] || ''}>
        {status}
      </Badge>
    );
  };

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Stats
  const totalRevenue = orders.filter(o => o.payment_status === 'paid').reduce((sum, o) => sum + o.total_amount, 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold">Orders</h1>
            <p className="text-muted-foreground mt-1">
              {filteredOrders.length} orders • R {totalRevenue.toFixed(2)} revenue • {pendingOrders} pending
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadOrders}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order ID, customer name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map(s => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterPayment} onValueChange={setFilterPayment}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="quarter">Last 3 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedOrders.size > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <span className="font-medium">{selectedOrders.size} orders selected</span>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={() => setSelectedOrders(new Set())}>
                Clear
              </Button>
              {STATUS_OPTIONS.map(s => (
                <Button key={s.value} variant="outline" size="sm" onClick={() => bulkUpdateStatus(s.value)}>
                  Mark {s.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Orders Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No orders found</h3>
              <p className="text-muted-foreground">
                {searchQuery || filterStatus !== 'all' || filterPayment !== 'all' || dateRange !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Orders will appear here once customers make purchases'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedOrders.size === paginatedOrders.length && paginatedOrders.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedOrders.has(order.id)}
                        onCheckedChange={() => toggleSelect(order.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">#{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground">{order.delivery_method}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{order.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{order.customer_email}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{new Date(order.created_at).toLocaleDateString('en-ZA')}</p>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}</p>
                    </TableCell>
                    <TableCell className="text-right font-medium">R {order.total_amount.toFixed(2)}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell>{getPaymentBadge(order.payment_status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openOrderDetail(order)}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="flex items-center px-3 text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Order Detail Modal */}
        <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order #{selectedOrder?.id.slice(0, 8)}</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-6">
                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" /> Date
                    </p>
                    <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString('en-ZA')}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Payment
                    </p>
                    {getPaymentBadge(selectedOrder.payment_status)}
                  </div>
                </div>

                <Separator />

                {/* Customer Info */}
                <div>
                  <h4 className="font-semibold mb-3">Customer Information</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <span className="text-muted-foreground w-20">Name:</span>
                      {selectedOrder.customer_name}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedOrder.customer_email}`} className="text-primary hover:underline">
                        {selectedOrder.customer_email}
                      </a>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a href={`tel:${selectedOrder.customer_phone}`} className="text-primary hover:underline">
                        {selectedOrder.customer_phone}
                      </a>
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Delivery Info */}
                <div>
                  <h4 className="font-semibold mb-3">Delivery Information</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      {selectedOrder.delivery_method}
                      {selectedOrder.delivery_price && ` (R ${selectedOrder.delivery_price.toFixed(2)})`}
                    </p>
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      {selectedOrder.delivery_address}
                    </p>
                    {selectedOrder.delivery_notes && (
                      <p className="text-muted-foreground italic">Note: {selectedOrder.delivery_notes}</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Order Items */}
                <div>
                  <h4 className="font-semibold mb-3">Order Items</h4>
                  {loadingItems ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orderItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.product_name} className="w-12 h-12 object-cover rounded" />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{item.product_name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.quantity} × R {item.price.toFixed(2)}</p>
                          </div>
                          <p className="font-medium">R {(item.quantity * item.price).toFixed(2)}</p>
                        </div>
                      ))}
                      <Separator />
                      <div className="flex justify-between items-center font-bold text-lg">
                        <span>Total</span>
                        <span>R {selectedOrder.total_amount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Update Status */}
                <div>
                  <h4 className="font-semibold mb-3">Update Status</h4>
                  <Select value={selectedOrder.status} onValueChange={(v) => updateOrderStatus(selectedOrder.id, v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
