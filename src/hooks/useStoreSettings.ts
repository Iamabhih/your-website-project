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

  // Social Media
  social_facebook: string;
  social_instagram: string;
  social_twitter: string;
  social_tiktok: string;

  // Business Hours
  business_hours_weekday: string;
  business_hours_saturday: string;
  business_hours_sunday: string;

  // Legal/Compliance
  business_registration_number: string;
  vat_number: string;

  // Feature Toggles
  feature_chat_enabled: boolean;
  feature_newsletter_enabled: boolean;
  feature_reviews_enabled: boolean;
  feature_wishlist_enabled: boolean;
  feature_age_verification_enabled: boolean;
  feature_telegram_bot_enabled: boolean;

  // SEO
  seo_meta_title: string;
  seo_meta_description: string;
  seo_keywords: string;
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
  social_facebook: '',
  social_instagram: '',
  social_twitter: '',
  social_tiktok: '',
  business_hours_weekday: '08:00 - 17:00',
  business_hours_saturday: '09:00 - 14:00',
  business_hours_sunday: 'Closed',
  business_registration_number: '',
  vat_number: '',
  feature_chat_enabled: true,
  feature_newsletter_enabled: true,
  feature_reviews_enabled: true,
  feature_wishlist_enabled: true,
  feature_age_verification_enabled: true,
  feature_telegram_bot_enabled: true,
  seo_meta_title: '',
  seo_meta_description: '',
  seo_keywords: '',
};

const STORE_SETTINGS_KEY = 'store_settings';

async function fetchStoreSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', STORE_SETTINGS_KEY)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No settings found, return defaults
      return defaultSettings;
    }
    throw error;
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
    .upsert({
      key: STORE_SETTINGS_KEY,
      value: settings,
      updated_at: new Date().toISOString(),
    }, {
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
