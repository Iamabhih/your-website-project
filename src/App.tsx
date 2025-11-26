import { Toaster } from "@/components/ui/toaster";
import { ThemeAwareToaster } from "@/components/ThemeAwareToaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { PWAProvider } from "@/contexts/PWAContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AgeVerificationModal } from "@/components/AgeVerificationModal";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
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
import AdminDashboard from "./pages/admin/Dashboard";
import AdminProducts from "./pages/admin/Products";
import AdminOrders from "./pages/admin/Orders";
import AdminAbandonedCarts from "./pages/admin/AbandonedCarts";
import AdminCustomers from "./pages/admin/Customers";
import AdminDeliveryOptions from "./pages/admin/DeliveryOptions";
import AdminSettings from "./pages/admin/Settings";
import AdminAnalytics from "./pages/admin/Analytics";
import AdminCoupons from "./pages/admin/Coupons";
import AdminReviews from "./pages/admin/Reviews";
import TelegramChats from "./pages/admin/TelegramChats";
import TelegramCustomers from "./pages/admin/TelegramCustomers";
import TelegramBroadcast from "./pages/admin/TelegramBroadcast";
import TelegramSupport from "./pages/admin/TelegramSupport";
import TelegramSettings from "./pages/admin/TelegramSettings";
import ProductImport from "./pages/admin/ProductImport";
import BannerManagement from "./pages/admin/BannerManagement";
import PWASettings from "./pages/admin/PWASettings";
import SystemLogs from "./pages/admin/SystemLogs";
import StoreSettings from "./pages/admin/StoreSettings";
import TelegramLink from "./pages/TelegramLink";
import ChatWidget from "./components/ChatWidget";
import Newsletter from "./pages/admin/Newsletter";
import Categories from "./pages/admin/Categories";
import Returns from "./pages/admin/Returns";
import Inventory from "./pages/admin/Inventory";
import AccountProfile from "./pages/AccountProfile";
import ThemeBuilder from "./pages/admin/ThemeBuilder";
import CustomIcons from "./pages/admin/CustomIcons";
import Branding from "./pages/admin/Branding";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ReturnPolicy from "./pages/ReturnPolicy";
import CookiePolicy from "./pages/CookiePolicy";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
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
          <LoadingProvider>
            <TooltipProvider>
              <AgeVerificationModal />
              <Toaster />
              <ThemeAwareToaster />
              <PWAInstallPrompt />
              <BrowserRouter>
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
                <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
                <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><AdminAnalytics /></ProtectedRoute>} />
                <Route path="/admin/products" element={<ProtectedRoute requireAdmin><AdminProducts /></ProtectedRoute>} />
                <Route path="/admin/products/import" element={<ProtectedRoute requireAdmin><ProductImport /></ProtectedRoute>} />
                <Route path="/admin/orders" element={<ProtectedRoute requireAdmin><AdminOrders /></ProtectedRoute>} />
                <Route path="/admin/abandoned-carts" element={<ProtectedRoute requireAdmin><AdminAbandonedCarts /></ProtectedRoute>} />
                <Route path="/admin/customers" element={<ProtectedRoute requireAdmin><AdminCustomers /></ProtectedRoute>} />
                <Route path="/admin/coupons" element={<ProtectedRoute requireAdmin><AdminCoupons /></ProtectedRoute>} />
                <Route path="/admin/reviews" element={<ProtectedRoute requireAdmin><AdminReviews /></ProtectedRoute>} />
                <Route path="/admin/delivery-options" element={<ProtectedRoute requireAdmin><AdminDeliveryOptions /></ProtectedRoute>} />
                <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
                <Route path="/admin/store-settings" element={<ProtectedRoute requireAdmin><StoreSettings /></ProtectedRoute>} />
                <Route path="/admin/newsletter" element={<ProtectedRoute requireAdmin><Newsletter /></ProtectedRoute>} />
                <Route path="/admin/categories" element={<ProtectedRoute requireAdmin><Categories /></ProtectedRoute>} />
                <Route path="/admin/returns" element={<ProtectedRoute requireAdmin><Returns /></ProtectedRoute>} />
                <Route path="/admin/inventory" element={<ProtectedRoute requireAdmin><Inventory /></ProtectedRoute>} />
                <Route path="/admin/telegram-chats" element={<ProtectedRoute requireAdmin><TelegramChats /></ProtectedRoute>} />
                <Route path="/admin/telegram-customers" element={<ProtectedRoute requireAdmin><TelegramCustomers /></ProtectedRoute>} />
                <Route path="/admin/telegram-broadcast" element={<ProtectedRoute requireAdmin><TelegramBroadcast /></ProtectedRoute>} />
                <Route path="/admin/telegram-support" element={<ProtectedRoute requireAdmin><TelegramSupport /></ProtectedRoute>} />
                <Route path="/admin/telegram-settings" element={<ProtectedRoute requireAdmin><TelegramSettings /></ProtectedRoute>} />
                <Route path="/account/telegram" element={<TelegramLink />} />
                <Route path="/admin/banner" element={<ProtectedRoute requireAdmin><BannerManagement /></ProtectedRoute>} />
                <Route path="/admin/pwa" element={<ProtectedRoute requireAdmin><PWASettings /></ProtectedRoute>} />
                <Route path="/admin/theme" element={<ProtectedRoute requireAdmin><ThemeBuilder /></ProtectedRoute>} />
                <Route path="/admin/branding" element={<ProtectedRoute requireAdmin><Branding /></ProtectedRoute>} />
                <Route path="/admin/icons" element={<ProtectedRoute requireAdmin><CustomIcons /></ProtectedRoute>} />
                <Route path="/admin/system-logs" element={<ProtectedRoute requireAdmin><SystemLogs /></ProtectedRoute>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </LoadingProvider>
        </PWAProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

