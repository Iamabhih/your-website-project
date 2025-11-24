import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, getCorsHeaders } from "../_shared/cors.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const WEBSITE_URL = Deno.env.get("WEBSITE_URL") || "https://your-domain.com";

interface OrderNotification {
  orderId: string;
  chatId: string;
  status: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyMarkup?: any
) {
  try {
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

    const result = await response.json();
    if (!result.ok) {
      console.error("Telegram API error:", result);
      throw new Error(result.description || "Failed to send message");
    }
    return result;
  } catch (error) {
    console.error("Error sending Telegram message:", error);
    throw error;
  }
}

function getStatusEmoji(status: string): string {
  const emojiMap: Record<string, string> = {
    pending: "⏳",
    processing: "⚙️",
    confirmed: "✅",
    shipped: "🚚",
    out_for_delivery: "📦",
    delivered: "🎉",
    cancelled: "❌",
    refunded: "💰",
  };
  return emojiMap[status] || "📦";
}

function getStatusMessage(status: string): string {
  const messages: Record<string, string> = {
    pending: "Your order has been received and is awaiting processing.",
    processing:
      "Great news! Your order is being prepared for shipment.",
    confirmed: "Your order has been confirmed and will ship soon.",
    shipped: "Your order is on its way!",
    out_for_delivery:
      "Your order is out for delivery and will arrive soon!",
    delivered: "Your order has been delivered! Enjoy your products!",
    cancelled: "Your order has been cancelled.",
    refunded: "Your order has been refunded.",
  };
  return messages[status] || "Your order status has been updated.";
}

function createInlineKeyboard(buttons: any[][]) {
  return {
    inline_keyboard: buttons,
  };
}

async function sendOrderStatusNotification(
  notification: OrderNotification
): Promise<void> {
  const { orderId, chatId, status, trackingNumber, estimatedDelivery } =
    notification;

  const emoji = getStatusEmoji(status);
  const statusMessage = getStatusMessage(status);
  const shortOrderId = orderId.slice(0, 8);

  let message = `${emoji} <b>Order Update</b>\n\n`;
  message += `<b>Order #${shortOrderId}</b>\n`;
  message += `Status: <b>${status.toUpperCase().replace("_", " ")}</b>\n\n`;
  message += `${statusMessage}\n`;

  if (trackingNumber) {
    message += `\n🔢 Tracking Number: <code>${trackingNumber}</code>\n`;
  }

  if (estimatedDelivery) {
    message += `📅 Estimated Delivery: ${
      new Date(estimatedDelivery).toLocaleDateString("en-ZA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }\n`;
  }

  const keyboard = createInlineKeyboard([
    [
      {
        text: "📦 Track Order",
        callback_data: `track_${orderId}`,
      },
      {
        text: "💬 Support",
        callback_data: "menu_support",
      },
    ],
    [
      {
        text: "🌐 View on Website",
        url: `${WEBSITE_URL}/my-orders`,
      },
    ],
  ]);

  await sendTelegramMessage(chatId, message, keyboard);
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

    const body = await req.json();
    const { type, record } = body;

    // Handle different notification types
    if (type === "order_status_update") {
      // Get order details with tracking info
      const { data: order } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_tracking (
            tracking_number,
            estimated_delivery_date
          )
        `
        )
        .eq("id", record.id)
        .single();

      if (!order) {
        throw new Error("Order not found");
      }

      // Find customer's Telegram chat ID from telegram_customers table
      const { data: customer } = await supabase
        .from("telegram_customers")
        .select("chat_id")
        .eq("customer_email", order.customer_email)
        .maybeSingle();

      if (!customer?.chat_id) {
        console.log("Customer does not have Telegram linked");
        return new Response(
          JSON.stringify({
            success: false,
            message: "Customer has no Telegram chat ID",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Send notification
      await sendOrderStatusNotification({
        orderId: order.id,
        chatId: customer.chat_id,
        status: order.status,
        trackingNumber: order.order_tracking?.[0]?.tracking_number,
        estimatedDelivery: order.order_tracking?.[0]?.estimated_delivery_date,
      });

      // Log notification
      await supabase.from("telegram_order_notifications").insert({
        order_id: order.id,
        chat_id: customer.chat_id,
        notification_type: "status_update",
        message_text: `Order status updated to: ${order.status}`,
      });

      return new Response(
        JSON.stringify({ success: true, message: "Notification sent" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle manual notification sending
    if (body.chatId && body.message) {
      await sendTelegramMessage(body.chatId, body.message, body.replyMarkup);

      return new Response(
        JSON.stringify({ success: true, message: "Message sent" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid request" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-telegram-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
