import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Bell, Send, Users, Megaphone, BarChart3, Plus, Trash2,
  Eye, Clock, Target, Sparkles, Gift, Tag, ShoppingCart,
  AlertCircle, CheckCircle2, Loader2, Calendar, Palette
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Campaign {
  id: string;
  title: string;
  message: string;
  type: 'push' | 'banner' | 'popup' | 'email';
  status: 'draft' | 'scheduled' | 'active' | 'completed';
  targetAudience: 'all' | 'customers' | 'new_users' | 'inactive';
  scheduledAt?: string;
  sentCount: number;
  openCount: number;
  clickCount: number;
  createdAt: string;
}

interface BannerConfig {
  id: string;
  title: string;
  message: string;
  backgroundColor: string;
  textColor: string;
  icon: string;
  actionText: string;
  actionLink: string;
  showCountdown: boolean;
  expiresAt?: string;
  isActive: boolean;
  position: 'top' | 'bottom' | 'popup';
}

const notificationTypes = [
  { value: 'order_update', label: 'Order Update', icon: ShoppingCart },
  { value: 'promotion', label: 'Promotion', icon: Tag },
  { value: 'price_drop', label: 'Price Drop', icon: Sparkles },
  { value: 'back_in_stock', label: 'Back in Stock', icon: ShoppingCart },
  { value: 'cart_reminder', label: 'Cart Reminder', icon: ShoppingCart },
  { value: 'welcome', label: 'Welcome', icon: Gift },
  { value: 'system', label: 'System', icon: AlertCircle },
];

const audienceOptions = [
  { value: 'all', label: 'All Users' },
  { value: 'customers', label: 'Customers Only' },
  { value: 'new_users', label: 'New Users (Last 7 days)' },
  { value: 'inactive', label: 'Inactive Users (30+ days)' },
];

const gradientPresets = [
  { name: 'Purple Pink', value: 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-500' },
  { name: 'Blue Cyan', value: 'bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400' },
  { name: 'Orange Red', value: 'bg-gradient-to-r from-orange-500 via-red-500 to-pink-500' },
  { name: 'Green Teal', value: 'bg-gradient-to-r from-green-500 via-teal-500 to-cyan-500' },
  { name: 'Indigo Purple', value: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500' },
  { name: 'Yellow Orange', value: 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500' },
];

export default function Notifications() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [banners, setBanners] = useState<BannerConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [showNewBanner, setShowNewBanner] = useState(false);

  // Quick Send Form
  const [quickSend, setQuickSend] = useState({
    title: '',
    message: '',
    type: 'promotion',
    audience: 'all',
  });

  // Banner Form
  const [bannerForm, setBannerForm] = useState<Partial<BannerConfig>>({
    title: '',
    message: '',
    backgroundColor: gradientPresets[0].value,
    textColor: 'text-white',
    icon: 'sparkles',
    actionText: 'Shop Now',
    actionLink: '/shop',
    showCountdown: false,
    isActive: true,
    position: 'top',
  });

  // Stats
  const [stats, setStats] = useState({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    activeSubscribers: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load campaigns from database
      const { data: campaignsData } = await supabase
        .from('notification_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (campaignsData) {
        setCampaigns(campaignsData.map(c => ({
          id: c.id,
          title: c.title,
          message: c.message,
          type: c.type,
          status: c.status,
          targetAudience: c.target_audience,
          scheduledAt: c.scheduled_at,
          sentCount: c.sent_count || 0,
          openCount: c.open_count || 0,
          clickCount: c.click_count || 0,
          createdAt: c.created_at,
        })));
      }

      // Load banners
      const { data: bannersData } = await supabase
        .from('promo_banners')
        .select('*')
        .order('created_at', { ascending: false });

      if (bannersData) {
        setBanners(bannersData.map(b => ({
          id: b.id,
          title: b.title,
          message: b.message,
          backgroundColor: b.background_color,
          textColor: b.text_color,
          icon: b.icon,
          actionText: b.action_text,
          actionLink: b.action_link,
          showCountdown: b.show_countdown,
          expiresAt: b.expires_at,
          isActive: b.is_active,
          position: b.position,
        })));
      }

      // Calculate stats
      const totalSent = campaignsData?.reduce((sum, c) => sum + (c.sent_count || 0), 0) || 0;
      const totalOpened = campaignsData?.reduce((sum, c) => sum + (c.open_count || 0), 0) || 0;
      const totalClicked = campaignsData?.reduce((sum, c) => sum + (c.click_count || 0), 0) || 0;

      // Get subscriber count
      const { count: subscriberCount } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalSent,
        totalOpened,
        totalClicked,
        activeSubscribers: subscriberCount || 0,
      });
    } catch (error) {
      console.error('Failed to load notification data:', error);
    }
    setLoading(false);
  };

  const sendQuickNotification = async () => {
    if (!quickSend.title || !quickSend.message) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      // Create campaign record
      const { data: campaign, error } = await supabase
        .from('notification_campaigns')
        .insert({
          title: quickSend.title,
          message: quickSend.message,
          type: 'push',
          status: 'active',
          target_audience: quickSend.audience,
        })
        .select()
        .single();

      if (error) throw error;

      // Send push notifications via edge function
      await supabase.functions.invoke('send-push-notifications', {
        body: {
          campaignId: campaign.id,
          title: quickSend.title,
          message: quickSend.message,
          type: quickSend.type,
          audience: quickSend.audience,
        },
      });

      toast.success('Notification sent successfully!');
      setQuickSend({ title: '', message: '', type: 'promotion', audience: 'all' });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send notification');
    }
    setSending(false);
  };

  const saveBanner = async () => {
    if (!bannerForm.title || !bannerForm.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase
        .from('promo_banners')
        .insert({
          title: bannerForm.title,
          message: bannerForm.message,
          background_color: bannerForm.backgroundColor,
          text_color: bannerForm.textColor,
          icon: bannerForm.icon,
          action_text: bannerForm.actionText,
          action_link: bannerForm.actionLink,
          show_countdown: bannerForm.showCountdown,
          expires_at: bannerForm.expiresAt,
          is_active: bannerForm.isActive,
          position: bannerForm.position,
        });

      if (error) throw error;

      toast.success('Banner created successfully!');
      setShowNewBanner(false);
      setBannerForm({
        title: '',
        message: '',
        backgroundColor: gradientPresets[0].value,
        textColor: 'text-white',
        icon: 'sparkles',
        actionText: 'Shop Now',
        actionLink: '/shop',
        showCountdown: false,
        isActive: true,
        position: 'top',
      });
      loadData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create banner');
    }
    setSending(false);
  };

  const toggleBanner = async (id: string, isActive: boolean) => {
    try {
      await supabase
        .from('promo_banners')
        .update({ is_active: isActive })
        .eq('id', id);

      setBanners(prev =>
        prev.map(b => b.id === id ? { ...b, isActive } : b)
      );

      toast.success(isActive ? 'Banner activated' : 'Banner deactivated');
    } catch (error) {
      toast.error('Failed to update banner');
    }
  };

  const deleteBanner = async (id: string) => {
    try {
      await supabase.from('promo_banners').delete().eq('id', id);
      setBanners(prev => prev.filter(b => b.id !== id));
      toast.success('Banner deleted');
    } catch (error) {
      toast.error('Failed to delete banner');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Bell className="h-8 w-8" />
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              Send push notifications and manage promotional banners
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalSent.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Total Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Eye className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalOpened.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Opened</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalClicked.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Clicked</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <Users className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeSubscribers.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Subscribers</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="send" className="space-y-6">
          <TabsList>
            <TabsTrigger value="send" className="gap-2">
              <Send className="h-4 w-4" />
              Send Notification
            </TabsTrigger>
            <TabsTrigger value="banners" className="gap-2">
              <Megaphone className="h-4 w-4" />
              Promo Banners
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          {/* Send Notification Tab */}
          <TabsContent value="send">
            <Card>
              <CardHeader>
                <CardTitle>Quick Send</CardTitle>
                <CardDescription>
                  Send a push notification to your users instantly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Notification Type</Label>
                    <Select
                      value={quickSend.type}
                      onValueChange={(value) => setQuickSend(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {notificationTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Target Audience</Label>
                    <Select
                      value={quickSend.audience}
                      onValueChange={(value) => setQuickSend(prev => ({ ...prev, audience: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {audienceOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Flash Sale - 50% Off!"
                    value={quickSend.title}
                    onChange={(e) => setQuickSend(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="e.g., Don't miss out on our biggest sale of the year!"
                    value={quickSend.message}
                    onChange={(e) => setQuickSend(prev => ({ ...prev, message: e.target.value }))}
                    rows={3}
                  />
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Bell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">{quickSend.title || 'Notification Title'}</p>
                        <p className="text-sm text-muted-foreground">
                          {quickSend.message || 'Your notification message will appear here'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  className="w-full sm:w-auto"
                  onClick={sendQuickNotification}
                  disabled={sending}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Notification
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Promo Banners Tab */}
          <TabsContent value="banners">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Promotional Banners</CardTitle>
                    <CardDescription>
                      Create and manage promotional banners displayed on your site
                    </CardDescription>
                  </div>
                  <Dialog open={showNewBanner} onOpenChange={setShowNewBanner}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Banner
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Create Promotional Banner</DialogTitle>
                        <DialogDescription>
                          Design a banner to promote sales, announcements, or special offers
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-6 py-4">
                        {/* Preview */}
                        <div className="space-y-2">
                          <Label>Preview</Label>
                          <div className={`rounded-lg p-4 ${bannerForm.backgroundColor} ${bannerForm.textColor}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-full">
                                  <Sparkles className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="font-bold">{bannerForm.title || 'Banner Title'}</p>
                                  <p className="text-sm opacity-90">{bannerForm.message || 'Banner message'}</p>
                                </div>
                              </div>
                              <Button size="sm" variant="secondary">
                                {bannerForm.actionText || 'Shop Now'}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Title *</Label>
                            <Input
                              placeholder="e.g., Summer Sale!"
                              value={bannerForm.title}
                              onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Message *</Label>
                            <Input
                              placeholder="e.g., Up to 50% off selected items"
                              value={bannerForm.message}
                              onChange={(e) => setBannerForm(prev => ({ ...prev, message: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Background Color</Label>
                          <div className="grid grid-cols-3 gap-2">
                            {gradientPresets.map((preset) => (
                              <button
                                key={preset.name}
                                className={`h-12 rounded-lg ${preset.value} border-2 transition-all ${
                                  bannerForm.backgroundColor === preset.value
                                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                                    : 'border-transparent'
                                }`}
                                onClick={() => setBannerForm(prev => ({ ...prev, backgroundColor: preset.value }))}
                              >
                                <span className="sr-only">{preset.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Button Text</Label>
                            <Input
                              placeholder="e.g., Shop Now"
                              value={bannerForm.actionText}
                              onChange={(e) => setBannerForm(prev => ({ ...prev, actionText: e.target.value }))}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Button Link</Label>
                            <Input
                              placeholder="e.g., /shop"
                              value={bannerForm.actionLink}
                              onChange={(e) => setBannerForm(prev => ({ ...prev, actionLink: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Show Countdown Timer</Label>
                            <p className="text-xs text-muted-foreground">Display time remaining until offer expires</p>
                          </div>
                          <Switch
                            checked={bannerForm.showCountdown}
                            onCheckedChange={(checked) => setBannerForm(prev => ({ ...prev, showCountdown: checked }))}
                          />
                        </div>

                        {bannerForm.showCountdown && (
                          <div className="space-y-2">
                            <Label>Expires At</Label>
                            <Input
                              type="datetime-local"
                              value={bannerForm.expiresAt}
                              onChange={(e) => setBannerForm(prev => ({ ...prev, expiresAt: e.target.value }))}
                            />
                          </div>
                        )}

                        <Button className="w-full" onClick={saveBanner} disabled={sending}>
                          {sending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Create Banner
                            </>
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {banners.length === 0 ? (
                  <div className="text-center py-12">
                    <Megaphone className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-semibold mb-2">No banners yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first promotional banner to engage customers
                    </p>
                    <Button onClick={() => setShowNewBanner(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Banner
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {banners.map((banner) => (
                      <div
                        key={banner.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`h-12 w-20 rounded ${banner.backgroundColor}`} />
                          <div className="min-w-0">
                            <p className="font-medium truncate">{banner.title}</p>
                            <p className="text-sm text-muted-foreground truncate">{banner.message}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge variant={banner.isActive ? 'default' : 'secondary'}>
                            {banner.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Switch
                            checked={banner.isActive}
                            onCheckedChange={(checked) => toggleBanner(banner.id, checked)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => deleteBanner(banner.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Notification History</CardTitle>
                <CardDescription>
                  View past notifications and their performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-semibold mb-2">No notifications sent yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Your notification history will appear here
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {campaigns.map((campaign) => (
                        <div
                          key={campaign.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium truncate">{campaign.title}</p>
                              <Badge variant={
                                campaign.status === 'completed' ? 'default' :
                                campaign.status === 'active' ? 'secondary' :
                                'outline'
                              }>
                                {campaign.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{campaign.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {format(new Date(campaign.createdAt), 'PPp')}
                            </p>
                          </div>
                          <div className="flex items-center gap-6 shrink-0 text-sm">
                            <div className="text-center">
                              <p className="font-semibold">{campaign.sentCount}</p>
                              <p className="text-xs text-muted-foreground">Sent</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold">{campaign.openCount}</p>
                              <p className="text-xs text-muted-foreground">Opened</p>
                            </div>
                            <div className="text-center">
                              <p className="font-semibold">{campaign.clickCount}</p>
                              <p className="text-xs text-muted-foreground">Clicked</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
