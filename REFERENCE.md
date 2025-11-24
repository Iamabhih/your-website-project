# Ideal Smoke Supply E-Commerce Platform

A full-stack e-commerce platform built with React, TypeScript, and Supabase, featuring Telegram bot integration, PayFast payment processing, and comprehensive admin management.

## 🚀 Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Edge Functions, Realtime)
- **State Management**: Zustand, TanStack Query
- **Payment**: PayFast (South African payments)
- **Messaging**: Telegram Bot API, Resend (emails)
- **Auth**: Supabase Auth with JWT
- **Routing**: React Router v6
- **Charts**: Recharts
- **PWA**: Vite PWA Plugin

## ✨ Core Features

### Frontend Features

#### Product Catalog
- Browse products by category (Vapes, E-Liquids, Accessories)
- Product cards with images, pricing, and pack information
- Individual product detail pages with full descriptions
- Age verification dialog (18+ requirement)
- SEO optimization with meta tags and structured data
- Responsive design for mobile, tablet, and desktop

#### Shopping Experience
- Add to cart functionality with quantity management
- Cart drawer with real-time updates
- Minimum quantity enforcement per product
- Order total calculation with delivery costs
- Support chat widget (integrates with Telegram)
- Notice banner system (customizable, real-time updates)

#### Checkout & Orders
- PayFast payment gateway integration
- Secure payment processing
- Order confirmation emails
- Order tracking for customers
- Payment success/cancellation pages
- Customer order history (/my-orders)

#### Progressive Web App (PWA)
- Installable as native app
- Offline support
- Custom install prompts
- App manifest with icons

#### Additional Pages
- About Us
- Privacy Policy
- Terms and Conditions
- Delivery Information
- Support page
- 404 Not Found handler

### Admin Dashboard

Access: `/admin/*` (requires admin role)

#### Dashboard Overview (`/admin`)
- Total revenue, orders, customers metrics
- Recent orders table
- Order status distribution chart
- Revenue trend chart (last 7 days)
- Quick stats overview

#### Product Management (`/admin/products`)
- Create, read, update, delete products
- Product image upload to Supabase Storage
- Category management
- Price and minimum quantity settings
- Pack information management
- Product search and filtering

#### Order Management (`/admin/orders`)
- View all orders with detailed information
- Filter by status (pending, processing, shipped, delivered, cancelled)
- Search by customer name, email, or phone
- Update order status with Telegram notifications
- WhatsApp integration for customer contact
- CSV export functionality
- Order timeline tracking

#### Customer Management (`/admin/customers`)
- View all registered customers
- Customer role management (admin/customer)
- Order count per customer
- Last sign-in tracking
- Search customers

#### Delivery Options (`/admin/delivery-options`)
- Configure delivery methods
- Set delivery costs
- Estimated delivery time
- Enable/disable delivery options
- Custom descriptions

#### Banner Management (`/admin/banner`)
- Real-time notice banner customization
- Text content and link configuration
- Background and text color selection
- Font weight adjustment
- Position (top/bottom)
- Dismissible option
- Live preview

#### Settings (`/admin/settings`)
- PayFast configuration (sandbox/live mode)
- Merchant ID and key management
- Admin email configuration
- System settings

#### Audit Logs (`/admin/logs`)
- View all system actions
- Filter by severity (info, warn, error)
- Filter by entity type (order, product)
- User action tracking
- IP address and user agent logging
- Detailed change history

### Customer Features

#### Authentication
- User signup and login
- Email-based authentication
- Auto-confirm email (no verification required)
- Secure JWT token management
- Role-based access control

#### Order Management
- View order history
- Order status tracking
- Order details with items
- Email notifications on status changes

#### Support Chat
- Live chat widget
- Connects to Telegram for admin responses
- Session tracking
- Message history

## 🏗️ Backend Architecture

### Database Schema (Supabase PostgreSQL)

#### Core Tables

**products**
- Product catalog with categories
- Pricing and descriptions
- Image URLs and pack information
- Minimum quantity constraints
- Created/updated timestamps

**orders**
- Customer order records
- Delivery address and contact info
- Payment status tracking
- Telegram chat ID linking
- Order status (pending, processing, shipped, delivered, cancelled)
- Total amount and delivery cost

**order_items**
- Line items for each order
- Product references
- Quantity and price snapshots

**user_roles**
- Role-based access control
- Enum type: admin | customer
- User ID references

**delivery_options**
- Configurable delivery methods
- Costs and estimated delivery days
- Active/inactive status

**settings**
- Key-value configuration store
- PayFast credentials
- Admin email
- Banner settings
- Updated by admin tracking

**audit_logs**
- Comprehensive action logging
- User, entity, and action tracking
- IP address and user agent
- Severity levels (info, warn, error)
- JSON details field

#### Telegram Integration Tables

**telegram_customers**
- Telegram user profiles
- Chat ID, username, names
- Contact information (phone, email)
- Preferences (JSON)
- Last interaction timestamp

**product_subscriptions**
- Product availability subscriptions
- Customer contact info
- Notification tracking
- Created timestamp

**abandoned_carts**
- Cart recovery system
- Cart items (JSON)
- Total amount
- Reminder tracking (reminded_at)
- Recovery status
- Customer contact info

**broadcast_messages**
- Marketing message history
- Sent/failed counts
- Created by admin tracking
- Send timestamp

#### Support Chat Tables

**chat_sessions**
- Live chat sessions
- Telegram thread ID linking
- User information
- Session status (active/closed)
- Started/ended timestamps
- Current page and user agent

**chat_messages**
- Chat message history
- Session references
- Sender type (visitor/support)
- Telegram message ID
- Message text and timestamp

**product_images**
- Additional product images
- Display order
- Primary image flag
- Product references

### Row Level Security (RLS)

All tables have RLS enabled with specific policies:

- **Products**: Public read, admin write
- **Orders**: Users view own orders, admins view all, public create
- **Order Items**: Public read/create
- **User Roles**: Users view own roles only
- **Delivery Options**: Public read, admin write
- **Settings**: Admin full access, public read for banner settings
- **Audit Logs**: Admin read, system insert
- **Telegram Tables**: Public create/read/update for customer interaction
- **Chat Tables**: Public create/read, admin update sessions
- **Abandoned Carts**: Admin view/update, public create
- **Product Subscriptions**: Public subscribe, admin manage

### Database Functions

**has_role(\_user_id uuid, \_role app_role)**
- Security definer function
- Prevents infinite recursion in RLS
- Checks if user has specific role
- Used in all admin RLS policies

**handle_new_user()**
- Trigger function for auth.users
- Auto-assigns 'customer' role to new signups
- Ensures proper role initialization

**update_updated_at_column()**
- Trigger function for timestamp updates
- Auto-updates updated_at on record changes
- Applied to products and orders

**log_order_change()**
- Trigger function for order audit logging
- Captures old and new values
- Records user, action, and entity

**log_product_change()**
- Trigger function for product audit logging
- Tracks all product modifications
- Complete change history

### Edge Functions

#### create-payfast-payment
**Purpose**: Payment processing and order creation  
**Method**: POST  
**Auth**: Public  
**Functionality**:
- Receives order details from frontend
- Creates order record in database
- Inserts order items
- Retrieves PayFast settings (sandbox/live)
- Constructs PayFast payment data
- Sends confirmation email to customer
- Sends admin notification email
- Returns PayFast URL and payment data

**Request Body**:
```json
{
  "items": [{ "id": "uuid", "name": "string", "price": number, "quantity": number, "image_url": "string" }],
  "customerName": "string",
  "customerEmail": "string",
  "customerPhone": "string",
  "deliveryAddress": "string",
  "deliveryMethod": "string",
  "deliveryNotes": "string",
  "deliveryPrice": number,
  "totalAmount": number
}
```

#### send-order-email
**Purpose**: Email notifications via Resend  
**Method**: POST  
**Auth**: Public  
**Functionality**:
- Sends order confirmation to customers
- Sends new order alerts to admin
- HTML email templates
- Error handling and logging

**Email Types**:
- Customer order confirmation
- Admin new order notification

#### notify-order-status
**Purpose**: Telegram notifications for order events  
**Method**: POST  
**Auth**: Public  
**Functionality**:
- New order alerts to admin
- Order status updates to customers (via Telegram)
- Order confirmation messages
- Fetches order details with items
- Sends formatted messages with order summary

**Notification Types**:
- `new_order`: Admin alert with full order details
- `status_update`: Customer notification of status change
- `order_confirmation`: Customer order confirmation

#### telegram-bot
**Purpose**: Main Telegram bot command handler  
**Method**: POST  
**Auth**: Public  
**Functionality**:
- Handles all bot commands
- Customer and admin command routing
- Order tracking and approval
- Product browsing
- Broadcast messaging
- Help and support

**Customer Commands**:
- `/start` or `/help` - Show available commands
- `/track` - Track order by email
- `/subscribe [product_name]` - Subscribe to product availability
- `/products` - Browse product catalog
- General messages - Forwarded to support

**Admin Commands** (admin chat ID only):
- `/orders` - View pending orders
- `/approve [order_id]` - Approve order
- `/cancel [order_id]` - Cancel order
- `/broadcast [message]` - Send to all customers

#### telegram-webhook
**Purpose**: Receive Telegram webhook updates  
**Method**: POST  
**Auth**: Public  
**Functionality**:
- Receives messages from Telegram
- Handles reply-to-message for support chat
- Updates chat sessions and messages
- Validates session status
- Error handling for closed/missing sessions

#### send-to-telegram
**Purpose**: Support chat integration  
**Method**: POST  
**Auth**: Public  
**Functionality**:
- Forwards website chat to Telegram
- Creates chat sessions with Telegram threads
- Sends visitor messages to admin
- Handles session closure
- Stores session and message history

**Event Types**:
- `new_session`: Create Telegram thread for new chat
- `visitor_message`: Forward message to Telegram
- `close_session`: Close Telegram thread and session

#### check-abandoned-carts
**Purpose**: Automated cart recovery  
**Method**: POST  
**Auth**: Public  
**Scheduling**: Hourly via cron job  
**Functionality**:
- Finds carts older than 1 hour
- Filters un-reminded, unrecovered carts
- Sends Telegram reminder messages
- Updates reminded_at timestamp
- Rate limiting (200ms between messages)
- Processes up to 50 carts per run

**Message Format**:
```
🛒 Don't forget your cart!

You left X item(s) in your cart:
• Product Name x Quantity

Total: R[amount]

Complete your order now and get it delivered!
```

#### check-inventory
**Purpose**: Stock alert system  
**Method**: POST  
**Auth**: Public  
**Functionality**:
- Low stock alerts to admin
- Back-in-stock notifications to subscribers
- Fetches product details
- Sends Telegram notifications
- Updates subscription notification status

**Event Types**:
- `low_stock`: Alert admin when inventory is low
- `back_in_stock`: Notify subscribed customers

### Storage Buckets

**product-images**
- Public bucket
- Product image uploads
- Accessible via public URLs
- Admin upload permissions

### Realtime Subscriptions

**settings** table:
- Enabled for realtime updates
- Used for live banner updates
- Automatic UI refresh on settings changes

## 🤖 Telegram Bot Integration

### Setup Process

1. **Create Bot with BotFather**
```
/newbot
[Choose bot name]
[Choose username ending in 'bot']
```

2. **Get Bot Token and Chat ID**
```
Use @userinfobot to get your Telegram chat ID
Save bot token from BotFather
```

3. **Set Webhook** (after deployment)
```
https://api.telegram.org/bot[BOT_TOKEN]/setWebhook?url=[SUPABASE_FUNCTION_URL]/telegram-webhook
```

4. **Configure Bot Commands**
```
/setcommands

For customers:
start - Show available commands
help - Show help message
track - Track your order status
subscribe - Subscribe to product alerts
products - Browse products

For admin (separate list):
orders - View pending orders
approve - Approve an order
cancel - Cancel an order
broadcast - Send message to all customers
```

### Bot Workflow

#### Customer Journey

1. **Initial Contact**
   - User sends `/start` to bot
   - Bot responds with welcome and command list
   - User profile created in `telegram_customers`

2. **Order Tracking**
   - User sends `/track`
   - Bot asks for email address
   - User provides email
   - Bot fetches orders for that email
   - Bot displays order status and details

3. **Product Subscription**
   - User sends `/subscribe [product name]`
   - Bot searches for product
   - Subscription created in `product_subscriptions`
   - User receives confirmation

4. **Product Browsing**
   - User sends `/products`
   - Bot displays categorized product list
   - Product names, prices, descriptions

5. **Support Chat**
   - User sends any message (not a command)
   - Message forwarded to admin via `send-to-telegram`
   - Admin can reply in Telegram
   - Reply forwarded back to user via `telegram-webhook`

#### Admin Operations

1. **New Order Notification**
   - Customer completes checkout
   - `notify-order-status` called with `new_order` type
   - Admin receives Telegram message with:
     - Order ID and total amount
     - Customer details (name, phone, email)
     - Delivery address and method
     - Item list with quantities

2. **Order Management**
   - Admin sends `/orders` to view pending orders
   - Admin sends `/approve [order_id]` to approve
   - Admin sends `/cancel [order_id]` to cancel
   - Status update triggers `notify-order-status`
   - Customer receives status update (if telegram_chat_id exists)

3. **Broadcast Messaging**
   - Admin sends `/broadcast [message]`
   - Message sent to all customers in `telegram_customers`
   - Broadcast record created in `broadcast_messages`
   - Sent/failed counts tracked

4. **Low Stock Alerts**
   - `check-inventory` called with `low_stock` type
   - Admin receives Telegram alert
   - Includes product name and details

5. **Support Chat Handling**
   - Customer initiates chat on website
   - New Telegram thread created in admin chat
   - Admin sees customer info and messages
   - Admin replies in thread
   - Reply forwarded to website chat

### Automated Notifications

#### Abandoned Cart Recovery
**Frequency**: Hourly  
**Function**: `check-abandoned-carts`  
**Trigger**: Supabase cron job or external scheduler  
**Logic**:
- Find carts older than 1 hour
- Not yet reminded
- Not recovered
- Has telegram_chat_id
- Send reminder message
- Update reminded_at timestamp

**Setup Cron** (external service like cron-job.org):
```
Schedule: Every hour
URL: [SUPABASE_URL]/functions/v1/check-abandoned-carts
Method: POST
Headers: Authorization: Bearer [ANON_KEY]
```

#### Stock Notifications
**Frequency**: On-demand or scheduled  
**Function**: `check-inventory`  
**Triggers**:
- Manual call when stock changes
- Scheduled check (e.g., every 6 hours)
- Admin dashboard action

**Back in Stock**:
- Fetches all notified=null subscriptions for product
- Sends notification to each subscriber
- Updates notified_at timestamp
- Sends admin summary

**Low Stock**:
- Admin sets threshold
- Function called when stock < threshold
- Admin receives alert

### Database Integration

**telegram_customers** tracking:
- Every interaction updates last_interaction
- Preferences stored as JSON (language, notifications)
- Email/phone collected during order tracking

**Orders** linking:
- telegram_chat_id saved with order
- Enables direct customer notifications
- Used for status updates

**Chat Sessions** lifecycle:
- Created when customer starts chat
- telegram_thread_id for Telegram integration
- Status: active → closed
- Messages stored in chat_messages

## 💳 Payment Integration

### PayFast Configuration

**Sandbox Mode** (testing):
```
Merchant ID: 10000100
Merchant Key: 46f0cd694581a
```

**Live Mode** (production):
```
Merchant ID: [Your merchant ID]
Merchant Key: [Your merchant key]
```

### Payment Flow

1. Customer completes checkout form
2. Frontend calls `create-payfast-payment` edge function
3. Order created in database
4. PayFast payment URL and data returned
5. Frontend redirects to PayFast
6. Customer completes payment on PayFast
7. PayFast redirects to success/cancel page
8. Frontend shows confirmation message

### Return URLs
- Success: `/payment-success?id=[order_id]`
- Cancel: `/payment-cancelled`
- Notify: `/api/payfast-notify` (webhook - optional)

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account (https://supabase.com)
- Telegram account (for bot creation)
- PayFast merchant account (https://www.payfast.co.za)
- Resend API key (https://resend.com) for emails
- Git for version control

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ideal-smoke-supply
npm install
```

### 2. Supabase Setup

#### Create Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose organization, name, database password
4. Select region (closest to your users)
5. Wait for project to initialize

#### Get Credentials
1. Go to Project Settings → API
2. Copy Project URL (VITE_SUPABASE_URL)
3. Copy anon/public key (VITE_SUPABASE_PUBLISHABLE_KEY)

#### Run Migrations
```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref [your-project-ref]

# Run all migrations
supabase db push
```

Or manually run SQL files in Supabase SQL Editor in order.

#### Enable Row Level Security
All tables should have RLS enabled (handled by migrations).

#### Configure Authentication
1. Go to Authentication → Settings
2. Enable Email provider
3. Disable email confirmations (auto-confirm emails)
4. Set site URL to your deployment URL

#### Create Storage Bucket
1. Go to Storage
2. Create new bucket: `product-images`
3. Make it public
4. Set up policies:
```sql
-- Allow public read
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow authenticated uploads
CREATE POLICY "Authenticated uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');
```

#### Enable Realtime
```sql
-- Already in migrations, but verify:
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
```

### 3. Environment Variables

Create `.env` file:
```env
VITE_SUPABASE_URL=https://[project-ref].supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[anon-key]
```

### 4. Edge Functions Setup

Edge functions are in `supabase/functions/`. Deploy them:

```bash
# Deploy all functions
supabase functions deploy create-payfast-payment
supabase functions deploy send-order-email
supabase functions deploy notify-order-status
supabase functions deploy telegram-bot
supabase functions deploy telegram-webhook
supabase functions deploy send-to-telegram
supabase functions deploy check-abandoned-carts
supabase functions deploy check-inventory
```

Set function secrets:
```bash
supabase secrets set TELEGRAM_BOT_TOKEN=[your-bot-token]
supabase secrets set TELEGRAM_CHAT_ID=[your-admin-chat-id]
supabase secrets set RESEND_API_KEY=[your-resend-key]
```

### 5. Telegram Bot Setup

#### Create Bot
1. Open Telegram, search for `@BotFather`
2. Send `/newbot`
3. Follow prompts to name your bot
4. Save the bot token

#### Get Your Chat ID
1. Search for `@userinfobot` in Telegram
2. Send `/start`
3. Save your chat ID (admin notifications will go here)

#### Set Webhook
Replace placeholders and run in browser or curl:
```
https://api.telegram.org/bot[BOT_TOKEN]/setWebhook?url=https://[project-ref].supabase.co/functions/v1/telegram-webhook
```

#### Configure Commands
1. Send `/setcommands` to BotFather
2. Select your bot
3. Paste customer commands:
```
start - Show available commands
help - Show help message
track - Track your order status
subscribe - Subscribe to product alerts
products - Browse products
```

### 6. PayFast Setup

#### Create Account
1. Sign up at https://www.payfast.co.za
2. Verify your account (for live mode)
3. Get merchant credentials from dashboard

#### Configure in Database
Insert into settings table:
```sql
-- Sandbox mode (testing)
INSERT INTO public.settings (key, value)
VALUES 
  ('payfast_mode', '"sandbox"'),
  ('payfast_merchant_id', '"10000100"'),
  ('payfast_merchant_key', '"46f0cd694581a"');

-- Live mode (production)
INSERT INTO public.settings (key, value)
VALUES 
  ('payfast_mode', '"live"'),
  ('payfast_merchant_id', '"your-merchant-id"'),
  ('payfast_merchant_key', '"your-merchant-key"');
```

### 7. Email Setup (Resend)

1. Sign up at https://resend.com
2. Create API key
3. Verify your domain (for production)
4. Use `onboarding@resend.dev` for testing
5. Add API key to edge function secrets (done in step 4)

### 8. Create Admin User

After deploying:

1. Sign up on the site with your email
2. Get your user ID from Supabase Auth dashboard
3. Run in SQL Editor:
```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('[your-user-id]', 'admin');
```

### 9. Configure Cron Jobs (Optional)

For automated features, set up cron jobs using a service like cron-job.org:

**Abandoned Cart Recovery** (hourly):
```
URL: https://[project-ref].supabase.co/functions/v1/check-abandoned-carts
Method: POST
Schedule: 0 * * * * (every hour)
Headers: Authorization: Bearer [ANON_KEY]
```

**Stock Alerts** (every 6 hours):
```
URL: https://[project-ref].supabase.co/functions/v1/check-inventory
Method: POST
Body: {"type": "check_all_products"}
Schedule: 0 */6 * * * (every 6 hours)
Headers: Authorization: Bearer [ANON_KEY]
```

### 10. Run Development Server

```bash
npm run dev
```

Visit http://localhost:5173

### 11. Build and Deploy

#### Frontend Deployment (Lovable)
1. Push to GitHub
2. Connect repo to Lovable
3. Auto-deploy on push

Or use other platforms:
```bash
# Build
npm run build

# Preview
npm run preview

# Deploy to Vercel, Netlify, etc.
```

#### Custom Domain
1. Configure DNS settings
2. Add domain in deployment platform
3. Update Supabase authentication URLs

## 📁 Key Files and Directories

### Frontend Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── Header.tsx       # Main navigation
│   ├── Footer.tsx       # Footer component
│   ├── ProductCard.tsx  # Product display card
│   ├── CartDrawer.tsx   # Shopping cart
│   ├── NoticeBanner.tsx # Customizable banner
│   └── ...
├── pages/               # Application pages
│   ├── Index.tsx        # Homepage
│   ├── ProductDetail.tsx # Product page
│   ├── PayFastCheckout.tsx # Checkout
│   ├── MyOrders.tsx     # Customer orders
│   ├── Auth.tsx         # Login/signup
│   ├── Support.tsx      # Support chat
│   └── admin/           # Admin dashboard
│       ├── Dashboard.tsx    # Analytics
│       ├── Products.tsx     # Product management
│       ├── Orders.tsx       # Order management
│       ├── Customers.tsx    # Customer list
│       ├── DeliveryOptions.tsx
│       ├── Banner.tsx       # Banner settings
│       ├── Settings.tsx     # System settings
│       └── Logs.tsx         # Audit logs
├── stores/
│   └── cartStore.ts     # Cart state (Zustand)
├── lib/
│   ├── products.ts      # Product utilities
│   ├── deliveryOptions.ts
│   ├── telegram.ts      # Telegram helpers
│   └── utils.ts         # General utilities
├── hooks/
│   ├── useAuth.tsx      # Authentication hook
│   ├── useSupportChat.tsx # Chat functionality
│   └── ...
├── integrations/
│   └── supabase/
│       ├── client.ts    # Supabase client
│       └── types.ts     # Database types (auto-generated)
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── index.css            # Global styles + Tailwind
```

### Backend Structure

```
supabase/
├── functions/           # Edge functions
│   ├── create-payfast-payment/
│   │   └── index.ts
│   ├── send-order-email/
│   │   ├── index.ts
│   │   └── deno.json
│   ├── notify-order-status/
│   │   └── index.ts
│   ├── telegram-bot/
│   │   └── index.ts
│   ├── telegram-webhook/
│   │   └── index.ts
│   ├── send-to-telegram/
│   │   └── index.ts
│   ├── check-abandoned-carts/
│   │   └── index.ts
│   └── check-inventory/
│       └── index.ts
├── migrations/          # Database migrations
│   ├── [timestamp]_initial_schema.sql
│   ├── [timestamp]_add_telegram_tables.sql
│   ├── [timestamp]_add_audit_logs.sql
│   └── ...
└── config.toml          # Supabase config
```

### Configuration Files

- `tailwind.config.ts` - Tailwind CSS configuration
- `vite.config.ts` - Vite build configuration
- `tsconfig.json` - TypeScript configuration
- `components.json` - shadcn/ui configuration
- `.env` - Environment variables (not committed)
- `package.json` - Dependencies and scripts

## 🔒 Security Features

### Row Level Security (RLS)

All database tables have RLS enabled with granular policies:

**Admin-Only Access**:
- Product management (create, update, delete)
- Order status updates
- Delivery options configuration
- Settings management
- Audit log viewing

**Public Access**:
- Product viewing
- Order creation
- Cart abandonment tracking
- Telegram customer profile creation

**User-Specific Access**:
- Users can only view their own orders
- Users can only view their own roles

### Authentication & Authorization

- JWT-based authentication via Supabase Auth
- Role-based access control (admin/customer)
- Security definer functions to prevent RLS recursion
- Secure password hashing (handled by Supabase)
- Auto-confirm emails (configurable)

### Audit Logging

All critical operations logged:
- Order creations and status changes
- Product modifications
- User actions with IP and user agent
- Severity levels for filtering
- Complete before/after snapshots

### Payment Security

- No credit card data stored locally
- PayFast PCI DSS compliant gateway
- Secure payment redirects
- Order verification on return

### Environment Security

- Secrets managed via Supabase Vault
- Environment variables for sensitive data
- Public functions have no secrets exposed
- CORS headers properly configured

## 🎨 Customization Guide

### Adding Products

#### Via Admin Dashboard
1. Login as admin
2. Go to `/admin/products`
3. Click "Add Product"
4. Fill in details:
   - Name, description, category
   - Price and minimum quantity
   - Upload image
   - Pack information (optional)
5. Save

#### Via Database
```sql
INSERT INTO public.products (name, description, category, price, min_quantity, image_url, pack_info)
VALUES (
  'New Product',
  'Product description',
  'Vapes',
  199.99,
  1,
  'https://[storage-url]/image.jpg',
  '1 Pack'
);
```

### Configuring Delivery Options

1. Go to `/admin/delivery-options`
2. Add or edit delivery methods
3. Set cost and estimated days
4. Enable/disable options
5. Save changes

### Customizing the Banner

1. Go to `/admin/banner`
2. Configure:
   - Text content and link
   - Background color (hex)
   - Text color (hex)
   - Font weight (normal/bold)
   - Position (top/bottom)
   - Dismissible option
3. Save and see live preview
4. Changes appear instantly on site (Realtime)

### Modifying Telegram Commands

Edit `supabase/functions/telegram-bot/index.ts`:

```typescript
// Add new customer command
if (text === '/newcommand') {
  await sendTelegramMessage(chatId, 'Command response');
  return;
}

// Add new admin command
if (isAdminChat && text.startsWith('/newadmin')) {
  // Admin-only logic
  await sendTelegramMessage(chatId, 'Admin response');
  return;
}
```

Update BotFather commands:
```
/setcommands
[select bot]
newcommand - Description of new command
```

### Email Template Customization

Edit `supabase/functions/send-order-email/index.ts`:

```typescript
const html = `
  <h1>Custom Email Template</h1>
  <p>Dear ${customerName},</p>
  <p>Your order #${orderId} has been received!</p>
  <!-- Add your styling and content -->
`;
```

### Styling and Design

#### Colors
Edit `src/index.css`:
```css
:root {
  --primary: [hsl-values];
  --secondary: [hsl-values];
  --accent: [hsl-values];
  /* Add custom colors */
}
```

#### Components
Modify shadcn/ui components in `src/components/ui/`

#### Tailwind
Add custom utilities in `tailwind.config.ts`:
```typescript
theme: {
  extend: {
    // Custom fonts, spacing, etc.
  }
}
```

### Adding New Pages

1. Create component in `src/pages/`:
```typescript
export default function NewPage() {
  return <div>New Page Content</div>;
}
```

2. Add route in `src/App.tsx`:
```typescript
<Route path="/new-page" element={<NewPage />} />
```

3. Add navigation link in `src/components/Header.tsx`

## 📊 Database Migrations

### Migration Files

Located in `supabase/migrations/`, named by timestamp:
- `[timestamp]_initial_schema.sql` - Core tables
- `[timestamp]_create_user_roles.sql` - RBAC setup
- `[timestamp]_add_telegram_integration.sql` - Telegram tables
- `[timestamp]_add_product_subscriptions.sql` - Stock alerts
- `[timestamp]_add_audit_logging.sql` - Audit system
- And more...

### Running Migrations

**Via Supabase CLI**:
```bash
supabase db push
```

**Via SQL Editor**:
1. Copy migration SQL
2. Paste in Supabase SQL Editor
3. Run query

**Via Lovable Cloud**:
Migrations auto-apply on deployment

### Creating New Migrations

```bash
supabase migration new [description]
```

Edit the generated file, then:
```bash
supabase db push
```

## 🚀 Deployment

### Production Checklist

- [ ] Set PayFast to live mode
- [ ] Verify email domain in Resend
- [ ] Update environment variables
- [ ] Enable HTTPS
- [ ] Configure custom domain
- [ ] Set up error monitoring
- [ ] Test payment flow end-to-end
- [ ] Verify Telegram bot webhook
- [ ] Set up cron jobs for automated tasks
- [ ] Create admin user
- [ ] Add initial products
- [ ] Configure delivery options
- [ ] Test order flow
- [ ] Review RLS policies

### Environment-Specific Settings

**Development**:
- PayFast sandbox mode
- Resend test emails (onboarding@resend.dev)
- Localhost URLs
- Verbose logging

**Production**:
- PayFast live mode
- Verified email domain
- Custom domain URLs
- Error-only logging
- SSL/TLS enabled

### Monitoring

- Supabase Dashboard → Logs for edge function errors
- Supabase Dashboard → Database → Logs for SQL errors
- Admin dashboard → Audit Logs for user actions
- Telegram bot for operational notifications

## 📝 License

[Specify your license]

## 🤝 Contributing

[Add contribution guidelines if open source]

## 📧 Support

For issues and questions:
- GitHub Issues: [repo-issues-url]
- Email: support@idealsmokesupply.com
- Telegram: @idealsmokesupply_bot

## 🙏 Acknowledgments

- Built with [Lovable](https://lovable.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Backend powered by [Supabase](https://supabase.com)
- Payment processing by [PayFast](https://www.payfast.co.za)
- Email service by [Resend](https://resend.com)

---

**Made with ❤️ for the vaping community**
