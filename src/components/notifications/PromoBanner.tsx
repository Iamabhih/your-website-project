import React, { useState, useEffect } from 'react';
import { X, ChevronRight, Clock, Sparkles, Gift, Percent, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/contexts/NotificationContext';
import { Link } from 'react-router-dom';

interface CountdownProps {
  expiresAt: Date;
}

function Countdown({ expiresAt }: CountdownProps) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const target = expiresAt.getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-1 text-sm font-mono">
      <Clock className="h-4 w-4 mr-1" />
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{pad(timeLeft.hours)}</span>
      <span>:</span>
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{pad(timeLeft.minutes)}</span>
      <span>:</span>
      <span className="bg-white/20 px-1.5 py-0.5 rounded">{pad(timeLeft.seconds)}</span>
    </div>
  );
}

const bannerIcons: Record<string, React.ReactNode> = {
  sparkles: <Sparkles className="h-5 w-5" />,
  gift: <Gift className="h-5 w-5" />,
  percent: <Percent className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
};

export default function PromoBanner() {
  const { activeBanner, dismissBanner } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (activeBanner) {
      // Delay for smooth animation
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [activeBanner]);

  if (!activeBanner) return null;

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      dismissBanner();
      setIsExiting(false);
    }, 300);
  };

  const bgColor = activeBanner.backgroundColor || 'bg-gradient-to-r from-purple-600 via-pink-600 to-red-500';
  const textColor = activeBanner.textColor || 'text-white';

  const content = (
    <div
      className={cn(
        'relative overflow-hidden transition-all duration-300',
        bgColor,
        textColor,
        isVisible && !isExiting
          ? 'max-h-20 opacity-100'
          : 'max-h-0 opacity-0'
      )}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-2xl animate-pulse" />
        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-pulse delay-150" />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/5 rounded-full blur-xl animate-bounce" style={{ animationDuration: '3s' }} />
      </div>

      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left side - Icon and Message */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Icon with pulse effect */}
            <div className="shrink-0 relative">
              <div className="absolute inset-0 bg-white/30 rounded-full animate-ping" />
              <div className="relative p-2 bg-white/20 rounded-full">
                {activeBanner.icon ? bannerIcons[activeBanner.icon] || <Sparkles className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
              </div>
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="font-bold text-sm sm:text-base truncate">
                {activeBanner.title}
              </p>
              <p className="text-xs sm:text-sm opacity-90 truncate hidden sm:block">
                {activeBanner.message}
              </p>
            </div>
          </div>

          {/* Right side - Countdown, CTA, Dismiss */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Countdown */}
            {activeBanner.showCountdown && activeBanner.expiresAt && (
              <div className="hidden md:block">
                <Countdown expiresAt={activeBanner.expiresAt} />
              </div>
            )}

            {/* CTA Button */}
            {activeBanner.actionText && activeBanner.link && (
              <Button
                variant="secondary"
                size="sm"
                className="bg-white text-gray-900 hover:bg-gray-100 font-semibold shadow-lg group"
                asChild
              >
                <Link to={activeBanner.link} onClick={handleDismiss}>
                  {activeBanner.actionText}
                  <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            )}

            {/* Dismiss button */}
            {activeBanner.dismissible && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom shimmer effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
    </div>
  );

  return content;
}

// Floating promo popup (for special occasions)
export function PromoPopup() {
  const { activeBanner, dismissBanner } = useNotifications();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (activeBanner) {
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [activeBanner]);

  if (!activeBanner) return null;

  return (
    <div
      className={cn(
        'fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 transition-all duration-500',
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8 pointer-events-none'
      )}
    >
      <div className="relative overflow-hidden rounded-2xl shadow-2xl bg-gradient-to-br from-purple-600 via-pink-600 to-red-500 text-white p-6">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
        </div>

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 text-white/80 hover:text-white hover:bg-white/10"
          onClick={dismissBanner}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Content */}
        <div className="relative space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl">
              <Gift className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-bold text-xl">{activeBanner.title}</h3>
              <p className="text-white/80 text-sm">{activeBanner.message}</p>
            </div>
          </div>

          {activeBanner.showCountdown && activeBanner.expiresAt && (
            <div className="flex justify-center">
              <Countdown expiresAt={activeBanner.expiresAt} />
            </div>
          )}

          {activeBanner.link && (
            <Button
              className="w-full bg-white text-purple-600 hover:bg-gray-100 font-bold"
              asChild
            >
              <Link to={activeBanner.link} onClick={dismissBanner}>
                {activeBanner.actionText || 'Shop Now'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
