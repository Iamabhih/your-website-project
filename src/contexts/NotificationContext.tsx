import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Notification types
export type NotificationType =
  | 'order_update'
  | 'promotion'
  | 'price_drop'
  | 'back_in_stock'
  | 'cart_reminder'
  | 'welcome'
  | 'system'
  | 'reward';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  image?: string;
  link?: string;
  actionText?: string;
  actionLink?: string;
  priority: NotificationPriority;
  read: boolean;
  dismissed: boolean;
  createdAt: Date;
  expiresAt?: Date;
  data?: Record<string, any>;
}

export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'promotion';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
  image?: string;
  persistent?: boolean;
}

export interface PromoBanner {
  id: string;
  title: string;
  message: string;
  backgroundColor?: string;
  textColor?: string;
  link?: string;
  actionText?: string;
  dismissible: boolean;
  showCountdown?: boolean;
  expiresAt?: Date;
  icon?: string;
}

interface NotificationContextType {
  // Notification Center
  notifications: Notification[];
  unreadCount: number;
  isNotificationCenterOpen: boolean;
  openNotificationCenter: () => void;
  closeNotificationCenter: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // Toast Notifications
  toasts: ToastNotification[];
  showToast: (toast: Omit<ToastNotification, 'id'>) => string;
  dismissToast: (id: string) => void;

  // Promo Banners
  activeBanner: PromoBanner | null;
  showBanner: (banner: Omit<PromoBanner, 'id'>) => void;
  dismissBanner: () => void;

  // Push Notifications
  pushPermission: NotificationPermission | 'unsupported';
  requestPushPermission: () => Promise<boolean>;
  isPushEnabled: boolean;
  togglePush: (enabled: boolean) => void;

  // Preferences
  preferences: NotificationPreferences;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
}

interface NotificationPreferences {
  orderUpdates: boolean;
  promotions: boolean;
  priceDrops: boolean;
  backInStock: boolean;
  cartReminders: boolean;
  sound: boolean;
  vibrate: boolean;
}

const defaultPreferences: NotificationPreferences = {
  orderUpdates: true,
  promotions: true,
  priceDrops: true,
  backInStock: true,
  cartReminders: true,
  sound: true,
  vibrate: true,
};

const NotificationContext = createContext<NotificationContextType | null>(null);

const NOTIFICATIONS_KEY = 'app-notifications';
const PREFERENCES_KEY = 'notification-preferences';
const DISMISSED_BANNERS_KEY = 'dismissed-banners';

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [activeBanner, setActiveBanner] = useState<PromoBanner | null>(null);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);

  // Load notifications and preferences from localStorage
  useEffect(() => {
    const savedNotifications = localStorage.getItem(NOTIFICATIONS_KEY);
    if (savedNotifications) {
      try {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed.map((n: any) => ({
          ...n,
          createdAt: new Date(n.createdAt),
          expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
        })));
      } catch (e) {
        console.error('Failed to parse notifications:', e);
      }
    }

    const savedPrefs = localStorage.getItem(PREFERENCES_KEY);
    if (savedPrefs) {
      try {
        setPreferences({ ...defaultPreferences, ...JSON.parse(savedPrefs) });
      } catch (e) {
        console.error('Failed to parse preferences:', e);
      }
    }

    // Check push notification support and permission
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
      setIsPushEnabled(Notification.permission === 'granted');
    } else {
      setPushPermission('unsupported');
    }
  }, []);

  // Save notifications to localStorage
  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  // Subscribe to real-time notifications from Supabase
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as any;
          addNotification({
            type: notification.type,
            title: notification.title,
            message: notification.message,
            priority: notification.priority || 'medium',
            link: notification.link,
            data: notification.data,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Clean up expired notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setNotifications(prev =>
        prev.filter(n => !n.expiresAt || n.expiresAt > now)
      );
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read && !n.dismissed).length;

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'dismissed' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      read: false,
      dismissed: false,
      createdAt: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50

    // Show toast for high priority
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      showToast({
        type: 'info',
        title: notification.title,
        message: notification.message,
        duration: notification.priority === 'urgent' ? 10000 : 5000,
      });
    }

    // Send native push notification if enabled
    if (isPushEnabled && pushPermission === 'granted') {
      sendNativeNotification(notification.title, notification.message, notification.icon);
    }

    // Play sound if enabled
    if (preferences.sound) {
      playNotificationSound();
    }

    return newNotification.id;
  }, [isPushEnabled, pushPermission, preferences.sound]);

  const showToast = useCallback((toast: Omit<ToastNotification, 'id'>): string => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastNotification = { ...toast, id };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration
    if (!toast.persistent) {
      const duration = toast.duration || 5000;
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }

    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const showBanner = useCallback((banner: Omit<PromoBanner, 'id'>) => {
    const dismissedBanners = JSON.parse(localStorage.getItem(DISMISSED_BANNERS_KEY) || '[]');
    const bannerId = `banner-${banner.title.replace(/\s+/g, '-').toLowerCase()}`;

    if (dismissedBanners.includes(bannerId)) return;

    setActiveBanner({ ...banner, id: bannerId });
  }, []);

  const dismissBanner = useCallback(() => {
    if (activeBanner) {
      const dismissedBanners = JSON.parse(localStorage.getItem(DISMISSED_BANNERS_KEY) || '[]');
      dismissedBanners.push(activeBanner.id);
      localStorage.setItem(DISMISSED_BANNERS_KEY, JSON.stringify(dismissedBanners));
    }
    setActiveBanner(null);
  }, [activeBanner]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, dismissed: true } : n)
    );
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const requestPushPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushPermission(permission);
      setIsPushEnabled(permission === 'granted');
      return permission === 'granted';
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }, []);

  const togglePush = useCallback((enabled: boolean) => {
    if (enabled && pushPermission !== 'granted') {
      requestPushPermission();
    } else {
      setIsPushEnabled(enabled);
    }
  }, [pushPermission, requestPushPermission]);

  const updatePreferences = useCallback((prefs: Partial<NotificationPreferences>) => {
    setPreferences(prev => ({ ...prev, ...prefs }));
  }, []);

  const sendNativeNotification = (title: string, body: string, icon?: string) => {
    if (Notification.permission === 'granted') {
      try {
        const notificationOptions: NotificationOptions = {
          body,
          icon: icon || '/icon-192x192.png',
          badge: '/icon-72x72.png',
        };
        
        new Notification(title, notificationOptions);
        
        // Handle vibration separately (not part of NotificationOptions)
        if (preferences.vibrate && 'vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
      } catch (e) {
        // Fallback for service worker notification
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'SHOW_NOTIFICATION',
            title,
            body,
            icon,
          });
        }
      }
    }
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch (e) {
      console.warn('Failed to play notification sound:', e);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications: notifications.filter(n => !n.dismissed),
        unreadCount,
        isNotificationCenterOpen,
        openNotificationCenter: () => setIsNotificationCenterOpen(true),
        closeNotificationCenter: () => setIsNotificationCenterOpen(false),
        markAsRead,
        markAllAsRead,
        dismissNotification,
        clearAllNotifications,
        toasts,
        showToast,
        dismissToast,
        activeBanner,
        showBanner,
        dismissBanner,
        pushPermission,
        requestPushPermission,
        isPushEnabled,
        togglePush,
        preferences,
        updatePreferences,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Helper hook for showing quick toasts
export function useToast() {
  const { showToast, dismissToast } = useNotifications();

  return {
    success: (title: string, message?: string) =>
      showToast({ type: 'success', title, message }),
    error: (title: string, message?: string) =>
      showToast({ type: 'error', title, message, duration: 7000 }),
    warning: (title: string, message?: string) =>
      showToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) =>
      showToast({ type: 'info', title, message }),
    promo: (title: string, message?: string, action?: { label: string; onClick: () => void }) =>
      showToast({ type: 'promotion', title, message, action, duration: 8000 }),
    dismiss: dismissToast,
  };
}
