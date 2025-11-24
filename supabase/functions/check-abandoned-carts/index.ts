import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

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
        if (cart.telegram_chat_id) {
          const items = Array.isArray(cart.cart_items) ? cart.cart_items : [];
          let message = `🛒 <b>You left items in your cart!</b>\n\n`;
          message += `Hi ${cart.customer_name || "there"}! 👋\n\n`;
          message += `You have ${items.length} item(s) waiting for you:\n\n`;

          items.forEach((item: any) => {
            message += `• ${item.name} x${item.quantity} - R${item.price}\n`;
          });

          message += `\n💰 Total: R${cart.total_amount}\n\n`;
          message += `Complete your order now and enjoy our premium CBD products! 🌿`;

          await sendTelegramMessage(cart.telegram_chat_id, message);
          remindedCount++;

          // Mark as reminded
          await supabase
            .from("abandoned_carts")
            .update({ reminded_at: new Date().toISOString() })
            .eq("id", cart.id);
        }

        // Rate limiting: wait 200ms between messages
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Failed to remind cart ${cart.id}:`, error);
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
