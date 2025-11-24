import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, getCorsHeaders } from "../_shared/cors.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const WEBSITE_URL = Deno.env.get("WEBSITE_URL") || "https://your-domain.com";

interface InlineKeyboard {
  text: string;
  callback_data?: string;
  url?: string;
}

async function sendTelegramMessage(
  chatId: string,
  text: string,
  options: {
    parseMode?: string;
    replyMarkup?: any;
    disableWebPagePreview?: boolean;
  } = {}
) {
  try {
    const body: any = {
      chat_id: chatId,
      text: text,
      parse_mode: options.parseMode || "HTML",
    };

    if (options.replyMarkup) {
      body.reply_markup = options.replyMarkup;
    }
    if (options.disableWebPagePreview) {
      body.disable_web_page_preview = true;
    }

    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await response.json();
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  try {
    await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text: text,
      }),
    });
  } catch (error) {
    console.error("Error answering callback:", error);
  }
}

async function editMessageText(
  chatId: string,
  messageId: number,
  text: string,
  replyMarkup?: any
) {
  try {
    const body: any = {
      chat_id: chatId,
      message_id: messageId,
      text: text,
      parse_mode: "HTML",
    };
    if (replyMarkup) {
      body.reply_markup = replyMarkup;
    }
    await fetch(`${TELEGRAM_API}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (error) {
    console.error("Error editing message:", error);
  }
}

function createInlineKeyboard(buttons: InlineKeyboard[][]) {
  return {
    inline_keyboard: buttons,
  };
}

function getMainMenuKeyboard() {
  return createInlineKeyboard([
    [
      { text: "🛍️ Browse Products", callback_data: "menu_products" },
      { text: "📦 My Orders", callback_data: "menu_orders" },
    ],
    [
      { text: "🔍 Track Order", callback_data: "menu_track" },
      { text: "💬 Support", callback_data: "menu_support" },
    ],
    [
      { text: "🌐 Visit Website", url: WEBSITE_URL },
    ],
  ]);
}

async function handleStart(supabase: any, chatId: string, username?: string) {
  const welcomeMessage = `🔥 <b>Welcome to Ideal Smoke Supply!</b>

I'm your personal shopping assistant for premium vaping products.

<b>What I can help you with:</b>
🛍️ Browse our product catalog
📦 Track and manage your orders
💬 Get instant customer support
🔔 Receive order status updates

Choose an option below to get started:`;

  await sendTelegramMessage(chatId, welcomeMessage, {
    replyMarkup: getMainMenuKeyboard(),
  });
}

async function handleProducts(
  supabase: any,
  chatId: string,
  page = 0,
  messageId?: number
) {
  const ITEMS_PER_PAGE = 5;
  const offset = page * ITEMS_PER_PAGE;

  const { data: products, count } = await supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .order("name")
    .range(offset, offset + ITEMS_PER_PAGE - 1);

  if (!products || products.length === 0) {
    await sendTelegramMessage(
      chatId,
      "😔 No products available at the moment. Check back soon!"
    );
    return;
  }

  let message = `🛍️ <b>Our Products</b>\n\n`;

  products.forEach((product: any, index: number) => {
    const inStock = product.stock_quantity > 0;
    const stockEmoji = inStock ? "✅" : "❌";

    message += `${index + 1}. <b>${product.name}</b>\n`;
    message += `   💰 <b>R${product.price.toFixed(2)}</b>\n`;
    message += `   ${stockEmoji} ${
      inStock ? `Stock: ${product.stock_quantity}` : "Out of Stock"
    }\n`;
    if (product.category) {
      message += `   📁 ${product.category}\n`;
    }
    message += `\n`;
  });

  // Pagination buttons
  const totalPages = Math.ceil((count || 0) / ITEMS_PER_PAGE);
  const paginationButtons: InlineKeyboard[] = [];

  if (page > 0) {
    paginationButtons.push({
      text: "⬅️ Previous",
      callback_data: `products_${page - 1}`,
    });
  }
  paginationButtons.push({
    text: `📄 ${page + 1}/${totalPages}`,
    callback_data: "noop",
  });
  if (page < totalPages - 1) {
    paginationButtons.push({
      text: "Next ➡️",
      callback_data: `products_${page + 1}`,
    });
  }

  const keyboard = createInlineKeyboard([
    paginationButtons,
    [
      { text: "🌐 View Full Catalog", url: `${WEBSITE_URL}/shop` },
      { text: "🏠 Main Menu", callback_data: "menu_main" },
    ],
  ]);

  if (messageId) {
    await editMessageText(chatId, messageId, message, keyboard);
  } else {
    await sendTelegramMessage(chatId, message, { replyMarkup: keyboard });
  }
}

async function handleMyOrders(
  supabase: any,
  chatId: string,
  email?: string,
  messageId?: number
) {
  if (!email) {
    const message = `📧 <b>Track Your Orders</b>

Please enter your email address to view your order history.

Format: your-email@example.com`;

    const keyboard = createInlineKeyboard([
      [{ text: "🏠 Main Menu", callback_data: "menu_main" }],
    ]);

    if (messageId) {
      await editMessageText(chatId, messageId, message, keyboard);
    } else {
      await sendTelegramMessage(chatId, message, { replyMarkup: keyboard });
    }

    // Store state that we're waiting for email
    await supabase.from("telegram_customers").upsert({
      chat_id: chatId,
      awaiting_email_for: "orders",
      last_interaction: new Date().toISOString(),
    });
    return;
  }

  const { data: orders } = await supabase
    .from("orders")
    .select(
      `
      id,
      status,
      total_amount,
      payment_status,
      created_at,
      order_tracking (
        tracking_number,
        courier,
        estimated_delivery_date
      )
    `
    )
    .eq("customer_email", email)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!orders || orders.length === 0) {
    await sendTelegramMessage(
      chatId,
      "📭 No orders found for this email address.\n\nMake sure you used the same email when placing your order."
    );
    return;
  }

  let message = `📦 <b>Your Orders</b>\n\n`;

  orders.forEach((order: any, index: number) => {
    const statusEmoji: Record<string, string> = {
      pending: "⏳",
      processing: "⚙️",
      shipped: "🚚",
      delivered: "✅",
      cancelled: "❌",
    };
    const emoji = statusEmoji[order.status as string] || "📦";

    message += `${index + 1}. <b>Order #${order.id.slice(0, 8)}</b>\n`;
    message += `   ${emoji} Status: <b>${order.status.toUpperCase()}</b>\n`;
    message += `   💰 Total: R${order.total_amount.toFixed(2)}\n`;
    message += `   💳 Payment: ${order.payment_status}\n`;
    message += `   📅 ${new Date(order.created_at).toLocaleDateString("en-ZA")}\n`;

    if (order.order_tracking?.[0]?.tracking_number) {
      message += `   🔢 Tracking: ${order.order_tracking[0].tracking_number}\n`;
    }
    message += `\n`;
  });

  const keyboard = createInlineKeyboard([
    [{ text: "🔄 Refresh Orders", callback_data: `orders_${email}` }],
    [
      { text: "🌐 View on Website", url: `${WEBSITE_URL}/my-orders` },
      { text: "🏠 Main Menu", callback_data: "menu_main" },
    ],
  ]);

  if (messageId) {
    await editMessageText(chatId, messageId, message, keyboard);
  } else {
    await sendTelegramMessage(chatId, message, { replyMarkup: keyboard });
  }

  // Clear the awaiting state
  await supabase
    .from("telegram_customers")
    .update({ awaiting_email_for: null, customer_email: email })
    .eq("chat_id", chatId);
}

async function handleTrackOrder(
  supabase: any,
  chatId: string,
  orderId?: string,
  messageId?: number
) {
  if (!orderId) {
    const message = `🔍 <b>Track Your Order</b>

Please send me your order number.

You can find it in your confirmation email.
Format: Just the order ID (e.g., 12345abc)`;

    const keyboard = createInlineKeyboard([
      [{ text: "📦 View All My Orders", callback_data: "menu_orders" }],
      [{ text: "🏠 Main Menu", callback_data: "menu_main" }],
    ]);

    await sendTelegramMessage(chatId, message, { replyMarkup: keyboard });

    // Store state
    await supabase.from("telegram_customers").upsert({
      chat_id: chatId,
      awaiting_order_id: true,
      last_interaction: new Date().toISOString(),
    });
    return;
  }

  // Find order by partial ID match
  const { data: order } = await supabase
    .from("orders")
    .select(
      `
      *,
      order_tracking (*),
      order_status_history (*)
    `
    )
    .ilike("id", `${orderId}%`)
    .maybeSingle();

  if (!order) {
    await sendTelegramMessage(
      chatId,
      `❌ Order not found.\n\nPlease check your order ID and try again.`
    );
    return;
  }

  const statusEmoji: Record<string, string> = {
    pending: "⏳",
    processing: "⚙️",
    shipped: "🚚",
    delivered: "✅",
    cancelled: "❌",
  };
  const emoji = statusEmoji[order.status as string] || "📦";

  let message = `📦 <b>Order #${order.id.slice(0, 8)}</b>\n\n`;
  message += `${emoji} <b>Status: ${order.status.toUpperCase()}</b>\n\n`;

  message += `<b>Order Details:</b>\n`;
  message += `💰 Total: R${order.total_amount.toFixed(2)}\n`;
  message += `💳 Payment: ${order.payment_status}\n`;
  message += `📅 Ordered: ${new Date(order.created_at).toLocaleDateString("en-ZA")}\n\n`;

  if (order.order_tracking && order.order_tracking.length > 0) {
    const tracking = order.order_tracking[0];
    message += `<b>🚚 Shipping Information:</b>\n`;
    if (tracking.courier) message += `📮 Courier: ${tracking.courier}\n`;
    if (tracking.tracking_number)
      message += `🔢 Tracking: ${tracking.tracking_number}\n`;
    if (tracking.estimated_delivery_date) {
      message += `📅 Estimated Delivery: ${
        new Date(tracking.estimated_delivery_date).toLocaleDateString("en-ZA")
      }\n`;
    }
    if (tracking.last_location)
      message += `📍 Last Location: ${tracking.last_location}\n`;
    message += `\n`;
  }

  if (order.order_status_history && order.order_status_history.length > 0) {
    message += `<b>📝 Status History:</b>\n`;
    order.order_status_history
      .slice(0, 3)
      .forEach((history: any) => {
        message += `• ${history.new_status} - ${
          new Date(history.changed_at).toLocaleDateString("en-ZA")
        }\n`;
      });
  }

  const keyboard = createInlineKeyboard([
    [
      { text: "🔄 Refresh Status", callback_data: `track_${order.id}` },
      { text: "💬 Contact Support", callback_data: "menu_support" },
    ],
    [{ text: "🏠 Main Menu", callback_data: "menu_main" }],
  ]);

  if (messageId) {
    await editMessageText(chatId, messageId, message, keyboard);
  } else {
    await sendTelegramMessage(chatId, message, { replyMarkup: keyboard });
  }

  // Clear awaiting state
  await supabase
    .from("telegram_customers")
    .update({ awaiting_order_id: false })
    .eq("chat_id", chatId);
}

async function handleSupport(supabase: any, chatId: string, messageId?: number) {
  const message = `💬 <b>Customer Support</b>

Our support team is here to help!

<b>Quick Actions:</b>
• Ask a question (just type your message)
• Track an order
• Check delivery info
• Product inquiries

<b>Contact Information:</b>
📧 Email: support@idealsmokesupply.com
📞 Phone: +27 XX XXX XXXX
⏰ Hours: Mon-Fri 9AM-6PM SAST

Just send me your message and our team will respond as soon as possible!`;

  const keyboard = createInlineKeyboard([
    [
      { text: "📦 Track Order", callback_data: "menu_track" },
      { text: "🛍️ Browse Products", callback_data: "menu_products" },
    ],
    [{ text: "🏠 Main Menu", callback_data: "menu_main" }],
  ]);

  if (messageId) {
    await editMessageText(chatId, messageId, message, keyboard);
  } else {
    await sendTelegramMessage(chatId, message, { replyMarkup: keyboard });
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

    const update = await req.json();
    const { message, callback_query } = update;

    // Handle callback queries (button clicks)
    if (callback_query) {
      const chatId = callback_query.message.chat.id.toString();
      const data = callback_query.data;
      const messageId = callback_query.message.message_id;

      await answerCallbackQuery(callback_query.id);

      // Route callback query to appropriate handler
      if (data === "menu_main") {
        await handleStart(supabase, chatId);
      } else if (data === "menu_products") {
        await handleProducts(supabase, chatId, 0, messageId);
      } else if (data.startsWith("products_")) {
        const page = parseInt(data.split("_")[1]);
        await handleProducts(supabase, chatId, page, messageId);
      } else if (data === "menu_orders") {
        await handleMyOrders(supabase, chatId, undefined, messageId);
      } else if (data.startsWith("orders_")) {
        const email = data.split("_")[1];
        await handleMyOrders(supabase, chatId, email, messageId);
      } else if (data === "menu_track") {
        await handleTrackOrder(supabase, chatId, undefined, messageId);
      } else if (data.startsWith("track_")) {
        const orderId = data.split("_")[1];
        await handleTrackOrder(supabase, chatId, orderId, messageId);
      } else if (data === "menu_support") {
        await handleSupport(supabase, chatId, messageId);
      } else if (data.startsWith("category_")) {
        const category = data.split("category_")[1];
        
        const { data: products } = await supabase
          .from("products")
          .select("*")
          .eq("category", category)
          .limit(10);
        
        let message = `📁 <b>${category}</b>\n\n`;
        
        if (!products || products.length === 0) {
          message += "No products in this category.";
        } else {
          products.forEach((product: any, i: number) => {
            message += `${i + 1}. <b>${product.name}</b>\n`;
            message += `   💰 R${product.price}\n`;
            message += `   ${product.stock_quantity > 0 ? "✅ In Stock" : "❌ Out of Stock"}\n\n`;
          });
        }
        
        const keyboard = createInlineKeyboard([
          [{ text: "🔙 All Categories", callback_data: "menu_categories" }],
          [{ text: "🏠 Main Menu", callback_data: "menu_main" }],
        ]);
        
        await editMessageText(chatId, messageId, message, keyboard);
      } else if (data.startsWith("toggle_")) {
        const { data: customer } = await supabase
          .from("telegram_customers")
          .select("notification_preferences")
          .eq("chat_id", chatId)
          .single();
        
        const prefs = customer?.notification_preferences || {
          orders: true,
          promotions: true,
          stock_alerts: true,
        };
        
        const prefKey = data.split("toggle_")[1];
        prefs[prefKey] = !prefs[prefKey];
        
        await supabase
          .from("telegram_customers")
          .update({ notification_preferences: prefs })
          .eq("chat_id", chatId);
        
        await answerCallbackQuery(callback_query.id, "✅ Preference updated!");
        
        // Refresh the preferences view
        let message = "🔔 <b>Notification Preferences</b>\n\n";
        message += `📦 Order Updates: ${prefs.orders ? "✅ Enabled" : "❌ Disabled"}\n`;
        message += `🎁 Promotions: ${prefs.promotions ? "✅ Enabled" : "❌ Disabled"}\n`;
        message += `📢 Stock Alerts: ${prefs.stock_alerts ? "✅ Enabled" : "❌ Disabled"}\n`;
        
        const keyboard = createInlineKeyboard([
          [
            { text: prefs.orders ? "🔕 Disable Orders" : "🔔 Enable Orders", callback_data: "toggle_orders" },
          ],
          [
            { text: prefs.promotions ? "🔕 Disable Promos" : "🔔 Enable Promos", callback_data: "toggle_promotions" },
          ],
          [
            { text: prefs.stock_alerts ? "🔕 Disable Stock" : "🔔 Enable Stock", callback_data: "toggle_stock" },
          ],
          [{ text: "🏠 Main Menu", callback_data: "menu_main" }],
        ]);
        
        await editMessageText(chatId, messageId, message, keyboard);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle text messages
    if (message && message.text) {
      const chatId = message.chat.id.toString();
      const text = message.text.trim();
      const username = message.chat.username;

      // Register or update customer
      await supabase.from("telegram_customers").upsert({
        chat_id: chatId,
        username: username,
        first_name: message.chat.first_name,
        last_name: message.chat.last_name,
        last_interaction: new Date().toISOString(),
      });

      // Check if waiting for specific input
      const { data: customer } = await supabase
        .from("telegram_customers")
        .select("*")
        .eq("chat_id", chatId)
        .maybeSingle();

      // Handle commands
      if (text.startsWith("/start")) {
        // Check for deep link account linking
        if (text.includes("link_")) {
          const linkingCode = text.split("link_")[1];
          
          // Call the account linking function
          const { data: linkResult, error: linkError } = await supabase.functions.invoke(
            "telegram-link-account",
            {
              body: {
                linkingCode: linkingCode,
                chatId: chatId,
                email: customer?.email,
              },
            }
          );

          if (linkError || !linkResult?.success) {
            await sendTelegramMessage(
              chatId,
              "❌ Failed to link account. Please try again or contact support."
            );
          } else {
            await sendTelegramMessage(
              chatId,
              `✅ <b>Account Successfully Linked!</b>\n\nYour Telegram account is now connected to ${linkResult.email}\n\nYou'll receive:\n🔔 Order status updates\n📦 Shipping notifications\n🎁 Exclusive promotions\n📢 Stock alerts\n\nUse the menu below to get started:`,
              { replyMarkup: getMainMenuKeyboard() }
            );
          }
        } else {
          await handleStart(supabase, chatId, username);
        }
      } else if (text.startsWith("/help")) {
        await handleStart(supabase, chatId, username);
      } else if (text.startsWith("/products")) {
        await handleProducts(supabase, chatId);
      } else if (text.startsWith("/myorders")) {
        await handleMyOrders(supabase, chatId);
      } else if (text.startsWith("/track")) {
        await handleTrackOrder(supabase, chatId);
      } else if (text.startsWith("/support")) {
        await handleSupport(supabase, chatId);
      } else if (text.startsWith("/categories")) {
        // Get all unique categories
        const { data: categories } = await supabase
          .from("products")
          .select("category")
          .not("category", "is", null);
        
        const uniqueCategories = [...new Set(categories?.map((p: any) => p.category))];
        
        let message = "📂 <b>Product Categories</b>\n\nChoose a category to browse:\n\n";
        const buttons = uniqueCategories.map((cat: string) => ([
          { text: `📁 ${cat}`, callback_data: `category_${cat}` }
        ]));
        buttons.push([{ text: "🏠 Main Menu", callback_data: "menu_main" }]);
        
        await sendTelegramMessage(chatId, message, {
          replyMarkup: createInlineKeyboard(buttons),
        });
      } else if (text.startsWith("/notifications")) {
        // Manage notification preferences
        const prefs = customer?.notification_preferences || {
          orders: true,
          promotions: true,
          stock_alerts: true,
        };
        
        let message = "🔔 <b>Notification Preferences</b>\n\n";
        message += `📦 Order Updates: ${prefs.orders ? "✅ Enabled" : "❌ Disabled"}\n`;
        message += `🎁 Promotions: ${prefs.promotions ? "✅ Enabled" : "❌ Disabled"}\n`;
        message += `📢 Stock Alerts: ${prefs.stock_alerts ? "✅ Enabled" : "❌ Disabled"}\n`;
        
        const keyboard = createInlineKeyboard([
          [
            { text: prefs.orders ? "🔕 Disable Orders" : "🔔 Enable Orders", callback_data: "toggle_orders" },
          ],
          [
            { text: prefs.promotions ? "🔕 Disable Promos" : "🔔 Enable Promos", callback_data: "toggle_promotions" },
          ],
          [
            { text: prefs.stock_alerts ? "🔕 Disable Stock" : "🔔 Enable Stock", callback_data: "toggle_stock" },
          ],
          [{ text: "🏠 Main Menu", callback_data: "menu_main" }],
        ]);
        
        await sendTelegramMessage(chatId, message, { replyMarkup: keyboard });
      } else if (customer?.awaiting_email_for === "orders" && text.includes("@")) {
        // Email provided for order tracking
        await handleMyOrders(supabase, chatId, text);
      } else if (customer?.awaiting_order_id) {
        // Order ID provided
        await handleTrackOrder(supabase, chatId, text);
      } else {
        // Forward to support/admin
        await supabase.from("telegram_support_messages").insert({
          chat_id: chatId,
          username: username,
          message_text: text,
          status: "pending",
        });

        await sendTelegramMessage(
          chatId,
          `✅ Thank you for your message!\n\nOur support team has been notified and will respond shortly.\n\nIn the meantime, you can:`,
          { replyMarkup: getMainMenuKeyboard() }
        );
      }
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
