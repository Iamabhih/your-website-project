import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  ArrowLeft, RotateCcw, Search, MoreVertical, Loader2,
  Package, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle,
  DollarSign, Eye, MessageSquare, Truck, User, Calendar, Filter
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';

interface ReturnRequest {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'refunded';
  reason: string;
  reason_details: string;
  items: ReturnItem[];
  refund_amount: number;
  refund_method: string;
  created_at: string;
  updated_at: string;
  admin_notes: string;
  tracking_number?: string;
  return_label_url?: string;
}

interface ReturnItem {
  product_id: string;
  product_name: string;
  variant_name?: string;
  quantity: number;
  price: number;
  condition: 'unopened' | 'opened' | 'damaged' | 'defective';
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  created_at: string;
  items: any[];
}

const RETURN_REASONS = [
  { value: 'wrong_item', label: 'Wrong item received' },
  { value: 'damaged', label: 'Item arrived damaged' },
  { value: 'defective', label: 'Item is defective' },
  { value: 'not_as_described', label: 'Not as described' },
  { value: 'no_longer_needed', label: 'No longer needed' },
  { value: 'better_price', label: 'Found better price' },
  { value: 'other', label: 'Other' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-success/10 text-success',
  refunded: 'bg-emerald-100 text-emerald-800',
};

// Mock data since we don't have a returns table
const MOCK_RETURNS: ReturnRequest[] = [
  {
    id: '1',
    order_id: 'ORD-001',
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    status: 'pending',
    reason: 'damaged',
    reason_details: 'Package was crushed during shipping',
    items: [
      { product_id: '1', product_name: 'Premium Vape Kit', quantity: 1, price: 599, condition: 'damaged' }
    ],
    refund_amount: 599,
    refund_method: 'original_payment',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    admin_notes: '',
  },
  {
    id: '2',
    order_id: 'ORD-002',
    customer_name: 'Jane Smith',
    customer_email: 'jane@example.com',
    status: 'approved',
    reason: 'wrong_item',
    reason_details: 'Received wrong flavor',
    items: [
      { product_id: '2', product_name: 'E-Liquid 50ml', variant_name: 'Mint', quantity: 2, price: 149, condition: 'unopened' }
    ],
    refund_amount: 298,
    refund_method: 'store_credit',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date().toISOString(),
    admin_notes: 'Customer will ship back items',
  },
];

export default function Returns() {
  const navigate = useNavigate();
  const [returns, setReturns] = useState<ReturnRequest[]>(MOCK_RETURNS);
  const [filteredReturns, setFilteredReturns] = useState<ReturnRequest[]>(MOCK_RETURNS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReturn, setSelectedReturn] = useState<ReturnRequest | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [saving, setSaving] = useState(false);

  // Create return form
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [returnDetails, setReturnDetails] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState('original_payment');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    loadOrders();
    filterReturns();
  }, []);

  useEffect(() => {
    filterReturns();
  }, [returns, searchQuery, statusFilter]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          customer_name,
          customer_email,
          total_amount,
          created_at,
          order_items (
            product_id,
            product_name,
            quantity,
            unit_price
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        setOrders(data.map(order => ({
          ...order,
          items: order.order_items || []
        })));
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const filterReturns = () => {
    let filtered = [...returns];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.order_id.toLowerCase().includes(query) ||
        r.customer_name.toLowerCase().includes(query) ||
        r.customer_email.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    setFilteredReturns(filtered);
  };

  const updateReturnStatus = (returnId: string, newStatus: ReturnRequest['status']) => {
    setReturns(prev => prev.map(r =>
      r.id === returnId ? { ...r, status: newStatus, updated_at: new Date().toISOString() } : r
    ));
    toast.success(`Return status updated to ${newStatus}`);
  };

  const handleCreateReturn = () => {
    if (!selectedOrderId || !returnReason) {
      toast.error('Please fill in required fields');
      return;
    }

    const order = orders.find(o => o.id === selectedOrderId);
    if (!order) return;

    const newReturn: ReturnRequest = {
      id: Date.now().toString(),
      order_id: selectedOrderId,
      customer_name: order.customer_name,
      customer_email: order.customer_email,
      status: 'pending',
      reason: returnReason,
      reason_details: returnDetails,
      items: order.items.map((item: any) => ({
        product_id: item.product_id,
        product_name: item.product_name,
        quantity: item.quantity,
        price: item.unit_price,
        condition: 'unopened' as const,
      })),
      refund_amount: refundAmount || order.total_amount,
      refund_method: refundMethod,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      admin_notes: adminNotes,
    };

    setReturns(prev => [newReturn, ...prev]);
    setShowCreateDialog(false);
    resetForm();
    toast.success('Return request created');
  };

  const resetForm = () => {
    setSelectedOrderId('');
    setReturnReason('');
    setReturnDetails('');
    setRefundAmount(0);
    setRefundMethod('original_payment');
    setAdminNotes('');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'processing': return <Truck className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'refunded': return <DollarSign className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const stats = {
    total: returns.length,
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    processing: returns.filter(r => r.status === 'processing').length,
    completed: returns.filter(r => ['completed', 'refunded'].includes(r.status)).length,
    totalRefunded: returns.filter(r => r.status === 'refunded').reduce((sum, r) => sum + r.refund_amount, 0),
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/admin')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Returns & Refunds</h1>
            <p className="text-muted-foreground">Manage return requests and process refunds</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { loadOrders(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Create Return
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <RotateCcw className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.approved}</p>
                <p className="text-sm text-muted-foreground">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.processing}</p>
                <p className="text-sm text-muted-foreground">Processing</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">R{stats.totalRefunded.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">Refunded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order ID, customer name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Returns Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RotateCcw className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No return requests found</p>
              <p className="text-sm">Return requests will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return ID</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map((returnReq) => (
                  <TableRow key={returnReq.id}>
                    <TableCell className="font-mono text-sm">
                      RET-{returnReq.id.slice(-6).toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        className="p-0 h-auto"
                        onClick={() => navigate(`/admin/orders?search=${returnReq.order_id}`)}
                      >
                        {returnReq.order_id}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{returnReq.customer_name}</p>
                        <p className="text-sm text-muted-foreground">{returnReq.customer_email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">
                        {RETURN_REASONS.find(r => r.value === returnReq.reason)?.label || returnReq.reason}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      R{returnReq.refund_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("gap-1", STATUS_COLORS[returnReq.status])}>
                        {getStatusIcon(returnReq.status)}
                        <span className="capitalize">{returnReq.status}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(returnReq.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedReturn(returnReq);
                            setShowDetailDialog(true);
                          }}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {returnReq.status === 'pending' && (
                            <>
                              <DropdownMenuItem onClick={() => updateReturnStatus(returnReq.id, 'approved')}>
                                <CheckCircle className="h-4 w-4 mr-2 text-success" />
                                Approve
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => updateReturnStatus(returnReq.id, 'rejected')}>
                                <XCircle className="h-4 w-4 mr-2 text-red-600" />
                                Reject
                              </DropdownMenuItem>
                            </>
                          )}
                          {returnReq.status === 'approved' && (
                            <DropdownMenuItem onClick={() => updateReturnStatus(returnReq.id, 'processing')}>
                              <Truck className="h-4 w-4 mr-2" />
                              Mark Processing
                            </DropdownMenuItem>
                          )}
                          {returnReq.status === 'processing' && (
                            <DropdownMenuItem onClick={() => updateReturnStatus(returnReq.id, 'completed')}>
                              <Package className="h-4 w-4 mr-2" />
                              Mark Received
                            </DropdownMenuItem>
                          )}
                          {returnReq.status === 'completed' && (
                            <DropdownMenuItem onClick={() => updateReturnStatus(returnReq.id, 'refunded')}>
                              <DollarSign className="h-4 w-4 mr-2 text-emerald-600" />
                              Issue Refund
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Return Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Return Request</DialogTitle>
            <DialogDescription>
              Create a return request for an existing order
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Select Order *</Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an order..." />
                </SelectTrigger>
                <SelectContent>
                  {orders.slice(0, 20).map(order => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.id.slice(0, 8)} - {order.customer_name} (R{order.total_amount.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Return Reason *</Label>
              <Select value={returnReason} onValueChange={setReturnReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason..." />
                </SelectTrigger>
                <SelectContent>
                  {RETURN_REASONS.map(reason => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea
                placeholder="Additional details about the return..."
                value={returnDetails}
                onChange={(e) => setReturnDetails(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Refund Amount</Label>
                <Input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Refund Method</Label>
                <Select value={refundMethod} onValueChange={setRefundMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="original_payment">Original Payment Method</SelectItem>
                    <SelectItem value="store_credit">Store Credit</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Admin Notes</Label>
              <Textarea
                placeholder="Internal notes..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateReturn} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Return Details</DialogTitle>
            <DialogDescription>
              RET-{selectedReturn?.id.slice(-6).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          {selectedReturn && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedReturn.customer_name}</p>
                  <p className="text-sm">{selectedReturn.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-medium">{selectedReturn.order_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={cn("gap-1 mt-1", STATUS_COLORS[selectedReturn.status])}>
                    {getStatusIcon(selectedReturn.status)}
                    <span className="capitalize">{selectedReturn.status}</span>
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Refund Amount</p>
                  <p className="font-medium text-lg">R{selectedReturn.refund_amount.toFixed(2)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Reason</p>
                <p className="font-medium">
                  {RETURN_REASONS.find(r => r.value === selectedReturn.reason)?.label}
                </p>
                {selectedReturn.reason_details && (
                  <p className="text-sm mt-1">{selectedReturn.reason_details}</p>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Items</p>
                <div className="border rounded-lg divide-y">
                  {selectedReturn.items.map((item, i) => (
                    <div key={i} className="p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        {item.variant_name && (
                          <p className="text-sm text-muted-foreground">{item.variant_name}</p>
                        )}
                        <Badge variant="outline" className="mt-1 text-xs capitalize">
                          {item.condition}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">R{item.price.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedReturn.admin_notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Admin Notes</p>
                  <p className="text-sm bg-muted p-3 rounded">{selectedReturn.admin_notes}</p>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                <span>Created: {new Date(selectedReturn.created_at).toLocaleString()}</span>
                <span>Updated: {new Date(selectedReturn.updated_at).toLocaleString()}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>Close</Button>
            {selectedReturn?.status === 'pending' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    updateReturnStatus(selectedReturn.id, 'rejected');
                    setShowDetailDialog(false);
                  }}
                >
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    updateReturnStatus(selectedReturn.id, 'approved');
                    setShowDetailDialog(false);
                  }}
                >
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
