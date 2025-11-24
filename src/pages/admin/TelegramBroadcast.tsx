import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface BroadcastMessage {
  id: string;
  message: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

export default function TelegramBroadcast() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [message, setMessage] = useState('');
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadBroadcasts();
    loadCustomerCount();
  }, [isAdmin]);

  const loadBroadcasts = async () => {
    const { data, error } = await supabase
      .from('broadcast_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error loading broadcasts:', error);
    } else {
      setBroadcasts(data || []);
    }
  };

  const loadCustomerCount = async () => {
    const { count, error } = await supabase
      .from('telegram_customers')
      .select('*', { count: 'exact', head: true });

    if (!error && count !== null) {
      setCustomerCount(count);
    }
  };

  const sendBroadcast = async () => {
    if (!message.trim()) {
      toast({
        title: 'Message required',
        description: 'Please enter a message to broadcast',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      // Get all customers
      const { data: customers, error: customersError } = await supabase
        .from('telegram_customers')
        .select('chat_id');

      if (customersError) throw customersError;

      if (!customers || customers.length === 0) {
        toast({
          title: 'No recipients',
          description: 'There are no Telegram customers to send to',
          variant: 'destructive',
        });
        return;
      }

      // Create broadcast record
      const { data: broadcast, error: broadcastError } = await supabase
        .from('broadcast_messages')
        .insert({
          message,
          sent_count: 0,
          failed_count: 0,
        })
        .select()
        .single();

      if (broadcastError) throw broadcastError;

      // Send to each customer via Telegram bot
      let sentCount = 0;
      let failedCount = 0;

      for (const customer of customers) {
        try {
          const response = await fetch(
            `https://api.telegram.org/bot${import.meta.env.VITE_TELEGRAM_BOT_TOKEN || ''}/sendMessage`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: customer.chat_id,
                text: message,
                parse_mode: 'HTML',
              }),
            }
          );

          if (response.ok) {
            sentCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          failedCount++;
          console.error('Error sending to customer:', error);
        }
      }

      // Update broadcast record
      await supabase
        .from('broadcast_messages')
        .update({
          sent_count: sentCount,
          failed_count: failedCount,
        })
        .eq('id', broadcast.id);

      setMessage('');
      loadBroadcasts();

      toast({
        title: 'Broadcast sent',
        description: `Message sent to ${sentCount} customers. ${failedCount} failed.`,
      });
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast({
        title: 'Error',
        description: 'Failed to send broadcast message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

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

      <div className="grid gap-6">
        {/* Send Broadcast */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              Send Broadcast Message
            </CardTitle>
            <CardDescription>
              Send a message to all {customerCount} Telegram customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Textarea
                placeholder="Enter your broadcast message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {message.length} characters
                </span>
                <Button
                  onClick={sendBroadcast}
                  disabled={sending || !message.trim()}
                >
                  {sending ? (
                    'Sending...'
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Send to {customerCount} customers
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Broadcast History */}
        <Card>
          <CardHeader>
            <CardTitle>Broadcast History</CardTitle>
            <CardDescription>Recent broadcast messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Message</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {broadcasts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No broadcasts sent yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    broadcasts.map((broadcast) => (
                      <TableRow key={broadcast.id}>
                        <TableCell className="max-w-md">
                          <p className="truncate">{broadcast.message}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {broadcast.sent_count} sent
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {broadcast.failed_count > 0 && (
                            <Badge variant="destructive">
                              {broadcast.failed_count} failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(broadcast.created_at).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </div>
    </AdminLayout>
  );
}
