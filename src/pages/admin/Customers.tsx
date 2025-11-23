import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Customer {
  id: string;
  email: string;
  created_at: string;
  role: string;
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-8">Customers</h1>

          <div className="grid gap-4">
            {customers.map((customer) => (
              <Card key={customer.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{customer.email}</p>
                      <p className="text-sm text-muted-foreground">
                        Joined: {new Date(customer.created_at).toLocaleDateString('en-ZA')}
                      </p>
                    </div>
                    <Badge variant={customer.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                      {customer.role}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
