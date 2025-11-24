import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import {
  Shield,
  ShieldOff,
  Search,
  UserPlus,
  Users,
  UserCheck,
  Download,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShoppingBag,
  Calendar,
  Mail,
  X,
  RefreshCw
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface Customer {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  role: string;
}

interface Order {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  payment_status: string;
}

interface CustomerStats {
  totalCustomers: number;
  totalAdmins: number;
  newThisMonth: number;
  newThisWeek: number;
}

const ITEMS_PER_PAGE = 10;

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [customerDetail, setCustomerDetail] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [stats, setStats] = useState<CustomerStats>({
    totalCustomers: 0,
    totalAdmins: 0,
    newThisMonth: 0,
    newThisWeek: 0,
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('user_roles')
        .select('id, user_id, role, created_at')
        .order('created_at', { ascending: false });

      if (data) {
        // Get user emails from auth
        const userIds = data.map(d => d.user_id);
        const promises = userIds.map(async (userId) => {
          try {
            const { data: userData } = await supabase.auth.admin.getUserById(userId);
            return userData?.user;
          } catch {
            return null;
          }
        });

        const users = await Promise.all(promises);
        const customersWithEmails = data.map((customer, index) => ({
          ...customer,
          email: users[index]?.email || 'N/A',
        }));

        setCustomers(customersWithEmails as Customer[]);
        calculateStats(customersWithEmails as Customer[]);
      }
    } catch (error: any) {
      toast.error('Failed to load customers: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (customerData: Customer[]) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    setStats({
      totalCustomers: customerData.filter(c => c.role === 'customer').length,
      totalAdmins: customerData.filter(c => c.role === 'admin').length,
      newThisMonth: customerData.filter(c => new Date(c.created_at) >= startOfMonth).length,
      newThisWeek: customerData.filter(c => new Date(c.created_at) >= startOfWeek).length,
    });
  };

  const loadCustomerOrders = async (userId: string) => {
    setLoadingOrders(true);
    try {
      const { data } = await supabase
        .from('orders')
        .select('id, created_at, total_amount, status, payment_status')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setCustomerOrders(data || []);
    } catch (error: any) {
      toast.error('Failed to load orders');
    } finally {
      setLoadingOrders(false);
    }
  };

  const promoteToAdmin = async (userId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(`${email} promoted to admin`);
      await loadCustomers();
    } catch (error: any) {
      toast.error('Failed to promote user: ' + error.message);
    }
  };

  const demoteToCustomer = async (userId: string, email: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'customer' })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(`${email} demoted to customer`);
      await loadCustomers();
    } catch (error: any) {
      toast.error('Failed to demote user: ' + error.message);
    }
  };

  const createAdminUser = async () => {
    if (!newAdminEmail) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      // Check if user exists in auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

      if (authError) {
        toast.error('Failed to fetch users: ' + authError.message);
        return;
      }

      const existingUser = authUsers?.users?.find((u: any) => u.email === newAdminEmail);

      if (!existingUser) {
        toast.error('User not found. Please ask them to sign up first.');
        return;
      }

      // Check if already has a role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', existingUser.id)
        .single();

      if (existingRole) {
        // Update existing role to admin
        await promoteToAdmin(existingUser.id, newAdminEmail);
      } else {
        // Insert new admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({
            user_id: existingUser.id,
            role: 'admin'
          });

        if (error) throw error;

        toast.success(`${newAdminEmail} added as admin`);
        await loadCustomers();
      }

      setNewAdminEmail('');
    } catch (error: any) {
      toast.error('Failed to create admin: ' + error.message);
    }
  };

  const bulkPromote = async () => {
    if (selectedCustomers.length === 0) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .in('user_id', selectedCustomers);

      if (error) throw error;

      toast.success(`${selectedCustomers.length} user(s) promoted to admin`);
      setSelectedCustomers([]);
      await loadCustomers();
    } catch (error: any) {
      toast.error('Failed to promote users: ' + error.message);
    }
  };

  const bulkDemote = async () => {
    if (selectedCustomers.length === 0) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'customer' })
        .in('user_id', selectedCustomers);

      if (error) throw error;

      toast.success(`${selectedCustomers.length} user(s) demoted to customer`);
      setSelectedCustomers([]);
      await loadCustomers();
    } catch (error: any) {
      toast.error('Failed to demote users: ' + error.message);
    }
  };

  const exportToCSV = () => {
    const headers = ['Email', 'Role', 'Joined Date', 'User ID'];
    const csvData = filteredCustomers.map(c => [
      c.email,
      c.role,
      new Date(c.created_at).toLocaleDateString('en-ZA'),
      c.user_id
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Customers exported to CSV');
  };

  const filteredCustomers = useMemo(() => {
    let filtered = customers;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.user_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(c => c.role === roleFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let cutoffDate: Date;

      switch (dateFilter) {
        case 'today':
          cutoffDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          cutoffDate = new Date(now);
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate = new Date(now);
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case '3months':
          cutoffDate = new Date(now);
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        default:
          cutoffDate = new Date(0);
      }

      filtered = filtered.filter(c => new Date(c.created_at) >= cutoffDate);
    }

    return filtered;
  }, [customers, searchQuery, roleFilter, dateFilter]);

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
      setSelectedCustomers(paginatedCustomers.map(c => c.user_id));
    }
  };

  const toggleSelectCustomer = (userId: string) => {
    setSelectedCustomers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const viewCustomerDetails = (customer: Customer) => {
    setCustomerDetail(customer);
    loadCustomerOrders(customer.user_id);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, dateFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">Customer Management</h1>
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
                  <p className="text-3xl font-bold">{stats.totalCustomers}</p>
                </div>
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Admin Users</p>
                  <p className="text-3xl font-bold">{stats.totalAdmins}</p>
                </div>
                <Shield className="h-10 w-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New This Month</p>
                  <p className="text-3xl font-bold">{stats.newThisMonth}</p>
                </div>
                <Calendar className="h-10 w-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">New This Week</p>
                  <p className="text-3xl font-bold">{stats.newThisWeek}</p>
                </div>
                <UserCheck className="h-10 w-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Admin User Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add Admin User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">
                  User Email Address
                </label>
                <Input
                  type="email"
                  placeholder="Enter user email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createAdminUser()}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  User must sign up first before being promoted to admin
                </p>
              </div>
              <Button onClick={createAdminUser}>
                <UserPlus className="mr-2 h-4 w-4" />
                Add Admin
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search by email or user ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                  <SelectItem value="3months">Last 3 Months</SelectItem>
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
                      <Button variant="outline" size="sm">
                        <Shield className="mr-2 h-4 w-4" />
                        Bulk Promote
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Promote Selected Users?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will give admin access to {selectedCustomers.length} user(s).
                          They will have full access to the admin dashboard.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={bulkPromote}>
                          Promote All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <ShieldOff className="mr-2 h-4 w-4" />
                        Bulk Demote
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Demote Selected Users?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove admin access from {selectedCustomers.length} user(s).
                          They will no longer have access to the admin dashboard.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={bulkDemote}>
                          Demote All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCustomers([])}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Clear Selection
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
                <p className="text-muted-foreground">No customers found</p>
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
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedCustomers.includes(customer.user_id)}
                          onCheckedChange={() => toggleSelectCustomer(customer.user_id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{customer.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                          {customer.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(customer.created_at).toLocaleDateString('en-ZA', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => viewCustomerDetails(customer)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {customer.role === 'admin' ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <ShieldOff className="mr-1 h-4 w-4" />
                                  Demote
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Demote to Customer?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove admin privileges from {customer.email}.
                                    They will no longer have access to the admin dashboard.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => demoteToCustomer(customer.user_id, customer.email)}
                                  >
                                    Demote
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="default" size="sm">
                                  <Shield className="mr-1 h-4 w-4" />
                                  Promote
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Promote to Admin?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will give {customer.email} full admin access to the dashboard.
                                    They will be able to manage products, orders, and settings.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => promoteToAdmin(customer.user_id, customer.email)}
                                  >
                                    Promote
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredCustomers.length)} of {filteredCustomers.length} customers
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
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page =>
                    page === 1 ||
                    page === totalPages ||
                    Math.abs(page - currentPage) <= 1
                  )
                  .map((page, index, array) => (
                    <span key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    </span>
                  ))}
              </div>
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
      <Dialog open={!!customerDetail} onOpenChange={() => setCustomerDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Details
            </DialogTitle>
          </DialogHeader>

          {customerDetail && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{customerDetail.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <Badge variant={customerDetail.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                    {customerDetail.role}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">User ID</p>
                  <p className="font-mono text-sm">{customerDetail.user_id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Joined</p>
                  <p className="font-medium">
                    {new Date(customerDetail.created_at).toLocaleDateString('en-ZA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold flex items-center gap-2 mb-4">
                  <ShoppingBag className="h-4 w-4" />
                  Order History
                </h3>

                {loadingOrders ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : customerOrders.length === 0 ? (
                  <p className="text-center text-muted-foreground p-8">
                    No orders found for this customer
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm text-muted-foreground px-3">
                      <span>Total Orders: {customerOrders.length}</span>
                      <span>
                        Total Spent: R{customerOrders.reduce((sum, o) => sum + o.total_amount, 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {customerOrders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-mono text-sm">#{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(order.created_at).toLocaleDateString('en-ZA')}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={
                              order.status === 'delivered' ? 'default' :
                              order.status === 'shipped' ? 'secondary' :
                              order.status === 'processing' ? 'outline' :
                              'destructive'
                            }>
                              {order.status}
                            </Badge>
                            <span className="font-semibold">R{order.total_amount.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
