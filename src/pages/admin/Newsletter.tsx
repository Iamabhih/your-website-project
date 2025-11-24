import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Search, UserX } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
  source: string;
  unsubscribed_at: string | null;
}

export default function Newsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0 });

  useEffect(() => {
    loadSubscribers();
  }, []);

  const loadSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });

      if (error) throw error;

      setSubscribers(data || []);
      
      const active = data?.filter(s => s.is_active).length || 0;
      setStats({
        total: data?.length || 0,
        active,
        unsubscribed: (data?.length || 0) - active
      });
    } catch (error: any) {
      toast.error("Failed to load subscribers");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async (id: string) => {
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({ 
          is_active: false, 
          unsubscribed_at: new Date().toISOString() 
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Subscriber deactivated");
      loadSubscribers();
    } catch (error: any) {
      toast.error("Failed to unsubscribe user");
      console.error(error);
    }
  };

  const exportToCSV = () => {
    const csv = [
      ["Email", "Subscribed At", "Status", "Source"],
      ...subscribers.map(s => [
        s.email,
        format(new Date(s.subscribed_at), "yyyy-MM-dd HH:mm"),
        s.is_active ? "Active" : "Unsubscribed",
        s.source
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Exported to CSV");
  };

  const filteredSubscribers = subscribers.filter(s =>
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Newsletter Subscribers</h1>
          <p className="text-muted-foreground mt-2">Manage your email subscribers</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Subscribers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Active</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Unsubscribed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-muted-foreground">{stats.unsubscribed}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Subscribers</CardTitle>
            <CardDescription>Search and manage your newsletter subscribers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4 gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={exportToCSV} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading subscribers...</div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Subscribed Date</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubscribers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No subscribers found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSubscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
                          <TableCell className="font-medium">{subscriber.email}</TableCell>
                          <TableCell>
                            {format(new Date(subscriber.subscribed_at), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell className="capitalize">{subscriber.source}</TableCell>
                          <TableCell>
                            {subscriber.is_active ? (
                              <Badge variant="default">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Unsubscribed</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {subscriber.is_active && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnsubscribe(subscriber.id)}
                              >
                                <UserX className="h-4 w-4" />
                              </Button>
                            )}
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
      </div>
    </AdminLayout>
  );
}
