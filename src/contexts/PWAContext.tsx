import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAContextType {
  // Install state
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isStandalone: boolean;

  // Install prompt
  showInstallPrompt: boolean;
  setShowInstallPrompt: (show: boolean) => void;
  triggerInstall: () => Promise<boolean>;
  dismissInstallPrompt: () => void;

  // Settings (from localStorage/admin)
  installPromptEnabled: boolean;
  installPromptDelay: number;
  installPromptTitle: string;
  installPromptDescription: string;

  // Push notifications
  notificationsEnabled: boolean;
  requestNotificationPermission: () => Promise<boolean>;

  // Service worker
  updateAvailable: boolean;
  updateApp: () => void;
  clearCache: () => Promise<void>;
}

const PWAContext = createContext<PWAContextType | null>(null);

const PWA_PROMPT_DISMISSED_KEY = 'pwa_prompt_dismissed';
const PWA_PROMPT_DISMISSED_DATE_KEY = 'pwa_prompt_dismissed_date';
const PWA_SETTINGS_KEY = 'pwa_admin_settings';

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Admin settings with defaults
  const [settings, setSettings] = useState({
    installPromptEnabled: true,
    installPromptDelay: 30000, // 30 seconds
    installPromptTitle: 'Install Our App',
    installPromptDescription: 'Add Ideal Smoke Supply to your home screen for quick access and offline browsing!',
  });

  // Check if running in standalone mode (already installed)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;

  // Load settings from localStorage
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(PWA_SETTINGS_KEY);
      if (savedSettings) {
        setSettings(prev => ({ ...prev, ...JSON.parse(savedSettings) }));
      }
    } catch (e) {
      console.error('Error loading PWA settings:', e);
    }

    // Check notification permission
    if ('Notification' in window) {
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, []);

  // Handle beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);

      // Check if prompt was previously dismissed
      const dismissed = localStorage.getItem(PWA_PROMPT_DISMISSED_KEY);
      const dismissedDate = localStorage.getItem(PWA_PROMPT_DISMISSED_DATE_KEY);

      // Show prompt again after 7 days
      const shouldShowAgain = !dismissed || (dismissedDate &&
        Date.now() - parseInt(dismissedDate) > 7 * 24 * 60 * 60 * 1000);

      if (shouldShowAgain && settings.installPromptEnabled && !isStandalone) {
        // Delay showing the prompt
        setTimeout(() => {
          setShowInstallPrompt(true);
        }, settings.installPromptDelay);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem(PWA_PROMPT_DISMISSED_KEY);
      localStorage.removeItem(PWA_PROMPT_DISMISSED_DATE_KEY);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [settings.installPromptEnabled, settings.installPromptDelay, isStandalone]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Handle service worker updates
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setUpdateAvailable(true);
              }
            });
          }
        });
      });
    }
  }, []);

  // Trigger install prompt
  const triggerInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) {
      console.log('Install prompt not available');
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        setIsInstalled(true);
        setShowInstallPrompt(false);
        return true;
      }
    } catch (error) {
      console.error('Error triggering install prompt:', error);
    }

    return false;
  }, [deferredPrompt]);

  // Dismiss install prompt
  const dismissInstallPrompt = useCallback(() => {
    setShowInstallPrompt(false);
    localStorage.setItem(PWA_PROMPT_DISMISSED_KEY, 'true');
    localStorage.setItem(PWA_PROMPT_DISMISSED_DATE_KEY, Date.now().toString());
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setNotificationsEnabled(granted);
      return granted;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }, []);

  // Update the app (reload with new service worker)
  const updateApp = useCallback(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
      window.location.reload();
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({ type: 'CLEAR_CACHE' });
      }
    }

    // Also clear caches directly
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  }, []);

  const value: PWAContextType = {
    isInstallable,
    isInstalled,
    isOnline,
    isStandalone,
    showInstallPrompt,
    setShowInstallPrompt,
    triggerInstall,
    dismissInstallPrompt,
    installPromptEnabled: settings.installPromptEnabled,
    installPromptDelay: settings.installPromptDelay,
    installPromptTitle: settings.installPromptTitle,
    installPromptDescription: settings.installPromptDescription,
    notificationsEnabled,
    requestNotificationPermission,
    updateAvailable,
    updateApp,
    clearCache,
  };

  return (
    <PWAContext.Provider value={value}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}
