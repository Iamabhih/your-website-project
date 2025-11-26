import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertCircle, AlertTriangle, Info, Gift, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ToastNotification, useNotifications } from '@/contexts/NotificationContext';

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  promotion: Gift,
};

const colorMap = {
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: 'text-emerald-600 dark:text-emerald-400',
    progress: 'bg-emerald-500',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-950/50',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-600 dark:text-red-400',
    progress: 'bg-red-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-600 dark:text-amber-400',
    progress: 'bg-amber-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-600 dark:text-blue-400',
    progress: 'bg-blue-500',
  },
  promotion: {
    bg: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-600 dark:text-purple-400',
    progress: 'bg-gradient-to-r from-purple-500 to-pink-500',
  },
};

interface ToastItemProps {
  toast: ToastNotification;
  onDismiss: () => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  const Icon = toast.icon || iconMap[toast.type];
  const colors = colorMap[toast.type];
  const duration = toast.duration || 5000;

  useEffect(() => {
    if (toast.persistent) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [duration, toast.persistent]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 300);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border shadow-lg backdrop-blur-sm transition-all duration-300',
        colors.bg,
        colors.border,
        isExiting
          ? 'opacity-0 translate-x-full scale-95'
          : 'opacity-100 translate-x-0 scale-100',
        'animate-in slide-in-from-right-full fade-in duration-300'
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div className={cn('shrink-0 mt-0.5', colors.icon)}>
          {typeof Icon === 'function' ? <Icon className="h-5 w-5" /> : Icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{toast.title}</p>
          {toast.message && (
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
              {toast.message}
            </p>
          )}

          {/* Image preview */}
          {toast.image && (
            <img
              src={toast.image}
              alt=""
              className="mt-2 rounded-lg w-full max-h-32 object-cover"
            />
          )}

          {/* Action button */}
          {toast.action && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 mt-2 text-sm font-medium"
              onClick={() => {
                toast.action?.onClick();
                handleDismiss();
              }}
            >
              {toast.action.label}
              <ExternalLink className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>

        {/* Dismiss button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 hover:bg-black/5 dark:hover:bg-white/5"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress bar */}
      {!toast.persistent && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/5 dark:bg-white/5">
          <div
            className={cn('h-full transition-all duration-100 ease-linear', colors.progress)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default function NotificationToastContainer() {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem
            toast={toast}
            onDismiss={() => dismissToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
