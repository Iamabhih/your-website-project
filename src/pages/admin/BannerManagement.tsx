import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Megaphone, Save, Eye } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";

interface BannerSettings {
  enabled: boolean;
  text: string;
  link: string;
  style: "info" | "warning" | "success" | "promo";
}

export default function BannerManagement() {
  const [settings, setSettings] = useState<BannerSettings>({
    enabled: false,
    text: "",
    link: "",
    style: "info",
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
        .in("key", ["banner_enabled", "banner_text", "banner_link", "banner_style"]);

      if (error) throw error;

      const settingsMap = data?.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, any>);

      if (settingsMap) {
        setSettings({
          enabled: settingsMap.banner_enabled || false,
          text: settingsMap.banner_text || "",
          link: settingsMap.banner_link || "",
          style: settingsMap.banner_style || "info",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load banner settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: "banner_enabled", value: settings.enabled },
        { key: "banner_text", value: settings.text },
        { key: "banner_link", value: settings.link },
        { key: "banner_style", value: settings.style },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("settings")
          .upsert({ key: update.key, value: update.value }, { onConflict: "key" });

        if (error) throw error;
      }

      toast.success("Banner settings saved successfully");
      
      // Clear dismissed state in localStorage so users can see the new banner
      localStorage.removeItem("banner-dismissed");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save banner settings");
    } finally {
      setSaving(false);
    }
  };

  const stylePreview = {
    info: "bg-primary text-primary-foreground",
    warning: "bg-accent text-accent-foreground",
    success: "bg-primary-light text-primary-foreground",
    promo: "bg-secondary text-secondary-foreground",
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
          <Megaphone className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Banner Management</h1>
            <p className="text-muted-foreground">Manage promotional banners displayed on your site</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Banner Settings</CardTitle>
              <CardDescription>Configure your promotional banner</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enabled" className="text-base">Enable Banner</Label>
                  <p className="text-sm text-muted-foreground">Show banner on your site</p>
                </div>
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, enabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="text">Banner Text</Label>
                <Input
                  id="text"
                  placeholder="Enter banner message (max 200 characters)"
                  value={settings.text}
                  onChange={(e) =>
                    setSettings({ ...settings, text: e.target.value.slice(0, 200) })
                  }
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground">
                  {settings.text.length}/200 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Link URL (Optional)</Label>
                <Input
                  id="link"
                  placeholder="https://example.com or /shop"
                  value={settings.link}
                  onChange={(e) => setSettings({ ...settings, link: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty for non-clickable banner
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="style">Banner Style</Label>
                <Select
                  value={settings.style}
                  onValueChange={(value: any) =>
                    setSettings({ ...settings, style: value })
                  }
                >
                  <SelectTrigger id="style">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info (Primary Green)</SelectItem>
                    <SelectItem value="warning">Warning (Orange)</SelectItem>
                    <SelectItem value="success">Success (Light Green)</SelectItem>
                    <SelectItem value="promo">Promo (Yellow)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSave} disabled={saving} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>See how your banner will look</CardDescription>
            </CardHeader>
            <CardContent>
              {settings.enabled && settings.text ? (
                <div
                  className={`${stylePreview[settings.style]} rounded-lg p-4 text-center animate-fade-in`}
                >
                  <p className="text-sm font-medium">{settings.text}</p>
                  {settings.link && (
                    <p className="text-xs mt-1 opacity-80">🔗 Links to: {settings.link}</p>
                  )}
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {settings.enabled
                      ? "Enter banner text to see preview"
                      : "Enable banner to see preview"}
                  </p>
                </div>
              )}

              <div className="mt-6 space-y-2">
                <h4 className="text-sm font-medium">Tips:</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Keep messages short and compelling</li>
                  <li>Use links to drive specific actions</li>
                  <li>Update regularly to maintain engagement</li>
                  <li>Users can dismiss the banner once per session</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
