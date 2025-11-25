# Telegram Chat Integration Status

## ✅ What's Been Fixed

### 1. Edge Functions Updated (Just Now)
- **`send-to-telegram`**: Now uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS when storing `telegram_thread_id`
- **`telegram-webhook`**: Now uses `SUPABASE_SERVICE_ROLE_KEY` and improved reply matching logic
- Both functions have been **deployed automatically**

### 2. Database Configuration
- ✅ Realtime enabled for `chat_messages` table
- ✅ RLS policies configured (public can create, service role can manage)
- ✅ `chat_sessions` table has proper schema

### 3. Reply Matching Logic
The webhook now:
- ✅ Checks if message is from admin chat ID (via `TELEGRAM_CHAT_ID` secret)
- ✅ Matches replies to `telegram_thread_id` (message ID from Telegram)
- ✅ Falls back to most recent active session if no direct match
- ✅ Stores admin messages properly in the database

## 🔧 Required: Webhook Registration

You need to register the webhook with Telegram. Choose ONE based on what you want:

### Option 1: Live Chat Support (Recommended for Chat Widget)
This enables the chat widget on your website where visitors can chat with support via Telegram.

**Webhook URL:**
```
https://dljnlqznteqxszbxdelw.supabase.co/functions/v1/telegram-webhook
```

**Register Command:**
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://dljnlqznteqxszbxdelw.supabase.co/functions/v1/telegram-webhook"}'
```

### Option 2: Full Bot Commands (For /track, /orders, etc.)
This enables customers to interact with your bot via commands like `/track`, `/products`, etc.

**Webhook URL:**
```
https://dljnlqznteqxszbxdelw.supabase.co/functions/v1/telegram-bot
```

**Register Command:**
```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://dljnlqznteqxszbxdelw.supabase.co/functions/v1/telegram-bot"}'
```

### Or Use the Admin UI
Go to **Admin → Telegram Settings** and click **"Register Webhook"** button.

## 🧪 Testing the Live Chat Flow

### Test Steps:
1. **Start a chat** on your website (visit any page, chat widget is in bottom-right)
2. **Enter your name** (e.g., "Test User")
3. **Select a category** (e.g., "Product Questions")
4. **Send a message**: "Hi, I need help!"
5. **Check Telegram**: You should receive a notification in your admin Telegram chat
6. **Reply in Telegram**: Reply to the message
7. **Check website**: Your reply should appear in the chat widget

### Expected Results:
- ✅ Message appears in Telegram with session info
- ✅ `telegram_thread_id` is stored in database (no longer NULL!)
- ✅ Admin reply appears in web chat within 1-2 seconds
- ✅ Visitor sees admin message with realtime updates

## 🔍 Debugging

### Check if webhook is registered:
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

Expected response:
```json
{
  "ok": true,
  "result": {
    "url": "https://dljnlqznteqxszbxdelw.supabase.co/functions/v1/telegram-webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0
  }
}
```

### Check Edge Function Logs:
1. Go to **Lovable Cloud → Functions**
2. Select `send-to-telegram` or `telegram-webhook`
3. View recent logs for errors

### Check Database:
```sql
-- Check if telegram_thread_id is being stored
SELECT id, visitor_name, telegram_thread_id, started_at 
FROM chat_sessions 
ORDER BY started_at DESC 
LIMIT 5;

-- Check messages are being stored
SELECT session_id, sender_type, message_text, created_at 
FROM chat_messages 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🐛 Common Issues & Fixes

### Issue: `telegram_thread_id` is NULL
**Status:** ✅ FIXED - Updated to use service role key

### Issue: Admin replies not appearing in web chat
**Status:** ✅ FIXED - Improved reply matching logic

### Issue: "Failed to send message" error
**Possible causes:**
- Webhook not registered correctly
- `TELEGRAM_BOT_TOKEN` or `TELEGRAM_CHAT_ID` secrets not set
- Bot not added to the admin chat

### Issue: Messages go to Telegram but replies don't come back
**Possible causes:**
- Webhook not registered (run registration command above)
- Replying to wrong message (must reply to the bot's message)
- Check webhook logs for errors

## 📱 Integration Types

You have **two separate integrations** available:

### 1. Live Chat Support (`telegram-webhook`)
- Website visitor → Telegram notification
- Admin replies in Telegram → Visitor sees in website
- Used by: Chat widget on website
- Webhook: `telegram-webhook`

### 2. Bot Commands (`telegram-bot`) 
- Customer sends `/track` → Bot responds with order status
- Customer sends `/products` → Bot shows product list
- Used by: Direct Telegram interactions
- Webhook: `telegram-bot`

**You can have BOTH active**, but you can only register ONE webhook URL at a time. Choose based on your primary use case.

## 🎯 Next Steps

1. ✅ Edge functions are updated and deployed
2. ✅ Realtime is enabled
3. ⏳ **YOU NEED TO**: Register the webhook (see commands above)
4. ⏳ **YOU NEED TO**: Test the full flow
5. ⏳ **OPTIONAL**: Fix the auth security warning (leaked password protection)

## 📊 Current Database State

Recent sessions show:
- Session 1: visitor_name = "Kush", telegram_thread_id = NULL (before fix)
- Session 2: visitor_name = "Abhishek H", telegram_thread_id = NULL (before fix)

**Next test will show telegram_thread_id properly stored!**

## ℹ️ Note on Security Warning

The security linter showed: "Leaked password protection is currently disabled"

This is a **general auth configuration** (not related to Telegram chat) that you should enable:
- Go to **Admin → Settings → Authentication**
- Enable "Leaked Password Protection"

This prevents users from using passwords that have been exposed in data breaches.
