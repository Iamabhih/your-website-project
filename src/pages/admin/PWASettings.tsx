import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Smartphone, Save, Info } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface PWASettings {
  name: string;
  short_name: string;
  description: string;
  theme_color: string;
  background_color: string;
  display: string;
  orientation: string;
  start_url: string;
}

export default function PWASettings() {
  const [settings, setSettings] = useState<PWASettings>({
    name: "Vaping & Smoking Shop",
    short_name: "VapeShop",
    description: "Your premium vaping and smoking accessories store",
    theme_color: "#2dd4bf",
    background_color: "#f9f7f4",
    display: "standalone",
    orientation: "portrait",
    start_url: "/",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("key, value")
        .ilike("key", "pwa_%");

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsMap = data.reduce((acc, item) => {
          const key = item.key.replace("pwa_", "");
          acc[key] = item.value;
          return acc;
        }, {} as Record<string, any>);

        setSettings((prev) => ({ ...prev, ...settingsMap }));
      }
    } catch (error) {
      console.error("Error fetching PWA settings:", error);
      toast.error("Failed to load PWA settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.entries(settings).map(([key, value]) => ({
        key: `pwa_${key}`,
        value: value,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("settings")
          .upsert({ key: update.key, value: update.value }, { onConflict: "key" });

        if (error) throw error;
      }

      toast.success("PWA settings saved successfully. Changes will apply on next deployment.");
    } catch (error) {
      console.error("Error saving PWA settings:", error);
      toast.error("Failed to save PWA settings");
    } finally {
      setSaving(false);
    }
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
        <div className="flex items-center gap-2">
          <Smartphone className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">PWA Settings</h1>
            <p className="text-muted-foreground">Configure Progressive Web App settings</p>
          </div>
        </div>

        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex gap-3">
          <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">About PWA Settings</p>
            <p className="text-muted-foreground">
              These settings control how your app appears when installed on mobile devices. Changes
              require rebuilding the manifest.json file and may take effect on next deployment.
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>App Identity</CardTitle>
              <CardDescription>Basic information about your app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">App Name</Label>
                <Input
                  id="name"
                  placeholder="Full app name"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_name">Short Name</Label>
                <Input
                  id="short_name"
                  placeholder="Short name (for home screen)"
                  value={settings.short_name}
                  onChange={(e) => setSettings({ ...settings, short_name: e.target.value })}
                  maxLength={12}
                />
                <p className="text-xs text-muted-foreground">
                  Max 12 characters. Used when space is limited.
                </p>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Visual settings for your app</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="theme_color">Theme Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="theme_color"
                      type="color"
                      value={settings.theme_color}
                      onChange={(e) =>
                        setSettings({ ...settings, theme_color: e.target.value })
                      }
                      className="h-10 w-20"
                    />
                    <Input
                      value={settings.theme_color}
                      onChange={(e) =>
                        setSettings({ ...settings, theme_color: e.target.value })
                      }
                      placeholder="#2dd4bf"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background_color">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background_color"
                      type="color"
                      value={settings.background_color}
                      onChange={(e) =>
                        setSettings({ ...settings, background_color: e.target.value })
                      }
                      className="h-10 w-20"
                    />
                    <Input
                      value={settings.background_color}
                      onChange={(e) =>
                        setSettings({ ...settings, background_color: e.target.value })
                      }
                      placeholder="#f9f7f4"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Display Options</CardTitle>
              <CardDescription>How your app should be displayed</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display">Display Mode</Label>
                <Select
                  value={settings.display}
                  onValueChange={(value) => setSettings({ ...settings, display: value })}
                >
                  <SelectTrigger id="display">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standalone">
                      Standalone (App-like, no browser UI)
                    </SelectItem>
                    <SelectItem value="fullscreen">Fullscreen (Immersive)</SelectItem>
                    <SelectItem value="minimal-ui">Minimal UI (Minimal browser UI)</SelectItem>
                    <SelectItem value="browser">Browser (Regular browser)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orientation">Screen Orientation</Label>
                <Select
                  value={settings.orientation}
                  onValueChange={(value) => setSettings({ ...settings, orientation: value })}
                >
                  <SelectTrigger id="orientation">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any (No preference)</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="landscape">Landscape</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_url">Start URL</Label>
                <Input
                  id="start_url"
                  placeholder="/"
                  value={settings.start_url}
                  onChange={(e) => setSettings({ ...settings, start_url: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Page to load when app is launched
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save PWA Settings"}
            </Button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
