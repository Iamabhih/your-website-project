import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  orderData: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    delivery_address: string;
    delivery_method: string;
    delivery_notes?: string;
    delivery_price: number;
    total_amount: number;
    user_id?: string;
  };
  items: Array<{
    product_id: string;
    product_name: string;
    price: number;
    quantity: number;
    image_url?: string;
  }>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { orderData, items }: PaymentRequest = await req.json();

    // Validate input
    if (!orderData.customer_email || !orderData.customer_name || items.length === 0) {
      throw new Error("Missing required order information");
    }

    // Get PayFast settings
    const { data: settings } = await supabase
      .from("settings")
      .select("key, value")
      .in("key", ["payfast_mode", "payfast_merchant_id", "payfast_merchant_key", "admin_email"]);

    const settingsMap = settings?.reduce((acc, s) => {
      acc[s.key] = typeof s.value === 'string' ? JSON.parse(s.value) : s.value;
      return acc;
    }, {} as Record<string, any>) || {};

    const mode = settingsMap.payfast_mode || "sandbox";
    const merchantId = settingsMap.payfast_merchant_id || "10000100";
    const merchantKey = settingsMap.payfast_merchant_key || "46f0cd694581a";
    const adminEmail = settingsMap.admin_email || "admin@cbdshop.co.za";

    // Create order in database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      throw new Error("Failed to create order");
    }

    // Create order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      price: item.price,
      quantity: item.quantity,
      image_url: item.image_url,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);
      // Don't fail the request, but log the error
    }

    // Send order confirmation email to customer
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-order-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          to: orderData.customer_email,
          subject: `Order Confirmation #${order.id.slice(0, 8)}`,
          orderDetails: {
            orderId: order.id.slice(0, 8),
            customerName: orderData.customer_name,
            totalAmount: orderData.total_amount,
            deliveryMethod: orderData.delivery_method,
            deliveryAddress: orderData.delivery_address,
            items: items.map(i => ({
              name: i.product_name,
              quantity: i.quantity,
              price: i.price,
            })),
          },
        }),
      });
    } catch (emailError) {
      console.error("Email error:", emailError);
    }

    // Send notification to admin
    try {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-order-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          to: adminEmail,
          subject: `New Order #${order.id.slice(0, 8)} - R${orderData.total_amount}`,
          orderDetails: {
            orderId: order.id.slice(0, 8),
            customerName: orderData.customer_name,
            totalAmount: orderData.total_amount,
            deliveryMethod: orderData.delivery_method,
            deliveryAddress: orderData.delivery_address,
            items: items.map(i => ({
              name: i.product_name,
              quantity: i.quantity,
              price: i.price,
            })),
          },
        }),
      });
    } catch (emailError) {
      console.error("Admin email error:", emailError);
    }

    // Prepare PayFast payment data
    const baseUrl = req.headers.get("origin") || Deno.env.get("SUPABASE_URL");
    const paymentData = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${baseUrl}/payment-success?order_id=${order.id}`,
      cancel_url: `${baseUrl}/payment-cancelled?order_id=${order.id}`,
      notify_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payfast-notify`,
      name_first: orderData.customer_name.split(" ")[0] || orderData.customer_name,
      name_last: orderData.customer_name.split(" ").slice(1).join(" ") || "",
      email_address: orderData.customer_email,
      cell_number: orderData.customer_phone,
      m_payment_id: order.id,
      amount: orderData.total_amount.toFixed(2),
      item_name: `Order #${order.id.slice(0, 8)}`,
      item_description: `${items.length} item(s)`,
    };

    const payfastUrl = mode === "live"
      ? "https://www.payfast.co.za/eng/process"
      : "https://sandbox.payfast.co.za/eng/process";

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        paymentUrl: payfastUrl,
        paymentData,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in create-payfast-payment:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
