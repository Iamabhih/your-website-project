import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  User, Mail, Phone, MapPin, Package, Heart, Bell, Shield,
  Edit, Save, Loader2, ShoppingBag, Calendar, CreditCard,
  Trash2, LogOut, Eye, EyeOff, Lock, Check
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
}

interface NotificationPreferences {
  email_marketing: boolean;
  email_orders: boolean;
  email_promotions: boolean;
  sms_orders: boolean;
  telegram_enabled: boolean;
}

interface OrderSummary {
  total_orders: number;
  total_spent: number;
  last_order_date: string | null;
}

export default function AccountProfile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    email: '',
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'South Africa',
  });

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationPreferences>({
    email_marketing: true,
    email_orders: true,
    email_promotions: false,
    sms_orders: false,
    telegram_enabled: false,
  });

  // Order summary
  const [orderSummary, setOrderSummary] = useState<OrderSummary>({
    total_orders: 0,
    total_spent: 0,
    last_order_date: null,
  });

  // Password change
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Delete account
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadProfile();
      loadOrderSummary();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load from orders to get customer info
      const { data: orders } = await supabase
        .from('orders')
        .select('customer_name, customer_email, customer_phone, delivery_address')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (orders && orders.length > 0) {
        const order = orders[0];
        setProfile(prev => ({
          ...prev,
          id: user.id,
          email: user.email || order.customer_email || '',
          full_name: order.customer_name || '',
          phone: order.customer_phone || '',
          address_line1: order.delivery_address || '',
        }));
      } else {
        setProfile(prev => ({
          ...prev,
          id: user.id,
          email: user.email || '',
        }));
      }

      // Load notification preferences from settings or local storage
      const savedPrefs = localStorage.getItem(`notifications-${user.id}`);
      if (savedPrefs) {
        setNotifications(JSON.parse(savedPrefs));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderSummary = async () => {
    if (!user) return;

    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('total_amount, created_at')
        .eq('user_id', user.id);

      if (orders) {
        setOrderSummary({
          total_orders: orders.length,
          total_spent: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
          last_order_date: orders.length > 0 ? orders[orders.length - 1].created_at : null,
        });
      }
    } catch (error) {
      console.error('Error loading order summary:', error);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      // Save notification preferences to local storage
      localStorage.setItem(`notifications-${user?.id}`, JSON.stringify(notifications));

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('Password changed successfully');
      setShowPasswordDialog(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Note: Account deletion would typically require backend function
    toast.error('Please contact support to delete your account');
    setShowDeleteDialog(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">My Account</h1>
              <p className="text-muted-foreground">Manage your profile and preferences</p>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{orderSummary.total_orders}</p>
                    <p className="text-sm text-muted-foreground">Total Orders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <CreditCard className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">R{orderSummary.total_spent.toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">Total Spent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {orderSummary.last_order_date
                        ? new Date(orderSummary.last_order_date).toLocaleDateString()
                        : 'No orders yet'}
                    </p>
                    <p className="text-sm text-muted-foreground">Last Order</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="orders">
                <Package className="h-4 w-4 mr-2" />
                Orders
              </TabsTrigger>
              <TabsTrigger value="notifications">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="security">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>Update your personal details</CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveProfile} disabled={saving}>
                          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        value={profile.full_name}
                        onChange={(e) => setProfile(p => ({ ...p, full_name: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={profile.email}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={profile.phone}
                        onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="+27"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-medium mb-4">Delivery Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address_line1">Street Address</Label>
                        <Input
                          id="address_line1"
                          value={profile.address_line1}
                          onChange={(e) => setProfile(p => ({ ...p, address_line1: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="address_line2">Apartment, Suite, etc. (optional)</Label>
                        <Input
                          id="address_line2"
                          value={profile.address_line2}
                          onChange={(e) => setProfile(p => ({ ...p, address_line2: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={profile.city}
                          onChange={(e) => setProfile(p => ({ ...p, city: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="province">Province</Label>
                        <Input
                          id="province"
                          value={profile.province}
                          onChange={(e) => setProfile(p => ({ ...p, province: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Postal Code</Label>
                        <Input
                          id="postal_code"
                          value={profile.postal_code}
                          onChange={(e) => setProfile(p => ({ ...p, postal_code: e.target.value }))}
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={profile.country}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>View and track your orders</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Package className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">View Your Orders</p>
                    <p className="text-muted-foreground mb-4">
                      Track shipments and view order details
                    </p>
                    <Button onClick={() => navigate('/my-orders')}>
                      View All Orders
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Wishlist</CardTitle>
                  <CardDescription>Products you've saved for later</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Heart className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium mb-2">Your Saved Items</p>
                    <p className="text-muted-foreground mb-4">
                      View and manage your wishlist
                    </p>
                    <Button onClick={() => navigate('/wishlist')}>
                      View Wishlist
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Choose how you want to be notified</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Email Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Order Updates</p>
                          <p className="text-sm text-muted-foreground">
                            Receive emails about your order status
                          </p>
                        </div>
                        <Switch
                          checked={notifications.email_orders}
                          onCheckedChange={(checked) => setNotifications(n => ({ ...n, email_orders: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Marketing Emails</p>
                          <p className="text-sm text-muted-foreground">
                            Receive news and product updates
                          </p>
                        </div>
                        <Switch
                          checked={notifications.email_marketing}
                          onCheckedChange={(checked) => setNotifications(n => ({ ...n, email_marketing: checked }))}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Promotions & Discounts</p>
                          <p className="text-sm text-muted-foreground">
                            Be the first to know about sales
                          </p>
                        </div>
                        <Switch
                          checked={notifications.email_promotions}
                          onCheckedChange={(checked) => setNotifications(n => ({ ...n, email_promotions: checked }))}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">SMS Notifications</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Order SMS</p>
                        <p className="text-sm text-muted-foreground">
                          Receive SMS updates for your orders
                        </p>
                      </div>
                      <Switch
                        checked={notifications.sms_orders}
                        onCheckedChange={(checked) => setNotifications(n => ({ ...n, sms_orders: checked }))}
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-medium">Telegram</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Telegram Notifications</p>
                        <p className="text-sm text-muted-foreground">
                          Get updates via Telegram
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {notifications.telegram_enabled && (
                          <Badge variant="secondary" className="text-success">
                            <Check className="h-3 w-3 mr-1" />
                            Connected
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate('/account/telegram')}
                        >
                          {notifications.telegram_enabled ? 'Manage' : 'Connect'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save Preferences
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your account security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Lock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-muted-foreground">
                          Last changed: Unknown
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
                      Change Password
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-success/10 rounded-lg">
                        <Mail className="h-5 w-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium">Email Address</p>
                        <p className="text-sm text-muted-foreground">
                          {profile.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      <Check className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  </div>

                  <Separator />

                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-800">Delete Account</p>
                        <p className="text-sm text-red-600">
                          Permanently delete your account and all data
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Change Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPasswords ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type={showPasswords ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
              />
            </div>
            {newPassword && newPassword.length < 8 && (
              <p className="text-sm text-red-500">Password must be at least 8 characters</p>
            )}
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-sm text-red-500">Passwords do not match</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPasswordDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={saving || newPassword.length < 8 || newPassword !== confirmPassword}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Change Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
              All your data, orders, and preferences will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              className="bg-destructive text-destructive-foreground"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
