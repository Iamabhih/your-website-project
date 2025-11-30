import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { ThemeAwareToaster } from "@/components/ThemeAwareToaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PWAProvider } from "@/contexts/PWAContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AgeVerificationModal } from "@/components/AgeVerificationModal";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import NotificationToastContainer from "@/components/notifications/NotificationToast";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import PromoBanner from "@/components/notifications/PromoBanner";
import { Loader2 } from "lucide-react";

// Customer pages - loaded immediately
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Shop from "./pages/Shop";
import About from "./pages/About";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import MyOrders from "./pages/MyOrders";
import Auth from "./pages/Auth";
import Delivery from "./pages/Delivery";
import Support from "./pages/Support";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import Wishlist from "./pages/Wishlist";
import TelegramLink from "./pages/TelegramLink";
import ChatWidget from "./components/ChatWidget";
import AccountProfile from "./pages/AccountProfile";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ReturnPolicy from "./pages/ReturnPolicy";
import CookiePolicy from "./pages/CookiePolicy";

// Admin pages - lazy loaded for better performance
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminOrders = lazy(() => import("./pages/admin/Orders"));
const AdminAbandonedCarts = lazy(() => import("./pages/admin/AbandonedCarts"));
const AdminCustomers = lazy(() => import("./pages/admin/Customers"));
const AdminDeliveryOptions = lazy(() => import("./pages/admin/DeliveryOptions"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const AdminCoupons = lazy(() => import("./pages/admin/Coupons"));
const AdminReviews = lazy(() => import("./pages/admin/Reviews"));
const AdminNotifications = lazy(() => import("./pages/admin/Notifications"));
const TelegramChats = lazy(() => import("./pages/admin/TelegramChats"));
const TelegramCustomers = lazy(() => import("./pages/admin/TelegramCustomers"));
const TelegramBroadcast = lazy(() => import("./pages/admin/TelegramBroadcast"));
const TelegramSupport = lazy(() => import("./pages/admin/TelegramSupport"));
const TelegramSettings = lazy(() => import("./pages/admin/TelegramSettings"));
const ProductImport = lazy(() => import("./pages/admin/ProductImport"));
const BannerManagement = lazy(() => import("./pages/admin/BannerManagement"));
const PWASettings = lazy(() => import("./pages/admin/PWASettings"));
const SystemLogs = lazy(() => import("./pages/admin/SystemLogs"));
const StoreSettings = lazy(() => import("./pages/admin/StoreSettings"));
const Newsletter = lazy(() => import("./pages/admin/Newsletter"));
const Categories = lazy(() => import("./pages/admin/Categories"));
const Returns = lazy(() => import("./pages/admin/Returns"));
const Inventory = lazy(() => import("./pages/admin/Inventory"));
const ThemeBuilder = lazy(() => import("./pages/admin/ThemeBuilder"));
const CustomIcons = lazy(() => import("./pages/admin/CustomIcons"));
const Branding = lazy(() => import("./pages/admin/Branding"));

// Loading fallback for lazy-loaded admin pages
const AdminLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Loading admin panel...</p>
    </div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
      retry: 1, // Reduced from 3 for better performance
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <PWAProvider>
          <NotificationProvider>
            <LoadingProvider>
              <TooltipProvider>
                <AgeVerificationModal />
                <Toaster />
                <ThemeAwareToaster />
                <PWAInstallPrompt />
                <NotificationToastContainer />
                <BrowserRouter>
                  <PromoBanner />
                  <NotificationCenter />
                  <ChatWidget />
                  <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/about" element={<About />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation/:id" element={<OrderConfirmation />} />
                <Route path="/my-orders" element={<MyOrders />} />
                <Route path="/wishlist" element={<Wishlist />} />
                <Route path="/account" element={<ProtectedRoute><AccountProfile /></ProtectedRoute>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/delivery" element={<Delivery />} />
                <Route path="/support" element={<Support />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/payment-cancelled" element={<PaymentCancelled />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms-of-service" element={<TermsOfService />} />
                <Route path="/return-policy" element={<ReturnPolicy />} />
                <Route path="/cookie-policy" element={<CookiePolicy />} />
                <Route path="/account/telegram" element={<TelegramLink />} />
                {/* Admin routes - lazy loaded with Suspense */}
                <Route path="/admin" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><AdminDashboard /></Suspense></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><AdminAnalytics /></Suspense></ProtectedRoute>} />
                <Route path="/admin/products" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><AdminProducts /></Suspense></ProtectedRoute>} />
                <Route path="/admin/products/import" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><ProductImport /></Suspense></ProtectedRoute>} />
                <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><AdminOrders /></Suspense></ProtectedRoute>} />
                <Route path="/admin/abandoned-carts" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><AdminAbandonedCarts /></Suspense></ProtectedRoute>} />
                <Route path="/admin/customers" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><AdminCustomers /></Suspense></ProtectedRoute>} />
                <Route path="/admin/coupons" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><AdminCoupons /></Suspense></ProtectedRoute>} />
                <Route path="/admin/reviews" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><AdminReviews /></Suspense></ProtectedRoute>} />
                <Route path="/admin/delivery-options" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><AdminDeliveryOptions /></Suspense></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><AdminSettings /></Suspense></ProtectedRoute>} />
                <Route path="/admin/store-settings" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><StoreSettings /></Suspense></ProtectedRoute>} />
                <Route path="/admin/newsletter" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><Newsletter /></Suspense></ProtectedRoute>} />
                <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><Categories /></Suspense></ProtectedRoute>} />
                <Route path="/admin/returns" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><Returns /></Suspense></ProtectedRoute>} />
                <Route path="/admin/inventory" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><Inventory /></Suspense></ProtectedRoute>} />
                <Route path="/admin/telegram-chats" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><TelegramChats /></Suspense></ProtectedRoute>} />
                <Route path="/admin/telegram-customers" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><TelegramCustomers /></Suspense></ProtectedRoute>} />
                <Route path="/admin/telegram-broadcast" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><TelegramBroadcast /></Suspense></ProtectedRoute>} />
                <Route path="/admin/telegram-support" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><TelegramSupport /></Suspense></ProtectedRoute>} />
                <Route path="/admin/telegram-settings" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><TelegramSettings /></Suspense></ProtectedRoute>} />
                <Route path="/admin/banner" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><BannerManagement /></Suspense></ProtectedRoute>} />
                <Route path="/admin/pwa" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><PWASettings /></Suspense></ProtectedRoute>} />
                <Route path="/admin/theme" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><ThemeBuilder /></Suspense></ProtectedRoute>} />
                <Route path="/admin/branding" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><Branding /></Suspense></ProtectedRoute>} />
                <Route path="/admin/icons" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><CustomIcons /></Suspense></ProtectedRoute>} />
                <Route path="/admin/system-logs" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><SystemLogs /></Suspense></ProtectedRoute>} />
                <Route path="/admin/notifications" element={<ProtectedRoute requireAdmin><Suspense fallback={<AdminLoadingFallback />}><AdminNotifications /></Suspense></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
                </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </LoadingProvider>
          </NotificationProvider>
        </PWAProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

