import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface TelegramCustomer {
  id: string;
  chat_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
  last_interaction: string;
}

export default function TelegramCustomers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [customers, setCustomers] = useState<TelegramCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadCustomers();
  }, [isAdmin]);

  const loadCustomers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('telegram_customers')
      .select('*')
      .order('last_interaction', { ascending: false });

    if (error) {
      console.error('Error loading customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Telegram customers',
        variant: 'destructive',
      });
    } else {
      setCustomers(data || []);
    }
    setLoading(false);
  };

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.first_name?.toLowerCase().includes(query) ||
      customer.last_name?.toLowerCase().includes(query) ||
      customer.username?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.includes(query)
    );
  });

  return (
    <AdminLayout>
      <Button
        variant="ghost"
        onClick={() => navigate('/admin')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Admin
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6" />
                Telegram Customers
              </CardTitle>
              <CardDescription>
                Manage customers who interact via Telegram
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-lg">
              {customers.length} Total
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, username, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading customers...
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Chat ID</TableHead>
                    <TableHead>Last Interaction</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? 'No customers found' : 'No Telegram customers yet'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div className="font-medium">
                            {customer.first_name || ''} {customer.last_name || ''}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.username ? `@${customer.username}` : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {customer.email && <div>{customer.email}</div>}
                            {customer.phone && <div>{customer.phone}</div>}
                            {!customer.email && !customer.phone && '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {customer.chat_id}
                          </code>
                        </TableCell>
                        <TableCell>
                          {new Date(customer.last_interaction).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {new Date(customer.created_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
    </AdminLayout>
  );
}
