import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  ThemeConfig,
  CustomIcon,
  BrandAsset,
  IconRegistry,
  defaultThemeConfig,
} from '@/types/theme';
import { applyTheme } from '@/lib/theme-utils';

interface ThemeContextType {
  // Theme
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
  updateTheme: (updates: Partial<ThemeConfig>) => void;
  saveTheme: () => Promise<void>;
  resetTheme: () => void;
  isLoading: boolean;
  isDirty: boolean;

  // Dark Mode
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;

  // Custom Icons
  icons: IconRegistry;
  getIcon: (name: string) => CustomIcon | null;
  updateIcon: (name: string, imageUrl: string | null) => Promise<void>;
  loadIcons: () => Promise<void>;

  // Brand Assets
  brandAssets: BrandAsset[];
  getBrandAsset: (type: BrandAsset['type']) => BrandAsset | null;
  updateBrandAsset: (type: BrandAsset['type'], imageUrl: string) => Promise<void>;
  loadBrandAssets: () => Promise<void>;

  // Preview Mode
  isPreviewMode: boolean;
  previewTheme: ThemeConfig | null;
  startPreview: (theme: ThemeConfig) => void;
  endPreview: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'theme_config';
const DARK_MODE_KEY = 'dark_mode';

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<ThemeConfig>(defaultThemeConfig);
  const [savedTheme, setSavedTheme] = useState<ThemeConfig>(defaultThemeConfig);
  const [isLoading, setIsLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [icons, setIcons] = useState<IconRegistry>({});
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);

  // Preview mode
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<ThemeConfig | null>(null);

  // Track initialization to prevent duplicate applies
  const hasInitialized = useRef(false);
  const lastAppliedTheme = useRef<string>('');

  // Check if theme has unsaved changes
  const isDirty = useMemo(
    () => JSON.stringify(theme) !== JSON.stringify(savedTheme),
    [theme, savedTheme]
  );

  // Load theme from Supabase
  const loadTheme = useCallback(async () => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'theme_config')
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        const loadedTheme = data.value as unknown as ThemeConfig;
        setThemeState(loadedTheme);
        setSavedTheme(loadedTheme);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
      // Use localStorage fallback
      const cached = localStorage.getItem(THEME_STORAGE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setThemeState(parsed);
          setSavedTheme(parsed);
        } catch (e) {
          console.error('Failed to parse cached theme');
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save theme to Supabase
  const saveTheme = useCallback(async () => {
    try {
      const updatedTheme = {
        ...theme,
        updatedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('settings')
        .upsert({
          key: 'theme_config',
          value: updatedTheme as any,
        });

      if (error) throw error;

      setSavedTheme(updatedTheme);
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(updatedTheme));
    } catch (error) {
      console.error('Failed to save theme:', error);
      throw error;
    }
  }, [theme]);

  // Update theme partially
  const updateTheme = useCallback((updates: Partial<ThemeConfig>) => {
    setThemeState((prev) => ({
      ...prev,
      ...updates,
      colors: updates.colors
        ? {
            light: { ...prev.colors.light, ...updates.colors.light },
            dark: { ...prev.colors.dark, ...updates.colors.dark },
          }
        : prev.colors,
      typography: updates.typography ? { ...prev.typography, ...updates.typography } : prev.typography,
      spacing: updates.spacing ? { ...prev.spacing, ...updates.spacing } : prev.spacing,
      buttons: updates.buttons
        ? {
            primary: { ...prev.buttons.primary, ...updates.buttons.primary },
            secondary: { ...prev.buttons.secondary, ...updates.buttons.secondary },
            outline: { ...prev.buttons.outline, ...updates.buttons.outline },
          }
        : prev.buttons,
      cards: updates.cards ? { ...prev.cards, ...updates.cards } : prev.cards,
      header: updates.header ? { ...prev.header, ...updates.header } : prev.header,
      footer: updates.footer ? { ...prev.footer, ...updates.footer } : prev.footer,
      productGrid: updates.productGrid ? { ...prev.productGrid, ...updates.productGrid } : prev.productGrid,
    }));
  }, []);

  // Reset theme to saved state
  const resetTheme = useCallback(() => {
    setThemeState(savedTheme);
  }, [savedTheme]);

  // Dark mode
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => {
      const newValue = !prev;
      localStorage.setItem(DARK_MODE_KEY, String(newValue));
      return newValue;
    });
  }, []);

  const setDarkMode = useCallback((dark: boolean) => {
    setIsDarkMode(dark);
    localStorage.setItem(DARK_MODE_KEY, String(dark));
  }, []);

  // Load custom icons
  const loadIcons = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'custom_icons')
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        setIcons(data.value as unknown as IconRegistry);
      }
    } catch (error) {
      console.error('Failed to load icons:', error);
    }
  }, []);

  // Get single icon
  const getIcon = useCallback(
    (name: string): CustomIcon | null => {
      return icons[name] || null;
    },
    [icons]
  );

  // Update single icon
  const updateIcon = useCallback(
    async (name: string, imageUrl: string | null) => {
      const updatedIcons = {
        ...icons,
        [name]: {
          ...icons[name],
          id: icons[name]?.id || crypto.randomUUID(),
          name,
          imageUrl,
          updatedAt: new Date().toISOString(),
        },
      };

      try {
        const { error } = await supabase.from('settings').upsert({
          key: 'custom_icons',
          value: updatedIcons as any,
        });

        if (error) throw error;

        setIcons(updatedIcons);
      } catch (error) {
        console.error('Failed to update icon:', error);
        throw error;
      }
    },
    [icons]
  );

  // Load brand assets
  const loadBrandAssets = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'brand_assets')
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        setBrandAssets(data.value as unknown as BrandAsset[]);
      }
    } catch (error) {
      console.error('Failed to load brand assets:', error);
    }
  }, []);

  // Get single brand asset
  const getBrandAsset = useCallback(
    (type: BrandAsset['type']): BrandAsset | null => {
      return brandAssets.find((asset) => asset.type === type) || null;
    },
    [brandAssets]
  );

  // Update brand asset
  const updateBrandAsset = useCallback(
    async (type: BrandAsset['type'], imageUrl: string) => {
      const existingIndex = brandAssets.findIndex((a) => a.type === type);
      const newAsset: BrandAsset = {
        id: existingIndex >= 0 ? brandAssets[existingIndex].id : crypto.randomUUID(),
        type,
        imageUrl,
        createdAt: existingIndex >= 0 ? brandAssets[existingIndex].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedAssets =
        existingIndex >= 0
          ? brandAssets.map((a, i) => (i === existingIndex ? newAsset : a))
          : [...brandAssets, newAsset];

      try {
        const { error } = await supabase.from('settings').upsert({
          key: 'brand_assets',
          value: updatedAssets as any,
        });

        if (error) throw error;

        setBrandAssets(updatedAssets);
      } catch (error) {
        console.error('Failed to update brand asset:', error);
        throw error;
      }
    },
    [brandAssets]
  );

  // Preview mode
  const startPreview = useCallback((previewConfig: ThemeConfig) => {
    setIsPreviewMode(true);
    setPreviewTheme(previewConfig);
  }, []);

  const endPreview = useCallback(() => {
    setIsPreviewMode(false);
    setPreviewTheme(null);
  }, []);

  // Apply theme when it changes (with duplicate prevention)
  useEffect(() => {
    // Don't apply until we've loaded from database
    if (isLoading) return;

    const activeTheme = isPreviewMode && previewTheme ? previewTheme : theme;
    const themeHash = JSON.stringify(activeTheme);

    // Only apply if theme has actually changed
    if (lastAppliedTheme.current !== themeHash) {
      applyTheme(activeTheme);
      lastAppliedTheme.current = themeHash;
    }
  }, [theme, isPreviewMode, previewTheme, isLoading]);

  // Apply dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initial load (only once)
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Load dark mode preference
    const savedDarkMode = localStorage.getItem(DARK_MODE_KEY);
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === 'true');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }

    // Load theme, icons, and brand assets
    loadTheme();
    loadIcons();
    loadBrandAssets();
  }, [loadTheme, loadIcons, loadBrandAssets]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme: setThemeState,
        updateTheme,
        saveTheme,
        resetTheme,
        isLoading,
        isDirty,
        isDarkMode,
        toggleDarkMode,
        setDarkMode,
        icons,
        getIcon,
        updateIcon,
        loadIcons,
        brandAssets,
        getBrandAsset,
        updateBrandAsset,
        loadBrandAssets,
        isPreviewMode,
        previewTheme,
        startPreview,
        endPreview,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
