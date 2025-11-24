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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Send,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  FileText,
  Plus,
  Trash2,
  Save,
  Filter,
  RefreshCw,
  Target,
  Mail,
  Bell
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface BroadcastMessage {
  id: string;
  message: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
  target_filter?: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  created_at: string;
}

interface TelegramCustomer {
  id: string;
  chat_id: string;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  email: string | null;
  customer_email: string | null;
  last_interaction: string;
  notification_preferences: {
    promotions?: boolean;
    orders?: boolean;
    stock_alerts?: boolean;
  } | null;
}

interface TargetingStats {
  total: number;
  withPromoOptIn: number;
  activeLastWeek: number;
  activeLastMonth: number;
  withEmail: number;
}

export default function TelegramBroadcast() {
  const [message, setMessage] = useState('');
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [customers, setCustomers] = useState<TelegramCustomer[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Targeting options
  const [targetFilter, setTargetFilter] = useState<string>('all');
  const [respectPreferences, setRespectPreferences] = useState(true);

  // Preview
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmSend, setShowConfirmSend] = useState(false);

  // Templates
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const [stats, setStats] = useState<TargetingStats>({
    total: 0,
    withPromoOptIn: 0,
    activeLastWeek: 0,
    activeLastMonth: 0,
    withEmail: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadBroadcasts(),
      loadCustomers(),
      loadTemplates(),
    ]);
    setLoading(false);
  };

  const loadBroadcasts = async () => {
    const { data, error } = await supabase
      .from('broadcast_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      setBroadcasts(data);
    }
  };

  const loadCustomers = async () => {
    const { data, error } = await supabase
      .from('telegram_customers')
      .select('*');

    if (!error && data) {
      const customersData = data as TelegramCustomer[];
      setCustomers(customersData);
      calculateStats(customersData);
    }
  };

  const loadTemplates = async () => {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'telegram_message_templates')
      .single();

    if (!error && data?.value) {
      const templateData = typeof data.value === 'string'
        ? JSON.parse(data.value)
        : data.value;
      setTemplates(templateData.templates || []);
    }
  };

  const calculateStats = (data: TelegramCustomer[]) => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    setStats({
      total: data.length,
      withPromoOptIn: data.filter(c => c.notification_preferences?.promotions === true).length,
      activeLastWeek: data.filter(c => new Date(c.last_interaction) >= weekAgo).length,
      activeLastMonth: data.filter(c => new Date(c.last_interaction) >= monthAgo).length,
      withEmail: data.filter(c => c.email || c.customer_email).length,
    });
  };

  const getTargetedCustomers = useMemo(() => {
    let filtered = customers;

    // Apply targeting filter
    const now = new Date();
    switch (targetFilter) {
      case 'active_week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(c => new Date(c.last_interaction) >= weekAgo);
        break;
      case 'active_month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(c => new Date(c.last_interaction) >= monthAgo);
        break;
      case 'with_email':
        filtered = filtered.filter(c => c.email || c.customer_email);
        break;
      case 'promo_opt_in':
        filtered = filtered.filter(c => c.notification_preferences?.promotions === true);
        break;
    }

    // Filter by notification preferences if enabled
    if (respectPreferences) {
      filtered = filtered.filter(c =>
        c.notification_preferences?.promotions !== false
      );
    }

    return filtered;
  }, [customers, targetFilter, respectPreferences]);

  const sendBroadcast = async () => {
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const targetCustomers = getTargetedCustomers;
    if (targetCustomers.length === 0) {
      toast.error('No customers match your targeting criteria');
      return;
    }

    setSending(true);
    setShowConfirmSend(false);

    try {
      // Create broadcast record
      const { data: broadcast, error: broadcastError } = await supabase
        .from('broadcast_messages')
        .insert({
          message,
          sent_count: 0,
          failed_count: 0,
          target_filter: targetFilter,
        })
        .select()
        .single();

      if (broadcastError) throw broadcastError;

      let sentCount = 0;
      let failedCount = 0;

      // Send via edge function (more secure - doesn't expose bot token)
      for (const customer of targetCustomers) {
        try {
          const { error } = await supabase.functions.invoke('send-to-telegram', {
            body: {
              chat_id: customer.chat_id,
              text: message,
              parse_mode: 'HTML',
            },
          });

          if (!error) {
            sentCount++;
          } else {
            failedCount++;
          }
        } catch {
          failedCount++;
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

      toast.success(`Broadcast sent to ${sentCount} customers. ${failedCount} failed.`);
    } catch (error: any) {
      toast.error('Failed to send broadcast: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim() || !message.trim()) {
      toast.error('Please enter a template name and message');
      return;
    }

    const newTemplate: MessageTemplate = {
      id: crypto.randomUUID(),
      name: templateName,
      content: message,
      created_at: new Date().toISOString(),
    };

    const updatedTemplates = [...templates, newTemplate];

    try {
      const { error } = await supabase
        .from('settings')
        .upsert([{
          key: 'telegram_message_templates',
          value: { templates: updatedTemplates } as any,
          updated_at: new Date().toISOString(),
        }], {
          onConflict: 'key',
        });

      if (error) throw error;

      setTemplates(updatedTemplates);
      setTemplateName('');
      setShowTemplateModal(false);
      toast.success('Template saved');
    } catch (error: any) {
      toast.error('Failed to save template: ' + error.message);
    }
  };

  const deleteTemplate = async (id: string) => {
    const updatedTemplates = templates.filter(t => t.id !== id);

    try {
      const { error } = await supabase
        .from('settings')
        .upsert([{
          key: 'telegram_message_templates',
          value: { templates: updatedTemplates } as any,
          updated_at: new Date().toISOString(),
        }], {
          onConflict: 'key',
        });

      if (error) throw error;

      setTemplates(updatedTemplates);
      toast.success('Template deleted');
    } catch (error: any) {
      toast.error('Failed to delete template: ' + error.message);
    }
  };

  const loadTemplate = (template: MessageTemplate) => {
    setMessage(template.content);
    setSelectedTemplate(template.id);
  };

  const insertVariable = (variable: string) => {
    setMessage(prev => prev + variable);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Telegram Broadcast</h1>
            <p className="text-muted-foreground mt-1">
              Send messages to your Telegram customers
            </p>
          </div>
          <Button variant="outline" onClick={loadData} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Customers</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.withPromoOptIn}</p>
                <p className="text-xs text-muted-foreground">Promo Opt-in</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.activeLastWeek}</p>
                <p className="text-xs text-muted-foreground">Active (7 days)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.activeLastMonth}</p>
                <p className="text-xs text-muted-foreground">Active (30 days)</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.withEmail}</p>
                <p className="text-xs text-muted-foreground">With Email</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Compose Message */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Compose Message
                </CardTitle>
                <CardDescription>
                  Create and send broadcast messages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Selection */}
                {templates.length > 0 && (
                  <div className="space-y-2">
                    <Label>Load from Template</Label>
                    <Select
                      value={selectedTemplate}
                      onValueChange={(value) => {
                        const template = templates.find(t => t.id === value);
                        if (template) loadTemplate(template);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Message Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="message">Message</Label>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertVariable('{name}')}
                      >
                        +Name
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => insertVariable('{store}')}
                      >
                        +Store
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    id="message"
                    placeholder="Enter your broadcast message...&#10;&#10;Supports HTML: <b>bold</b>, <i>italic</i>, <a href='url'>link</a>"
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      setSelectedTemplate('');
                    }}
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{message.length} characters</span>
                    <span>Supports HTML formatting</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(true)}
                    disabled={!message.trim()}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowTemplateModal(true)}
                    disabled={!message.trim()}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save as Template
                  </Button>
                  <Button
                    onClick={() => setShowConfirmSend(true)}
                    disabled={sending || !message.trim() || getTargetedCustomers.length === 0}
                    className="ml-auto"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send to {getTargetedCustomers.length} customers
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Targeting Options */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Targeting
                </CardTitle>
                <CardDescription>
                  Select who receives this broadcast
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select value={targetFilter} onValueChange={setTargetFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Customers ({stats.total})</SelectItem>
                      <SelectItem value="active_week">Active Last 7 Days ({stats.activeLastWeek})</SelectItem>
                      <SelectItem value="active_month">Active Last 30 Days ({stats.activeLastMonth})</SelectItem>
                      <SelectItem value="with_email">With Email Linked ({stats.withEmail})</SelectItem>
                      <SelectItem value="promo_opt_in">Promo Opt-in Only ({stats.withPromoOptIn})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label>Respect Preferences</Label>
                    <p className="text-xs text-muted-foreground">
                      Skip customers who opted out of promos
                    </p>
                  </div>
                  <Switch
                    checked={respectPreferences}
                    onCheckedChange={setRespectPreferences}
                  />
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Recipients</span>
                  </div>
                  <p className="text-2xl font-bold">{getTargetedCustomers.length}</p>
                  <p className="text-sm text-muted-foreground">
                    customers will receive this message
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Templates */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Templates
                </CardTitle>
                <CardDescription>
                  Saved message templates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No templates saved yet
                  </p>
                ) : (
                  <div className="space-y-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className="flex items-center justify-between p-2 border rounded hover:bg-muted cursor-pointer"
                        onClick={() => loadTemplate(template)}
                      >
                        <span className="text-sm font-medium truncate">
                          {template.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(template.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Broadcast History */}
        <Card>
          <CardHeader>
            <CardTitle>Broadcast History</CardTitle>
            <CardDescription>Recent broadcast messages</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : broadcasts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p>No broadcasts sent yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Message</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {broadcasts.map((broadcast) => (
                    <TableRow key={broadcast.id}>
                      <TableCell className="max-w-md">
                        <p className="truncate">{broadcast.message}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {broadcast.target_filter || 'all'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          {broadcast.sent_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {broadcast.failed_count > 0 && (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            {broadcast.failed_count}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(broadcast.created_at).toLocaleString('en-ZA', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Message Preview</DialogTitle>
            <DialogDescription>
              This is how your message will appear in Telegram
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 bg-[#1e2836] text-white rounded-lg mt-4">
            <div
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{
                __html: message
                  .replace(/{name}/g, '<span class="text-blue-400">Customer</span>')
                  .replace(/{store}/g, '<span class="text-blue-400">Your Store</span>')
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Template Modal */}
      <Dialog open={showTemplateModal} onOpenChange={setShowTemplateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this message for future use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                placeholder="e.g., Welcome Message, Sale Announcement"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
              />
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-1">Message Preview:</p>
              <p className="text-muted-foreground truncate">{message}</p>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowTemplateModal(false)}>
              Cancel
            </Button>
            <Button onClick={saveTemplate} disabled={!templateName.trim()}>
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Send Dialog */}
      <AlertDialog open={showConfirmSend} onOpenChange={setShowConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Broadcast?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                You are about to send this message to{' '}
                <strong>{getTargetedCustomers.length} customers</strong>.
              </p>
              <p>
                Target: <Badge variant="outline" className="capitalize ml-1">{targetFilter}</Badge>
              </p>
              {respectPreferences && (
                <p className="text-xs">
                  Customers who opted out of promotions will be skipped.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={sendBroadcast}>
              <Send className="mr-2 h-4 w-4" />
              Send Broadcast
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
