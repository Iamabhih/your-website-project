import { useEffect, useState } from 'react';
import { usePWA } from '@/contexts/PWAContext';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone, Zap, WifiOff, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PWAInstallPrompt() {
  const {
    showInstallPrompt,
    isInstallable,
    isStandalone,
    triggerInstall,
    dismissInstallPrompt,
    installPromptTitle,
    installPromptDescription,
  } = usePWA();

  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (showInstallPrompt && isInstallable && !isStandalone) {
      // Small delay for animation
      setTimeout(() => setIsVisible(true), 100);
    }
  }, [showInstallPrompt, isInstallable, isStandalone]);

  const handleInstall = async () => {
    const success = await triggerInstall();
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      dismissInstallPrompt();
    }, 300);
  };

  if (!showInstallPrompt || !isInstallable || isStandalone) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] transition-opacity duration-300",
          isVisible && !isClosing ? "opacity-100" : "opacity-0"
        )}
        onClick={handleClose}
      />

      {/* Prompt Modal */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-[101] transform transition-all duration-300 ease-out",
          "sm:bottom-auto sm:left-1/2 sm:right-auto sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2",
          isVisible && !isClosing
            ? "translate-y-0 opacity-100 sm:scale-100"
            : "translate-y-full opacity-0 sm:translate-y-0 sm:scale-95"
        )}
      >
        <div className="bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border/50 overflow-hidden w-full sm:w-[420px] max-h-[90vh] overflow-y-auto">
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-br from-primary via-primary to-primary-dark p-6 pb-12">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* App icon */}
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center p-2">
                <img
                  src="/logo.png"
                  alt="App Icon"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white text-center">
              {installPromptTitle}
            </h2>
          </div>

          {/* Content */}
          <div className="px-6 py-6 -mt-6 bg-card rounded-t-3xl relative">
            <p className="text-center text-muted-foreground mb-6">
              {installPromptDescription}
            </p>

            {/* Features grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">Fast Access</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <WifiOff className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">Works Offline</span>
              </div>
              <div className="flex flex-col items-center text-center p-3 rounded-xl bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Bell className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">Notifications</span>
              </div>
            </div>

            {/* Install steps (iOS specific hint) */}
            <div className="bg-muted/30 rounded-xl p-4 mb-6 border border-border/50">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-foreground mb-1">Add to Home Screen</p>
                  <p className="text-muted-foreground text-xs">
                    Install this app on your device for the best experience. It takes no storage space and works just like a native app!
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleInstall}
                size="lg"
                className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
              >
                <Download className="mr-2 h-5 w-5 group-hover:animate-bounce" />
                Install App
              </Button>
              <Button
                variant="ghost"
                onClick={handleClose}
                className="w-full text-muted-foreground hover:text-foreground"
              >
                Not Now
              </Button>
            </div>

            {/* Bottom hint */}
            <p className="text-center text-xs text-muted-foreground mt-4">
              You can always install later from the menu
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
