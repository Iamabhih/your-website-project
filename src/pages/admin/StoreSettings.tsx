import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Loader2,
  Store,
  Phone,
  MapPin,
  Clock,
  Share2,
  Settings2,
  Search,
  Save,
  BarChart3,
  Globe,
  Mail,
  Truck,
  Shield,
  Package,
  AlertTriangle,
  CreditCard
} from 'lucide-react';
import { useStoreSettings, useUpdateStoreSettings, StoreSettings, defaultSettings } from '@/hooks/useStoreSettings';

export default function AdminStoreSettings() {
  const { data: settings, isLoading, error } = useStoreSettings();
  const updateMutation = useUpdateStoreSettings();
  const [formData, setFormData] = useState<StoreSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (field: keyof StoreSettings, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync(formData);
      setHasChanges(false);
      toast.success('Store settings saved successfully!');
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-destructive">Failed to load store settings</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Store Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your business information displayed across the site
            </p>
          </div>
          <div className="flex items-center gap-4">
            {formData.feature_maintenance_mode_enabled && (
              <Badge variant="destructive" className="animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Maintenance Mode Active
              </Badge>
            )}
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || !hasChanges}
              size="lg"
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 h-auto">
            <TabsTrigger value="business" className="flex-col sm:flex-row py-2">
              <Store className="h-4 w-4 sm:mr-2" />
              <span className="text-xs sm:text-sm">Business</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex-col sm:flex-row py-2">
              <Phone className="h-4 w-4 sm:mr-2" />
              <span className="text-xs sm:text-sm">Contact</span>
            </TabsTrigger>
            <TabsTrigger value="social" className="flex-col sm:flex-row py-2">
              <Share2 className="h-4 w-4 sm:mr-2" />
              <span className="text-xs sm:text-sm">Social</span>
            </TabsTrigger>
            <TabsTrigger value="features" className="flex-col sm:flex-row py-2">
              <Settings2 className="h-4 w-4 sm:mr-2" />
              <span className="text-xs sm:text-sm">Features</span>
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex-col sm:flex-row py-2">
              <Search className="h-4 w-4 sm:mr-2" />
              <span className="text-xs sm:text-sm">SEO</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-col sm:flex-row py-2">
              <BarChart3 className="h-4 w-4 sm:mr-2" />
              <span className="text-xs sm:text-sm">Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex-col sm:flex-row py-2">
              <Truck className="h-4 w-4 sm:mr-2" />
              <span className="text-xs sm:text-sm">Shipping</span>
            </TabsTrigger>
            <TabsTrigger value="checkout" className="flex-col sm:flex-row py-2">
              <CreditCard className="h-4 w-4 sm:mr-2" />
              <span className="text-xs sm:text-sm">Checkout</span>
            </TabsTrigger>
          </TabsList>

          {/* Business Information */}
          <TabsContent value="business">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5" />
                    Business Information
                  </CardTitle>
                  <CardDescription>
                    Basic information about your store
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="store_name">Store Name</Label>
                      <Input
                        id="store_name"
                        value={formData.store_name}
                        onChange={(e) => handleChange('store_name', e.target.value)}
                        placeholder="Your Store Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="store_tagline">Tagline</Label>
                      <Input
                        id="store_tagline"
                        value={formData.store_tagline}
                        onChange={(e) => handleChange('store_tagline', e.target.value)}
                        placeholder="Your catchy tagline"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="store_description">Store Description</Label>
                    <Textarea
                      id="store_description"
                      value={formData.store_description}
                      onChange={(e) => handleChange('store_description', e.target.value)}
                      placeholder="Describe your business..."
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="store_logo_url">Logo URL</Label>
                      <Input
                        id="store_logo_url"
                        value={formData.store_logo_url}
                        onChange={(e) => handleChange('store_logo_url', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="store_favicon_url">Favicon URL</Label>
                      <Input
                        id="store_favicon_url"
                        value={formData.store_favicon_url}
                        onChange={(e) => handleChange('store_favicon_url', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Legal & Tax Information
                  </CardTitle>
                  <CardDescription>
                    Business registration and tax settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="business_registration_number">Business Registration Number</Label>
                      <Input
                        id="business_registration_number"
                        value={formData.business_registration_number}
                        onChange={(e) => handleChange('business_registration_number', e.target.value)}
                        placeholder="e.g., 2024/123456/07"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vat_number">VAT Number (Optional)</Label>
                      <Input
                        id="vat_number"
                        value={formData.vat_number}
                        onChange={(e) => handleChange('vat_number', e.target.value)}
                        placeholder="e.g., 4123456789"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label htmlFor="tax_enabled">Tax Enabled</Label>
                        <p className="text-sm text-muted-foreground">
                          Add tax to product prices
                        </p>
                      </div>
                      <Switch
                        id="tax_enabled"
                        checked={formData.tax_enabled}
                        onCheckedChange={(checked) => handleChange('tax_enabled', checked)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                      <Input
                        id="tax_rate"
                        type="number"
                        value={formData.tax_rate}
                        onChange={(e) => handleChange('tax_rate', parseFloat(e.target.value) || 0)}
                        placeholder="15"
                        disabled={!formData.tax_enabled}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Business Hours
                  </CardTitle>
                  <CardDescription>
                    When customers can reach you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="business_hours_weekday">Monday - Friday</Label>
                      <Input
                        id="business_hours_weekday"
                        value={formData.business_hours_weekday}
                        onChange={(e) => handleChange('business_hours_weekday', e.target.value)}
                        placeholder="08:00 - 17:00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business_hours_saturday">Saturday</Label>
                      <Input
                        id="business_hours_saturday"
                        value={formData.business_hours_saturday}
                        onChange={(e) => handleChange('business_hours_saturday', e.target.value)}
                        placeholder="09:00 - 14:00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business_hours_sunday">Sunday</Label>
                      <Input
                        id="business_hours_sunday"
                        value={formData.business_hours_sunday}
                        onChange={(e) => handleChange('business_hours_sunday', e.target.value)}
                        placeholder="Closed"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business_hours_public_holidays">Public Holidays</Label>
                      <Input
                        id="business_hours_public_holidays"
                        value={formData.business_hours_public_holidays}
                        onChange={(e) => handleChange('business_hours_public_holidays', e.target.value)}
                        placeholder="Closed"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Regional Settings
                  </CardTitle>
                  <CardDescription>
                    Currency and locale preferences
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label htmlFor="currency_code">Currency Code</Label>
                      <Select
                        value={formData.currency_code}
                        onValueChange={(value) => handleChange('currency_code', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="currency_symbol">Currency Symbol</Label>
                      <Input
                        id="currency_symbol"
                        value={formData.currency_symbol}
                        onChange={(e) => handleChange('currency_symbol', e.target.value)}
                        placeholder="R"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Select
                        value={formData.timezone}
                        onValueChange={(value) => handleChange('timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                          <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_format">Date Format</Label>
                      <Select
                        value={formData.date_format}
                        onValueChange={(value) => handleChange('date_format', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Contact Information */}
          <TabsContent value="contact">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contact Information
                  </CardTitle>
                  <CardDescription>
                    How customers can reach you
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="store_email">Email Address</Label>
                      <Input
                        id="store_email"
                        type="email"
                        value={formData.store_email}
                        onChange={(e) => handleChange('store_email', e.target.value)}
                        placeholder="support@yourstore.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="store_phone">Phone Number</Label>
                      <Input
                        id="store_phone"
                        value={formData.store_phone}
                        onChange={(e) => handleChange('store_phone', e.target.value)}
                        placeholder="+27 12 345 6789"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="store_whatsapp">WhatsApp Number</Label>
                    <Input
                      id="store_whatsapp"
                      value={formData.store_whatsapp}
                      onChange={(e) => handleChange('store_whatsapp', e.target.value)}
                      placeholder="+27 12 345 6789"
                    />
                    <p className="text-sm text-muted-foreground">
                      Used for WhatsApp chat button (include country code)
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Physical Address
                  </CardTitle>
                  <CardDescription>
                    Your business location
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="store_address">Street Address</Label>
                    <Input
                      id="store_address"
                      value={formData.store_address}
                      onChange={(e) => handleChange('store_address', e.target.value)}
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="store_city">City</Label>
                      <Input
                        id="store_city"
                        value={formData.store_city}
                        onChange={(e) => handleChange('store_city', e.target.value)}
                        placeholder="Johannesburg"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="store_province">Province/State</Label>
                      <Input
                        id="store_province"
                        value={formData.store_province}
                        onChange={(e) => handleChange('store_province', e.target.value)}
                        placeholder="Gauteng"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="store_postal_code">Postal Code</Label>
                      <Input
                        id="store_postal_code"
                        value={formData.store_postal_code}
                        onChange={(e) => handleChange('store_postal_code', e.target.value)}
                        placeholder="2000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="store_country">Country</Label>
                      <Input
                        id="store_country"
                        value={formData.store_country}
                        onChange={(e) => handleChange('store_country', e.target.value)}
                        placeholder="South Africa"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Settings
                  </CardTitle>
                  <CardDescription>
                    Configure email notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email_from_name">From Name</Label>
                      <Input
                        id="email_from_name"
                        value={formData.email_from_name}
                        onChange={(e) => handleChange('email_from_name', e.target.value)}
                        placeholder="Your Store Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email_from_address">From Email</Label>
                      <Input
                        id="email_from_address"
                        type="email"
                        value={formData.email_from_address}
                        onChange={(e) => handleChange('email_from_address', e.target.value)}
                        placeholder="noreply@yourstore.com"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Order Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Send email when new orders are placed
                        </p>
                      </div>
                      <Switch
                        checked={formData.email_order_notifications}
                        onCheckedChange={(checked) => handleChange('email_order_notifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Shipping Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify customers when orders ship
                        </p>
                      </div>
                      <Switch
                        checked={formData.email_shipping_notifications}
                        onCheckedChange={(checked) => handleChange('email_shipping_notifications', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Marketing Emails</Label>
                        <p className="text-sm text-muted-foreground">
                          Send promotional emails to subscribed customers
                        </p>
                      </div>
                      <Switch
                        checked={formData.email_marketing_enabled}
                        onCheckedChange={(checked) => handleChange('email_marketing_enabled', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Social Media */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Social Media Links
                </CardTitle>
                <CardDescription>
                  Connect your social media profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="social_facebook">Facebook</Label>
                    <Input
                      id="social_facebook"
                      value={formData.social_facebook}
                      onChange={(e) => handleChange('social_facebook', e.target.value)}
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="social_instagram">Instagram</Label>
                    <Input
                      id="social_instagram"
                      value={formData.social_instagram}
                      onChange={(e) => handleChange('social_instagram', e.target.value)}
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="social_twitter">Twitter / X</Label>
                    <Input
                      id="social_twitter"
                      value={formData.social_twitter}
                      onChange={(e) => handleChange('social_twitter', e.target.value)}
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="social_tiktok">TikTok</Label>
                    <Input
                      id="social_tiktok"
                      value={formData.social_tiktok}
                      onChange={(e) => handleChange('social_tiktok', e.target.value)}
                      placeholder="https://tiktok.com/@yourhandle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="social_youtube">YouTube</Label>
                    <Input
                      id="social_youtube"
                      value={formData.social_youtube}
                      onChange={(e) => handleChange('social_youtube', e.target.value)}
                      placeholder="https://youtube.com/@yourchannel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="social_linkedin">LinkedIn</Label>
                    <Input
                      id="social_linkedin"
                      value={formData.social_linkedin}
                      onChange={(e) => handleChange('social_linkedin', e.target.value)}
                      placeholder="https://linkedin.com/company/yourcompany"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature Toggles */}
          <TabsContent value="features">
            <div className="space-y-6">
              {/* Maintenance Mode - Special Alert */}
              <Card className={formData.feature_maintenance_mode_enabled ? 'border-destructive' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    Maintenance Mode
                  </CardTitle>
                  <CardDescription>
                    Temporarily disable the storefront for maintenance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/50">
                    <div className="space-y-0.5">
                      <Label htmlFor="maintenance_mode">Enable Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        This will show a maintenance page to all visitors
                      </p>
                    </div>
                    <Switch
                      id="maintenance_mode"
                      checked={formData.feature_maintenance_mode_enabled}
                      onCheckedChange={(checked) => handleChange('feature_maintenance_mode_enabled', checked)}
                    />
                  </div>
                  {formData.feature_maintenance_mode_enabled && (
                    <div className="space-y-2">
                      <Label htmlFor="maintenance_message">Maintenance Message</Label>
                      <Textarea
                        id="maintenance_message"
                        value={formData.maintenance_message}
                        onChange={(e) => handleChange('maintenance_message', e.target.value)}
                        placeholder="We are currently performing maintenance..."
                        rows={3}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Site Features
                  </CardTitle>
                  <CardDescription>
                    Enable or disable site features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Age Verification</Label>
                        <p className="text-sm text-muted-foreground">
                          Require 18+ confirmation
                        </p>
                      </div>
                      <Switch
                        checked={formData.feature_age_verification_enabled}
                        onCheckedChange={(checked) => handleChange('feature_age_verification_enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Live Chat</Label>
                        <p className="text-sm text-muted-foreground">
                          Show chat widget
                        </p>
                      </div>
                      <Switch
                        checked={formData.feature_chat_enabled}
                        onCheckedChange={(checked) => handleChange('feature_chat_enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Newsletter Signup</Label>
                        <p className="text-sm text-muted-foreground">
                          Show subscription form
                        </p>
                      </div>
                      <Switch
                        checked={formData.feature_newsletter_enabled}
                        onCheckedChange={(checked) => handleChange('feature_newsletter_enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Product Reviews</Label>
                        <p className="text-sm text-muted-foreground">
                          Allow customer reviews
                        </p>
                      </div>
                      <Switch
                        checked={formData.feature_reviews_enabled}
                        onCheckedChange={(checked) => handleChange('feature_reviews_enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Wishlist</Label>
                        <p className="text-sm text-muted-foreground">
                          Save products for later
                        </p>
                      </div>
                      <Switch
                        checked={formData.feature_wishlist_enabled}
                        onCheckedChange={(checked) => handleChange('feature_wishlist_enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Telegram Bot</Label>
                        <p className="text-sm text-muted-foreground">
                          Order updates via Telegram
                        </p>
                      </div>
                      <Switch
                        checked={formData.feature_telegram_bot_enabled}
                        onCheckedChange={(checked) => handleChange('feature_telegram_bot_enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Guest Checkout</Label>
                        <p className="text-sm text-muted-foreground">
                          Order without account
                        </p>
                      </div>
                      <Switch
                        checked={formData.feature_guest_checkout_enabled}
                        onCheckedChange={(checked) => handleChange('feature_guest_checkout_enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Stock Alerts</Label>
                        <p className="text-sm text-muted-foreground">
                          Notify when back in stock
                        </p>
                      </div>
                      <Switch
                        checked={formData.feature_stock_alerts_enabled}
                        onCheckedChange={(checked) => handleChange('feature_stock_alerts_enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Compare Products</Label>
                        <p className="text-sm text-muted-foreground">
                          Side-by-side comparison
                        </p>
                      </div>
                      <Switch
                        checked={formData.feature_compare_products_enabled}
                        onCheckedChange={(checked) => handleChange('feature_compare_products_enabled', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <Label>Recently Viewed</Label>
                        <p className="text-sm text-muted-foreground">
                          Show browsing history
                        </p>
                      </div>
                      <Switch
                        checked={formData.feature_recently_viewed_enabled}
                        onCheckedChange={(checked) => handleChange('feature_recently_viewed_enabled', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* SEO Settings */}
          <TabsContent value="seo">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    SEO Settings
                  </CardTitle>
                  <CardDescription>
                    Optimize your store for search engines
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seo_meta_title">Meta Title</Label>
                    <Input
                      id="seo_meta_title"
                      value={formData.seo_meta_title}
                      onChange={(e) => handleChange('seo_meta_title', e.target.value)}
                      placeholder="Your Store - Premium Vaping Products"
                    />
                    <p className="text-sm text-muted-foreground">
                      {formData.seo_meta_title.length}/60 characters (recommended: 50-60)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seo_meta_description">Meta Description</Label>
                    <Textarea
                      id="seo_meta_description"
                      value={formData.seo_meta_description}
                      onChange={(e) => handleChange('seo_meta_description', e.target.value)}
                      placeholder="Describe your store for search results..."
                      rows={3}
                    />
                    <p className="text-sm text-muted-foreground">
                      {formData.seo_meta_description.length}/160 characters (recommended: 150-160)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seo_keywords">Keywords</Label>
                    <Input
                      id="seo_keywords"
                      value={formData.seo_keywords}
                      onChange={(e) => handleChange('seo_keywords', e.target.value)}
                      placeholder="vape, e-liquid, vaping products, South Africa"
                    />
                    <p className="text-sm text-muted-foreground">
                      Comma-separated keywords for your store
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Social Sharing (Open Graph)</CardTitle>
                  <CardDescription>
                    How your site appears when shared on social media
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seo_og_image">Default Share Image URL</Label>
                    <Input
                      id="seo_og_image"
                      value={formData.seo_og_image}
                      onChange={(e) => handleChange('seo_og_image', e.target.value)}
                      placeholder="https://yourstore.com/og-image.jpg"
                    />
                    <p className="text-sm text-muted-foreground">
                      Recommended: 1200x630 pixels
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seo_twitter_handle">Twitter Handle</Label>
                    <Input
                      id="seo_twitter_handle"
                      value={formData.seo_twitter_handle}
                      onChange={(e) => handleChange('seo_twitter_handle', e.target.value)}
                      placeholder="@yourhandle"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Advanced SEO</CardTitle>
                  <CardDescription>
                    Technical SEO settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seo_google_site_verification">Google Site Verification</Label>
                    <Input
                      id="seo_google_site_verification"
                      value={formData.seo_google_site_verification}
                      onChange={(e) => handleChange('seo_google_site_verification', e.target.value)}
                      placeholder="Google verification code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seo_robots_txt">Robots.txt Content</Label>
                    <Textarea
                      id="seo_robots_txt"
                      value={formData.seo_robots_txt}
                      onChange={(e) => handleChange('seo_robots_txt', e.target.value)}
                      placeholder="User-agent: *&#10;Allow: /"
                      rows={4}
                      className="font-mono text-sm"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Analytics & Tracking
                </CardTitle>
                <CardDescription>
                  Connect your analytics platforms
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="analytics_google_id">Google Analytics ID</Label>
                    <Input
                      id="analytics_google_id"
                      value={formData.analytics_google_id}
                      onChange={(e) => handleChange('analytics_google_id', e.target.value)}
                      placeholder="G-XXXXXXXXXX or UA-XXXXXXXXX-X"
                    />
                    <p className="text-sm text-muted-foreground">
                      GA4 or Universal Analytics tracking ID
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="analytics_facebook_pixel">Facebook Pixel ID</Label>
                    <Input
                      id="analytics_facebook_pixel"
                      value={formData.analytics_facebook_pixel}
                      onChange={(e) => handleChange('analytics_facebook_pixel', e.target.value)}
                      placeholder="123456789012345"
                    />
                    <p className="text-sm text-muted-foreground">
                      For Facebook/Meta ads tracking
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="analytics_tiktok_pixel">TikTok Pixel ID</Label>
                    <Input
                      id="analytics_tiktok_pixel"
                      value={formData.analytics_tiktok_pixel}
                      onChange={(e) => handleChange('analytics_tiktok_pixel', e.target.value)}
                      placeholder="XXXXXXXXXXXXXXXXXX"
                    />
                    <p className="text-sm text-muted-foreground">
                      For TikTok ads tracking
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="analytics_hotjar_id">Hotjar Site ID</Label>
                    <Input
                      id="analytics_hotjar_id"
                      value={formData.analytics_hotjar_id}
                      onChange={(e) => handleChange('analytics_hotjar_id', e.target.value)}
                      placeholder="1234567"
                    />
                    <p className="text-sm text-muted-foreground">
                      For heatmaps and session recordings
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shipping */}
          <TabsContent value="shipping">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Shipping Defaults
                  </CardTitle>
                  <CardDescription>
                    Default shipping rates and settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="shipping_free_threshold">Free Shipping Threshold (R)</Label>
                      <Input
                        id="shipping_free_threshold"
                        type="number"
                        value={formData.shipping_free_threshold}
                        onChange={(e) => handleChange('shipping_free_threshold', parseFloat(e.target.value) || 0)}
                        placeholder="500"
                      />
                      <p className="text-sm text-muted-foreground">
                        Orders above this amount qualify for free shipping
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping_processing_days">Processing Days</Label>
                      <Input
                        id="shipping_processing_days"
                        type="number"
                        value={formData.shipping_processing_days}
                        onChange={(e) => handleChange('shipping_processing_days', parseInt(e.target.value) || 0)}
                        placeholder="2"
                      />
                      <p className="text-sm text-muted-foreground">
                        Days to process before shipping
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping_default_rate">Standard Shipping Rate (R)</Label>
                      <Input
                        id="shipping_default_rate"
                        type="number"
                        value={formData.shipping_default_rate}
                        onChange={(e) => handleChange('shipping_default_rate', parseFloat(e.target.value) || 0)}
                        placeholder="99"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shipping_express_rate">Express Shipping Rate (R)</Label>
                      <Input
                        id="shipping_express_rate"
                        type="number"
                        value={formData.shipping_express_rate}
                        onChange={(e) => handleChange('shipping_express_rate', parseFloat(e.target.value) || 0)}
                        placeholder="150"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Inventory Settings
                  </CardTitle>
                  <CardDescription>
                    Stock management preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-0.5">
                      <Label>Track Stock</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable inventory tracking for products
                      </p>
                    </div>
                    <Switch
                      checked={formData.inventory_track_stock}
                      onCheckedChange={(checked) => handleChange('inventory_track_stock', checked)}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="inventory_low_stock_threshold">Low Stock Threshold</Label>
                      <Input
                        id="inventory_low_stock_threshold"
                        type="number"
                        value={formData.inventory_low_stock_threshold}
                        onChange={(e) => handleChange('inventory_low_stock_threshold', parseInt(e.target.value) || 0)}
                        placeholder="5"
                      />
                      <p className="text-sm text-muted-foreground">
                        Alert when stock falls below this
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="inventory_out_of_stock_visibility">Out of Stock Products</Label>
                      <Select
                        value={formData.inventory_out_of_stock_visibility}
                        onValueChange={(value) => handleChange('inventory_out_of_stock_visibility', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="show">Show (marked as out of stock)</SelectItem>
                          <SelectItem value="hide">Hide from catalog</SelectItem>
                          <SelectItem value="last">Show at end of catalog</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Checkout Settings */}
          <TabsContent value="checkout">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Checkout Settings
                  </CardTitle>
                  <CardDescription>
                    Configure checkout requirements and limits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="checkout_min_order_amount">Minimum Order Amount (R)</Label>
                      <Input
                        id="checkout_min_order_amount"
                        type="number"
                        value={formData.checkout_min_order_amount}
                        onChange={(e) => handleChange('checkout_min_order_amount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                      />
                      <p className="text-sm text-muted-foreground">
                        Set to 0 for no minimum
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkout_max_order_amount">Maximum Order Amount (R)</Label>
                      <Input
                        id="checkout_max_order_amount"
                        type="number"
                        value={formData.checkout_max_order_amount}
                        onChange={(e) => handleChange('checkout_max_order_amount', parseFloat(e.target.value) || 0)}
                        placeholder="50000"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Required Fields</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label>Require Phone Number</Label>
                          <p className="text-sm text-muted-foreground">
                            Customer must provide phone
                          </p>
                        </div>
                        <Switch
                          checked={formData.checkout_require_phone}
                          onCheckedChange={(checked) => handleChange('checkout_require_phone', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-0.5">
                          <Label>Require Company Name</Label>
                          <p className="text-sm text-muted-foreground">
                            For B2B orders
                          </p>
                        </div>
                        <Switch
                          checked={formData.checkout_require_company}
                          onCheckedChange={(checked) => handleChange('checkout_require_company', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Legal Pages</CardTitle>
                  <CardDescription>
                    Links to your legal documents
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="legal_terms_url">Terms of Service URL</Label>
                      <Input
                        id="legal_terms_url"
                        value={formData.legal_terms_url}
                        onChange={(e) => handleChange('legal_terms_url', e.target.value)}
                        placeholder="/terms-of-service"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legal_privacy_url">Privacy Policy URL</Label>
                      <Input
                        id="legal_privacy_url"
                        value={formData.legal_privacy_url}
                        onChange={(e) => handleChange('legal_privacy_url', e.target.value)}
                        placeholder="/privacy-policy"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legal_refund_url">Refund Policy URL</Label>
                      <Input
                        id="legal_refund_url"
                        value={formData.legal_refund_url}
                        onChange={(e) => handleChange('legal_refund_url', e.target.value)}
                        placeholder="/return-policy"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="legal_cookie_url">Cookie Policy URL</Label>
                      <Input
                        id="legal_cookie_url"
                        value={formData.legal_cookie_url}
                        onChange={(e) => handleChange('legal_cookie_url', e.target.value)}
                        placeholder="/cookie-policy"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {hasChanges && (
          <div className="fixed bottom-4 right-4 z-50">
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              size="lg"
              className="shadow-lg"
            >
              {updateMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
