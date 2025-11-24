import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle } from 'lucide-react';

interface ProductVariant {
  id: string;
  variant_name: string;
  flavor: string | null;
  nicotine_strength: string | null;
  size: string | null;
  color: string | null;
  price_adjustment: number;
  stock_quantity: number;
  is_active: boolean;
  is_default: boolean;
}

interface ProductVariantSelectorProps {
  productId: string;
  basePrice: number;
  onVariantChange: (variant: ProductVariant | null) => void;
}

export default function ProductVariantSelector({
  productId,
  basePrice,
  onVariantChange,
}: ProductVariantSelectorProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);

  // Extract unique option types
  const [flavors, setFlavors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [nicotineStrengths, setNicotineStrengths] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);

  // Selected options
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedNicotine, setSelectedNicotine] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');

  useEffect(() => {
    loadVariants();
  }, [productId]);

  useEffect(() => {
    // Find matching variant based on selected options
    if (variants.length > 0) {
      const match = variants.find((v) => {
        return (
          (selectedFlavor === '' || v.flavor === selectedFlavor) &&
          (selectedSize === '' || v.size === selectedSize) &&
          (selectedNicotine === '' || v.nicotine_strength === selectedNicotine) &&
          (selectedColor === '' || v.color === selectedColor)
        );
      });

      setSelectedVariant(match || null);
      onVariantChange(match || null);
    }
  }, [selectedFlavor, selectedSize, selectedNicotine, selectedColor, variants]);

  const loadVariants = async () => {
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productId)
      .eq('is_active', true);

    if (!error && data) {
      setVariants(data);

      // Extract unique options
      const uniqueFlavors = [...new Set(data.map((v) => v.flavor).filter(Boolean))] as string[];
      const uniqueSizes = [...new Set(data.map((v) => v.size).filter(Boolean))] as string[];
      const uniqueNicotine = [...new Set(data.map((v) => v.nicotine_strength).filter(Boolean))] as string[];
      const uniqueColors = [...new Set(data.map((v) => v.color).filter(Boolean))] as string[];

      setFlavors(uniqueFlavors);
      setSizes(uniqueSizes);
      setNicotineStrengths(uniqueNicotine);
      setColors(uniqueColors);

      // Set default variant if exists
      const defaultVariant = data.find((v) => v.is_default);
      if (defaultVariant) {
        if (defaultVariant.flavor) setSelectedFlavor(defaultVariant.flavor);
        if (defaultVariant.size) setSelectedSize(defaultVariant.size);
        if (defaultVariant.nicotine_strength) setSelectedNicotine(defaultVariant.nicotine_strength);
        if (defaultVariant.color) setSelectedColor(defaultVariant.color);
      } else if (data.length > 0) {
        // Select first variant's options
        const first = data[0];
        if (first.flavor) setSelectedFlavor(first.flavor);
        if (first.size) setSelectedSize(first.size);
        if (first.nicotine_strength) setSelectedNicotine(first.nicotine_strength);
        if (first.color) setSelectedColor(first.color);
      }
    }

    setLoading(false);
  };

  const getFinalPrice = () => {
    if (selectedVariant) {
      return basePrice + selectedVariant.price_adjustment;
    }
    return basePrice;
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading options...</p>;
  }

  if (variants.length === 0) {
    return null; // No variants, use standard product interface
  }

  return (
    <div className="space-y-4">
      {/* Price Display */}
      <div>
        <span className="text-4xl font-bold text-primary">
          R {getFinalPrice().toFixed(2)}
        </span>
        {selectedVariant && selectedVariant.price_adjustment !== 0 && (
          <span className="text-sm text-muted-foreground ml-2">
            ({selectedVariant.price_adjustment > 0 ? '+' : ''}R {selectedVariant.price_adjustment.toFixed(2)})
          </span>
        )}
      </div>

      {/* Flavor Selection */}
      {flavors.length > 0 && (
        <div>
          <label className="text-sm font-semibold mb-2 block">Flavor</label>
          <div className="flex flex-wrap gap-2">
            {flavors.map((flavor) => (
              <Button
                key={flavor}
                variant={selectedFlavor === flavor ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFlavor(flavor)}
              >
                {flavor}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {sizes.length > 0 && (
        <div>
          <label className="text-sm font-semibold mb-2 block">Size</label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <Button
                key={size}
                variant={selectedSize === size ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Nicotine Strength Selection */}
      {nicotineStrengths.length > 0 && (
        <div>
          <label className="text-sm font-semibold mb-2 block">Nicotine Strength</label>
          <Select value={selectedNicotine} onValueChange={setSelectedNicotine}>
            <SelectTrigger>
              <SelectValue placeholder="Select nicotine strength" />
            </SelectTrigger>
            <SelectContent>
              {nicotineStrengths.map((strength) => (
                <SelectItem key={strength} value={strength}>
                  {strength}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Color Selection */}
      {colors.length > 0 && (
        <div>
          <label className="text-sm font-semibold mb-2 block">Color</label>
          <div className="flex flex-wrap gap-2">
            {colors.map((color) => (
              <Button
                key={color}
                variant={selectedColor === color ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedColor(color)}
              >
                {color}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Stock Status */}
      {selectedVariant && (
        <div className="flex items-center gap-2">
          {selectedVariant.stock_quantity > 0 ? (
            <Badge variant="default" className="bg-green-600">
              In Stock ({selectedVariant.stock_quantity} available)
            </Badge>
          ) : (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Out of Stock
            </Badge>
          )}
        </div>
      )}

      {/* Variant Name/Description */}
      {selectedVariant && (
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium">{selectedVariant.variant_name}</p>
          {selectedVariant.stock_quantity === 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              This variant is currently out of stock
            </p>
          )}
        </div>
      )}
    </div>
  );
}
