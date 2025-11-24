// Theme Configuration Types

export interface ColorConfig {
  h: number; // Hue (0-360)
  s: number; // Saturation (0-100)
  l: number; // Lightness (0-100)
}

export interface ThemeColors {
  primary: ColorConfig;
  secondary: ColorConfig;
  accent: ColorConfig;
  background: ColorConfig;
  foreground: ColorConfig;
  card: ColorConfig;
  cardForeground: ColorConfig;
  popover: ColorConfig;
  popoverForeground: ColorConfig;
  muted: ColorConfig;
  mutedForeground: ColorConfig;
  border: ColorConfig;
  input: ColorConfig;
  ring: ColorConfig;
  destructive: ColorConfig;
  destructiveForeground: ColorConfig;
  success: ColorConfig;
  successForeground: ColorConfig;
  warning: ColorConfig;
  warningForeground: ColorConfig;
  info: ColorConfig;
  infoForeground: ColorConfig;
}

export interface TypographyConfig {
  headingFont: string;
  bodyFont: string;
  monoFont: string;
  baseFontSize: number; // in px
  headingWeight: number;
  bodyWeight: number;
  lineHeight: number;
  letterSpacing: number; // in em
}

export interface SpacingConfig {
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  shadowIntensity: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  containerMaxWidth: number; // in px
  gridGap: number; // in px
}

export interface ButtonStyle {
  borderRadius: number;
  paddingX: number;
  paddingY: number;
  fontWeight: number;
  textTransform: 'none' | 'uppercase' | 'capitalize';
}

export interface CardStyle {
  borderRadius: number;
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderWidth: number;
  hoverEffect: 'none' | 'lift' | 'glow' | 'border';
}

export interface HeaderConfig {
  layout: 'left' | 'center' | 'split';
  sticky: boolean;
  height: number;
  showAnnouncementBar: boolean;
  announcementText: string;
  announcementBgColor: ColorConfig;
  searchStyle: 'inline' | 'dropdown' | 'fullwidth';
  cartStyle: 'icon' | 'count' | 'mini';
}

export interface FooterConfig {
  columns: number;
  layout: 'simple' | 'detailed' | 'minimal';
  showNewsletter: boolean;
  showSocial: boolean;
  showPaymentIcons: boolean;
  backgroundColor: ColorConfig;
}

export interface ProductGridConfig {
  itemsPerRow: 2 | 3 | 4 | 5 | 6;
  cardStyle: 'minimal' | 'detailed' | 'hover-reveal';
  imageRatio: 'square' | 'portrait' | 'landscape';
  showQuickView: boolean;
  showWishlist: boolean;
  showCompare: boolean;
}

export interface ThemeConfig {
  id?: string;
  name: string;
  version: string;
  colors: {
    light: ThemeColors;
    dark: ThemeColors;
  };
  typography: TypographyConfig;
  spacing: SpacingConfig;
  buttons: {
    primary: ButtonStyle;
    secondary: ButtonStyle;
    outline: ButtonStyle;
  };
  cards: CardStyle;
  header: HeaderConfig;
  footer: FooterConfig;
  productGrid: ProductGridConfig;
  customCss: string;
  updatedAt?: string;
}

// Custom Icon Types
export type IconType = 'category' | 'navigation' | 'action' | 'social' | 'status' | 'feature';

export interface CustomIcon {
  id: string;
  name: string;
  iconType: IconType;
  imageUrl: string | null;
  fallbackIcon: string; // Lucide icon name
  size?: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IconRegistry {
  [key: string]: CustomIcon;
}

// Brand Assets Types
export interface BrandAsset {
  id: string;
  type: 'logo-primary' | 'logo-inverted' | 'logo-mobile' | 'favicon' | 'og-image' | 'email-header' | 'loading-logo';
  imageUrl: string;
  width?: number;
  height?: number;
  altText?: string;
  createdAt: string;
  updatedAt: string;
}

// Homepage Section Types
export type HomepageSectionType =
  | 'hero'
  | 'featured-categories'
  | 'product-carousel'
  | 'promotional-banner'
  | 'testimonials'
  | 'brand-logos'
  | 'newsletter'
  | 'custom-html'
  | 'featured-products'
  | 'trust-badges';

export interface HomepageSection {
  id: string;
  type: HomepageSectionType;
  title: string;
  enabled: boolean;
  order: number;
  config: Record<string, any>;
  mobileConfig?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Theme Preset
export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  config: ThemeConfig;
  isBuiltIn: boolean;
  createdAt: string;
}

// Default Theme Configuration
export const defaultThemeColors: ThemeColors = {
  primary: { h: 142, s: 71, l: 45 },
  secondary: { h: 38, s: 90, l: 65 },
  accent: { h: 25, s: 85, l: 60 },
  background: { h: 42, s: 47, l: 97 },
  foreground: { h: 150, s: 20, l: 15 },
  card: { h: 0, s: 0, l: 100 },
  cardForeground: { h: 150, s: 20, l: 15 },
  popover: { h: 0, s: 0, l: 100 },
  popoverForeground: { h: 150, s: 20, l: 15 },
  muted: { h: 42, s: 30, l: 92 },
  mutedForeground: { h: 150, s: 10, l: 40 },
  border: { h: 42, s: 25, l: 85 },
  input: { h: 42, s: 25, l: 85 },
  ring: { h: 142, s: 71, l: 45 },
  destructive: { h: 0, s: 84, l: 60 },
  destructiveForeground: { h: 0, s: 0, l: 100 },
  success: { h: 142, s: 71, l: 45 },
  successForeground: { h: 0, s: 0, l: 100 },
  warning: { h: 38, s: 92, l: 50 },
  warningForeground: { h: 0, s: 0, l: 100 },
  info: { h: 200, s: 80, l: 50 },
  infoForeground: { h: 0, s: 0, l: 100 },
};

export const defaultDarkThemeColors: ThemeColors = {
  primary: { h: 142, s: 71, l: 45 },
  secondary: { h: 38, s: 90, l: 65 },
  accent: { h: 25, s: 85, l: 60 },
  background: { h: 222, s: 84, l: 5 },
  foreground: { h: 210, s: 40, l: 98 },
  card: { h: 222, s: 84, l: 8 },
  cardForeground: { h: 210, s: 40, l: 98 },
  popover: { h: 222, s: 84, l: 8 },
  popoverForeground: { h: 210, s: 40, l: 98 },
  muted: { h: 217, s: 32, l: 17 },
  mutedForeground: { h: 215, s: 20, l: 65 },
  border: { h: 217, s: 32, l: 17 },
  input: { h: 217, s: 32, l: 17 },
  ring: { h: 142, s: 71, l: 45 },
  destructive: { h: 0, s: 62, l: 50 },
  destructiveForeground: { h: 0, s: 0, l: 100 },
  success: { h: 142, s: 71, l: 45 },
  successForeground: { h: 0, s: 0, l: 100 },
  warning: { h: 38, s: 92, l: 50 },
  warningForeground: { h: 0, s: 0, l: 100 },
  info: { h: 200, s: 80, l: 50 },
  infoForeground: { h: 0, s: 0, l: 100 },
};

export const defaultTypography: TypographyConfig = {
  headingFont: 'Inter',
  bodyFont: 'Inter',
  monoFont: 'JetBrains Mono',
  baseFontSize: 16,
  headingWeight: 700,
  bodyWeight: 400,
  lineHeight: 1.5,
  letterSpacing: 0,
};

export const defaultSpacing: SpacingConfig = {
  borderRadius: 'md',
  shadowIntensity: 'md',
  containerMaxWidth: 1400,
  gridGap: 24,
};

export const defaultButtonStyle: ButtonStyle = {
  borderRadius: 8,
  paddingX: 16,
  paddingY: 8,
  fontWeight: 500,
  textTransform: 'none',
};

export const defaultCardStyle: CardStyle = {
  borderRadius: 12,
  shadow: 'md',
  borderWidth: 1,
  hoverEffect: 'lift',
};

export const defaultHeaderConfig: HeaderConfig = {
  layout: 'left',
  sticky: true,
  height: 72,
  showAnnouncementBar: false,
  announcementText: '',
  announcementBgColor: { h: 142, s: 71, l: 45 },
  searchStyle: 'dropdown',
  cartStyle: 'count',
};

export const defaultFooterConfig: FooterConfig = {
  columns: 4,
  layout: 'detailed',
  showNewsletter: true,
  showSocial: true,
  showPaymentIcons: true,
  backgroundColor: { h: 150, s: 45, l: 25 },
};

export const defaultProductGridConfig: ProductGridConfig = {
  itemsPerRow: 4,
  cardStyle: 'detailed',
  imageRatio: 'square',
  showQuickView: true,
  showWishlist: true,
  showCompare: false,
};

export const defaultThemeConfig: ThemeConfig = {
  name: 'Default Theme',
  version: '1.0.0',
  colors: {
    light: defaultThemeColors,
    dark: defaultDarkThemeColors,
  },
  typography: defaultTypography,
  spacing: defaultSpacing,
  buttons: {
    primary: defaultButtonStyle,
    secondary: { ...defaultButtonStyle, fontWeight: 400 },
    outline: { ...defaultButtonStyle, fontWeight: 400 },
  },
  cards: defaultCardStyle,
  header: defaultHeaderConfig,
  footer: defaultFooterConfig,
  productGrid: defaultProductGridConfig,
  customCss: '',
};

// Popular Google Fonts for selection
export const popularFonts = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Source Sans Pro',
  'Nunito',
  'Raleway',
  'Playfair Display',
  'Merriweather',
  'Ubuntu',
  'Oswald',
  'Quicksand',
  'Work Sans',
  'DM Sans',
  'Space Grotesk',
  'Outfit',
  'Plus Jakarta Sans',
  'Manrope',
];

// Icon slot definitions
export const iconSlots: { name: string; type: IconType; fallback: string; label: string }[] = [
  // Categories
  { name: 'category-vapes', type: 'category', fallback: 'Droplet', label: 'Vapes' },
  { name: 'category-eliquids', type: 'category', fallback: 'Beaker', label: 'E-Liquids' },
  { name: 'category-accessories', type: 'category', fallback: 'Package', label: 'Accessories' },
  { name: 'category-mods', type: 'category', fallback: 'Cpu', label: 'Mods' },
  { name: 'category-coils', type: 'category', fallback: 'CircleDot', label: 'Coils' },
  { name: 'category-pods', type: 'category', fallback: 'Box', label: 'Pods' },
  { name: 'category-disposables', type: 'category', fallback: 'Cigarette', label: 'Disposables' },
  { name: 'category-batteries', type: 'category', fallback: 'Battery', label: 'Batteries' },

  // Navigation
  { name: 'nav-home', type: 'navigation', fallback: 'Home', label: 'Home' },
  { name: 'nav-shop', type: 'navigation', fallback: 'ShoppingBag', label: 'Shop' },
  { name: 'nav-cart', type: 'navigation', fallback: 'ShoppingCart', label: 'Cart' },
  { name: 'nav-account', type: 'navigation', fallback: 'User', label: 'Account' },
  { name: 'nav-search', type: 'navigation', fallback: 'Search', label: 'Search' },
  { name: 'nav-menu', type: 'navigation', fallback: 'Menu', label: 'Menu' },
  { name: 'nav-wishlist', type: 'navigation', fallback: 'Heart', label: 'Wishlist' },

  // Actions
  { name: 'action-add-cart', type: 'action', fallback: 'Plus', label: 'Add to Cart' },
  { name: 'action-remove', type: 'action', fallback: 'Trash2', label: 'Remove' },
  { name: 'action-edit', type: 'action', fallback: 'Edit', label: 'Edit' },
  { name: 'action-share', type: 'action', fallback: 'Share2', label: 'Share' },
  { name: 'action-compare', type: 'action', fallback: 'ArrowLeftRight', label: 'Compare' },
  { name: 'action-quickview', type: 'action', fallback: 'Eye', label: 'Quick View' },

  // Social
  { name: 'social-facebook', type: 'social', fallback: 'Facebook', label: 'Facebook' },
  { name: 'social-instagram', type: 'social', fallback: 'Instagram', label: 'Instagram' },
  { name: 'social-twitter', type: 'social', fallback: 'Twitter', label: 'Twitter/X' },
  { name: 'social-tiktok', type: 'social', fallback: 'Music2', label: 'TikTok' },
  { name: 'social-youtube', type: 'social', fallback: 'Youtube', label: 'YouTube' },
  { name: 'social-whatsapp', type: 'social', fallback: 'MessageCircle', label: 'WhatsApp' },

  // Status
  { name: 'status-success', type: 'status', fallback: 'CheckCircle', label: 'Success' },
  { name: 'status-error', type: 'status', fallback: 'XCircle', label: 'Error' },
  { name: 'status-warning', type: 'status', fallback: 'AlertTriangle', label: 'Warning' },
  { name: 'status-info', type: 'status', fallback: 'Info', label: 'Info' },

  // Features/Trust Badges
  { name: 'feature-shipping', type: 'feature', fallback: 'Truck', label: 'Free Shipping' },
  { name: 'feature-secure', type: 'feature', fallback: 'Shield', label: 'Secure Payment' },
  { name: 'feature-support', type: 'feature', fallback: 'Headphones', label: '24/7 Support' },
  { name: 'feature-returns', type: 'feature', fallback: 'RotateCcw', label: 'Easy Returns' },
  { name: 'feature-quality', type: 'feature', fallback: 'Award', label: 'Quality Guaranteed' },
];
