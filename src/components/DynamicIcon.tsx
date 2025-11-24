import { useState, memo } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { iconSlots } from '@/types/theme';
import { cn } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';

interface DynamicIconProps {
  name: string;
  size?: number;
  className?: string;
  fallback?: string;
  color?: string;
}

// Type for Lucide icons
type LucideIconComponent = React.ComponentType<{
  size?: number;
  className?: string;
  color?: string;
}>;

// Get Lucide icon by name
function getLucideIcon(iconName: string): LucideIconComponent | null {
  const icons = LucideIcons as unknown as Record<string, LucideIconComponent>;
  return icons[iconName] || null;
}

export const DynamicIcon = memo(function DynamicIcon({
  name,
  size = 24,
  className,
  fallback,
  color,
}: DynamicIconProps) {
  const { getIcon } = useTheme();
  const [imageError, setImageError] = useState(false);

  // Get custom icon from registry
  const customIcon = getIcon(name);

  // Find default fallback from iconSlots
  const slotConfig = iconSlots.find((slot) => slot.name === name);
  const fallbackIconName = fallback || customIcon?.fallbackIcon || slotConfig?.fallback || 'HelpCircle';

  // If we have a custom image and it hasn't errored
  if (customIcon?.imageUrl && !imageError) {
    return (
      <img
        src={customIcon.imageUrl}
        alt={name}
        width={size}
        height={size}
        className={cn('object-contain', className)}
        style={{ width: size, height: size, color }}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    );
  }

  // Fall back to Lucide icon
  const LucideIcon = getLucideIcon(fallbackIconName);
  if (LucideIcon) {
    return <LucideIcon size={size} className={className} color={color} />;
  }

  // Ultimate fallback
  const HelpCircle = getLucideIcon('HelpCircle');
  if (HelpCircle) {
    return <HelpCircle size={size} className={className} color={color} />;
  }

  return null;
});

// Pre-configured icon components for common use cases
export const CategoryIcon = memo(function CategoryIcon({
  category,
  size = 24,
  className,
}: {
  category: string;
  size?: number;
  className?: string;
}) {
  // Normalize category name to icon slot name
  const iconName = `category-${category.toLowerCase().replace(/\s+/g, '-')}`;
  return <DynamicIcon name={iconName} size={size} className={className} />;
});

export const NavIcon = memo(function NavIcon({
  type,
  size = 24,
  className,
}: {
  type: 'home' | 'shop' | 'cart' | 'account' | 'search' | 'menu' | 'wishlist';
  size?: number;
  className?: string;
}) {
  return <DynamicIcon name={`nav-${type}`} size={size} className={className} />;
});

export const ActionIcon = memo(function ActionIcon({
  type,
  size = 24,
  className,
}: {
  type: 'add-cart' | 'remove' | 'edit' | 'share' | 'compare' | 'quickview';
  size?: number;
  className?: string;
}) {
  return <DynamicIcon name={`action-${type}`} size={size} className={className} />;
});

export const SocialIcon = memo(function SocialIcon({
  platform,
  size = 24,
  className,
}: {
  platform: 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'youtube' | 'whatsapp';
  size?: number;
  className?: string;
}) {
  return <DynamicIcon name={`social-${platform}`} size={size} className={className} />;
});

export const StatusIcon = memo(function StatusIcon({
  status,
  size = 24,
  className,
}: {
  status: 'success' | 'error' | 'warning' | 'info';
  size?: number;
  className?: string;
}) {
  return <DynamicIcon name={`status-${status}`} size={size} className={className} />;
});

export const FeatureIcon = memo(function FeatureIcon({
  feature,
  size = 24,
  className,
}: {
  feature: 'shipping' | 'secure' | 'support' | 'returns' | 'quality';
  size?: number;
  className?: string;
}) {
  return <DynamicIcon name={`feature-${feature}`} size={size} className={className} />;
});

// Icon picker component for admin
export function IconPreview({
  name,
  label,
  size = 48,
  showLabel = true,
}: {
  name: string;
  label?: string;
  size?: number;
  showLabel?: boolean;
}) {
  const slotConfig = iconSlots.find((slot) => slot.name === name);

  return (
    <div className="flex flex-col items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <DynamicIcon name={name} size={size} />
      {showLabel && (
        <span className="text-xs text-muted-foreground text-center">
          {label || slotConfig?.label || name}
        </span>
      )}
    </div>
  );
}

export default DynamicIcon;
