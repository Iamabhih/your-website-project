import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // PayFast sends data as form-urlencoded
    const formData = await req.formData();
    const paymentData: Record<string, string> = {};
    
    formData.forEach((value, key) => {
      paymentData[key] = value.toString();
    });

    console.log("PayFast notification received:", paymentData);

    // Extract payment details
    const orderId = paymentData.m_payment_id;
    const paymentStatus = paymentData.payment_status;
    const amountGross = parseFloat(paymentData.amount_gross || "0");

    if (!orderId) {
      console.error("No order ID in notification");
      return new Response("No order ID", { status: 400 });
    }

    // Get order from database
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("Order not found:", orderId, orderError);
      return new Response("Order not found", { status: 404 });
    }

    // Verify amount matches
    if (Math.abs(amountGross - order.total_amount) > 0.01) {
      console.error("Amount mismatch", { received: amountGross, expected: order.total_amount });
      return new Response("Amount mismatch", { status: 400 });
    }

    // Update order based on payment status
    let newStatus = order.status;
    let paymentStatusValue = "pending";

    if (paymentStatus === "COMPLETE") {
      newStatus = "processing";
      paymentStatusValue = "completed";
    } else if (paymentStatus === "FAILED") {
      newStatus = "cancelled";
      paymentStatusValue = "failed";
    } else if (paymentStatus === "CANCELLED") {
      newStatus = "cancelled";
      paymentStatusValue = "cancelled";
    }

    // Update order
    const { error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatusValue,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (updateError) {
      console.error("Failed to update order:", updateError);
      return new Response("Failed to update order", { status: 500 });
    }

    // Create status history entry
    await supabase
      .from("order_status_history")
      .insert({
        order_id: orderId,
        old_status: order.status,
        new_status: newStatus,
        notes: `Payment ${paymentStatus.toLowerCase()} via PayFast`,
      });

    // If payment successful, send notification
    if (paymentStatus === "COMPLETE") {
      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/notify-order-status`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
          },
          body: JSON.stringify({
            orderId: orderId,
            status: "processing",
          }),
        });
      } catch (notifyError) {
        console.error("Failed to send notification:", notifyError);
      }
    }

    console.log(`Order ${orderId} updated: ${paymentStatus}`);
    return new Response("OK", { status: 200 });
  } catch (error: any) {
    console.error("Error processing PayFast notification:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});
