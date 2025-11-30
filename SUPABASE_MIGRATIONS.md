# Supabase Migrations Reference

**Project:** Ideal Smoke Supply E-Commerce Platform
**Last Updated:** November 30, 2025
**Total Migrations:** 19

---

## Quick Reference

### Migration Execution Order

Run migrations in chronological order by filename prefix:

```bash
# Using Supabase CLI
supabase db push

# Or run individually in order:
supabase db execute -f supabase/migrations/20250124000000_create_coupons.sql
supabase db execute -f supabase/migrations/20250124000001_create_reviews.sql
# ... continue in order
```

### Key Tables by Feature

| Feature | Tables |
|---------|--------|
| **Products** | `products`, `product_variants`, `variant_option_groups`, `variant_options`, `product_images` |
| **Orders** | `orders`, `order_items`, `order_status_history`, `order_tracking` |
| **Users** | `user_roles`, `customers` |
| **Promotions** | `coupons`, `coupon_usage`, `promo_banners`, `banner_dismissals` |
| **Reviews** | `product_reviews`, `review_helpful` |
| **Wishlist** | `wishlist`, `guest_wishlist` |
| **Chat/Support** | `chat_sessions`, `chat_messages`, `telegram_support_messages` |
| **Telegram** | `telegram_customers`, `telegram_order_notifications`, `telegram_notification_settings` |
| **Notifications** | `notification_campaigns`, `push_subscriptions`, `user_notifications`, `notification_preferences` |
| **Newsletter** | `newsletter_subscribers` |
| **System** | `settings`, `audit_logs`, `system_logs`, `error_tracking` |
| **Cart Recovery** | `abandoned_carts` |

---

## Migrations Detail

### 1. `20250124000000_create_coupons.sql`

**Purpose:** Discount coupon system

**Creates:**
```sql
-- Tables
CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2),
  usage_limit INTEGER,
  per_customer_limit INTEGER DEFAULT 1,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE coupon_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coupon_id UUID REFERENCES coupons(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id),
  customer_email VARCHAR(255) NOT NULL,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function
CREATE FUNCTION validate_coupon(_coupon_code TEXT, _customer_email TEXT, _cart_total DECIMAL)
RETURNS JSON AS $$
-- Validates coupon and returns discount amount or error
$$;
```

**RLS:** Public view active coupons, Admin manage all

---

### 2. `20250124000001_create_reviews.sql`

**Purpose:** Product reviews and ratings

**Creates:**
```sql
CREATE TABLE product_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE review_helpful (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID REFERENCES product_reviews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);
```

**Modifies:** `products` table - adds `average_rating`, `review_count`

**Triggers:** Auto-updates product rating/count on review changes

---

### 3. `20250124000002_enhance_order_tracking.sql`

**Purpose:** Order status history and shipping tracking

**Creates:**
```sql
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  old_status order_status,
  new_status order_status NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE order_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE UNIQUE,
  tracking_number VARCHAR(100),
  courier VARCHAR(100),
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  tracking_url TEXT,
  last_location TEXT,
  last_update_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Modifies:** `orders` table - adds `tracking_number`, `estimated_delivery`

**Triggers:** Auto-logs status changes to history

---

### 4. `20250124000003_create_product_variants.sql`

**Purpose:** Product variants (flavor, size, nicotine strength, etc.)

**Creates:**
```sql
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  sku VARCHAR(100) UNIQUE,
  variant_name VARCHAR(255),
  flavor VARCHAR(100),
  nicotine_strength VARCHAR(50),
  size VARCHAR(50),
  color VARCHAR(50),
  price_adjustment DECIMAL(10,2) DEFAULT 0,
  stock_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  image_url TEXT,
  weight DECIMAL(10,2),
  dimensions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE variant_option_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE variant_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id UUID REFERENCES variant_option_groups(id) ON DELETE CASCADE,
  value VARCHAR(100) NOT NULL,
  display_order INTEGER DEFAULT 0
);

CREATE TABLE variant_option_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
  option_id UUID REFERENCES variant_options(id) ON DELETE CASCADE,
  UNIQUE(variant_id, option_id)
);
```

**Modifies:**
- `products` - adds `has_variants`
- `order_items` - adds `variant_id`, `variant_name`

---

### 5. `20250124000004_create_wishlist.sql`

**Purpose:** Wishlist for authenticated and guest users

**Creates:**
```sql
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  UNIQUE(user_id, product_id, variant_id)
);

CREATE TABLE guest_wishlist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id VARCHAR(255) NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, product_id, variant_id)
);

-- Migration function
CREATE FUNCTION migrate_guest_wishlist(_session_id TEXT, _user_id UUID)
RETURNS INTEGER AS $$
-- Migrates guest wishlist to user wishlist on login
$$;
```

**Modifies:** `products` - adds `wishlist_count`

---

### 6. `20250124000005_enhance_telegram_integration.sql`

**Purpose:** Telegram bot support and order notifications

**Creates:**
```sql
CREATE TABLE telegram_support_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id VARCHAR(50) NOT NULL,
  username VARCHAR(255),
  message_text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending/responded/resolved
  admin_response TEXT,
  responded_by UUID REFERENCES auth.users(id),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE telegram_order_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  chat_id VARCHAR(50) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  message_text TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivery_status VARCHAR(20) DEFAULT 'pending'
);
```

**Modifies:**
- `customers` - adds `telegram_chat_id`
- `telegram_customers` - adds `customer_email`, `notification_preferences`

**Triggers:** Auto-sends Telegram notification on order status change

---

### 7. `20251123175653_*.sql`

**Purpose:** System logging and error tracking

**Creates:**
```sql
CREATE TABLE system_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  log_type VARCHAR(20) NOT NULL, -- debug/info/warning/error/critical
  source VARCHAR(50) NOT NULL,   -- frontend/edge-function/database/system
  category VARCHAR(100),
  message TEXT NOT NULL,
  stack_trace TEXT,
  metadata JSONB,
  user_id UUID,
  session_id VARCHAR(255),
  url TEXT,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE error_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  error_hash VARCHAR(64) UNIQUE,
  first_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  occurrence_count INTEGER DEFAULT 1,
  error_message TEXT NOT NULL,
  error_type VARCHAR(100),
  stack_trace TEXT,
  source_file TEXT,
  line_number INTEGER,
  column_number INTEGER,
  browser_info JSONB,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES auth.users(id),
  resolution_notes TEXT,
  severity VARCHAR(20) DEFAULT 'medium',
  affected_users_count INTEGER DEFAULT 1
);
```

---

### 8. `20251124092327_*.sql`

**Purpose:** Security fixes for RLS policies

**Changes:**
- Restricts `telegram_customers` to admin-only SELECT
- Restricts `order_items` to user's own orders
- Allows system to insert `abandoned_carts`

---

### 9. `20251124134406_*.sql`

**Purpose:** Telegram notification settings

**Creates:**
```sql
CREATE TABLE telegram_notification_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default settings inserted
INSERT INTO telegram_notification_settings (setting_key, is_enabled, description) VALUES
  ('new_orders', true, 'Notify on new orders'),
  ('order_status_changes', true, 'Notify on order status updates'),
  ('low_stock_alerts', true, 'Notify on low stock'),
  ('abandoned_cart_notifications', true, 'Notify on abandoned carts'),
  ('support_message_alerts', true, 'Notify on new support messages');
```

---

### 10. `20251124134719_*.sql`

**Purpose:** Newsletter subscription system

**Creates:**
```sql
CREATE TABLE newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  source VARCHAR(50) DEFAULT 'homepage',
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);
```

---

### 11. `20251124142722_*.sql`

**Purpose:** Chat session enhancements

**Modifies `chat_sessions`:**
- Adds `rating` (1-5)
- Adds `priority` (low/normal/high/urgent)
- Adds `is_starred`
- Adds `tags` (TEXT[])

**Modifies `chat_messages`:**
- Adds `is_read`

---

### 12. `20251124183656_*.sql`

**Purpose:** Storage buckets for brand assets

**Creates Storage Buckets:**
```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit) VALUES
  ('brand-assets', 'brand-assets', true, 5242880),
  ('custom-icons', 'custom-icons', true, 5242880);
```

---

### 13. `20251124194718_*.sql`

**Purpose:** Enable realtime for chat

**Enables Realtime:**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
```

---

### 14. `20251124200413_*.sql` & `20251126000001_*.sql`

**Purpose:** Notification system for PWA and promotional banners

**Creates:**
```sql
CREATE TABLE notification_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- promotion/order/system/info/success/warning/error
  target_audience VARCHAR(50) DEFAULT 'all', -- all/subscribers/customers/admins
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'draft', -- draft/scheduled/sent/cancelled
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE promo_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  background_color VARCHAR(7) DEFAULT '#3B82F6',
  text_color VARCHAR(7) DEFAULT '#FFFFFF',
  icon VARCHAR(50),
  link_url TEXT,
  link_text VARCHAR(100),
  is_dismissible BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  display_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  dismiss_count INTEGER DEFAULT 0,
  show_countdown BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES notification_campaigns(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  push_enabled BOOLEAN DEFAULT true,
  email_enabled BOOLEAN DEFAULT true,
  sound_enabled BOOLEAN DEFAULT true,
  vibration_enabled BOOLEAN DEFAULT true,
  promotions_enabled BOOLEAN DEFAULT true,
  order_updates_enabled BOOLEAN DEFAULT true,
  system_notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE banner_dismissals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  banner_id UUID REFERENCES promo_banners(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255),
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(banner_id, user_id),
  UNIQUE(banner_id, session_id)
);
```

**Functions:**
- `get_active_banner(user_id, session_id)` - Get next active banner
- `mark_notification_read(notification_id)` - Mark as read
- `mark_all_notifications_read()` - Mark all as read
- `track_banner_interaction(banner_id, interaction_type)` - Track metrics
- `send_notification_to_all(campaign_id)` - Broadcast notification

**Realtime:** Enabled for `user_notifications`

---

### 15. `20251124234312_*.sql`

**Purpose:** Core schema (foundational tables)

**Creates Core Tables:**
- `products` - Product catalog
- `user_roles` - User permissions (admin/customer)
- `orders` - Customer orders
- `order_items` - Order line items
- `delivery_options` - Shipping methods
- `settings` - Key-value configuration
- `audit_logs` - Activity logging
- `telegram_customers` - Telegram bot users
- `product_subscriptions` - Stock notifications
- `abandoned_carts` - Cart recovery
- `broadcast_messages` - Telegram broadcasts
- `chat_sessions` - Live chat sessions
- `chat_messages` - Chat message history
- `product_images` - Product gallery

**Creates Enums:**
- `app_role` - admin, customer
- `order_status` - pending, processing, shipped, delivered, cancelled

**Creates Functions:**
- `has_role(user_id, role)` - Role check without RLS recursion
- `handle_new_user()` - Auto-assign role on signup

**Storage:** `product-images` bucket

---

### 16. `20251125093200_*.sql`

**Purpose:** Consolidation migration (variants, wishlist, coupons, reviews)

Combines functionality from migrations 1-5 into a single comprehensive migration.

---

### 17-19. Remaining Migrations

Various fixes and duplications of notification system tables.

---

## Database Functions Reference

### Coupon Validation
```sql
SELECT * FROM validate_coupon('SAVE10', 'customer@email.com', 150.00);
-- Returns: { valid: true, discount_amount: 15.00, message: "Coupon applied" }
```

### Wishlist Migration
```sql
SELECT migrate_guest_wishlist('session-123', 'user-uuid');
-- Returns: Number of items migrated
```

### Order Statistics
```sql
SELECT * FROM get_order_statistics();
-- Returns: { total_orders, total_revenue, pending_count, delivered_count, ... }
```

### Active Banner
```sql
SELECT * FROM get_active_banner('user-uuid', 'session-id');
-- Returns: Active banner details or NULL
```

### Notification Functions
```sql
SELECT mark_notification_read('notification-uuid');
SELECT mark_all_notifications_read();
SELECT send_notification_to_all('campaign-uuid');
```

---

## RLS Policy Summary

| Table | Public | Authenticated | Admin |
|-------|--------|---------------|-------|
| products | Read | Read | Full |
| orders | Create | Read own | Full |
| order_items | - | Read own | Full |
| coupons | Read active | Read active | Full |
| product_reviews | Read approved | Create, Read | Full |
| wishlist | - | Own only | Full |
| telegram_customers | - | - | Full |
| notification_campaigns | Read active | Read active | Full |
| user_notifications | - | Own only | Full |
| settings | Read specific | Read specific | Full |

---

## Realtime Subscriptions

The following tables have realtime enabled:

```typescript
// Subscribe to chat messages
supabase
  .channel('chat')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'chat_messages'
  }, callback)
  .subscribe();

// Subscribe to notifications
supabase
  .channel('notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'user_notifications',
    filter: `user_id=eq.${userId}`
  }, callback)
  .subscribe();

// Subscribe to settings changes
supabase
  .channel('settings')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'settings'
  }, callback)
  .subscribe();
```

---

## Storage Buckets

| Bucket | Public | Size Limit | Allowed Types |
|--------|--------|------------|---------------|
| product-images | Yes | 5MB | JPEG, PNG, WebP, GIF |
| brand-assets | Yes | 5MB | All images |
| custom-icons | Yes | 5MB | All images |

---

## Troubleshooting

### Common Issues

**1. RLS Policy Errors**
```sql
-- Check if user has admin role
SELECT has_role(auth.uid(), 'admin');

-- Check user's role
SELECT * FROM user_roles WHERE user_id = auth.uid();
```

**2. Migration Conflicts**
Some migrations create overlapping tables. Run in order and skip if table exists:
```sql
CREATE TABLE IF NOT EXISTS table_name (...);
```

**3. Missing Functions**
If functions are missing, re-run the specific migration:
```bash
supabase db execute -f supabase/migrations/20250124000000_create_coupons.sql
```

---

## Version History

| Date | Migration | Description |
|------|-----------|-------------|
| Jan 24, 2025 | 000000-000005 | Core e-commerce features |
| Nov 23, 2025 | 175653 | System logging |
| Nov 24, 2025 | 092327-234312 | Security, notifications, chat |
| Nov 25, 2025 | 093200 | Consolidation |
| Nov 26, 2025 | 000001-112249 | Notification system finalization |

---

**Document Generated:** November 30, 2025
