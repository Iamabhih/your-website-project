import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Palette,
  Type,
  Layout,
  Square,
  Sun,
  Moon,
  Save,
  RotateCcw,
  Download,
  Upload,
  Eye,
  EyeOff,
  Loader2,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  ColorConfig,
  ThemeColors,
  popularFonts,
  defaultThemeConfig,
  SpacingConfig,
} from '@/types/theme';
import { hslToHex, hexToHsl, getContrastRatio, meetsWcagAA, exportTheme, importTheme } from '@/lib/theme-utils';

// Color picker component
function ColorPicker({
  label,
  color,
  onChange,
  description,
}: {
  label: string;
  color: ColorConfig;
  onChange: (color: ColorConfig) => void;
  description?: string;
}) {
  const [hexValue, setHexValue] = useState(hslToHex(color));

  useEffect(() => {
    setHexValue(hslToHex(color));
  }, [color]);

  const handleHexChange = (hex: string) => {
    setHexValue(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      onChange(hexToHsl(hex));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <Label className="font-medium">{label}</Label>
          {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-lg border-2 border-border shadow-sm"
          style={{ backgroundColor: hslToHex(color) }}
        />
      </div>
      <div className="grid grid-cols-4 gap-2">
        <div className="col-span-1">
          <Label className="text-xs text-muted-foreground">Hex</Label>
          <Input
            value={hexValue}
            onChange={(e) => handleHexChange(e.target.value)}
            className="text-xs font-mono h-8"
            placeholder="#000000"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">H</Label>
          <Input
            type="number"
            min={0}
            max={360}
            value={color.h}
            onChange={(e) => onChange({ ...color, h: Number(e.target.value) })}
            className="text-xs h-8"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">S%</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={color.s}
            onChange={(e) => onChange({ ...color, s: Number(e.target.value) })}
            className="text-xs h-8"
          />
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">L%</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={color.l}
            onChange={(e) => onChange({ ...color, l: Number(e.target.value) })}
            className="text-xs h-8"
          />
        </div>
      </div>
      <Slider
        value={[color.h]}
        max={360}
        step={1}
        onValueChange={([h]) => onChange({ ...color, h })}
        className="mt-2"
        style={{
          background: `linear-gradient(to right,
            hsl(0, ${color.s}%, ${color.l}%),
            hsl(60, ${color.s}%, ${color.l}%),
            hsl(120, ${color.s}%, ${color.l}%),
            hsl(180, ${color.s}%, ${color.l}%),
            hsl(240, ${color.s}%, ${color.l}%),
            hsl(300, ${color.s}%, ${color.l}%),
            hsl(360, ${color.s}%, ${color.l}%)
          )`,
        }}
      />
    </div>
  );
}

// Contrast checker
function ContrastChecker({
  foreground,
  background,
}: {
  foreground: ColorConfig;
  background: ColorConfig;
}) {
  const ratio = getContrastRatio(foreground, background);
  const passesAA = meetsWcagAA(foreground, background);
  const passesAALarge = meetsWcagAA(foreground, background, true);

  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold"
        style={{
          backgroundColor: hslToHex(background),
          color: hslToHex(foreground),
        }}
      >
        Aa
      </div>
      <div>
        <p className="font-medium">{ratio.toFixed(2)}:1</p>
        <div className="flex gap-1">
          {passesAA ? (
            <Badge variant="secondary" className="bg-success/10 text-success text-[10px] px-1">
              AA
            </Badge>
          ) : passesAALarge ? (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-[10px] px-1">
              AA Large
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-red-100 text-red-800 text-[10px] px-1">
              Fail
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ThemeBuilder() {
  const {
    theme,
    updateTheme,
    saveTheme,
    resetTheme,
    isDirty,
    isLoading,
    isDarkMode,
    toggleDarkMode,
  } = useTheme();

  const [saving, setSaving] = useState(false);
  const [activeColorMode, setActiveColorMode] = useState<'light' | 'dark'>('light');

  const activeColors = activeColorMode === 'light' ? theme.colors.light : theme.colors.dark;

  const handleColorChange = (key: keyof ThemeColors, value: ColorConfig) => {
    updateTheme({
      colors: {
        ...theme.colors,
        [activeColorMode]: {
          ...activeColors,
          [key]: value,
        },
      },
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveTheme();
      toast.success('Theme saved successfully!');
    } catch (error) {
      toast.error('Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    const json = exportTheme(theme);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Theme exported!');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      const imported = importTheme(text);
      if (imported) {
        updateTheme(imported);
        toast.success('Theme imported! Save to apply permanently.');
      } else {
        toast.error('Invalid theme file');
      }
    };
    input.click();
  };

  const handleReset = () => {
    if (confirm('Reset all theme settings to default? This cannot be undone.')) {
      updateTheme(defaultThemeConfig);
      toast.success('Theme reset to defaults');
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold">Theme Builder</h1>
            <p className="text-muted-foreground mt-1">
              Customize your store's visual appearance
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {isDirty && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Unsaved Changes
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={toggleDarkMode}>
              {isDarkMode ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {isDarkMode ? 'Light' : 'Dark'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={resetTheme} disabled={!isDirty}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Undo
            </Button>
            <Button onClick={handleSave} disabled={!isDirty || saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Theme
            </Button>
          </div>
        </div>

        <Tabs defaultValue="colors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-5">
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Colors</span>
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              <span className="hidden sm:inline">Typography</span>
            </TabsTrigger>
            <TabsTrigger value="spacing" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              <span className="hidden sm:inline">Spacing</span>
            </TabsTrigger>
            <TabsTrigger value="components" className="flex items-center gap-2">
              <Square className="h-4 w-4" />
              <span className="hidden sm:inline">Components</span>
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced</span>
            </TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-6">
            {/* Mode Selector */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Color Mode</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={activeColorMode === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveColorMode('light')}
                    >
                      <Sun className="h-4 w-4 mr-2" />
                      Light
                    </Button>
                    <Button
                      variant={activeColorMode === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setActiveColorMode('dark')}
                    >
                      <Moon className="h-4 w-4 mr-2" />
                      Dark
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  Configure colors for {activeColorMode} mode
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Primary Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Brand Colors</CardTitle>
                <CardDescription>Your main brand colors used throughout the site</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <ColorPicker
                  label="Primary"
                  description="Main brand color"
                  color={activeColors.primary}
                  onChange={(c) => handleColorChange('primary', c)}
                />
                <ColorPicker
                  label="Secondary"
                  description="Supporting brand color"
                  color={activeColors.secondary}
                  onChange={(c) => handleColorChange('secondary', c)}
                />
                <ColorPicker
                  label="Accent"
                  description="Highlight color"
                  color={activeColors.accent}
                  onChange={(c) => handleColorChange('accent', c)}
                />
              </CardContent>
            </Card>

            {/* Background Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Background & Surface</CardTitle>
                <CardDescription>Page and component backgrounds</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <ColorPicker
                  label="Background"
                  description="Main page background"
                  color={activeColors.background}
                  onChange={(c) => handleColorChange('background', c)}
                />
                <ColorPicker
                  label="Card"
                  description="Card backgrounds"
                  color={activeColors.card}
                  onChange={(c) => handleColorChange('card', c)}
                />
                <ColorPicker
                  label="Muted"
                  description="Subtle backgrounds"
                  color={activeColors.muted}
                  onChange={(c) => handleColorChange('muted', c)}
                />
              </CardContent>
            </Card>

            {/* Text Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Text Colors</CardTitle>
                <CardDescription>Typography colors with contrast checking</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <ColorPicker
                    label="Foreground"
                    description="Main text color"
                    color={activeColors.foreground}
                    onChange={(c) => handleColorChange('foreground', c)}
                  />
                  <ColorPicker
                    label="Card Foreground"
                    description="Text on cards"
                    color={activeColors.cardForeground}
                    onChange={(c) => handleColorChange('cardForeground', c)}
                  />
                  <ColorPicker
                    label="Muted Foreground"
                    description="Secondary text"
                    color={activeColors.mutedForeground}
                    onChange={(c) => handleColorChange('mutedForeground', c)}
                  />
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Contrast Check</h4>
                  <div className="flex gap-4 flex-wrap">
                    <ContrastChecker foreground={activeColors.foreground} background={activeColors.background} />
                    <ContrastChecker foreground={activeColors.cardForeground} background={activeColors.card} />
                    <ContrastChecker foreground={activeColors.mutedForeground} background={activeColors.muted} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Colors */}
            <Card>
              <CardHeader>
                <CardTitle>Status Colors</CardTitle>
                <CardDescription>Feedback and notification colors</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <ColorPicker
                  label="Success"
                  color={activeColors.success}
                  onChange={(c) => handleColorChange('success', c)}
                />
                <ColorPicker
                  label="Warning"
                  color={activeColors.warning}
                  onChange={(c) => handleColorChange('warning', c)}
                />
                <ColorPicker
                  label="Destructive"
                  color={activeColors.destructive}
                  onChange={(c) => handleColorChange('destructive', c)}
                />
                <ColorPicker
                  label="Info"
                  color={activeColors.info}
                  onChange={(c) => handleColorChange('info', c)}
                />
              </CardContent>
            </Card>

            {/* Border & Input */}
            <Card>
              <CardHeader>
                <CardTitle>Borders & Inputs</CardTitle>
                <CardDescription>Form and UI element styling</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-3">
                <ColorPicker
                  label="Border"
                  color={activeColors.border}
                  onChange={(c) => handleColorChange('border', c)}
                />
                <ColorPicker
                  label="Input"
                  color={activeColors.input}
                  onChange={(c) => handleColorChange('input', c)}
                />
                <ColorPicker
                  label="Ring"
                  description="Focus ring"
                  color={activeColors.ring}
                  onChange={(c) => handleColorChange('ring', c)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Font Families</CardTitle>
                <CardDescription>Choose fonts from Google Fonts</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Heading Font</Label>
                  <Select
                    value={theme.typography.headingFont}
                    onValueChange={(v) => updateTheme({ typography: { ...theme.typography, headingFont: v } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {popularFonts.map((font) => (
                        <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p
                    className="text-2xl font-bold mt-2"
                    style={{ fontFamily: theme.typography.headingFont }}
                  >
                    Heading Preview
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Body Font</Label>
                  <Select
                    value={theme.typography.bodyFont}
                    onValueChange={(v) => updateTheme({ typography: { ...theme.typography, bodyFont: v } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {popularFonts.map((font) => (
                        <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                          {font}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="mt-2" style={{ fontFamily: theme.typography.bodyFont }}>
                    Body text preview with the selected font family.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Monospace Font</Label>
                  <Select
                    value={theme.typography.monoFont}
                    onValueChange={(v) => updateTheme({ typography: { ...theme.typography, monoFont: v } })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="JetBrains Mono">JetBrains Mono</SelectItem>
                      <SelectItem value="Fira Code">Fira Code</SelectItem>
                      <SelectItem value="Source Code Pro">Source Code Pro</SelectItem>
                      <SelectItem value="IBM Plex Mono">IBM Plex Mono</SelectItem>
                    </SelectContent>
                  </Select>
                  <code
                    className="block mt-2 text-sm"
                    style={{ fontFamily: theme.typography.monoFont }}
                  >
                    const code = "preview";
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Typography Scale</CardTitle>
                <CardDescription>Font sizes, weights, and spacing</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Base Font Size (px)</Label>
                  <Input
                    type="number"
                    min={12}
                    max={20}
                    value={theme.typography.baseFontSize}
                    onChange={(e) =>
                      updateTheme({ typography: { ...theme.typography, baseFontSize: Number(e.target.value) } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heading Weight</Label>
                  <Select
                    value={String(theme.typography.headingWeight)}
                    onValueChange={(v) =>
                      updateTheme({ typography: { ...theme.typography, headingWeight: Number(v) } })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="400">400 - Regular</SelectItem>
                      <SelectItem value="500">500 - Medium</SelectItem>
                      <SelectItem value="600">600 - Semibold</SelectItem>
                      <SelectItem value="700">700 - Bold</SelectItem>
                      <SelectItem value="800">800 - Extra Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Line Height</Label>
                  <Input
                    type="number"
                    min={1}
                    max={2}
                    step={0.1}
                    value={theme.typography.lineHeight}
                    onChange={(e) =>
                      updateTheme({ typography: { ...theme.typography, lineHeight: Number(e.target.value) } })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Letter Spacing (em)</Label>
                  <Input
                    type="number"
                    min={-0.1}
                    max={0.2}
                    step={0.01}
                    value={theme.typography.letterSpacing}
                    onChange={(e) =>
                      updateTheme({ typography: { ...theme.typography, letterSpacing: Number(e.target.value) } })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Spacing Tab */}
          <TabsContent value="spacing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Border Radius</CardTitle>
                <CardDescription>Corner rounding for UI elements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-6 gap-4">
                  {(['none', 'sm', 'md', 'lg', 'xl', 'full'] as SpacingConfig['borderRadius'][]).map((size) => (
                    <button
                      key={size}
                      onClick={() => updateTheme({ spacing: { ...theme.spacing, borderRadius: size } })}
                      className={`p-4 border-2 rounded transition-all ${
                        theme.spacing.borderRadius === size
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div
                        className="w-full aspect-square bg-primary"
                        style={{
                          borderRadius:
                            size === 'none' ? '0' :
                            size === 'sm' ? '4px' :
                            size === 'md' ? '8px' :
                            size === 'lg' ? '12px' :
                            size === 'xl' ? '16px' : '9999px',
                        }}
                      />
                      <p className="text-xs mt-2 text-center font-medium">{size}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Shadows</CardTitle>
                <CardDescription>Shadow depth for elevated elements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-4">
                  {(['none', 'sm', 'md', 'lg', 'xl'] as SpacingConfig['shadowIntensity'][]).map((size) => (
                    <button
                      key={size}
                      onClick={() => updateTheme({ spacing: { ...theme.spacing, shadowIntensity: size } })}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        theme.spacing.shadowIntensity === size
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div
                        className="w-full aspect-square bg-card rounded-lg"
                        style={{
                          boxShadow:
                            size === 'none' ? 'none' :
                            size === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' :
                            size === 'md' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' :
                            size === 'lg' ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' :
                            '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                        }}
                      />
                      <p className="text-xs mt-2 text-center font-medium">{size}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Layout</CardTitle>
                <CardDescription>Container and grid settings</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Container Max Width (px)</Label>
                  <Input
                    type="number"
                    min={960}
                    max={1920}
                    step={40}
                    value={theme.spacing.containerMaxWidth}
                    onChange={(e) =>
                      updateTheme({ spacing: { ...theme.spacing, containerMaxWidth: Number(e.target.value) } })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Recommended: 1200-1400px for most stores
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Grid Gap (px)</Label>
                  <Input
                    type="number"
                    min={8}
                    max={48}
                    step={4}
                    value={theme.spacing.gridGap}
                    onChange={(e) =>
                      updateTheme({ spacing: { ...theme.spacing, gridGap: Number(e.target.value) } })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Space between grid items
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Button Styles</CardTitle>
                <CardDescription>Customize button appearance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Border Radius (px)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      value={theme.buttons.primary.borderRadius}
                      onChange={(e) =>
                        updateTheme({
                          buttons: {
                            ...theme.buttons,
                            primary: { ...theme.buttons.primary, borderRadius: Number(e.target.value) },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Horizontal Padding (px)</Label>
                    <Input
                      type="number"
                      min={8}
                      max={32}
                      value={theme.buttons.primary.paddingX}
                      onChange={(e) =>
                        updateTheme({
                          buttons: {
                            ...theme.buttons,
                            primary: { ...theme.buttons.primary, paddingX: Number(e.target.value) },
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Font Weight</Label>
                    <Select
                      value={String(theme.buttons.primary.fontWeight)}
                      onValueChange={(v) =>
                        updateTheme({
                          buttons: {
                            ...theme.buttons,
                            primary: { ...theme.buttons.primary, fontWeight: Number(v) },
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="400">400 - Regular</SelectItem>
                        <SelectItem value="500">500 - Medium</SelectItem>
                        <SelectItem value="600">600 - Semibold</SelectItem>
                        <SelectItem value="700">700 - Bold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Text Transform</Label>
                    <Select
                      value={theme.buttons.primary.textTransform}
                      onValueChange={(v: 'none' | 'uppercase' | 'capitalize') =>
                        updateTheme({
                          buttons: {
                            ...theme.buttons,
                            primary: { ...theme.buttons.primary, textTransform: v },
                          },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="uppercase">UPPERCASE</SelectItem>
                        <SelectItem value="capitalize">Capitalize</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Preview</h4>
                  <div className="flex gap-3 flex-wrap">
                    <Button
                      style={{
                        borderRadius: theme.buttons.primary.borderRadius,
                        paddingLeft: theme.buttons.primary.paddingX,
                        paddingRight: theme.buttons.primary.paddingX,
                        fontWeight: theme.buttons.primary.fontWeight,
                        textTransform: theme.buttons.primary.textTransform,
                      }}
                    >
                      Primary Button
                    </Button>
                    <Button
                      variant="secondary"
                      style={{
                        borderRadius: theme.buttons.primary.borderRadius,
                        paddingLeft: theme.buttons.primary.paddingX,
                        paddingRight: theme.buttons.primary.paddingX,
                      }}
                    >
                      Secondary
                    </Button>
                    <Button
                      variant="outline"
                      style={{
                        borderRadius: theme.buttons.primary.borderRadius,
                        paddingLeft: theme.buttons.primary.paddingX,
                        paddingRight: theme.buttons.primary.paddingX,
                      }}
                    >
                      Outline
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Card Styles</CardTitle>
                <CardDescription>Product and content cards</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Border Radius (px)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={24}
                      value={theme.cards.borderRadius}
                      onChange={(e) =>
                        updateTheme({ cards: { ...theme.cards, borderRadius: Number(e.target.value) } })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shadow</Label>
                    <Select
                      value={theme.cards.shadow}
                      onValueChange={(v: 'none' | 'sm' | 'md' | 'lg' | 'xl') =>
                        updateTheme({ cards: { ...theme.cards, shadow: v } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="sm">Small</SelectItem>
                        <SelectItem value="md">Medium</SelectItem>
                        <SelectItem value="lg">Large</SelectItem>
                        <SelectItem value="xl">Extra Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Border Width (px)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={4}
                      value={theme.cards.borderWidth}
                      onChange={(e) =>
                        updateTheme({ cards: { ...theme.cards, borderWidth: Number(e.target.value) } })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hover Effect</Label>
                    <Select
                      value={theme.cards.hoverEffect}
                      onValueChange={(v: 'none' | 'lift' | 'glow' | 'border') =>
                        updateTheme({ cards: { ...theme.cards, hoverEffect: v } })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="lift">Lift</SelectItem>
                        <SelectItem value="glow">Glow</SelectItem>
                        <SelectItem value="border">Border Highlight</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom CSS</CardTitle>
                <CardDescription>Add custom CSS to override default styles</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={theme.customCss}
                  onChange={(e) => updateTheme({ customCss: e.target.value })}
                  placeholder="/* Your custom CSS here */
.my-custom-class {
  color: red;
}"
                  rows={12}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Use with caution. Invalid CSS may break your site's appearance.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reset Theme</CardTitle>
                <CardDescription>Reset all settings to defaults</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive" onClick={handleReset}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default Theme
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
