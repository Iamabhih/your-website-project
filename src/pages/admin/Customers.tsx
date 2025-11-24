import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from 'sonner';
import { Shield, ShieldOff, Search, UserPlus } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Customer {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  role: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('id, user_id, role, created_at')
      .order('created_at', { ascending: false });

    if (data) {
      // Get user emails from auth
      const userIds = data.map(d => d.user_id);
      const promises = userIds.map(async (userId) => {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        return userData.user;
      });

      const users = await Promise.all(promises);
      const customersWithEmails = data.map((customer, index) => ({
        ...customer,
        email: users[index]?.email || 'N/A',
      }));

      setCustomers(customersWithEmails as any);
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
      const { data: authUsers } = await supabase.auth.admin.listUsers();
      const existingUser = authUsers?.users.find(u => u.email === newAdminEmail);

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

  const filteredCustomers = customers.filter(c =>
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-8">Customer Management</h1>

          {/* Add Admin User Section */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Promote User to Admin
                  </label>
                  <Input
                    type="email"
                    placeholder="Enter user email"
                    value={newAdminEmail}
                    onChange={(e) => setNewAdminEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createAdminUser()}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    User must sign up first before being promoted
                  </p>
                </div>
                <Button onClick={createAdminUser}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Admin
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search customers by email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Customer List */}
          <div className="grid gap-4">
            {filteredCustomers.map((customer) => (
              <Card key={customer.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-semibold">{customer.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined: {new Date(customer.created_at).toLocaleDateString('en-ZA')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={customer.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                        {customer.role}
                      </Badge>
                      {customer.role === 'admin' ? (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <ShieldOff className="mr-2 h-4 w-4" />
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
                              <Shield className="mr-2 h-4 w-4" />
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
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredCustomers.length === 0 && (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">No customers found</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
