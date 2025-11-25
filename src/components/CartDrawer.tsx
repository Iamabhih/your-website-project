import { useState } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Package,
  Tag,
  Truck,
  Shield,
  Clock,
  Heart,
  Share2,
  Save,
  MoreVertical,
  Edit3,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const FREE_SHIPPING_THRESHOLD = 500; // R500 for free shipping

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const {
    items,
    savedCarts,
    metadata,
    removeItem,
    updateQuantity,
    updateItemNotes,
    clearCart,
    getTotalPrice,
    getTotalItems,
    getTotalSavings,
    saveCartForLater,
    loadSavedCart,
    deleteSavedCart,
    getShareableCart,
  } = useCartStore();

  const { data: storeSettings } = useStoreSettings();
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveCartName, setSaveCartName] = useState('');
  const [showSavedCarts, setShowSavedCarts] = useState(false);

  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);
  const totalSavings = getTotalSavings();
  const couponDiscount = metadata.couponDiscount || 0;
  const freeShippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const handleQuantityChange = (item: CartItem, delta: number) => {
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      removeItem(item.id);
    } else {
      updateQuantity(item.id, newQty);
    }
  };

  const handleDirectQuantityInput = (item: CartItem, value: string) => {
    const qty = parseInt(value, 10);
    if (!isNaN(qty) && qty > 0) {
      updateQuantity(item.id, qty);
    }
  };

  const handleSaveNotes = (itemId: string) => {
    updateItemNotes(itemId, noteText);
    setEditingNotes(null);
    setNoteText('');
    toast.success('Notes saved');
  };

  const handleSaveCart = () => {
    if (saveCartName.trim()) {
      saveCartForLater(saveCartName.trim());
      toast.success('Cart saved for later');
      setSaveCartName('');
      setShowSaveDialog(false);
    }
  };

  const handleShareCart = () => {
    const shareCode = getShareableCart();
    const shareUrl = `${window.location.origin}/shop?cart=${shareCode}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Cart link copied to clipboard');
  };

  const handleClearCart = () => {
    clearCart();
    setShowClearConfirm(false);
    toast.success('Cart cleared');
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
          {/* Header */}
          <SheetHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-xl">Shopping Cart</SheetTitle>
                  {items.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
                    </p>
                  )}
                </div>
              </div>
              {items.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setShowSaveDialog(true)}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Cart for Later
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleShareCart}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share Cart
                    </DropdownMenuItem>
                    {savedCarts.length > 0 && (
                      <DropdownMenuItem onClick={() => setShowSavedCarts(true)}>
                        <Heart className="mr-2 h-4 w-4" />
                        Load Saved Cart ({savedCarts.length})
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowClearConfirm(true)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Clear Cart
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </SheetHeader>

          {/* Free Shipping Progress */}
          {items.length > 0 && subtotal < FREE_SHIPPING_THRESHOLD && (
            <div className="px-6 py-3 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-primary" />
                <span className="text-sm">
                  Add <strong>R{amountToFreeShipping.toFixed(2)}</strong> more for free shipping
                </span>
              </div>
              <Progress value={freeShippingProgress} className="h-2" />
            </div>
          )}

          {items.length > 0 && subtotal >= FREE_SHIPPING_THRESHOLD && (
            <div className="px-6 py-3 bg-success/10 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-sm text-success font-medium">
                You qualify for free shipping!
              </span>
            </div>
          )}

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Your cart is empty</h3>
                <p className="text-muted-foreground mb-6 text-sm max-w-xs">
                  Discover amazing products and add them to your cart
                </p>
                <Link to="/shop" onClick={onClose}>
                  <Button className="gap-2">
                    Start Shopping
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>

                {savedCarts.length > 0 && (
                  <div className="mt-8 w-full">
                    <Separator className="mb-4" />
                    <p className="text-sm text-muted-foreground mb-3">
                      Or load a saved cart:
                    </p>
                    <div className="space-y-2">
                      {savedCarts.slice(0, 3).map((cart) => (
                        <Button
                          key={cart.id}
                          variant="outline"
                          className="w-full justify-between"
                          onClick={() => {
                            loadSavedCart(cart.id);
                            toast.success('Cart loaded');
                          }}
                        >
                          <span>{cart.name}</span>
                          <Badge variant="secondary">{cart.items.length} items</Badge>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group bg-card rounded-lg border p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <Link
                        to={`/product/${item.productId || item.id}`}
                        onClick={onClose}
                        className="flex-shrink-0"
                      >
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-20 h-20 bg-muted rounded-md flex items-center justify-center">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </Link>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/product/${item.productId || item.id}`}
                          onClick={onClose}
                          className="font-medium hover:text-primary line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        {item.variantName && (
                          <p className="text-sm text-muted-foreground">{item.variantName}</p>
                        )}
                        {item.sku && (
                          <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                        )}

                        {/* Price */}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-semibold text-primary">
                            R{item.price.toFixed(2)}
                          </span>
                          {item.compareAtPrice && item.compareAtPrice > item.price && (
                            <span className="text-sm text-muted-foreground line-through">
                              R{item.compareAtPrice.toFixed(2)}
                            </span>
                          )}
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-2 mt-3">
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-r-none"
                              onClick={() => handleQuantityChange(item, -item.min_quantity)}
                              disabled={item.quantity <= item.min_quantity}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleDirectQuantityInput(item, e.target.value)}
                              className="w-12 h-8 text-center border-0 rounded-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              min={item.min_quantity}
                              max={item.max_quantity}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-l-none"
                              onClick={() => handleQuantityChange(item, item.min_quantity)}
                              disabled={item.max_quantity ? item.quantity >= item.max_quantity : false}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setEditingNotes(item.id);
                              setNoteText(item.notes || '');
                            }}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive ml-auto"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Item Notes */}
                        {item.notes && editingNotes !== item.id && (
                          <p className="text-xs text-muted-foreground mt-2 italic">
                            Note: {item.notes}
                          </p>
                        )}

                        {/* Notes Editor */}
                        {editingNotes === item.id && (
                          <div className="mt-2 space-y-2">
                            <Textarea
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              placeholder="Add special instructions..."
                              className="text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSaveNotes(item.id)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingNotes(null);
                                  setNoteText('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Line Total */}
                      <div className="text-right">
                        <p className="font-bold">
                          R{(item.price * item.quantity).toFixed(2)}
                        </p>
                        {item.compareAtPrice && item.compareAtPrice > item.price && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            Save R{((item.compareAtPrice - item.price) * item.quantity).toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-6 space-y-4 bg-background">
              {/* Order Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>R{subtotal.toFixed(2)}</span>
                </div>

                {totalSavings > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      You Save
                    </span>
                    <span>-R{totalSavings.toFixed(2)}</span>
                  </div>
                )}

                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-success">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Coupon ({metadata.couponCode})
                    </span>
                    <span>-R{couponDiscount.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Shipping</span>
                  <span>{subtotal >= FREE_SHIPPING_THRESHOLD ? 'FREE' : 'Calculated at checkout'}</span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-primary">R{getTotalPrice().toFixed(2)}</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-4 py-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Secure Checkout
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Fast Delivery
                </span>
              </div>

              {/* Checkout Button */}
              <Link to="/checkout" onClick={onClose} className="block">
                <Button className="w-full gap-2" size="lg">
                  Proceed to Checkout
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link to="/shop" onClick={onClose} className="block">
                <Button variant="outline" className="w-full" size="sm">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Clear Cart Confirmation */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear your cart?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {items.length} item(s) from your cart. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearCart}>Clear Cart</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Cart Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Cart for Later</DialogTitle>
            <DialogDescription>
              Give your cart a name to easily find it later
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="e.g., Birthday wishlist, Monthly order"
            value={saveCartName}
            onChange={(e) => setSaveCartName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCart} disabled={!saveCartName.trim()}>
              Save Cart
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved Carts Dialog */}
      <Dialog open={showSavedCarts} onOpenChange={setShowSavedCarts}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Saved Carts</DialogTitle>
            <DialogDescription>
              Load a previously saved cart
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {savedCarts.map((cart) => (
              <div
                key={cart.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{cart.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {cart.items.length} items - {new Date(cart.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => {
                      loadSavedCart(cart.id);
                      setShowSavedCarts(false);
                      toast.success('Cart loaded');
                    }}
                  >
                    Load
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteSavedCart(cart.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
