import * as React from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Loader2,
  Store,
  Phone,
  MapPin,
  Clock,
  Share2,
  Shield,
  Settings2,
  Search,
  Save
} from 'lucide-react';
import { useStoreSettings, useUpdateStoreSettings, StoreSettings, defaultSettings } from '@/hooks/useStoreSettings';

export default function AdminStoreSettings() {
  const { data: settings, isLoading, error } = useStoreSettings();
  const updateMutation = useUpdateStoreSettings();
  const [formData, setFormData] = React.useState<StoreSettings>(defaultSettings);
  const [hasChanges, setHasChanges] = React.useState(false);

  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (field: keyof StoreSettings, value: string | boolean) => {
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
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Store Settings</h1>
            <p className="text-muted-foreground mt-1">
              Manage your business information displayed across the site
            </p>
          </div>
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

        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="business">
              <Store className="h-4 w-4 mr-2" />
              Business
            </TabsTrigger>
            <TabsTrigger value="contact">
              <Phone className="h-4 w-4 mr-2" />
              Contact
            </TabsTrigger>
            <TabsTrigger value="social">
              <Share2 className="h-4 w-4 mr-2" />
              Social
            </TabsTrigger>
            <TabsTrigger value="features">
              <Settings2 className="h-4 w-4 mr-2" />
              Features
            </TabsTrigger>
            <TabsTrigger value="seo">
              <Search className="h-4 w-4 mr-2" />
              SEO
            </TabsTrigger>
          </TabsList>

          {/* Business Information */}
          <TabsContent value="business">
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

                <Separator />

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

                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Business Hours
                  </h3>
                  <div className="grid gap-4 md:grid-cols-3">
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
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Information */}
          <TabsContent value="contact">
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

                <Separator />

                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Physical Address
                  </h3>
                  <div className="space-y-4">
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
                  </div>
                </div>
              </CardContent>
            </Card>
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Feature Toggles */}
          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="h-5 w-5" />
                  Feature Toggles
                </CardTitle>
                <CardDescription>
                  Enable or disable site features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="feature_age_verification">Age Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Require visitors to confirm they are 18+ before accessing the site
                    </p>
                  </div>
                  <Switch
                    id="feature_age_verification"
                    checked={formData.feature_age_verification_enabled}
                    onCheckedChange={(checked) => handleChange('feature_age_verification_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="feature_chat">Live Chat Widget</Label>
                    <p className="text-sm text-muted-foreground">
                      Show chat widget for customer support
                    </p>
                  </div>
                  <Switch
                    id="feature_chat"
                    checked={formData.feature_chat_enabled}
                    onCheckedChange={(checked) => handleChange('feature_chat_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="feature_newsletter">Newsletter Signup</Label>
                    <p className="text-sm text-muted-foreground">
                      Show newsletter subscription form on the homepage
                    </p>
                  </div>
                  <Switch
                    id="feature_newsletter"
                    checked={formData.feature_newsletter_enabled}
                    onCheckedChange={(checked) => handleChange('feature_newsletter_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="feature_reviews">Product Reviews</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow customers to leave product reviews
                    </p>
                  </div>
                  <Switch
                    id="feature_reviews"
                    checked={formData.feature_reviews_enabled}
                    onCheckedChange={(checked) => handleChange('feature_reviews_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="feature_wishlist">Wishlist</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow customers to save products to a wishlist
                    </p>
                  </div>
                  <Switch
                    id="feature_wishlist"
                    checked={formData.feature_wishlist_enabled}
                    onCheckedChange={(checked) => handleChange('feature_wishlist_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="feature_telegram">Telegram Bot</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable Telegram bot for order updates and support
                    </p>
                  </div>
                  <Switch
                    id="feature_telegram"
                    checked={formData.feature_telegram_bot_enabled}
                    onCheckedChange={(checked) => handleChange('feature_telegram_bot_enabled', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Settings */}
          <TabsContent value="seo">
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
                    Recommended: 50-60 characters
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
                    Recommended: 150-160 characters
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
