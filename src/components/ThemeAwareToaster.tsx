import { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner } from "sonner";

export function ThemeAwareToaster() {
  const [mounted, setMounted] = useState(false);
  const { isDarkMode, isLoading } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted and theme is loaded
  if (!mounted || isLoading) {
    return null;
  }

  return (
    <Sonner
      theme={isDarkMode ? "dark" : "light"}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
    />
  );
}
