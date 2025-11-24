import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Upload,
  Trash2,
  RotateCcw,
  Search,
  Loader2,
  ImageIcon,
  FolderTree,
  Navigation,
  MousePointerClick,
  Share2,
  AlertCircle,
  Award,
  X,
} from 'lucide-react';
import { iconSlots, IconType } from '@/types/theme';
import { DynamicIcon } from '@/components/DynamicIcon';

const iconTypeConfig: Record<IconType, { label: string; icon: React.ReactNode; description: string }> = {
  category: {
    label: 'Categories',
    icon: <FolderTree className="h-4 w-4" />,
    description: 'Product category icons displayed in navigation and filters',
  },
  navigation: {
    label: 'Navigation',
    icon: <Navigation className="h-4 w-4" />,
    description: 'Header, footer, and menu navigation icons',
  },
  action: {
    label: 'Actions',
    icon: <MousePointerClick className="h-4 w-4" />,
    description: 'Interactive buttons like add to cart, wishlist, etc.',
  },
  social: {
    label: 'Social',
    icon: <Share2 className="h-4 w-4" />,
    description: 'Social media platform icons',
  },
  status: {
    label: 'Status',
    icon: <AlertCircle className="h-4 w-4" />,
    description: 'Feedback icons for success, error, warning, info',
  },
  feature: {
    label: 'Features',
    icon: <Award className="h-4 w-4" />,
    description: 'Trust badges and feature highlights',
  },
};

interface IconEditorProps {
  iconName: string;
  label: string;
  fallback: string;
  onClose: () => void;
}

function IconEditor({ iconName, label, fallback, onClose }: IconEditorProps) {
  const { getIcon, updateIcon } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentIcon = getIcon(iconName);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/svg+xml', 'image/png', 'image/webp', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload SVG, PNG, WebP, or JPEG files');
      return;
    }

    // Validate file size (max 500KB)
    if (file.size > 500 * 1024) {
      toast.error('File size must be under 500KB');
      return;
    }

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileName = `${iconName}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('icons')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('icons')
        .getPublicUrl(data.path);

      // Update icon in registry
      await updateIcon(iconName, publicUrl);
      setPreviewUrl(publicUrl);
      toast.success('Icon uploaded successfully!');
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload icon');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      await updateIcon(iconName, null);
      setPreviewUrl(null);
      toast.success('Custom icon removed');
    } catch (error) {
      toast.error('Failed to remove icon');
    }
  };

  const displayUrl = previewUrl || currentIcon?.imageUrl;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        {/* Current Icon Display */}
        <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={label}
              className="w-16 h-16 object-contain"
            />
          ) : (
            <DynamicIcon name={iconName} size={48} fallback={fallback} />
          )}
        </div>

        <div className="flex-1">
          <h3 className="font-semibold">{label}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {displayUrl ? 'Custom icon uploaded' : `Using default: ${fallback}`}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Upload
            </Button>
            {displayUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemove}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,.png,.webp,.jpg,.jpeg"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Size Previews */}
      <div>
        <Label className="text-xs text-muted-foreground">Preview at different sizes</Label>
        <div className="flex items-end gap-4 mt-2 p-4 bg-muted/30 rounded-lg">
          {[16, 24, 32, 48, 64].map((size) => (
            <div key={size} className="flex flex-col items-center gap-1">
              <div
                className="flex items-center justify-center border rounded bg-background"
                style={{ width: size + 8, height: size + 8 }}
              >
                {displayUrl ? (
                  <img
                    src={displayUrl}
                    alt=""
                    style={{ width: size, height: size }}
                    className="object-contain"
                  />
                ) : (
                  <DynamicIcon name={iconName} size={size} fallback={fallback} />
                )}
              </div>
              <span className="text-[10px] text-muted-foreground">{size}px</span>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Guidelines */}
      <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/30 rounded-lg">
        <p className="font-medium">Upload Guidelines:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Formats: SVG (recommended), PNG, WebP, JPEG</li>
          <li>Max size: 500KB</li>
          <li>Recommended: Square images, 64x64px or larger</li>
          <li>SVG icons can adapt to theme colors</li>
        </ul>
      </div>
    </div>
  );
}

export default function CustomIcons() {
  const { icons, getIcon } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<{
    name: string;
    label: string;
    fallback: string;
  } | null>(null);

  // Group icons by type
  const groupedIcons = iconSlots.reduce((acc, slot) => {
    if (!acc[slot.type]) {
      acc[slot.type] = [];
    }
    acc[slot.type].push(slot);
    return acc;
  }, {} as Record<IconType, typeof iconSlots>);

  // Filter icons by search
  const filterIcons = (slots: typeof iconSlots) => {
    if (!searchQuery) return slots;
    const query = searchQuery.toLowerCase();
    return slots.filter(
      (slot) =>
        slot.name.toLowerCase().includes(query) ||
        slot.label.toLowerCase().includes(query)
    );
  };

  // Count custom icons
  const customIconCount = Object.values(icons).filter((icon) => icon?.imageUrl).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold">Custom Icons</h1>
            <p className="text-muted-foreground mt-1">
              Replace system icons with your own images
            </p>
          </div>
          <Badge variant="secondary">
            <ImageIcon className="h-3 w-3 mr-1" />
            {customIconCount} Custom Icons
          </Badge>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Icon Grid by Type */}
        <Tabs defaultValue="category" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {(Object.keys(iconTypeConfig) as IconType[]).map((type) => (
              <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                {iconTypeConfig[type].icon}
                <span className="hidden sm:inline">{iconTypeConfig[type].label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(iconTypeConfig) as IconType[]).map((type) => {
            const typeIcons = filterIcons(groupedIcons[type] || []);

            return (
              <TabsContent key={type} value={type}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {iconTypeConfig[type].icon}
                      {iconTypeConfig[type].label}
                    </CardTitle>
                    <CardDescription>{iconTypeConfig[type].description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {typeIcons.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No icons found matching "{searchQuery}"</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {typeIcons.map((slot) => {
                          const customIcon = getIcon(slot.name);
                          const hasCustom = !!customIcon?.imageUrl;

                          return (
                            <Dialog
                              key={slot.name}
                              open={selectedIcon?.name === slot.name}
                              onOpenChange={(open) => {
                                if (open) {
                                  setSelectedIcon({
                                    name: slot.name,
                                    label: slot.label,
                                    fallback: slot.fallback,
                                  });
                                } else {
                                  setSelectedIcon(null);
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <button
                                  className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-all hover:border-primary hover:bg-primary/5 ${
                                    hasCustom ? 'border-primary/50 bg-primary/5' : ''
                                  }`}
                                >
                                  <div className="relative">
                                    <div className="w-12 h-12 flex items-center justify-center">
                                      {hasCustom ? (
                                        <img
                                          src={customIcon.imageUrl!}
                                          alt={slot.label}
                                          className="w-10 h-10 object-contain"
                                        />
                                      ) : (
                                        <DynamicIcon
                                          name={slot.name}
                                          size={40}
                                          fallback={slot.fallback}
                                        />
                                      )}
                                    </div>
                                    {hasCustom && (
                                      <Badge
                                        variant="secondary"
                                        className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center bg-primary text-primary-foreground"
                                      >
                                        <ImageIcon className="h-2 w-2" />
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="text-xs text-center text-muted-foreground">
                                    {slot.label}
                                  </span>
                                </button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Icon: {slot.label}</DialogTitle>
                                </DialogHeader>
                                {selectedIcon && (
                                  <IconEditor
                                    iconName={selectedIcon.name}
                                    label={selectedIcon.label}
                                    fallback={selectedIcon.fallback}
                                    onClose={() => setSelectedIcon(null)}
                                  />
                                )}
                              </DialogContent>
                            </Dialog>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How Custom Icons Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Upload</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload your custom icon image (SVG, PNG, WebP)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Replace</h4>
                  <p className="text-sm text-muted-foreground">
                    Your image replaces the default system icon
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <RotateCcw className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Reset</h4>
                  <p className="text-sm text-muted-foreground">
                    Easily revert to the default icon anytime
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
