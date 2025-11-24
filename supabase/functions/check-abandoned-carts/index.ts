import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, getCorsHeaders } from "../_shared/cors.ts";
import { logInfo, logError } from "../_shared/logger.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID"); // Admin chat ID
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: any) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    }),
  });
  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check notification settings
    const { data: settings } = await supabase
      .from('telegram_notification_settings')
      .select('*')
      .eq('setting_key', 'abandoned_cart_alerts')
      .single();

    if (!settings?.is_enabled) {
      await logInfo('check-abandoned-carts', 'Abandoned cart notifications disabled');
      return new Response(
        JSON.stringify({ success: true, message: 'Notifications disabled' }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Find abandoned carts (created more than 1 hour ago, not reminded yet)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: carts } = await supabase
      .from("abandoned_carts")
      .select("*")
      .lt("created_at", oneHourAgo)
      .is("reminded_at", null)
      .eq("recovered", false)
      .limit(50);

    if (!carts || carts.length === 0) {
      return new Response(
        JSON.stringify({ success: true, reminded: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let remindedCount = 0;
    let failedCount = 0;

    for (const cart of carts) {
      try {
        const items = Array.isArray(cart.cart_items) ? cart.cart_items : [];
        
        // Send admin notification
        if (TELEGRAM_CHAT_ID) {
          let adminMessage = `🚨 <b>Abandoned Cart Alert</b>\n\n`;
          adminMessage += `<b>Customer:</b> ${cart.customer_name || 'Anonymous'}\n`;
          if (cart.customer_email) adminMessage += `<b>Email:</b> ${cart.customer_email}\n`;
          if (cart.customer_phone) adminMessage += `<b>Phone:</b> ${cart.customer_phone}\n`;
          adminMessage += `<b>Items:</b> ${items.length}\n`;
          adminMessage += `<b>Value:</b> R${cart.total_amount}\n`;
          adminMessage += `<b>Has Telegram:</b> ${cart.telegram_chat_id ? '✅' : '❌'}\n`;

          await sendTelegramMessage(TELEGRAM_CHAT_ID, adminMessage);
          await logInfo('check-abandoned-carts', 'Admin notification sent', { cartId: cart.id });
        }

        // Send customer reminder if Telegram linked
        if (cart.telegram_chat_id) {
          let customerMessage = `🛒 <b>You left items in your cart!</b>\n\n`;
          customerMessage += `Hi ${cart.customer_name || "there"}! 👋\n\n`;
          customerMessage += `You have ${items.length} item(s) waiting for you:\n\n`;

          items.forEach((item: any) => {
            customerMessage += `• ${item.name} x${item.quantity} - R${item.price}\n`;
          });

          customerMessage += `\n💰 Total: R${cart.total_amount}\n\n`;
          customerMessage += `Complete your order now and enjoy our premium CBD products! 🌿`;

          const baseUrl = Deno.env.get("VITE_SUPABASE_URL")?.replace('/functions/v1', '') || '';
          const inlineKeyboard = {
            inline_keyboard: [
              [
                { text: "🛍️ Complete Order", url: `${baseUrl}/checkout` },
                { text: "💬 Need Help?", callback_data: "support" },
              ],
            ],
          };

          await sendTelegramMessage(cart.telegram_chat_id, customerMessage, inlineKeyboard);
          remindedCount++;

          // Mark as reminded
          await supabase
            .from("abandoned_carts")
            .update({ reminded_at: new Date().toISOString() })
            .eq("id", cart.id);
          
          await logInfo('check-abandoned-carts', 'Customer reminder sent', { cartId: cart.id });
        }

        // Rate limiting: wait 200ms between messages
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        await logError('check-abandoned-carts', `Failed to process cart ${cart.id}`, error);
        failedCount++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        reminded: remindedCount,
        failed: failedCount,
        total: carts.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in check-abandoned-carts:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
