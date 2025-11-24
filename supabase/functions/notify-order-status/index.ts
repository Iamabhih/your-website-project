import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, getCorsHeaders } from "../_shared/cors.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendTelegramMessage(text: string) {
  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
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

    const { orderId, status, type } = await req.json();

    // Get order details
    const { data: order } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .single();

    if (!order) {
      throw new Error("Order not found");
    }

    let message = "";
    const orderNumber = order.id.slice(0, 8);

    if (type === "new_order") {
      message = `🛒 <b>New Order Received!</b>\n\n` +
        `📋 Order #${orderNumber}\n` +
        `👤 Customer: ${order.customer_name}\n` +
        `📧 Email: ${order.customer_email}\n` +
        `📱 Phone: ${order.customer_phone}\n` +
        `💰 Total: R${order.total_amount}\n` +
        `🚚 Delivery: ${order.delivery_method}\n` +
        `📍 Address: ${order.delivery_address}\n\n` +
        `<b>Items:</b>\n`;

      order.order_items.forEach((item: any) => {
        message += `• ${item.product_name} x${item.quantity} - R${item.price}\n`;
      });

      message += `\n✅ Status: ${order.status.toUpperCase()}`;
    } else if (type === "status_update") {
      message = `📦 <b>Order Status Updated</b>\n\n` +
        `📋 Order #${orderNumber}\n` +
        `👤 Customer: ${order.customer_name}\n` +
        `📧 Email: ${order.customer_email}\n` +
        `🔄 New Status: ${status.toUpperCase()}\n` +
        `💰 Total: R${order.total_amount}`;

      // Also notify customer if they have a telegram chat_id
      if (order.telegram_chat_id) {
        const customerMessage = `📦 Your order #${orderNumber} status has been updated to: <b>${status.toUpperCase()}</b>\n\n` +
          `Total: R${order.total_amount}\n` +
          `Delivery: ${order.delivery_method}`;

        await fetch(`${TELEGRAM_API}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: order.telegram_chat_id,
            text: customerMessage,
            parse_mode: "HTML",
          }),
        });
      }
    }

    await sendTelegramMessage(message);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in notify-order-status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
