import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  Loader2,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Mail,
  Share2,
  Globe,
  Sparkles,
  Download,
  ExternalLink,
} from 'lucide-react';
import { BrandAsset } from '@/types/theme';

interface AssetConfig {
  type: BrandAsset['type'];
  label: string;
  description: string;
  icon: React.ReactNode;
  recommended: string;
  acceptTypes: string;
  maxSize: number; // in KB
}

const assetConfigs: AssetConfig[] = [
  {
    type: 'logo-primary',
    label: 'Primary Logo',
    description: 'Main logo displayed in header (light backgrounds)',
    icon: <Monitor className="h-5 w-5" />,
    recommended: '300x80px, transparent PNG or SVG',
    acceptTypes: '.svg,.png,.webp',
    maxSize: 500,
  },
  {
    type: 'logo-inverted',
    label: 'Inverted Logo',
    description: 'Logo for dark backgrounds (footer, dark mode)',
    icon: <Moon className="h-5 w-5" />,
    recommended: '300x80px, transparent PNG or SVG',
    acceptTypes: '.svg,.png,.webp',
    maxSize: 500,
  },
  {
    type: 'logo-mobile',
    label: 'Mobile Logo',
    description: 'Compact logo for mobile header',
    icon: <Smartphone className="h-5 w-5" />,
    recommended: '80x80px square, transparent PNG',
    acceptTypes: '.svg,.png,.webp',
    maxSize: 200,
  },
  {
    type: 'favicon',
    label: 'Favicon',
    description: 'Browser tab icon',
    icon: <Globe className="h-5 w-5" />,
    recommended: '512x512px square PNG (will generate all sizes)',
    acceptTypes: '.png,.ico,.svg',
    maxSize: 100,
  },
  {
    type: 'og-image',
    label: 'Social Share Image',
    description: 'Default image when sharing on social media',
    icon: <Share2 className="h-5 w-5" />,
    recommended: '1200x630px JPEG or PNG',
    acceptTypes: '.jpg,.jpeg,.png,.webp',
    maxSize: 1000,
  },
  {
    type: 'email-header',
    label: 'Email Header',
    description: 'Logo for transactional emails',
    icon: <Mail className="h-5 w-5" />,
    recommended: '600x150px, max 100KB for email clients',
    acceptTypes: '.png,.jpg,.jpeg',
    maxSize: 100,
  },
  {
    type: 'loading-logo',
    label: 'Loading Logo',
    description: 'Animated or static logo for loading screens',
    icon: <Sparkles className="h-5 w-5" />,
    recommended: '200x200px, PNG or animated GIF',
    acceptTypes: '.png,.gif,.svg,.webp',
    maxSize: 500,
  },
];

interface AssetUploaderProps {
  config: AssetConfig;
  currentAsset: BrandAsset | null;
  onUpload: (url: string) => Promise<void>;
  onRemove: () => Promise<void>;
}

function AssetUploader({ config, currentAsset, onUpload, onRemove }: AssetUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file size
    if (file.size > config.maxSize * 1024) {
      toast.error(`File size must be under ${config.maxSize}KB`);
      return;
    }

    setUploading(true);
    try {
      // Upload to Supabase Storage
      const fileName = `${config.type}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data, error } = await supabase.storage
        .from('brand-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(data.path);

      await onUpload(publicUrl);
      toast.success(`${config.label} uploaded successfully!`);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleRemove = async () => {
    if (!confirm(`Remove ${config.label}?`)) return;
    try {
      await onRemove();
      toast.success(`${config.label} removed`);
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  return (
    <Card className={dragOver ? 'ring-2 ring-primary' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {config.icon}
            </div>
            <div>
              <CardTitle className="text-base">{config.label}</CardTitle>
              <CardDescription className="text-xs">{config.description}</CardDescription>
            </div>
          </div>
          {currentAsset && (
            <Badge variant="secondary" className="bg-success/10 text-success">
              Uploaded
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview */}
        <div
          className={`border-2 border-dashed rounded-lg p-4 transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {currentAsset?.imageUrl ? (
            <div className="relative group">
              <div className="aspect-video flex items-center justify-center bg-muted/30 rounded overflow-hidden">
                <img
                  src={currentAsset.imageUrl}
                  alt={config.label}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 rounded">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open(currentAsset.imageUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleRemove}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                <ImageIcon className="h-8 w-8" />
              )}
              <span className="text-sm">
                {uploading ? 'Uploading...' : 'Click or drag to upload'}
              </span>
            </button>
          )}
        </div>

        {/* File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={config.acceptTypes}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="hidden"
        />

        {/* Guidelines */}
        <div className="text-xs text-muted-foreground">
          <p>Recommended: {config.recommended}</p>
          <p>Max size: {config.maxSize}KB</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Branding() {
  const { brandAssets, getBrandAsset, updateBrandAsset, loadBrandAssets } = useTheme();

  const handleUpload = async (type: BrandAsset['type'], url: string) => {
    await updateBrandAsset(type, url);
  };

  const handleRemove = async (type: BrandAsset['type']) => {
    // Note: This sets the URL to empty, effectively "removing" it
    // In a real app, you might also delete from storage
    await updateBrandAsset(type, '');
    await loadBrandAssets();
  };

  const uploadedCount = brandAssets.filter((a) => a.imageUrl).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold">Branding</h1>
            <p className="text-muted-foreground mt-1">
              Manage your store's logos and brand assets
            </p>
          </div>
          <Badge variant="secondary">
            <ImageIcon className="h-3 w-3 mr-1" />
            {uploadedCount}/{assetConfigs.length} Assets
          </Badge>
        </div>

        {/* Info Banner */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Brand Consistency</h3>
                <p className="text-sm text-muted-foreground">
                  Upload all logo variations to ensure your brand looks great everywhere -
                  from browser tabs to social shares to email receipts.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Primary Logos */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Logos</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assetConfigs
              .filter((c) => c.type.includes('logo'))
              .map((config) => (
                <AssetUploader
                  key={config.type}
                  config={config}
                  currentAsset={getBrandAsset(config.type)}
                  onUpload={(url) => handleUpload(config.type, url)}
                  onRemove={() => handleRemove(config.type)}
                />
              ))}
          </div>
        </div>

        <Separator />

        {/* Other Assets */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Other Brand Assets</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assetConfigs
              .filter((c) => !c.type.includes('logo'))
              .map((config) => (
                <AssetUploader
                  key={config.type}
                  config={config}
                  currentAsset={getBrandAsset(config.type)}
                  onUpload={(url) => handleUpload(config.type, url)}
                  onRemove={() => handleRemove(config.type)}
                />
              ))}
          </div>
        </div>

        {/* Usage Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Where Your Assets Are Used</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Monitor className="h-4 w-4 text-primary" />
                  <span className="font-medium">Primary Logo</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Website header</li>
                  <li>• Invoice headers</li>
                  <li>• Login pages</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Moon className="h-4 w-4 text-primary" />
                  <span className="font-medium">Inverted Logo</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Website footer</li>
                  <li>• Dark mode header</li>
                  <li>• Dark-themed emails</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <span className="font-medium">Mobile Logo</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Mobile header</li>
                  <li>• PWA app icon</li>
                  <li>• Compact displays</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="h-4 w-4 text-primary" />
                  <span className="font-medium">Favicon</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Browser tabs</li>
                  <li>• Bookmarks</li>
                  <li>• Home screen icons</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Share2 className="h-4 w-4 text-primary" />
                  <span className="font-medium">Social Image</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Facebook shares</li>
                  <li>• Twitter cards</li>
                  <li>• LinkedIn posts</li>
                </ul>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-primary" />
                  <span className="font-medium">Email Header</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Order confirmations</li>
                  <li>• Shipping updates</li>
                  <li>• Marketing emails</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
