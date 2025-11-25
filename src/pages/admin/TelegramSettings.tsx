import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Settings,
  Bot,
  Bell,
  MessageSquare,
  Shield,
  Loader2,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  ExternalLink,
  Copy,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface TelegramSettings {
  bot_enabled: boolean;
  bot_username: string;
  webhook_url: string;
  admin_chat_id: string;
  welcome_message: string;
  order_notification_template: string;
  shipping_notification_template: string;
  features: {
    order_tracking: boolean;
    support_chat: boolean;
    promotions: boolean;
    stock_alerts: boolean;
  };
  auto_replies: {
    greeting: string;
    unknown_command: string;
    help_text: string;
  };
}

interface NotificationSetting {
  id: string;
  setting_key: string;
  description: string | null;
  is_enabled: boolean;
}

const defaultSettings: TelegramSettings = {
  bot_enabled: false,
  bot_username: '',
  webhook_url: '',
  admin_chat_id: '',
  welcome_message: 'Welcome to our store! How can I help you today?',
  order_notification_template: '🛒 Order Update\n\nOrder: #{order_id}\nStatus: {status}\n\nThank you for shopping with us!',
  shipping_notification_template: '📦 Shipping Update\n\nYour order #{order_id} has been shipped!\nTracking: {tracking_number}\n\nExpected delivery: {delivery_date}',
  features: {
    order_tracking: true,
    support_chat: true,
    promotions: false,
    stock_alerts: true,
  },
  auto_replies: {
    greeting: 'Hi {name}! Welcome to our Telegram bot. Type /help to see available commands.',
    unknown_command: "Sorry, I didn't understand that command. Type /help to see what I can do.",
    help_text: 'Available commands:\n/start - Start the bot\n/track [order_id] - Track your order\n/support - Contact support\n/settings - Notification settings',
  },
};

export default function TelegramSettings() {
  const [settings, setSettings] = useState<TelegramSettings>(defaultSettings);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      // Load telegram settings
      const { data: settingsData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'telegram_bot_settings')
        .single();

      if (settingsData?.value) {
        const parsed = typeof settingsData.value === 'string'
          ? JSON.parse(settingsData.value)
          : settingsData.value;
        setSettings({ ...defaultSettings, ...parsed });
      }

      // Load notification settings
      const { data: notifData } = await supabase
        .from('telegram_notification_settings')
        .select('*')
        .order('setting_key');

      if (notifData) {
        setNotificationSettings(notifData);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current: any = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .upsert([{
          key: 'telegram_bot_settings',
          value: settings as any,
          updated_at: new Date().toISOString(),
        }], {
          onConflict: 'key',
        });

      if (error) throw error;

      setHasChanges(false);
      toast.success('Telegram settings saved');
    } catch (error: any) {
      toast.error('Failed to save settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleNotificationSetting = async (setting: NotificationSetting) => {
    try {
      const { error } = await supabase
        .from('telegram_notification_settings')
        .update({ is_enabled: !setting.is_enabled })
        .eq('id', setting.id);

      if (error) throw error;

      setNotificationSettings(prev =>
        prev.map(s => s.id === setting.id ? { ...s, is_enabled: !s.is_enabled } : s)
      );
      toast.success('Notification setting updated');
    } catch (error: any) {
      toast.error('Failed to update setting');
    }
  };

  const testConnection = async () => {
    setTestingConnection(true);
    try {
      const { error } = await supabase.functions.invoke('send-to-telegram', {
        body: {
          chat_id: settings.admin_chat_id,
          text: '✅ Test message from admin dashboard. Your Telegram bot is configured correctly!',
        },
      });

      if (error) throw error;

      setConnectionStatus('connected');
      toast.success('Test message sent! Check your Telegram.');
    } catch (error: any) {
      setConnectionStatus('error');
      toast.error('Connection failed. Check your bot configuration.');
    } finally {
      setTestingConnection(false);
    }
  };

  const webhookUrl = `https://dljnlqznteqxszbxdelw.supabase.co/functions/v1/telegram-webhook`;

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl);
    toast.success('Webhook URL copied to clipboard');
  };

  const registerWebhook = async () => {
    if (!settings.admin_chat_id) {
      toast.error('Please configure admin chat ID first');
      return;
    }

    setTestingConnection(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-to-telegram', {
        body: {
          event: 'register_webhook',
          webhookUrl,
        },
      });

      if (error) throw error;

      toast.success('Webhook registered successfully!');
      console.log('Webhook registration response:', data);
    } catch (error: any) {
      toast.error('Failed to register webhook: ' + error.message);
      console.error('Webhook registration error:', error);
    } finally {
      setTestingConnection(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Telegram Settings</h1>
            <p className="text-muted-foreground mt-1">
              Configure your Telegram bot integration
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Badge variant="outline" className="animate-pulse">
                Unsaved changes
              </Badge>
            )}
            <Button onClick={saveSettings} disabled={saving || !hasChanges}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Settings
            </Button>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general" className="gap-2">
              <Bot className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="messages" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              Messages
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Zap className="h-4 w-4" />
              Features
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    Bot Configuration
                  </CardTitle>
                  <CardDescription>
                    Configure your Telegram bot connection
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Enable Telegram Bot</Label>
                      <p className="text-sm text-muted-foreground">
                        Turn on/off all Telegram bot functionality
                      </p>
                    </div>
                    <Switch
                      checked={settings.bot_enabled}
                      onCheckedChange={(checked) => handleChange('bot_enabled', checked)}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bot_username">Bot Username</Label>
                      <Input
                        id="bot_username"
                        value={settings.bot_username}
                        onChange={(e) => handleChange('bot_username', e.target.value)}
                        placeholder="@YourBotUsername"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your bot's username from @BotFather
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin_chat_id">Admin Chat ID</Label>
                      <Input
                        id="admin_chat_id"
                        value={settings.admin_chat_id}
                        onChange={(e) => handleChange('admin_chat_id', e.target.value)}
                        placeholder="123456789"
                      />
                      <p className="text-xs text-muted-foreground">
                        Your Telegram chat ID for admin notifications
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Connection Status</h4>
                        <p className="text-sm text-muted-foreground">
                          Test your bot connection
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {connectionStatus === 'connected' && (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Connected
                          </Badge>
                        )}
                        {connectionStatus === 'error' && (
                          <Badge variant="destructive" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Error
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          onClick={testConnection}
                          disabled={testingConnection || !settings.admin_chat_id}
                        >
                          {testingConnection ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Test Connection
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Webhook Configuration
                  </CardTitle>
                  <CardDescription>
                    Set up webhook for receiving Telegram updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Label>Webhook URL</Label>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={copyWebhookUrl}>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={registerWebhook} disabled={testingConnection}>
                          {testingConnection ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <ExternalLink className="h-4 w-4 mr-1" />
                          )}
                          Register
                        </Button>
                      </div>
                    </div>
                    <code className="text-sm block p-2 bg-background rounded border break-all">
                      {webhookUrl}
                    </code>
                  </div>

                  <div className="p-4 border border-yellow-500/50 bg-yellow-500/10 rounded-lg">
                    <div className="flex gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-600">Important Setup Steps:</p>
                        <ol className="list-decimal list-inside mt-2 space-y-1 text-muted-foreground">
                          <li>Create a bot with @BotFather on Telegram</li>
                          <li>Copy the bot token and add it to your Supabase secrets as TELEGRAM_BOT_TOKEN</li>
                          <li>Set your webhook URL using the Telegram API</li>
                          <li>Enter your bot username and admin chat ID above</li>
                        </ol>
                        <a
                          href="https://core.telegram.org/bots/tutorial"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-primary hover:underline"
                        >
                          View Telegram Bot Setup Guide
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure which notifications are sent via Telegram
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {notificationSettings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No notification settings configured
                  </p>
                ) : (
                  notificationSettings.map((setting) => (
                    <div
                      key={setting.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="space-y-0.5">
                        <Label className="capitalize">
                          {setting.setting_key.replace(/_/g, ' ')}
                        </Label>
                        {setting.description && (
                          <p className="text-sm text-muted-foreground">
                            {setting.description}
                          </p>
                        )}
                      </div>
                      <Switch
                        checked={setting.is_enabled}
                        onCheckedChange={() => toggleNotificationSetting(setting)}
                      />
                    </div>
                  ))
                )}

                <Separator className="my-6" />

                <div className="space-y-4">
                  <h4 className="font-medium">Default Notification Preferences</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Order Tracking</Label>
                        <p className="text-xs text-muted-foreground">
                          Send order status updates
                        </p>
                      </div>
                      <Switch
                        checked={settings.features.order_tracking}
                        onCheckedChange={(checked) => handleChange('features.order_tracking', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Stock Alerts</Label>
                        <p className="text-xs text-muted-foreground">
                          Notify when items back in stock
                        </p>
                      </div>
                      <Switch
                        checked={settings.features.stock_alerts}
                        onCheckedChange={(checked) => handleChange('features.stock_alerts', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Promotions</Label>
                        <p className="text-xs text-muted-foreground">
                          Allow promotional messages
                        </p>
                      </div>
                      <Switch
                        checked={settings.features.promotions}
                        onCheckedChange={(checked) => handleChange('features.promotions', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Support Chat</Label>
                        <p className="text-xs text-muted-foreground">
                          Enable customer support via bot
                        </p>
                      </div>
                      <Switch
                        checked={settings.features.support_chat}
                        onCheckedChange={(checked) => handleChange('features.support_chat', checked)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Message Templates */}
          <TabsContent value="messages">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome Message</CardTitle>
                  <CardDescription>
                    Message sent when a user starts the bot
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={settings.welcome_message}
                    onChange={(e) => handleChange('welcome_message', e.target.value)}
                    rows={3}
                    placeholder="Welcome message..."
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Notification Template</CardTitle>
                  <CardDescription>
                    Template for order status updates. Variables: {'{order_id}'}, {'{status}'}, {'{total}'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={settings.order_notification_template}
                    onChange={(e) => handleChange('order_notification_template', e.target.value)}
                    rows={5}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Shipping Notification Template</CardTitle>
                  <CardDescription>
                    Template for shipping updates. Variables: {'{order_id}'}, {'{tracking_number}'}, {'{delivery_date}'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={settings.shipping_notification_template}
                    onChange={(e) => handleChange('shipping_notification_template', e.target.value)}
                    rows={5}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Auto-Reply Messages</CardTitle>
                  <CardDescription>
                    Automatic responses to common interactions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Greeting Message</Label>
                    <Textarea
                      value={settings.auto_replies.greeting}
                      onChange={(e) => handleChange('auto_replies.greeting', e.target.value)}
                      rows={2}
                      placeholder="Greeting message..."
                    />
                    <p className="text-xs text-muted-foreground">
                      Variables: {'{name}'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Unknown Command Response</Label>
                    <Textarea
                      value={settings.auto_replies.unknown_command}
                      onChange={(e) => handleChange('auto_replies.unknown_command', e.target.value)}
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Help Text</Label>
                    <Textarea
                      value={settings.auto_replies.help_text}
                      onChange={(e) => handleChange('auto_replies.help_text', e.target.value)}
                      rows={5}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Features */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Bot Features
                </CardTitle>
                <CardDescription>
                  Enable or disable specific bot capabilities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Order Tracking</Label>
                      <Switch
                        checked={settings.features.order_tracking}
                        onCheckedChange={(checked) => handleChange('features.order_tracking', checked)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Allow customers to track orders via /track command
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Support Chat</Label>
                      <Switch
                        checked={settings.features.support_chat}
                        onCheckedChange={(checked) => handleChange('features.support_chat', checked)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enable live chat support through the bot
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Promotional Messages</Label>
                      <Switch
                        checked={settings.features.promotions}
                        onCheckedChange={(checked) => handleChange('features.promotions', checked)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Send promotional broadcasts to subscribers
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Stock Alerts</Label>
                      <Switch
                        checked={settings.features.stock_alerts}
                        onCheckedChange={(checked) => handleChange('features.stock_alerts', checked)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Notify customers when items are back in stock
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {hasChanges && (
          <div className="fixed bottom-4 right-4 z-50">
            <Button onClick={saveSettings} disabled={saving} size="lg" className="shadow-lg">
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Settings
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
