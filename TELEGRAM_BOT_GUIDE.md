# Telegram Bot Integration Guide

## 🤖 World-Class Telegram Bot for Ideal Smoke Supply

This guide covers the complete setup and features of your enterprise-grade Telegram bot for customer interaction and order management.

## Features Overview

### ✅ Customer Features
- **Interactive Menu Navigation** - Beautiful inline keyboard menus
- **Product Browsing** - Paginated product catalog with stock status
- **Order Tracking** - Real-time order status updates and tracking
- **Order Management** - View all orders, get shipping details
- **Customer Support** - Direct messaging to support team
- **Status Notifications** - Automatic updates when order status changes

### ✅ Admin Features
- **Support Message Management** - View and respond to customer inquiries
- **Order Status Updates** - Automatically notify customers via Telegram
- **Customer Insights** - Track customer interactions and preferences

## Setup Instructions

### 1. Create Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow prompts to create your bot:
   - Bot name: `Ideal Smoke Supply Bot`
   - Username: `ideal_smoke_supply_bot` (must end with 'bot')
4. Save the **Bot Token** provided by BotFather
5. Send `/setdescription` to add bot description
6. Send `/setabouttext` to add "About" text
7. Send `/setcommands` and paste:
   ```
   start - Start the bot and show main menu
   products - Browse product catalog
   myorders - View your order history
   track - Track a specific order
   support - Contact customer support
   help - Show help and commands
   ```

### 2. Configure Supabase Environment Variables

Add these to your Supabase project settings:

```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
WEBSITE_URL=https://your-domain.com
```

### 3. Deploy Supabase Functions

Deploy all Telegram-related Edge Functions:

```bash
# Deploy enhanced bot handler
supabase functions deploy telegram-bot-enhanced

# Deploy webhook receiver
supabase functions deploy telegram-webhook

# Deploy notification sender
supabase functions deploy send-telegram-notification
```

### 4. Set Webhook URL

Set your bot's webhook to point to Supabase:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/telegram-webhook"
  }'
```

Or use the admin settings page at `/admin/settings` - it has a one-click webhook setup!

### 5. Run Database Migration

Apply the Telegram enhancement migration:

```bash
supabase migration up --db-url "your-database-url"
```

Or apply via Supabase Dashboard:
- Go to SQL Editor
- Upload `supabase/migrations/20250124000005_enhance_telegram_integration.sql`
- Execute

### 6. Test Your Bot

1. Open Telegram and search for your bot username
2. Send `/start` command
3. You should see the welcome message with interactive buttons
4. Test all menu options

## Bot Commands Reference

### Customer Commands

| Command | Description |
|---------|-------------|
| `/start` | Initialize bot and show main menu |
| `/products` | Browse product catalog with pagination |
| `/myorders` | View order history (requires email) |
| `/track` | Track specific order by ID |
| `/support` | Contact customer support team |
| `/help` | Display help and available commands |

### Interactive Menu Options

**Main Menu:**
- 🛍️ Browse Products
- 📦 My Orders
- 🔍 Track Order
- 💬 Support
- 🌐 Visit Website

**Product Browser:**
- Paginated product list (5 per page)
- Stock status indicators
- Price information
- Direct link to full catalog

**Order Tracking:**
- Order status with emoji indicators
- Shipping information
- Tracking numbers
- Estimated delivery dates
- Status history

## Automatic Notifications

### Order Status Updates

Customers automatically receive Telegram notifications when:

1. **Order Confirmed** - Order received and confirmed
2. **Processing** - Order being prepared for shipment
3. **Shipped** - Order dispatched with tracking number
4. **Out for Delivery** - Order on the way
5. **Delivered** - Order successfully delivered
6. **Cancelled/Refunded** - Order cancelled or refunded

**Example Notification:**
```
🚚 Order Update

Order #12345abc
Status: SHIPPED

Your order is on its way!

🔢 Tracking Number: TRK123456789
📅 Estimated Delivery: Monday, January 27, 2025

[Track Order] [Support]
[View on Website]
```

## Linking Customers to Telegram

For customers to receive order notifications, they must link their Telegram account:

### Option 1: Manual Linking (Admin)
Update customer record in database:
```sql
UPDATE customers
SET telegram_chat_id = '123456789'
WHERE email = 'customer@example.com';
```

### Option 2: Automatic Linking (Future Enhancement)
Add a "Link Telegram" button in user account settings that:
1. Generates unique token
2. Redirects to bot with `/start link_TOKEN`
3. Bot verifies and links account

## Customer Support Workflow

### How It Works:

1. **Customer sends message** to bot
2. **Message stored** in `telegram_support_messages` table
3. **Admin views** messages in admin dashboard (future feature)
4. **Admin responds** via Telegram or dashboard
5. **Customer receives** response notification

### Support Message Database:

Messages are stored with:
- Chat ID
- Username
- Message text
- Status (pending/responded/resolved)
- Response text
- Timestamp

## Admin Integration

### View Support Messages (Future Feature)

Create an admin page to:
- View all pending support messages
- Respond directly from dashboard
- Mark as resolved
- View conversation history

### Send Broadcast Messages (Future Enhancement)

Ability to:
- Send announcements to all customers
- Target specific customer segments
- Schedule messages
- Track delivery status

## Database Schema

### Tables Created:

**telegram_support_messages**
- Stores customer support inquiries
- Tracks response status
- Links to admin responses

**telegram_order_notifications**
- Logs all sent notifications
- Delivery status tracking
- Order linkage

**telegram_customers** (Enhanced)
- Customer chat IDs
- Interaction history
- Notification preferences
- Email linking
- State management for conversations

## Advanced Features

### Conversation State Management

The bot tracks conversation state to handle multi-step interactions:

```typescript
// Example: Waiting for email input
customer.awaiting_email_for = 'orders';

// Example: Waiting for order ID
customer.awaiting_order_id = true;
```

### Callback Query Handlers

Inline buttons use callback data for navigation:

```
menu_main - Main menu
menu_products - Product browser
products_0 - Products page 0
menu_orders - My orders
menu_track - Track order
track_ORDER_ID - Track specific order
menu_support - Support menu
```

### Error Handling

The bot gracefully handles:
- Invalid commands
- Missing data
- API failures
- Network timeouts
- Unauthorized access

## Monitoring & Analytics

### Key Metrics to Track:

1. **Bot Usage:**
   - Total users
   - Active users (daily/weekly)
   - Command usage frequency
   - Most used features

2. **Support:**
   - Average response time
   - Resolution rate
   - Customer satisfaction

3. **Orders:**
   - Notification delivery rate
   - Click-through rate on order tracking
   - Customer engagement

### Logging:

All bot interactions are logged to:
- `telegram_customers.last_interaction`
- `telegram_support_messages`
- `telegram_order_notifications`

## Security Best Practices

1. **Never expose bot token** - Use environment variables only
2. **Validate webhook requests** - Verify they come from Telegram
3. **Rate limiting** - Prevent abuse with rate limits
4. **Input validation** - Sanitize all user inputs
5. **RLS policies** - Ensure proper data access control

## Troubleshooting

### Bot Not Responding

1. Check webhook status:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getWebhookInfo"
   ```

2. Verify environment variables in Supabase
3. Check Edge Function logs in Supabase Dashboard
4. Test webhook URL manually

### Notifications Not Sending

1. Verify customer has `telegram_chat_id` set
2. Check `telegram_order_notifications` table for errors
3. Verify bot token is correct
4. Check Telegram API rate limits

### Database Errors

1. Ensure migration was applied successfully
2. Check RLS policies are correct
3. Verify service role key has permissions
4. Review Supabase logs

## Future Enhancements

### Phase 2 Features:
- [ ] Shopping cart via Telegram
- [ ] Payment link generation
- [ ] Product search functionality
- [ ] Wishlist management
- [ ] Review submission via bot
- [ ] Referral program
- [ ] Loyalty points tracking

### Phase 3 Features:
- [ ] AI-powered support responses
- [ ] Multi-language support
- [ ] Voice message handling
- [ ] Image recognition for product queries
- [ ] Automated FAQ responses
- [ ] Customer feedback surveys

## Testing Checklist

- [ ] `/start` shows welcome message with menu
- [ ] Product browser shows products with pagination
- [ ] Order tracking works with email
- [ ] Order tracking works with order ID
- [ ] Support messages are stored correctly
- [ ] Inline buttons navigate properly
- [ ] Links to website work correctly
- [ ] Order status notifications send
- [ ] Error messages display appropriately
- [ ] Conversation state persists correctly

## Support

For issues or questions:
- GitHub Issues: Create an issue in the repository
- Email: dev@idealsmokesupply.com
- Documentation: This guide and code comments

## License

Part of Ideal Smoke Supply e-commerce platform.

---

**Built with ❤️ using Supabase Edge Functions and Telegram Bot API**
