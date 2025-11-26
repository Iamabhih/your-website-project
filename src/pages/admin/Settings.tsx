import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Send, Mail, CreditCard, Settings } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SettingsData {
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
  const [settings, setSettings] = useState<SettingsData>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('key, value');

      if (error) throw error;

      const settingsObj: SettingsData = {};
      data?.forEach((item) => {
        try {
          const parsedValue = typeof item.value === 'string'
            ? JSON.parse(item.value)
            : item.value;
          settingsObj[item.key as keyof SettingsData] = parsedValue as string;
        } catch {
          settingsObj[item.key as keyof SettingsData] = String(item.value);
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
          value,
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[400px] flex items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Settings className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">System Settings</h1>
            <p className="text-muted-foreground">Configure email and payment integrations</p>
          </div>
        </div>

        <Tabs defaultValue="email" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="h-4 w-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="payment" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payment
            </TabsTrigger>
            <TabsTrigger value="general" className="gap-2">
              <Settings className="h-4 w-4" />
              Overview
            </TabsTrigger>
          </TabsList>

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

          {/* General/Overview Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Integration Status Overview</CardTitle>
                <CardDescription>
                  Quick view of all system integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
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
                  <h3 className="font-semibold mb-2">Platform Status</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure all integrations to make your platform fully operational.
                    For Telegram settings, go to <strong>Communication → Telegram Settings</strong>.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
