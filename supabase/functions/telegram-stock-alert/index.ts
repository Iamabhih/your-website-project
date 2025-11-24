import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, getCorsHeaders } from "../_shared/cors.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const WEBSITE_URL = Deno.env.get("WEBSITE_URL") || "https://your-domain.com";

async function sendTelegramMessage(chatId: string, text: string, replyMarkup?: any) {
  const body: any = {
    chat_id: chatId,
    text: text,
    parse_mode: "HTML",
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return await response.json();
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { productId } = await req.json();

    if (!productId) {
      return new Response(
        JSON.stringify({ error: "Product ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return new Response(
        JSON.stringify({ error: "Product not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get subscribers for this product
    const { data: subscriptions, error: subError } = await supabase
      .from("product_subscriptions")
      .select("*")
      .eq("product_id", productId)
      .is("notified_at", null);

    if (subError) throw subError;

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, notified: 0, message: "No subscribers to notify" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let notified = 0;
    const errors: any[] = [];

    // Send notifications to all subscribers
    for (const subscription of subscriptions) {
      if (!subscription.telegram_chat_id) continue;

      try {
        const message = `🎉 <b>Great News!</b>\n\n<b>${product.name}</b> is now back in stock!\n\n💰 Price: R${product.price}\n📦 Available Now\n\nDon't miss out - get yours today!`;

        const keyboard = {
          inline_keyboard: [
            [
              {
                text: "🛒 View Product",
                url: `${WEBSITE_URL}/product/${product.id}`,
              },
            ],
            [
              {
                text: "🛍️ Shop Now",
                url: WEBSITE_URL,
              },
            ],
          ],
        };

        await sendTelegramMessage(subscription.telegram_chat_id, message, keyboard);

        // Mark as notified
        await supabase
          .from("product_subscriptions")
          .update({ notified_at: new Date().toISOString() })
          .eq("id", subscription.id);

        notified++;

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error: any) {
        console.error(`Error notifying ${subscription.telegram_chat_id}:`, error);
        errors.push({
          subscription_id: subscription.id,
          chat_id: subscription.telegram_chat_id,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notified,
        total_subscriptions: subscriptions.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in telegram-stock-alert:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
