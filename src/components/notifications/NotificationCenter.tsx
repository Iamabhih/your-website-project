import React, { useState } from 'react';
import {
  Bell, X, Check, CheckCheck, Trash2, Settings, Package,
  Tag, ShoppingCart, Gift, AlertCircle, Info, Sparkles,
  ChevronRight, Clock, ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useNotifications, Notification, NotificationType } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

const typeIcons: Record<NotificationType, React.ReactNode> = {
  order_update: <Package className="h-5 w-5" />,
  promotion: <Tag className="h-5 w-5" />,
  price_drop: <Sparkles className="h-5 w-5" />,
  back_in_stock: <ShoppingCart className="h-5 w-5" />,
  cart_reminder: <ShoppingCart className="h-5 w-5" />,
  welcome: <Gift className="h-5 w-5" />,
  system: <Info className="h-5 w-5" />,
  reward: <Gift className="h-5 w-5" />,
};

const typeColors: Record<NotificationType, string> = {
  order_update: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  promotion: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  price_drop: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  back_in_stock: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  cart_reminder: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  welcome: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  system: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  reward: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
};

interface NotificationItemProps {
  notification: Notification;
  onRead: () => void;
  onDismiss: () => void;
  onClose: () => void;
}

function NotificationItem({ notification, onRead, onDismiss, onClose }: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    onRead();
    if (notification.link) {
      onClose();
    }
  };

  const content = (
    <div
      className={cn(
        'relative p-4 border-b transition-all duration-200 cursor-pointer',
        notification.read
          ? 'bg-background'
          : 'bg-primary/5 dark:bg-primary/10',
        isHovered && 'bg-muted/50'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Unread indicator */}
      {!notification.read && (
        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary animate-pulse" />
      )}

      <div className="flex gap-3 pl-2">
        {/* Icon */}
        <div className={cn('shrink-0 p-2 rounded-xl', typeColors[notification.type])}>
          {typeIcons[notification.type]}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className={cn(
              'text-sm line-clamp-1',
              notification.read ? 'font-medium' : 'font-semibold'
            )}>
              {notification.title}
            </h4>
            <span className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>

          {/* Image */}
          {notification.image && (
            <img
              src={notification.image}
              alt=""
              className="mt-2 rounded-lg w-full max-h-24 object-cover"
            />
          )}

          {/* Action */}
          {notification.actionText && (
            <div className="flex items-center gap-1 mt-2 text-primary text-sm font-medium">
              {notification.actionText}
              <ChevronRight className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* Dismiss button (on hover) */}
        {isHovered && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 opacity-0 animate-in fade-in"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );

  if (notification.link) {
    return <Link to={notification.link}>{content}</Link>;
  }

  return content;
}

function SettingsTab() {
  const { preferences, updatePreferences, pushPermission, requestPushPermission, isPushEnabled, togglePush } = useNotifications();

  return (
    <div className="p-4 space-y-6">
      {/* Push Notifications */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm">Push Notifications</h4>

        {pushPermission === 'unsupported' ? (
          <p className="text-sm text-muted-foreground">
            Push notifications are not supported in this browser.
          </p>
        ) : pushPermission === 'denied' ? (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            Push notifications are blocked. Please enable them in your browser settings.
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Enable push notifications</p>
              <p className="text-xs text-muted-foreground">Get notified even when the app is closed</p>
            </div>
            <Switch
              checked={isPushEnabled}
              onCheckedChange={(checked) => {
                if (checked && pushPermission !== 'granted') {
                  requestPushPermission();
                } else {
                  togglePush(checked);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Notification Types */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm">Notification Types</h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-1.5 rounded-lg', typeColors.order_update)}>
                <Package className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Order Updates</p>
                <p className="text-xs text-muted-foreground">Shipping and delivery notifications</p>
              </div>
            </div>
            <Switch
              checked={preferences.orderUpdates}
              onCheckedChange={(checked) => updatePreferences({ orderUpdates: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-1.5 rounded-lg', typeColors.promotion)}>
                <Tag className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Promotions</p>
                <p className="text-xs text-muted-foreground">Sales, discounts, and special offers</p>
              </div>
            </div>
            <Switch
              checked={preferences.promotions}
              onCheckedChange={(checked) => updatePreferences({ promotions: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-1.5 rounded-lg', typeColors.price_drop)}>
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Price Drops</p>
                <p className="text-xs text-muted-foreground">When items in your wishlist go on sale</p>
              </div>
            </div>
            <Switch
              checked={preferences.priceDrops}
              onCheckedChange={(checked) => updatePreferences({ priceDrops: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-1.5 rounded-lg', typeColors.back_in_stock)}>
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Back in Stock</p>
                <p className="text-xs text-muted-foreground">When out-of-stock items are available</p>
              </div>
            </div>
            <Switch
              checked={preferences.backInStock}
              onCheckedChange={(checked) => updatePreferences({ backInStock: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn('p-1.5 rounded-lg', typeColors.cart_reminder)}>
                <ShoppingCart className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Cart Reminders</p>
                <p className="text-xs text-muted-foreground">Reminders about items in your cart</p>
              </div>
            </div>
            <Switch
              checked={preferences.cartReminders}
              onCheckedChange={(checked) => updatePreferences({ cartReminders: checked })}
            />
          </div>
        </div>
      </div>

      {/* Sound & Vibration */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm">Sound & Vibration</h4>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Sound</p>
              <p className="text-xs text-muted-foreground">Play sound for new notifications</p>
            </div>
            <Switch
              checked={preferences.sound}
              onCheckedChange={(checked) => updatePreferences({ sound: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Vibration</p>
              <p className="text-xs text-muted-foreground">Vibrate for push notifications</p>
            </div>
            <Switch
              checked={preferences.vibrate}
              onCheckedChange={(checked) => updatePreferences({ vibrate: checked })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    isNotificationCenterOpen,
    closeNotificationCenter,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    clearAllNotifications,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'unread') return !n.read;
    return true;
  });

  return (
    <Sheet open={isNotificationCenterOpen} onOpenChange={(open) => !open && closeNotificationCenter()}>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SheetTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="rounded-full">
                  {unreadCount} new
                </Badge>
              )}
            </div>
          </div>
          <SheetDescription className="sr-only">
            View and manage your notifications
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 pt-2 border-b shrink-0">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="all" className="text-xs">
                All
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                <Settings className="h-3.5 w-3.5 mr-1" />
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="flex-1 m-0 overflow-hidden">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Bell className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No notifications yet</h3>
                <p className="text-sm text-muted-foreground">
                  We'll notify you about orders, promotions, and more.
                </p>
              </div>
            ) : (
              <>
                {/* Actions */}
                <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="h-3.5 w-3.5 mr-1" />
                    Mark all read
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={clearAllNotifications}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Clear all
                  </Button>
                </div>

                <ScrollArea className="flex-1">
                  {filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={() => markAsRead(notification.id)}
                      onDismiss={() => dismissNotification(notification.id)}
                      onClose={closeNotificationCenter}
                    />
                  ))}
                </ScrollArea>
              </>
            )}
          </TabsContent>

          <TabsContent value="unread" className="flex-1 m-0 overflow-hidden">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Check className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">All caught up!</h3>
                <p className="text-sm text-muted-foreground">
                  You've read all your notifications.
                </p>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                {filteredNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={() => markAsRead(notification.id)}
                    onDismiss={() => dismissNotification(notification.id)}
                    onClose={closeNotificationCenter}
                  />
                ))}
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="settings" className="flex-1 m-0 overflow-hidden">
            <ScrollArea className="flex-1">
              <SettingsTab />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// Notification Bell Button for Header
export function NotificationBell() {
  const { unreadCount, openNotificationCenter } = useNotifications();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative"
      onClick={openNotificationCenter}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center animate-in zoom-in">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Button>
  );
}
