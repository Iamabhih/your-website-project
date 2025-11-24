import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Search,
  Users,
  MessageSquare,
  Send,
  Eye,
  Edit2,
  Trash2,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Bell,
  BellOff,
  UserCheck,
  Clock,
  Mail,
  Phone,
  AtSign,
  X,
  History,
  ShoppingBag
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface TelegramCustomer {
  id: string;
  chat_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  customer_email: string | null;
  phone: string | null;
  created_at: string;
  last_interaction: string;
  notification_preferences: {
    orders?: boolean;
    promotions?: boolean;
    stock_alerts?: boolean;
  } | null;
  preferences: Record<string, any> | null;
}

interface CustomerOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
}

interface NotificationHistory {
  id: string;
  notification_type: string;
  message_text: string;
  sent_at: string;
  order_id: string;
}

interface CustomerStats {
  total: number;
  activeThisWeek: number;
  withEmail: number;
  withPhone: number;
}

const ITEMS_PER_PAGE = 10;

export default function TelegramCustomers() {
  const [customers, setCustomers] = useState<TelegramCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [contactFilter, setContactFilter] = useState<string>('all');

  // Modal states
  const [detailCustomer, setDetailCustomer] = useState<TelegramCustomer | null>(null);
  const [editCustomer, setEditCustomer] = useState<TelegramCustomer | null>(null);
  const [messageCustomer, setMessageCustomer] = useState<TelegramCustomer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<CustomerOrder[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<NotificationHistory[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Form states
  const [editForm, setEditForm] = useState({ email: '', phone: '', notes: '' });
  const [messageText, setMessageText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const [stats, setStats] = useState<CustomerStats>({
    total: 0,
    activeThisWeek: 0,
    withEmail: 0,
    withPhone: 0,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('telegram_customers')
        .select('*')
        .order('last_interaction', { ascending: false });

      if (error) throw error;

      const customersData = (data || []) as TelegramCustomer[];
      setCustomers(customersData);
      calculateStats(customersData);
    } catch (error: any) {
      toast.error('Failed to load Telegram customers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: TelegramCustomer[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    setStats({
      total: data.length,
      activeThisWeek: data.filter(c => new Date(c.last_interaction) >= weekAgo).length,
      withEmail: data.filter(c => c.email || c.customer_email).length,
      withPhone: data.filter(c => c.phone).length,
    });
  };

  const loadCustomerDetails = async (customer: TelegramCustomer) => {
    setLoadingDetails(true);
    try {
      // Load orders if customer has email linked
      const customerEmail = customer.email || customer.customer_email;
      if (customerEmail) {
        const { data: orders } = await supabase
          .from('orders')
          .select('id, created_at, total_amount, status')
          .eq('customer_email', customerEmail)
          .order('created_at', { ascending: false })
          .limit(10);
        setCustomerOrders(orders || []);
      } else {
        setCustomerOrders([]);
      }

      // Load notification history
      const { data: notifications } = await supabase
        .from('telegram_order_notifications')
        .select('*')
        .eq('chat_id', customer.chat_id)
        .order('sent_at', { ascending: false })
        .limit(20);
      setNotificationHistory(notifications || []);
    } catch (error) {
      console.error('Error loading customer details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const viewCustomerDetails = (customer: TelegramCustomer) => {
    setDetailCustomer(customer);
    loadCustomerDetails(customer);
  };

  const openEditModal = (customer: TelegramCustomer) => {
    setEditCustomer(customer);
    setEditForm({
      email: customer.email || customer.customer_email || '',
      phone: customer.phone || '',
      notes: (customer.preferences as any)?.notes || '',
    });
  };

  const saveCustomerEdit = async () => {
    if (!editCustomer) return;

    try {
      const { error } = await supabase
        .from('telegram_customers')
        .update({
          email: editForm.email || null,
          phone: editForm.phone || null,
          preferences: {
            ...(editCustomer.preferences || {}),
            notes: editForm.notes,
          },
        })
        .eq('id', editCustomer.id);

      if (error) throw error;

      toast.success('Customer updated successfully');
      setEditCustomer(null);
      loadCustomers();
    } catch (error: any) {
      toast.error('Failed to update customer: ' + error.message);
    }
  };

  const updateNotificationPreferences = async (customer: TelegramCustomer, key: string, value: boolean) => {
    try {
      const currentPrefs = customer.notification_preferences || {};
      const newPrefs = { ...currentPrefs, [key]: value };

      const { error } = await supabase
        .from('telegram_customers')
        .update({ notification_preferences: newPrefs })
        .eq('id', customer.id);

      if (error) throw error;

      toast.success('Notification preferences updated');
      loadCustomers();
    } catch (error: any) {
      toast.error('Failed to update preferences: ' + error.message);
    }
  };

  const sendDirectMessage = async () => {
    if (!messageCustomer || !messageText.trim()) return;

    setSendingMessage(true);
    try {
      const { error } = await supabase.functions.invoke('send-to-telegram', {
        body: {
          chat_id: messageCustomer.chat_id,
          text: messageText,
        },
      });

      if (error) throw error;

      toast.success('Message sent successfully');
      setMessageText('');
      setMessageCustomer(null);
    } catch (error: any) {
      toast.error('Failed to send message: ' + error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const deleteCustomer = async (customer: TelegramCustomer) => {
    try {
      const { error } = await supabase
        .from('telegram_customers')
        .delete()
        .eq('id', customer.id);

      if (error) throw error;

      toast.success('Customer removed');
      loadCustomers();
    } catch (error: any) {
      toast.error('Failed to remove customer: ' + error.message);
    }
  };

  const bulkDelete = async () => {
    if (selectedCustomers.length === 0) return;

    try {
      const { error } = await supabase
        .from('telegram_customers')
        .delete()
        .in('id', selectedCustomers);

      if (error) throw error;

      toast.success(`${selectedCustomers.length} customer(s) removed`);
      setSelectedCustomers([]);
      loadCustomers();
    } catch (error: any) {
      toast.error('Failed to remove customers: ' + error.message);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Username', 'Email', 'Phone', 'Chat ID', 'Last Active', 'Joined'];
    const csvData = filteredCustomers.map(c => [
      `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unknown',
      c.username || '',
      c.email || c.customer_email || '',
      c.phone || '',
      c.chat_id,
      new Date(c.last_interaction).toLocaleString(),
      new Date(c.created_at).toLocaleDateString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telegram-customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.first_name?.toLowerCase().includes(query) ||
        c.last_name?.toLowerCase().includes(query) ||
        c.username?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.customer_email?.toLowerCase().includes(query) ||
        c.phone?.includes(query) ||
        c.chat_id.includes(query)
      );
    }

    // Activity filter
    if (activityFilter !== 'all') {
      const now = new Date();
      let cutoff: Date;
      switch (activityFilter) {
        case 'today':
          cutoff = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'inactive':
          cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(c => new Date(c.last_interaction) < cutoff);
          return filtered;
        default:
          cutoff = new Date(0);
      }
      filtered = filtered.filter(c => new Date(c.last_interaction) >= cutoff);
    }

    // Contact filter
    if (contactFilter !== 'all') {
      switch (contactFilter) {
        case 'with_email':
          filtered = filtered.filter(c => c.email || c.customer_email);
          break;
        case 'with_phone':
          filtered = filtered.filter(c => c.phone);
          break;
        case 'no_contact':
          filtered = filtered.filter(c => !c.email && !c.customer_email && !c.phone);
          break;
      }
    }

    return filtered;
  }, [customers, searchQuery, activityFilter, contactFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSelectAll = () => {
    if (selectedCustomers.length === paginatedCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(paginatedCustomers.map(c => c.id));
    }
  };

  const toggleSelectCustomer = (id: string) => {
    setSelectedCustomers(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activityFilter, contactFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Telegram Customers</h1>
            <p className="text-muted-foreground mt-1">
              Manage customers who interact via Telegram
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadCustomers} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportToCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Customers</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active This Week</p>
                  <p className="text-3xl font-bold">{stats.activeThisWeek}</p>
                </div>
                <Clock className="h-10 w-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">With Email</p>
                  <p className="text-3xl font-bold">{stats.withEmail}</p>
                </div>
                <Mail className="h-10 w-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">With Phone</p>
                  <p className="text-3xl font-bold">{stats.withPhone}</p>
                </div>
                <Phone className="h-10 w-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by name, username, email, phone, or chat ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={activityFilter} onValueChange={setActivityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Activity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activity</SelectItem>
                  <SelectItem value="today">Active Today</SelectItem>
                  <SelectItem value="week">Active This Week</SelectItem>
                  <SelectItem value="month">Active This Month</SelectItem>
                  <SelectItem value="inactive">Inactive (30+ days)</SelectItem>
                </SelectContent>
              </Select>
              <Select value={contactFilter} onValueChange={setContactFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Contact Info" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Contacts</SelectItem>
                  <SelectItem value="with_email">With Email</SelectItem>
                  <SelectItem value="with_phone">With Phone</SelectItem>
                  <SelectItem value="no_contact">No Contact Info</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bulk Actions */}
        {selectedCustomers.length > 0 && (
          <Card className="border-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {selectedCustomers.length} customer(s) selected
                </p>
                <div className="flex gap-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Selected
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Customers?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently remove {selectedCustomers.length} customer(s) from your Telegram list.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={bulkDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomers([])}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : paginatedCustomers.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery || activityFilter !== 'all' || contactFilter !== 'all'
                    ? 'No customers match your filters'
                    : 'No Telegram customers yet'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedCustomers.length === paginatedCustomers.length && paginatedCustomers.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Notifications</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCustomers.includes(customer.id)}
                          onCheckedChange={() => toggleSelectCustomer(customer.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {customer.first_name || customer.last_name
                              ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
                              : 'Unknown'}
                          </p>
                          {customer.username && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <AtSign className="h-3 w-3" />
                              {customer.username}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {(customer.email || customer.customer_email) && (
                            <p className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              {customer.email || customer.customer_email}
                            </p>
                          )}
                          {customer.phone && (
                            <p className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {customer.phone}
                            </p>
                          )}
                          {!customer.email && !customer.customer_email && !customer.phone && (
                            <span className="text-muted-foreground">No contact info</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(customer.last_interaction).toLocaleDateString('en-ZA', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {customer.notification_preferences?.orders !== false ? (
                          <Badge variant="secondary" className="text-xs">
                            <Bell className="h-3 w-3 mr-1" />
                            On
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            <BellOff className="h-3 w-3 mr-1" />
                            Off
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewCustomerDetails(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setMessageCustomer(customer)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(customer)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Detail Modal */}
      <Dialog open={!!detailCustomer} onOpenChange={() => setDetailCustomer(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Customer Profile
            </DialogTitle>
            <DialogDescription>
              View customer details and activity
            </DialogDescription>
          </DialogHeader>

          {detailCustomer && (
            <Tabs defaultValue="profile" className="mt-4">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="orders">Orders</TabsTrigger>
                <TabsTrigger value="notifications">Notification History</TabsTrigger>
                <TabsTrigger value="preferences">Preferences</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {detailCustomer.first_name || detailCustomer.last_name
                        ? `${detailCustomer.first_name || ''} ${detailCustomer.last_name || ''}`.trim()
                        : 'Not provided'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium">
                      {detailCustomer.username ? `@${detailCustomer.username}` : 'Not set'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">
                      {detailCustomer.email || detailCustomer.customer_email || 'Not linked'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{detailCustomer.phone || 'Not provided'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Chat ID</p>
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {detailCustomer.chat_id}
                    </code>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Joined</p>
                    <p className="font-medium">
                      {new Date(detailCustomer.created_at).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Last Active</p>
                    <p className="font-medium">
                      {new Date(detailCustomer.last_interaction).toLocaleString('en-ZA')}
                    </p>
                  </div>
                </div>

                {(detailCustomer.preferences as any)?.notes && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm bg-muted p-3 rounded">
                      {(detailCustomer.preferences as any).notes}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="orders" className="mt-4">
                {loadingDetails ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No orders found for this customer</p>
                    {!detailCustomer.email && !detailCustomer.customer_email && (
                      <p className="text-sm mt-1">Link an email to see order history</p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div>
                          <p className="font-mono text-sm">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('en-ZA')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                          <span className="font-semibold">R{order.total_amount.toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="notifications" className="mt-4">
                {loadingDetails ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : notificationHistory.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    <History className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No notification history</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {notificationHistory.map((notif) => (
                      <div key={notif.id} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline">{notif.notification_type}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(notif.sent_at).toLocaleString('en-ZA')}
                          </span>
                        </div>
                        <p className="text-sm">{notif.message_text.substring(0, 100)}...</p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="preferences" className="mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Order Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive updates about order status
                      </p>
                    </div>
                    <Switch
                      checked={detailCustomer.notification_preferences?.orders !== false}
                      onCheckedChange={(checked) =>
                        updateNotificationPreferences(detailCustomer, 'orders', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Promotional Messages</p>
                      <p className="text-sm text-muted-foreground">
                        Receive special offers and promotions
                      </p>
                    </div>
                    <Switch
                      checked={detailCustomer.notification_preferences?.promotions === true}
                      onCheckedChange={(checked) =>
                        updateNotificationPreferences(detailCustomer, 'promotions', checked)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">Stock Alerts</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified when items are back in stock
                      </p>
                    </div>
                    <Switch
                      checked={detailCustomer.notification_preferences?.stock_alerts === true}
                      onCheckedChange={(checked) =>
                        updateNotificationPreferences(detailCustomer, 'stock_alerts', checked)
                      }
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Modal */}
      <Dialog open={!!editCustomer} onOpenChange={() => setEditCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update customer contact information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address</Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="customer@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+27 12 345 6789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={editForm.notes}
                onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes about this customer..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setEditCustomer(null)}>
              Cancel
            </Button>
            <Button onClick={saveCustomerEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Modal */}
      <Dialog open={!!messageCustomer} onOpenChange={() => setMessageCustomer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Direct Message</DialogTitle>
            <DialogDescription>
              Send a message to {messageCustomer?.first_name || messageCustomer?.username || 'this customer'} via Telegram
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message..."
              rows={5}
            />
            <p className="text-sm text-muted-foreground">
              {messageText.length} characters
            </p>
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setMessageCustomer(null)}>
              Cancel
            </Button>
            <Button
              onClick={sendDirectMessage}
              disabled={sendingMessage || !messageText.trim()}
            >
              {sendingMessage ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Message
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
