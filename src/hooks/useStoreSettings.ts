import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StoreSettings {
  // Business Information
  store_name: string;
  store_tagline: string;
  store_description: string;
  store_email: string;
  store_phone: string;
  store_whatsapp: string;
  store_address: string;
  store_city: string;
  store_province: string;
  store_postal_code: string;
  store_country: string;
  store_logo_url: string;
  store_favicon_url: string;

  // Social Media
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_tiktok: string;
  social_youtube: string;
  social_linkedin: string;

  // Business Hours
  business_hours_weekday: string;
  business_hours_saturday: string;
  business_hours_sunday: string;
  business_hours_public_holidays: string;

  // Legal/Compliance
  business_registration_number: string;
  vat_number: string;
  tax_rate: number;
  tax_enabled: boolean;

  // Feature Toggles
  feature_chat_enabled: boolean;
  feature_newsletter_enabled: boolean;
  feature_reviews_enabled: boolean;
  feature_wishlist_enabled: boolean;
  feature_age_verification_enabled: boolean;
  feature_telegram_bot_enabled: boolean;
  feature_guest_checkout_enabled: boolean;
  feature_stock_alerts_enabled: boolean;
  feature_compare_products_enabled: boolean;
  feature_recently_viewed_enabled: boolean;
  feature_maintenance_mode_enabled: boolean;
  maintenance_message: string;

  // SEO
  seo_meta_title: string;
  seo_meta_description: string;
  seo_keywords: string;
  seo_og_image: string;
  seo_twitter_handle: string;
  seo_google_site_verification: string;
  seo_robots_txt: string;

  // Analytics
  analytics_google_id: string;
  analytics_facebook_pixel: string;
  analytics_hotjar_id: string;
  analytics_tiktok_pixel: string;

  // Regional Settings
  currency_code: string;
  currency_symbol: string;
  timezone: string;
  date_format: string;

  // Email Settings
  email_from_name: string;
  email_from_address: string;
  email_order_notifications: boolean;
  email_shipping_notifications: boolean;
  email_marketing_enabled: boolean;

  // Shipping Defaults
  shipping_free_threshold: number;
  shipping_default_rate: number;
  shipping_express_rate: number;
  shipping_processing_days: number;

  // Legal Pages
  legal_terms_url: string;
  legal_privacy_url: string;
  legal_refund_url: string;
  legal_cookie_url: string;

  // Checkout Settings
  checkout_min_order_amount: number;
  checkout_max_order_amount: number;
  checkout_require_phone: boolean;
  checkout_require_company: boolean;

  // Inventory Settings
  inventory_low_stock_threshold: number;
  inventory_out_of_stock_visibility: string;
  inventory_track_stock: boolean;
}

const defaultSettings: StoreSettings = {
  store_name: 'Ideal Smoke Supply',
  store_tagline: 'Your trusted source for premium vaping products',
  store_description: 'Bringing you quality vapes, e-liquids, and accessories.',
  store_email: '',
  store_phone: '',
  store_whatsapp: '',
  store_address: '',
  store_city: '',
  store_province: '',
  store_postal_code: '',
  store_country: 'South Africa',
  store_logo_url: '',
  store_favicon_url: '',

  social_facebook: '',
  social_instagram: '',
  social_twitter: '',
  social_tiktok: '',
  social_youtube: '',
  social_linkedin: '',

  business_hours_weekday: '08:00 - 17:00',
  business_hours_saturday: '09:00 - 14:00',
  business_hours_sunday: 'Closed',
  business_hours_public_holidays: 'Closed',

  business_registration_number: '',
  vat_number: '',
  tax_rate: 15,
  tax_enabled: true,

  feature_chat_enabled: true,
  feature_newsletter_enabled: true,
  feature_reviews_enabled: true,
  feature_wishlist_enabled: true,
  feature_age_verification_enabled: true,
  feature_telegram_bot_enabled: true,
  feature_guest_checkout_enabled: true,
  feature_stock_alerts_enabled: true,
  feature_compare_products_enabled: false,
  feature_recently_viewed_enabled: true,
  feature_maintenance_mode_enabled: false,
  maintenance_message: 'We are currently performing scheduled maintenance. Please check back soon.',

  seo_meta_title: '',
  seo_meta_description: '',
  seo_keywords: '',
  seo_og_image: '',
  seo_twitter_handle: '',
  seo_google_site_verification: '',
  seo_robots_txt: 'User-agent: *\nAllow: /',

  analytics_google_id: '',
  analytics_facebook_pixel: '',
  analytics_hotjar_id: '',
  analytics_tiktok_pixel: '',

  currency_code: 'ZAR',
  currency_symbol: 'R',
  timezone: 'Africa/Johannesburg',
  date_format: 'DD/MM/YYYY',

  email_from_name: '',
  email_from_address: '',
  email_order_notifications: true,
  email_shipping_notifications: true,
  email_marketing_enabled: false,

  shipping_free_threshold: 500,
  shipping_default_rate: 99,
  shipping_express_rate: 150,
  shipping_processing_days: 2,

  legal_terms_url: '/terms-of-service',
  legal_privacy_url: '/privacy-policy',
  legal_refund_url: '/return-policy',
  legal_cookie_url: '/cookie-policy',

  checkout_min_order_amount: 0,
  checkout_max_order_amount: 50000,
  checkout_require_phone: true,
  checkout_require_company: false,

  inventory_low_stock_threshold: 5,
  inventory_out_of_stock_visibility: 'hide',
  inventory_track_stock: true,
};

const STORE_SETTINGS_KEY = 'store_settings';

async function fetchStoreSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', STORE_SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    // No settings found, return defaults
    return defaultSettings;
  }

  // Merge with defaults to ensure all fields exist
  const storedSettings = typeof data.value === 'string'
    ? JSON.parse(data.value)
    : data.value;

  return { ...defaultSettings, ...storedSettings };
}

async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert([{
      key: STORE_SETTINGS_KEY,
      value: settings as any,
      updated_at: new Date().toISOString(),
    }], {
      onConflict: 'key',
    });

  if (error) throw error;
}

export function useStoreSettings() {
  return useQuery({
    queryKey: ['store-settings'],
    queryFn: fetchStoreSettings,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: saveStoreSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-settings'] });
    },
  });
}

export { defaultSettings };
