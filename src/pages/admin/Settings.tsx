import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Send, Bot, Mail, CreditCard } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Settings {
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  resend_api_key?: string;
  payfast_mode?: string;
  payfast_merchant_id?: string;
  payfast_merchant_key?: string;
  admin_email?: string;
}

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>({});
  const [webhookUrl, setWebhookUrl] = useState('');

  useEffect(() => {
    loadSettings();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    setWebhookUrl(`${supabaseUrl}/functions/v1/telegram-webhook`);
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) throw error;

      const settingsObj: Settings = {};
      data?.forEach((item) => {
        try {
          const value = typeof item.value === 'string' ? item.value : JSON.stringify(item.value);
          settingsObj[item.key as keyof Settings] = value;
        } catch {
          settingsObj[item.key as keyof Settings] = String(item.value);
        }
      });

      setSettings(settingsObj);
    } catch (error: any) {
      toast.error('Failed to load settings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: string) => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('settings')
        .upsert({
          key,
          value: JSON.stringify(value),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      toast.success('Setting saved successfully');
      await loadSettings();
    } catch (error: any) {
      toast.error('Failed to save setting: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const testTelegram = async () => {
    setTesting('telegram');
    try {
      const { data, error } = await supabase.functions.invoke('send-to-telegram', {
        body: {
          event: 'test',
          message: '✅ Telegram integration is working! This is a test message from Ideal Smoke Supply admin.',
        },
      });

      if (error) throw error;
      toast.success('Test message sent to Telegram!');
    } catch (error: any) {
      toast.error('Telegram test failed: ' + error.message);
    } finally {
      setTesting(null);
    }
  };

  const testResend = async () => {
    setTesting('resend');
    try {
      const { data, error } = await supabase.functions.invoke('send-order-email', {
        body: {
          to: settings.admin_email || 'admin@example.com',
          subject: '✅ Test Email - Ideal Smoke Supply',
          orderDetails: {
            orderId: 'TEST-' + Date.now(),
            customerName: 'Test Customer',
            totalAmount: 100,
            deliveryMethod: 'Standard Delivery',
            deliveryAddress: '123 Test Street, Test City',
            items: [
              { name: 'Test Product', quantity: 1, price: 100 }
            ]
          }
        },
      });

      if (error) throw error;
      toast.success('Test email sent!');
    } catch (error: any) {
      toast.error('Email test failed: ' + error.message);
    } finally {
      setTesting(null);
    }
  };

  const setupTelegramWebhook = async () => {
    setTesting('webhook');
    try {
      if (!settings.telegram_bot_token) {
        throw new Error('Please save your Telegram bot token first');
      }

      const response = await fetch(
        `https://api.telegram.org/bot${settings.telegram_bot_token}/setWebhook`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: webhookUrl }),
        }
      );

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.description || 'Failed to set webhook');
      }

      toast.success('Telegram webhook configured successfully!');
    } catch (error: any) {
      toast.error('Webhook setup failed: ' + error.message);
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          <h1 className="text-4xl font-bold mb-8">System Settings</h1>

          <Tabs defaultValue="telegram" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="telegram">
                <Bot className="h-4 w-4 mr-2" />
                Telegram
              </TabsTrigger>
              <TabsTrigger value="email">
                <Mail className="h-4 w-4 mr-2" />
                Email
              </TabsTrigger>
              <TabsTrigger value="payment">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment
              </TabsTrigger>
              <TabsTrigger value="general">
                General
              </TabsTrigger>
            </TabsList>

            {/* Telegram Settings */}
            <TabsContent value="telegram">
              <Card>
                <CardHeader>
                  <CardTitle>Telegram Bot Configuration</CardTitle>
                  <CardDescription>
                    Configure your Telegram bot for customer service and notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="telegram_bot_token">Bot Token</Label>
                    <Input
                      id="telegram_bot_token"
                      type="password"
                      placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                      value={settings.telegram_bot_token || ''}
                      onChange={(e) => setSettings({ ...settings, telegram_bot_token: e.target.value })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Get this from @BotFather on Telegram
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telegram_chat_id">Admin Chat ID</Label>
                    <Input
                      id="telegram_chat_id"
                      placeholder="123456789"
                      value={settings.telegram_chat_id || ''}
                      onChange={(e) => setSettings({ ...settings, telegram_chat_id: e.target.value })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Get your chat ID from @userinfobot on Telegram
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <div className="flex gap-2">
                      <Input value={webhookUrl} readOnly className="font-mono text-sm" />
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(webhookUrl);
                          toast.success('Copied to clipboard!');
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => {
                        saveSetting('telegram_bot_token', settings.telegram_bot_token || '');
                        saveSetting('telegram_chat_id', settings.telegram_chat_id || '');
                      }}
                      disabled={saving}
                    >
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Settings
                    </Button>
                    <Button
                      variant="outline"
                      onClick={setupTelegramWebhook}
                      disabled={testing === 'webhook'}
                    >
                      {testing === 'webhook' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Setup Webhook
                    </Button>
                    <Button
                      variant="outline"
                      onClick={testTelegram}
                      disabled={testing === 'telegram'}
                    >
                      {testing === 'telegram' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Send className="mr-2 h-4 w-4" />
                      Test
                    </Button>
                  </div>

                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Setup Instructions:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Search for @BotFather on Telegram and send /newbot</li>
                      <li>Follow prompts to create your bot and copy the token</li>
                      <li>Search for @userinfobot and get your chat ID</li>
                      <li>Enter both values above and click "Save Settings"</li>
                      <li>Click "Setup Webhook" to connect your bot</li>
                      <li>Click "Test" to verify everything works</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Email Settings */}
            <TabsContent value="email">
              <Card>
                <CardHeader>
                  <CardTitle>Email Configuration (Resend)</CardTitle>
                  <CardDescription>
                    Configure email service for order confirmations and notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="resend_api_key">Resend API Key</Label>
                    <Input
                      id="resend_api_key"
                      type="password"
                      placeholder="re_..."
                      value={settings.resend_api_key || ''}
                      onChange={(e) => setSettings({ ...settings, resend_api_key: e.target.value })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Get your API key from resend.com/api-keys
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="admin_email">Admin Email</Label>
                    <Input
                      id="admin_email"
                      type="email"
                      placeholder="admin@idealsmokesupply.com"
                      value={settings.admin_email || ''}
                      onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                    />
                    <p className="text-sm text-muted-foreground">
                      Email address for receiving order notifications
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => {
                        saveSetting('resend_api_key', settings.resend_api_key || '');
                        saveSetting('admin_email', settings.admin_email || '');
                      }}
                      disabled={saving}
                    >
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Settings
                    </Button>
                    <Button
                      variant="outline"
                      onClick={testResend}
                      disabled={testing === 'resend'}
                    >
                      {testing === 'resend' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Send className="mr-2 h-4 w-4" />
                      Send Test Email
                    </Button>
                  </div>

                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Setup Instructions:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Sign up for a free account at resend.com (3,000 emails/month)</li>
                      <li>Create an API key in your Resend dashboard</li>
                      <li>Enter the API key and your admin email above</li>
                      <li>Click "Save Settings" and then "Send Test Email"</li>
                      <li>(Optional) Verify your domain for professional emails</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Settings */}
            <TabsContent value="payment">
              <Card>
                <CardHeader>
                  <CardTitle>PayFast Payment Configuration</CardTitle>
                  <CardDescription>
                    Configure PayFast payment gateway for South African payments
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="payfast_mode">Mode</Label>
                    <Select
                      value={settings.payfast_mode || 'sandbox'}
                      onValueChange={(value) => setSettings({ ...settings, payfast_mode: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select mode" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">
                          <div className="flex items-center">
                            <Badge variant="outline" className="mr-2">TEST</Badge>
                            Sandbox (Testing)
                          </div>
                        </SelectItem>
                        <SelectItem value="live">
                          <div className="flex items-center">
                            <Badge className="mr-2">LIVE</Badge>
                            Live (Production)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Use sandbox for testing, live for production
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payfast_merchant_id">Merchant ID</Label>
                    <Input
                      id="payfast_merchant_id"
                      placeholder="10000100"
                      value={settings.payfast_merchant_id || ''}
                      onChange={(e) => setSettings({ ...settings, payfast_merchant_id: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payfast_merchant_key">Merchant Key</Label>
                    <Input
                      id="payfast_merchant_key"
                      type="password"
                      placeholder="46f0cd694581a"
                      value={settings.payfast_merchant_key || ''}
                      onChange={(e) => setSettings({ ...settings, payfast_merchant_key: e.target.value })}
                    />
                  </div>

                  <Button
                    onClick={() => {
                      saveSetting('payfast_mode', settings.payfast_mode || 'sandbox');
                      saveSetting('payfast_merchant_id', settings.payfast_merchant_id || '');
                      saveSetting('payfast_merchant_key', settings.payfast_merchant_key || '');
                    }}
                    disabled={saving}
                    className="w-full"
                  >
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Payment Settings
                  </Button>

                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h3 className="font-semibold mb-2">Default Test Credentials (Sandbox):</h3>
                    <div className="space-y-1 text-sm text-muted-foreground font-mono">
                      <p>Merchant ID: 10000100</p>
                      <p>Merchant Key: 46f0cd694581a</p>
                    </div>
                    <h3 className="font-semibold mb-2 mt-4">For Production:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Sign up at payfast.co.za</li>
                      <li>Complete merchant verification</li>
                      <li>Get your live credentials from the dashboard</li>
                      <li>Change mode to "Live" and enter your credentials</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* General Settings */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    System-wide configuration and information
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Telegram Integration</h3>
                        <p className="text-sm text-muted-foreground">Bot and webhook configuration</p>
                      </div>
                      <Badge variant={settings.telegram_bot_token ? 'default' : 'secondary'}>
                        {settings.telegram_bot_token ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Configured
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Not Set
                          </>
                        )}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Email Service</h3>
                        <p className="text-sm text-muted-foreground">Resend API configuration</p>
                      </div>
                      <Badge variant={settings.resend_api_key ? 'default' : 'secondary'}>
                        {settings.resend_api_key ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Configured
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Not Set
                          </>
                        )}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">Payment Gateway</h3>
                        <p className="text-sm text-muted-foreground">
                          PayFast ({settings.payfast_mode || 'sandbox'} mode)
                        </p>
                      </div>
                      <Badge variant={settings.payfast_merchant_id ? 'default' : 'secondary'}>
                        {settings.payfast_merchant_id ? (
                          <>
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Configured
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-1 h-3 w-3" />
                            Not Set
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-primary/5 border-l-4 border-primary rounded">
                    <h3 className="font-semibold mb-2">🎉 Platform Status</h3>
                    <p className="text-sm text-muted-foreground">
                      Configure all integrations to make your platform fully operational.
                      Test each integration after configuration to ensure everything works correctly.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
