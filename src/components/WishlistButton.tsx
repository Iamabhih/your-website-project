import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/hooks/useWishlist';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  productId: string;
  variantId?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  iconOnly?: boolean;
}

export default function WishlistButton({
  productId,
  variantId,
  size = 'icon',
  variant = 'outline',
  className,
  iconOnly = true,
}: WishlistButtonProps) {
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const inWishlist = isInWishlist(productId, variantId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inWishlist) {
      removeFromWishlist(productId, variantId);
    } else {
      addToWishlist(productId, variantId);
    }
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleClick}
      className={cn(className)}
      title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={cn(
          'h-5 w-5',
          inWishlist && 'fill-red-500 text-red-500',
          !iconOnly && 'mr-2'
        )}
      />
      {!iconOnly && (inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist')}
    </Button>
  );
}
