import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, getCorsHeaders } from "../_shared/cors.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendTelegramMessage(chatId: string, text: string) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: "HTML",
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

    // Check for low stock products (less than or equal to 5 items)
    const { data: lowStockProducts } = await supabase
      .from("products")
      .select("*")
      .lte("stock_quantity", 5)
      .gt("stock_quantity", 0);

    // Notify admin about low stock
    if (lowStockProducts && lowStockProducts.length > 0) {
      let message = `⚠️ <b>Low Stock Alert</b>\n\n`;
      message += `The following products are running low:\n\n`;

      lowStockProducts.forEach((product) => {
        message += `• <b>${product.name}</b>\n`;
        message += `  Stock: ${product.stock_quantity} units\n`;
        message += `  Price: R${product.price}\n\n`;
      });

      message += `Please restock soon to avoid out-of-stock situations.`;

      await sendTelegramMessage(TELEGRAM_CHAT_ID!, message);
    }

    // Check for products that are back in stock and notify subscribers
    const { data: backInStockProducts } = await supabase
      .from("products")
      .select("*, product_subscriptions(*)")
      .gt("stock_quantity", 0);

    let notifiedCount = 0;

    if (backInStockProducts) {
      for (const product of backInStockProducts) {
        const subscriptions = product.product_subscriptions || [];
        
        for (const subscription of subscriptions) {
          // Only notify if not already notified
          if (!subscription.notified_at && subscription.telegram_chat_id) {
            try {
              const message = `✅ <b>Product Back in Stock!</b>\n\n` +
                `🌿 <b>${product.name}</b> is now available!\n\n` +
                `💰 Price: R${product.price}\n` +
                `📦 Stock: ${product.stock_quantity} units\n\n` +
                `Order now before it's gone again!`;

              await sendTelegramMessage(subscription.telegram_chat_id, message);
              
              // Mark as notified
              await supabase
                .from("product_subscriptions")
                .update({ notified_at: new Date().toISOString() })
                .eq("id", subscription.id);

              notifiedCount++;

              // Rate limiting
              await new Promise((resolve) => setTimeout(resolve, 200));
            } catch (error) {
              console.error(`Failed to notify subscription ${subscription.id}:`, error);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        lowStockCount: lowStockProducts?.length || 0,
        notifiedSubscribers: notifiedCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in check-inventory:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
