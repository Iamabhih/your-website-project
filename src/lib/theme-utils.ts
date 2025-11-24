import { ColorConfig, ThemeColors, ThemeConfig, SpacingConfig } from '@/types/theme';

// Convert HSL to CSS string
export function hslToString(color: ColorConfig): string {
  return `${color.h} ${color.s}% ${color.l}%`;
}

// Convert HSL to hex
export function hslToHex(color: ColorConfig): string {
  const h = color.h / 360;
  const s = color.s / 100;
  const l = color.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert hex to HSL
export function hexToHsl(hex: string): ColorConfig {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// Lighten a color
export function lighten(color: ColorConfig, amount: number): ColorConfig {
  return {
    ...color,
    l: Math.min(100, color.l + amount),
  };
}

// Darken a color
export function darken(color: ColorConfig, amount: number): ColorConfig {
  return {
    ...color,
    l: Math.max(0, color.l - amount),
  };
}

// Adjust saturation
export function saturate(color: ColorConfig, amount: number): ColorConfig {
  return {
    ...color,
    s: Math.min(100, Math.max(0, color.s + amount)),
  };
}

// Get contrasting text color (black or white)
export function getContrastColor(color: ColorConfig): ColorConfig {
  // Use relative luminance formula
  const l = color.l;
  return l > 50
    ? { h: 0, s: 0, l: 10 } // Dark text
    : { h: 0, s: 0, l: 98 }; // Light text
}

// Generate border radius value
export function getBorderRadius(size: SpacingConfig['borderRadius']): string {
  const radiusMap: Record<SpacingConfig['borderRadius'], string> = {
    none: '0',
    sm: '0.25rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  };
  return radiusMap[size];
}

// Generate shadow value
export function getShadow(intensity: SpacingConfig['shadowIntensity']): string {
  const shadowMap: Record<SpacingConfig['shadowIntensity'], string> = {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  };
  return shadowMap[intensity];
}

// Generate CSS variables from theme config
export function generateCssVariables(colors: ThemeColors, isDark: boolean = false): string {
  const prefix = isDark ? '.dark' : ':root';

  const variables = `
${prefix} {
  --background: ${hslToString(colors.background)};
  --foreground: ${hslToString(colors.foreground)};
  --card: ${hslToString(colors.card)};
  --card-foreground: ${hslToString(colors.cardForeground)};
  --popover: ${hslToString(colors.popover)};
  --popover-foreground: ${hslToString(colors.popoverForeground)};
  --primary: ${hslToString(colors.primary)};
  --primary-foreground: ${hslToString(getContrastColor(colors.primary))};
  --secondary: ${hslToString(colors.secondary)};
  --secondary-foreground: ${hslToString(getContrastColor(colors.secondary))};
  --accent: ${hslToString(colors.accent)};
  --accent-foreground: ${hslToString(getContrastColor(colors.accent))};
  --muted: ${hslToString(colors.muted)};
  --muted-foreground: ${hslToString(colors.mutedForeground)};
  --destructive: ${hslToString(colors.destructive)};
  --destructive-foreground: ${hslToString(colors.destructiveForeground)};
  --success: ${hslToString(colors.success)};
  --success-foreground: ${hslToString(colors.successForeground)};
  --warning: ${hslToString(colors.warning)};
  --warning-foreground: ${hslToString(colors.warningForeground)};
  --info: ${hslToString(colors.info)};
  --info-foreground: ${hslToString(colors.infoForeground)};
  --border: ${hslToString(colors.border)};
  --input: ${hslToString(colors.input)};
  --ring: ${hslToString(colors.ring)};
}`;

  return variables;
}

// Generate full theme CSS
export function generateThemeCss(config: ThemeConfig): string {
  const lightVars = generateCssVariables(config.colors.light, false);
  const darkVars = generateCssVariables(config.colors.dark, true);

  const spacingVars = `
:root {
  --radius: ${getBorderRadius(config.spacing.borderRadius)};
  --shadow: ${getShadow(config.spacing.shadowIntensity)};
  --container-max-width: ${config.spacing.containerMaxWidth}px;
  --grid-gap: ${config.spacing.gridGap}px;
  --font-heading: '${config.typography.headingFont}', sans-serif;
  --font-body: '${config.typography.bodyFont}', sans-serif;
  --font-mono: '${config.typography.monoFont}', monospace;
  --font-size-base: ${config.typography.baseFontSize}px;
  --font-weight-heading: ${config.typography.headingWeight};
  --font-weight-body: ${config.typography.bodyWeight};
  --line-height: ${config.typography.lineHeight};
  --letter-spacing: ${config.typography.letterSpacing}em;
}`;

  const buttonVars = `
:root {
  --btn-primary-radius: ${config.buttons.primary.borderRadius}px;
  --btn-primary-px: ${config.buttons.primary.paddingX}px;
  --btn-primary-py: ${config.buttons.primary.paddingY}px;
  --btn-primary-weight: ${config.buttons.primary.fontWeight};
  --btn-primary-transform: ${config.buttons.primary.textTransform};
}`;

  const cardVars = `
:root {
  --card-radius: ${config.cards.borderRadius}px;
  --card-shadow: ${getShadow(config.cards.shadow)};
  --card-border-width: ${config.cards.borderWidth}px;
}`;

  return `${lightVars}\n${darkVars}\n${spacingVars}\n${buttonVars}\n${cardVars}\n${config.customCss || ''}`;
}

// Inject CSS into document
export function injectThemeCss(css: string, styleId: string = 'dynamic-theme'): void {
  // Remove existing style element if present
  const existingStyle = document.getElementById(styleId);
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create new style element
  const styleElement = document.createElement('style');
  styleElement.id = styleId;
  styleElement.textContent = css;
  document.head.appendChild(styleElement);
}

// Load Google Font
export function loadGoogleFont(fontFamily: string): void {
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/ /g, '+')}:wght@300;400;500;600;700;800&display=swap`;

  // Check if font is already loaded
  const existingLink = document.querySelector(`link[href*="${fontFamily.replace(/ /g, '+')}"]`);
  if (existingLink) return;

  const linkElement = document.createElement('link');
  linkElement.rel = 'stylesheet';
  linkElement.href = fontUrl;
  document.head.appendChild(linkElement);
}

// Load multiple Google Fonts
export function loadGoogleFonts(fonts: string[]): void {
  const uniqueFonts = [...new Set(fonts)];
  uniqueFonts.forEach(loadGoogleFont);
}

// Apply theme to document
export function applyTheme(config: ThemeConfig): void {
  // Load fonts
  loadGoogleFonts([
    config.typography.headingFont,
    config.typography.bodyFont,
    config.typography.monoFont,
  ]);

  // Generate and inject CSS
  const css = generateThemeCss(config);
  injectThemeCss(css);
}

// Generate color palette preview
export function generateColorPalette(baseColor: ColorConfig): ColorConfig[] {
  return [
    darken(baseColor, 40),
    darken(baseColor, 30),
    darken(baseColor, 20),
    darken(baseColor, 10),
    baseColor,
    lighten(baseColor, 10),
    lighten(baseColor, 20),
    lighten(baseColor, 30),
    lighten(baseColor, 40),
  ];
}

// Check color accessibility (WCAG contrast ratio)
export function getContrastRatio(color1: ColorConfig, color2: ColorConfig): number {
  const getLuminance = (color: ColorConfig) => {
    const rgb = hslToRgb(color);
    const [r, g, b] = rgb.map((val) => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// Convert HSL to RGB
function hslToRgb(color: ColorConfig): [number, number, number] {
  const h = color.h / 360;
  const s = color.s / 100;
  const l = color.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Check if contrast meets WCAG AA standard
export function meetsWcagAA(foreground: ColorConfig, background: ColorConfig, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

// Check if contrast meets WCAG AAA standard
export function meetsWcagAAA(foreground: ColorConfig, background: ColorConfig, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

// Deep merge theme configs
export function mergeThemeConfig(base: ThemeConfig, override: Partial<ThemeConfig>): ThemeConfig {
  return {
    ...base,
    ...override,
    colors: override.colors ? {
      light: { ...base.colors.light, ...override.colors.light },
      dark: { ...base.colors.dark, ...override.colors.dark },
    } : base.colors,
    typography: override.typography ? { ...base.typography, ...override.typography } : base.typography,
    spacing: override.spacing ? { ...base.spacing, ...override.spacing } : base.spacing,
    buttons: override.buttons ? {
      primary: { ...base.buttons.primary, ...override.buttons?.primary },
      secondary: { ...base.buttons.secondary, ...override.buttons?.secondary },
      outline: { ...base.buttons.outline, ...override.buttons?.outline },
    } : base.buttons,
    cards: override.cards ? { ...base.cards, ...override.cards } : base.cards,
    header: override.header ? { ...base.header, ...override.header } : base.header,
    footer: override.footer ? { ...base.footer, ...override.footer } : base.footer,
    productGrid: override.productGrid ? { ...base.productGrid, ...override.productGrid } : base.productGrid,
  };
}

// Export theme as JSON
export function exportTheme(config: ThemeConfig): string {
  return JSON.stringify(config, null, 2);
}

// Import theme from JSON
export function importTheme(json: string): ThemeConfig | null {
  try {
    const parsed = JSON.parse(json);
    // Basic validation
    if (parsed.colors && parsed.typography && parsed.spacing) {
      return parsed as ThemeConfig;
    }
    return null;
  } catch {
    return null;
  }
}
