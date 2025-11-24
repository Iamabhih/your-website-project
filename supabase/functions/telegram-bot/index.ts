import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, getCorsHeaders } from "../_shared/cors.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendTelegramMessage(chatId: string, text: string, parseMode = "HTML") {
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: parseMode,
      }),
    });
    return await response.json();
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
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

    const { message, callback_query } = await req.json();
    const msg = message || callback_query?.message;
    const chatId = msg?.chat?.id?.toString();
    const text = message?.text || "";
    const callbackData = callback_query?.data;

    if (!chatId) {
      return new Response(JSON.stringify({ error: "No chat ID" }), { status: 400, headers: corsHeaders });
    }

    // Register or update customer
    const { data: customer } = await supabase
      .from("telegram_customers")
      .select("*")
      .eq("chat_id", chatId)
      .maybeSingle();

    if (!customer) {
      await supabase.from("telegram_customers").insert({
        chat_id: chatId,
        username: msg.chat.username,
        first_name: msg.chat.first_name,
        last_name: msg.chat.last_name,
      });
    } else {
      await supabase
        .from("telegram_customers")
        .update({ last_interaction: new Date().toISOString() })
        .eq("chat_id", chatId);
    }

    // Handle commands
    if (text.startsWith("/start")) {
      await sendTelegramMessage(
        chatId,
        `🌿 <b>Welcome to CBD Shop!</b>\n\nI'm your personal CBD assistant. Here's what I can help you with:\n\n/products - Browse our CBD products\n/track - Track your order\n/subscribe - Get notified when products are back in stock\n/help - Show this help message\n\nWhat would you like to do today?`
      );
    } else if (text.startsWith("/help")) {
      await sendTelegramMessage(
        chatId,
        `📚 <b>Available Commands:</b>\n\n/products - View all available products\n/track - Track your order by email\n/subscribe - Subscribe to product availability alerts\n/help - Show this help message\n\nNeed human assistance? Just send us a message!`
      );
    } else if (text.startsWith("/products")) {
      const { data: products } = await supabase
        .from("products")
        .select("*")
        .gt("stock_quantity", 0)
        .order("name");

      if (products && products.length > 0) {
        let message = "🛍️ <b>Available Products:</b>\n\n";
        products.forEach((p) => {
          message += `<b>${p.name}</b>\n`;
          message += `💰 R${p.price}\n`;
          message += `📦 Stock: ${p.stock_quantity}\n`;
          if (p.description) message += `${p.description.substring(0, 100)}...\n`;
          message += "\n";
        });
        message += "Visit our website to order!";
        await sendTelegramMessage(chatId, message);
      } else {
        await sendTelegramMessage(chatId, "Sorry, no products available at the moment.");
      }
    } else if (text.startsWith("/track")) {
      await sendTelegramMessage(
        chatId,
        "📧 Please send me your email address to track your orders."
      );
    } else if (text.includes("@") && !text.startsWith("/")) {
      // Email provided for order tracking
      const email = text.trim();
      const { data: orders } = await supabase
        .from("orders")
        .select("*")
        .eq("customer_email", email)
        .order("created_at", { ascending: false })
        .limit(5);

      if (orders && orders.length > 0) {
        let message = `📦 <b>Your Orders:</b>\n\n`;
        orders.forEach((order) => {
          message += `Order #${order.id.slice(0, 8)}\n`;
          message += `Status: ${order.status.toUpperCase()}\n`;
          message += `Total: R${order.total_amount}\n`;
          message += `Date: ${new Date(order.created_at).toLocaleDateString()}\n\n`;
        });
        await sendTelegramMessage(chatId, message);
      } else {
        await sendTelegramMessage(chatId, "No orders found for this email address.");
      }
    } else if (text.startsWith("/subscribe")) {
      const { data: products } = await supabase
        .from("products")
        .select("id, name, stock_quantity")
        .lte("stock_quantity", 5);

      if (products && products.length > 0) {
        let message = "🔔 <b>Subscribe to Product Alerts:</b>\n\n";
        message += "Send me the product name you want to be notified about:\n\n";
        products.forEach((p) => {
          message += `• ${p.name} (${p.stock_quantity} left)\n`;
        });
        await sendTelegramMessage(chatId, message);
      } else {
        await sendTelegramMessage(chatId, "All products are currently in stock!");
      }
    } else {
      // Forward message to admin or handle as support chat
      await sendTelegramMessage(
        chatId,
        "Thank you for your message! Our team will respond shortly. 💬"
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in telegram-bot:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
