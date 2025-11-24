import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface BannerSettings {
  enabled: boolean;
  text: string;
  link: string;
  style: "info" | "warning" | "success" | "promo";
}

export function Banner() {
  const [settings, setSettings] = useState<BannerSettings | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user has dismissed banner
    const isDismissed = localStorage.getItem("banner-dismissed") === "true";
    setDismissed(isDismissed);

    // Fetch banner settings
    fetchBannerSettings();
  }, []);

  const fetchBannerSettings = async () => {
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
      console.error("Error fetching banner settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("banner-dismissed", "true");
    setDismissed(true);
  };

  if (loading || !settings || !settings.enabled || dismissed || !settings.text) {
    return null;
  }

  const styleClasses = {
    info: "bg-primary text-primary-foreground",
    warning: "bg-accent text-accent-foreground",
    success: "bg-primary-light text-primary-foreground",
    promo: "bg-secondary text-secondary-foreground",
  };

  const BannerContent = () => (
    <div className="flex items-center justify-center gap-2 text-sm font-medium">
      <span>{settings.text}</span>
      {settings.link && (
        <ExternalLink className="h-4 w-4" />
      )}
    </div>
  );

  return (
    <div className={`relative ${styleClasses[settings.style]} animate-fade-in`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex justify-center">
            {settings.link ? (
              <a
                href={settings.link}
                className="hover:underline"
                target={settings.link.startsWith("http") ? "_blank" : "_self"}
                rel="noopener noreferrer"
              >
                <BannerContent />
              </a>
            ) : (
              <BannerContent />
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            className="shrink-0 h-6 w-6 hover:bg-black/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
