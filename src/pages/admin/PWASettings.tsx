import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Smartphone,
  Save,
  Info,
  Download,
  Bell,
  Palette,
  Link as LinkIcon,
  Trash2,
  RefreshCw,
  Eye,
  Settings2,
  Zap,
  WifiOff,
  Shield,
  CheckCircle2,
  XCircle,
  BarChart3,
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface PWASettingsData {
  // App Identity
  name: string;
  short_name: string;
  description: string;

  // Appearance
  theme_color: string;
  background_color: string;
  display: string;
  orientation: string;

  // Install Prompt
  install_prompt_enabled: boolean;
  install_prompt_delay: number;
  install_prompt_title: string;
  install_prompt_description: string;

  // Notifications
  push_notifications_enabled: boolean;
  notification_badge_color: string;

  // URLs
  start_url: string;
  scope: string;

  // Shortcuts
  shortcuts: Array<{
    name: string;
    short_name: string;
    url: string;
    description: string;
  }>;
}

const PWA_SETTINGS_KEY = 'pwa_admin_settings';

export default function PWASettings() {
  const [settings, setSettings] = useState<PWASettingsData>({
    name: "Ideal Smoke Supply",
    short_name: "Ideal Smoke",
    description: "Premium vaping and smoking products delivered to your door",
    theme_color: "#8B9A6D",
    background_color: "#faf9f7",
    display: "standalone",
    orientation: "portrait-primary",
    install_prompt_enabled: true,
    install_prompt_delay: 30,
    install_prompt_title: "Install Our App",
    install_prompt_description: "Add Ideal Smoke Supply to your home screen for quick access and offline browsing!",
    push_notifications_enabled: true,
    notification_badge_color: "#8B9A6D",
    start_url: "/",
    scope: "/",
    shortcuts: [
      { name: "Shop Products", short_name: "Shop", url: "/shop", description: "Browse our catalog" },
      { name: "My Orders", short_name: "Orders", url: "/my-orders", description: "View order history" },
      { name: "Support", short_name: "Help", url: "/support", description: "Get help" },
    ],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pwaStatus, setPwaStatus] = useState({
    serviceWorkerActive: false,
    cacheSize: "Calculating...",
    isInstallable: false,
    notificationPermission: "default" as NotificationPermission,
  });

  useEffect(() => {
    fetchSettings();
    checkPWAStatus();
  }, []);

  const fetchSettings = async () => {
    try {
      // Load from localStorage first for local settings
      const localSettings = localStorage.getItem(PWA_SETTINGS_KEY);
      if (localSettings) {
        setSettings(prev => ({ ...prev, ...JSON.parse(localSettings) }));
      }

      // Then try to fetch from Supabase
      const { data, error } = await supabase
        .from("settings")
        .select("key, value")
        .ilike("key", "pwa_%");

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsMap = data.reduce((acc, item) => {
          const key = item.key.replace("pwa_", "");
          try {
            acc[key] = typeof item.value === 'string' ? JSON.parse(item.value) : item.value;
          } catch {
            acc[key] = item.value;
          }
          return acc;
        }, {} as Record<string, any>);

        setSettings((prev) => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error("Error fetching PWA settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkPWAStatus = async () => {
    // Check service worker
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      setPwaStatus(prev => ({
        ...prev,
        serviceWorkerActive: !!registration?.active,
      }));
    }

    // Check cache size
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const usedMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
      setPwaStatus(prev => ({
        ...prev,
        cacheSize: `${usedMB} MB`,
      }));
    }

    // Check notification permission
    if ("Notification" in window) {
      setPwaStatus(prev => ({
        ...prev,
        notificationPermission: Notification.permission,
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to localStorage for immediate use
      localStorage.setItem(PWA_SETTINGS_KEY, JSON.stringify({
        installPromptEnabled: settings.install_prompt_enabled,
        installPromptDelay: settings.install_prompt_delay * 1000,
        installPromptTitle: settings.install_prompt_title,
        installPromptDescription: settings.install_prompt_description,
      }));

      // Save to Supabase for persistence
      const updates = Object.entries(settings).map(([key, value]) => ({
        key: `pwa_${key}`,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("settings")
          .upsert({ key: update.key, value: update.value }, { onConflict: "key" });

        if (error) throw error;
      }

      toast.success("PWA settings saved successfully!");
    } catch (error) {
      console.error("Error saving PWA settings:", error);
      toast.error("Failed to save PWA settings");
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    try {
      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
        toast.success("Cache cleared successfully!");
        checkPWAStatus();
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
      toast.error("Failed to clear cache");
    }
  };

  const handleUpdateServiceWorker = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          toast.success("Service Worker updated!");
        }
      }
    } catch (error) {
      console.error("Error updating service worker:", error);
      toast.error("Failed to update Service Worker");
    }
  };

  const addShortcut = () => {
    setSettings(prev => ({
      ...prev,
      shortcuts: [...prev.shortcuts, { name: "", short_name: "", url: "", description: "" }],
    }));
  };

  const removeShortcut = (index: number) => {
    setSettings(prev => ({
      ...prev,
      shortcuts: prev.shortcuts.filter((_, i) => i !== index),
    }));
  };

  const updateShortcut = (index: number, field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      shortcuts: prev.shortcuts.map((s, i) =>
        i === index ? { ...s, [field]: value } : s
      ),
    }));
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">PWA Management</h1>
              <p className="text-muted-foreground">Configure Progressive Web App settings and install prompt</p>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save All Settings"}
          </Button>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {pwaStatus.serviceWorkerActive ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : (
                    <XCircle className="h-8 w-8 text-red-500" />
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Service Worker</p>
                    <p className="font-semibold">{pwaStatus.serviceWorkerActive ? "Active" : "Inactive"}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Cache Size</p>
                  <p className="font-semibold">{pwaStatus.cacheSize}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Bell className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Notifications</p>
                  <p className="font-semibold capitalize">{pwaStatus.notificationPermission}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleUpdateServiceWorker}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Update SW
                </Button>
                <Button variant="outline" size="sm" onClick={handleClearCache}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear Cache
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="identity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="identity" className="gap-2">
              <Settings2 className="h-4 w-4" />
              <span className="hidden sm:inline">Identity</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
            <TabsTrigger value="install" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Install Prompt</span>
            </TabsTrigger>
            <TabsTrigger value="shortcuts" className="gap-2">
              <LinkIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Shortcuts</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </TabsTrigger>
          </TabsList>

          {/* Identity Tab */}
          <TabsContent value="identity">
            <Card>
              <CardHeader>
                <CardTitle>App Identity</CardTitle>
                <CardDescription>Basic information about your Progressive Web App</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">App Name</Label>
                    <Input
                      id="name"
                      placeholder="Full app name"
                      value={settings.name}
                      onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Full name shown in app stores and installers</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="short_name">Short Name</Label>
                    <Input
                      id="short_name"
                      placeholder="Short name"
                      value={settings.short_name}
                      onChange={(e) => setSettings({ ...settings, short_name: e.target.value })}
                      maxLength={12}
                    />
                    <p className="text-xs text-muted-foreground">Max 12 chars. Used on home screen.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your app"
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_url">Start URL</Label>
                    <Input
                      id="start_url"
                      placeholder="/"
                      value={settings.start_url}
                      onChange={(e) => setSettings({ ...settings, start_url: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Page to load when app opens</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="scope">Scope</Label>
                    <Input
                      id="scope"
                      placeholder="/"
                      value={settings.scope}
                      onChange={(e) => setSettings({ ...settings, scope: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">URL scope for the PWA</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance">
            <Card>
              <CardHeader>
                <CardTitle>Visual Settings</CardTitle>
                <CardDescription>Customize how your app looks when installed</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Theme Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.theme_color}
                        onChange={(e) => setSettings({ ...settings, theme_color: e.target.value })}
                        className="h-10 w-20 p-1"
                      />
                      <Input
                        value={settings.theme_color}
                        onChange={(e) => setSettings({ ...settings, theme_color: e.target.value })}
                        placeholder="#8B9A6D"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Status bar and toolbar color</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.background_color}
                        onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                        className="h-10 w-20 p-1"
                      />
                      <Input
                        value={settings.background_color}
                        onChange={(e) => setSettings({ ...settings, background_color: e.target.value })}
                        placeholder="#faf9f7"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Splash screen background</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Display Mode</Label>
                    <Select
                      value={settings.display}
                      onValueChange={(value) => setSettings({ ...settings, display: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standalone">Standalone (App-like)</SelectItem>
                        <SelectItem value="fullscreen">Fullscreen (Immersive)</SelectItem>
                        <SelectItem value="minimal-ui">Minimal UI</SelectItem>
                        <SelectItem value="browser">Browser (Regular)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Orientation</Label>
                    <Select
                      value={settings.orientation}
                      onValueChange={(value) => setSettings({ ...settings, orientation: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="portrait-primary">Portrait</SelectItem>
                        <SelectItem value="landscape-primary">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Install Prompt Tab */}
          <TabsContent value="install">
            <div className="grid gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Install Prompt Settings</CardTitle>
                      <CardDescription>Configure the app installation popup</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="prompt-enabled">Enable Prompt</Label>
                      <Switch
                        id="prompt-enabled"
                        checked={settings.install_prompt_enabled}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, install_prompt_enabled: checked })
                        }
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="prompt-title">Prompt Title</Label>
                    <Input
                      id="prompt-title"
                      placeholder="Install Our App"
                      value={settings.install_prompt_title}
                      onChange={(e) =>
                        setSettings({ ...settings, install_prompt_title: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prompt-description">Prompt Description</Label>
                    <Textarea
                      id="prompt-description"
                      placeholder="Add our app to your home screen..."
                      value={settings.install_prompt_description}
                      onChange={(e) =>
                        setSettings({ ...settings, install_prompt_description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prompt-delay">Show Delay (seconds)</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="prompt-delay"
                        type="number"
                        min={5}
                        max={300}
                        value={settings.install_prompt_delay}
                        onChange={(e) =>
                          setSettings({ ...settings, install_prompt_delay: parseInt(e.target.value) || 30 })
                        }
                        className="w-24"
                      />
                      <p className="text-sm text-muted-foreground">
                        Prompt will appear {settings.install_prompt_delay} seconds after page load
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Info className="h-4 w-4 text-primary" />
                      Prompt Behavior
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                      <li>Prompt only shows to users who haven't installed the app</li>
                      <li>If dismissed, won't show again for 7 days</li>
                      <li>Works on Chrome, Edge, Samsung Internet, and other supported browsers</li>
                      <li>iOS users will see instructions for "Add to Home Screen"</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Push Notifications</CardTitle>
                      <CardDescription>Configure notification settings</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="notifications-enabled">Enable Notifications</Label>
                      <Switch
                        id="notifications-enabled"
                        checked={settings.push_notifications_enabled}
                        onCheckedChange={(checked) =>
                          setSettings({ ...settings, push_notifications_enabled: checked })
                        }
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Badge Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.notification_badge_color}
                        onChange={(e) =>
                          setSettings({ ...settings, notification_badge_color: e.target.value })
                        }
                        className="h-10 w-20 p-1"
                      />
                      <Input
                        value={settings.notification_badge_color}
                        onChange={(e) =>
                          setSettings({ ...settings, notification_badge_color: e.target.value })
                        }
                        className="flex-1"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Shortcuts Tab */}
          <TabsContent value="shortcuts">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>App Shortcuts</CardTitle>
                    <CardDescription>Quick actions shown when long-pressing the app icon</CardDescription>
                  </div>
                  <Button onClick={addShortcut} variant="outline" size="sm">
                    Add Shortcut
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {settings.shortcuts.map((shortcut, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Shortcut {index + 1}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeShortcut(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          placeholder="Shop Products"
                          value={shortcut.name}
                          onChange={(e) => updateShortcut(index, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Short Name</Label>
                        <Input
                          placeholder="Shop"
                          value={shortcut.short_name}
                          onChange={(e) => updateShortcut(index, "short_name", e.target.value)}
                          maxLength={12}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>URL</Label>
                        <Input
                          placeholder="/shop"
                          value={shortcut.url}
                          onChange={(e) => updateShortcut(index, "url", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Input
                          placeholder="Browse products"
                          value={shortcut.description}
                          onChange={(e) => updateShortcut(index, "description", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                {settings.shortcuts.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No shortcuts configured. Add one to get started.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Phone Mockup */}
              <Card>
                <CardHeader>
                  <CardTitle>Install Prompt Preview</CardTitle>
                  <CardDescription>How the install prompt will appear to users</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center">
                  <div className="w-[280px] h-[560px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl">
                    <div className="w-full h-full bg-card rounded-[2.5rem] overflow-hidden relative">
                      {/* Status bar */}
                      <div
                        className="h-8 flex items-center justify-center text-xs text-white font-medium"
                        style={{ backgroundColor: settings.theme_color }}
                      >
                        {settings.short_name}
                      </div>

                      {/* Content area with prompt preview */}
                      <div className="p-4 bg-black/50 h-full flex items-end">
                        <div className="bg-card rounded-t-2xl p-4 w-full">
                          <div className="flex justify-center mb-3">
                            <div
                              className="w-12 h-12 rounded-xl shadow-md flex items-center justify-center"
                              style={{ backgroundColor: settings.background_color }}
                            >
                              <img src="/logo.png" alt="Icon" className="w-8 h-8 object-contain" />
                            </div>
                          </div>
                          <h3 className="text-center font-bold text-sm mb-1">
                            {settings.install_prompt_title}
                          </h3>
                          <p className="text-center text-xs text-muted-foreground mb-4 line-clamp-2">
                            {settings.install_prompt_description}
                          </p>
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1 text-xs">
                              Install
                            </Button>
                            <Button size="sm" variant="ghost" className="text-xs">
                              Not Now
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Features Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>PWA Features</CardTitle>
                  <CardDescription>Active features for your Progressive Web App</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 rounded-full bg-green-500/10">
                      <Zap className="h-5 w-5 text-green-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Fast Loading</p>
                      <p className="text-xs text-muted-foreground">Cached assets load instantly</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 rounded-full bg-blue-500/10">
                      <WifiOff className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Offline Support</p>
                      <p className="text-xs text-muted-foreground">Works without internet</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 rounded-full bg-purple-500/10">
                      <Download className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Installable</p>
                      <p className="text-xs text-muted-foreground">Add to home screen</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 rounded-full bg-amber-500/10">
                      <Bell className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Push Notifications</p>
                      <p className="text-xs text-muted-foreground">Engage users with updates</p>
                    </div>
                    {settings.push_notifications_enabled ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground ml-auto" />
                    )}
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="p-2 rounded-full bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">HTTPS Secure</p>
                      <p className="text-xs text-muted-foreground">Encrypted connection</p>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-green-500 ml-auto" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
