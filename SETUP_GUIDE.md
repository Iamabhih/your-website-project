# Ideal Smoke Supply - Setup Guide

## Overview
Your complete e-commerce platform is now built with:
- ✅ PayFast payment integration
- ✅ Email notifications via Resend
- ✅ Telegram bot for customer service
- ✅ Admin dashboard
- ✅ Automated cart recovery
- ✅ Stock alert system

## 1. Create Admin User

To promote your first user to admin, sign up through the website, then run this SQL:

```sql
-- Replace 'YOUR_USER_EMAIL' with your actual email
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'YOUR_USER_EMAIL'
ON CONFLICT (user_id, role) DO NOTHING;
```

## 2. Telegram Bot Setup

### Step 1: Create Bot with BotFather
1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Follow the prompts to name your bot
4. Copy the **bot token** (looks like: `123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ`)
5. Update the `TELEGRAM_BOT_TOKEN` secret in your backend

### Step 2: Get Your Chat ID
1. Search for **@userinfobot** on Telegram
2. Start a conversation
3. Copy your **chat ID** (a number like: `123456789`)
4. Update the `TELEGRAM_CHAT_ID` secret in your backend

### Step 3: Set Webhook
Run this command (replace with your values):

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://dljnlqznteqxszbxdelw.supabase.co/functions/v1/telegram-webhook"}'
```

### Available Bot Commands:
- `/start` - Welcome message and help
- `/products` - View available products
- `/track` - Track order by email
- `/subscribe` - Subscribe to product availability alerts
- `/help` - Show help message

## 3. Resend Email Setup

### Step 1: Create Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (3,000 emails/month)

### Step 2: Verify Domain (Optional but Recommended)
1. Go to [Domains](https://resend.com/domains)
2. Add your domain and verify DNS records
3. This allows emails from `noreply@yourdomain.com`

### Step 3: Create API Key
1. Go to [API Keys](https://resend.com/api-keys)
2. Create a new API key
3. Copy the key and update the `RESEND_API_KEY` secret

**Note**: Without domain verification, emails will come from `onboarding@resend.dev`

## 4. PayFast Configuration

### For Testing (Sandbox Mode - Already Configured):
- Merchant ID: `10000100`
- Merchant Key: `46f0cd694581a`
- Mode: `sandbox`

Use these [test cards](https://developers.payfast.co.za/docs#step_4_testing):
- **Success**: Card number ending in 0000
- **Failed**: Card number ending in 0001

### For Production:
1. Sign up at [PayFast](https://www.payfast.co.za/)
2. Get your live credentials from your merchant dashboard
3. Update settings in the database:

```sql
UPDATE settings SET value = '"live"' WHERE key = 'payfast_mode';
UPDATE settings SET value = '"YOUR_MERCHANT_ID"' WHERE key = 'payfast_merchant_id';
UPDATE settings SET value = '"YOUR_MERCHANT_KEY"' WHERE key = 'payfast_merchant_key';
UPDATE settings SET value = '"YOUR_ADMIN_EMAIL"' WHERE key = 'admin_email';
```

## 5. Automated Tasks (Optional)

### Cart Recovery System
Reminds customers about abandoned carts after 1 hour.

**Setup with pg_cron:**

```sql
-- Enable extensions (run once)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule cart recovery (runs every hour)
SELECT cron.schedule(
  'check-abandoned-carts',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://dljnlqznteqxszbxdelw.supabase.co/functions/v1/check-abandoned-carts',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsam5scXpudGVxeHN6YnhkZWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzY1MzgsImV4cCI6MjA3OTQxMjUzOH0.EAG1tFOmq8qUzUCQRgvEHBVhXc9IY_p5WWUlk-T0y0c"}'::jsonb
  ) as request_id;
  $$
);
```

### Inventory Alerts
Notifies admin of low stock and customers when products are back in stock.

```sql
-- Schedule inventory check (runs twice daily)
SELECT cron.schedule(
  'check-inventory',
  '0 9,17 * * *',
  $$
  SELECT net.http_post(
    url:='https://dljnlqznteqxszbxdelw.supabase.co/functions/v1/check-inventory',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsam5scXpudGVxeHN6YnhkZWx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MzY1MzgsImV4cCI6MjA3OTQxMjUzOH0.EAG1tFOmq8qUzUCQRgvEHBVhXc9IY_p5WWUlk-T0y0c"}'::jsonb
  ) as request_id;
  $$
);
```

## 6. Product Image Uploads

You can now upload product images to the `product-images` storage bucket:

1. Go to your backend → Storage
2. Upload images to the `product-images` bucket
3. Copy the public URL
4. Update product `image_url` in the products table

## 7. Testing the Platform

### Test Order Flow:
1. Browse products on `/shop`
2. Add items to cart
3. Go to `/checkout`
4. Fill in details and select delivery
5. Use PayFast sandbox for testing
6. Should redirect to `/payment-success`

### Test Admin Functions:
1. Login as admin
2. Access `/admin` dashboard
3. Manage products, orders, customers
4. Update delivery options

### Test Telegram Bot:
1. Search for your bot on Telegram
2. Send `/start` command
3. Try `/products`, `/track` commands
4. Test order notifications

### Test Emails:
1. Place an order
2. Check customer email for confirmation
3. Check admin email for new order alert

## 8. Common Issues

### Emails Not Sending
- Verify Resend API key is correct
- Check domain verification status
- Look at edge function logs

### Telegram Bot Not Responding
- Verify bot token is correct
- Check webhook is set correctly
- Ensure chat ID is correct
- Check edge function logs

### PayFast Payment Issues
- For testing, ensure sandbox mode is enabled
- Verify merchant credentials
- Check return URLs are correct

### Images Not Loading
- Ensure storage bucket is public
- Check image URLs are correct
- Verify RLS policies allow public read

## 9. Production Checklist

Before going live:
- [ ] Switch PayFast to live mode with production credentials
- [ ] Verify domain with Resend for professional emails
- [ ] Set up Telegram webhook correctly
- [ ] Create admin user account
- [ ] Test complete order flow
- [ ] Upload all product images
- [ ] Configure delivery options
- [ ] Test email notifications
- [ ] Enable cron jobs for automation
- [ ] Update banner settings
- [ ] Review all RLS policies

## Support

For issues or questions:
- Check backend logs for error details
- Review edge function logs
- Test API endpoints directly
- Verify all secrets are configured correctly

---

**Your platform is ready to launch! 🚀**
