import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Menu, X, User, LogOut, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { NotificationBell } from '@/components/notifications/NotificationCenter';
import CartDrawer from './CartDrawer';
import logo from '@/assets/logo.png';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const getTotalItems = useCartStore((state) => state.getTotalItems);
  const { user, isAdmin, signOut } = useAuth();
  const { wishlistItems } = useWishlist();

  const navigation = [
    { name: 'Shop', href: '/shop' },
    { name: 'About', href: '/about' },
    { name: 'Delivery Info', href: '/delivery' },
    { name: 'Support', href: '/support' },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <img src={logo} alt="Ideal Smoke Supply" className="h-12 w-auto transition-transform duration-300 group-hover:scale-105" />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1" aria-label="Main navigation">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="relative px-4 py-2 text-sm font-medium text-foreground hover:text-primary transition-colors group"
                >
                  {item.name}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-primary rounded-full transition-all duration-300 group-hover:w-3/4" />
                </Link>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4">
              {user ? (
                <>
                  {isAdmin && (
                    <Link to="/admin" className="hidden sm:block">
                      <Button variant="ghost" size="sm">
                        Admin
                      </Button>
                    </Link>
                  )}
                  <Link to="/my-orders">
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 sm:h-auto sm:w-auto sm:p-2">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="sm" onClick={signOut} className="hidden sm:flex">
                    <LogOut className="h-5 w-5" />
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                    Login
                  </Button>
                </Link>
              )}

              {/* Notification Bell */}
              <NotificationBell />

              {/* Wishlist Button */}
              <Link to="/wishlist">
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative h-9 w-9 p-0 sm:h-auto sm:w-auto sm:p-2 hover:bg-primary/10 transition-colors"
                  aria-label={`Wishlist${wishlistItems.length > 0 ? ` with ${wishlistItems.length} item${wishlistItems.length > 1 ? 's' : ''}` : ''}`}
                >
                  <Heart className="h-5 w-5 transition-transform hover:scale-110" />
                  {wishlistItems.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary text-[10px] sm:text-xs text-primary-foreground flex items-center justify-center animate-scale-in shadow-sm" aria-hidden="true">
                      {wishlistItems.length}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Cart Button */}
              <Button
                variant="ghost"
                size="sm"
                className="relative h-9 w-9 p-0 sm:h-auto sm:w-auto sm:p-2 hover:bg-primary/10 transition-colors"
                onClick={() => setCartOpen(true)}
                aria-label={`Shopping cart${getTotalItems() > 0 ? ` with ${getTotalItems()} item${getTotalItems() > 1 ? 's' : ''}` : ''}`}
              >
                <ShoppingCart className="h-5 w-5 transition-transform hover:scale-110" />
                {getTotalItems() > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 rounded-full bg-primary text-[10px] sm:text-xs text-primary-foreground flex items-center justify-center animate-scale-in shadow-sm" aria-hidden="true">
                    {getTotalItems()}
                  </span>
                )}
              </Button>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 space-y-2 border-t" aria-label="Mobile navigation">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {/* Mobile-only: Admin link and Logout for logged-in users */}
              {user && (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors sm:hidden"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    className="block w-full text-left px-3 py-2 text-base font-medium text-foreground hover:text-primary transition-colors sm:hidden"
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                  >
                    Logout
                  </button>
                </>
              )}
            </nav>
          )}
        </div>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
