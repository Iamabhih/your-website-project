import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, getCorsHeaders } from "../_shared/cors.ts";

interface EmailRequest {
  to: string;
  subject: string;
  orderDetails: {
    orderId: string;
    customerName: string;
    totalAmount: number;
    deliveryMethod: string;
    deliveryAddress: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  };
}

async function sendEmail(apiKey: string, to: string, subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'CBD Shop <onboarding@resend.dev>',
      to: [to],
      subject: subject,
      html: html,
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
    const { to, subject, orderDetails }: EmailRequest = await req.json();

    const itemsHtml = orderDetails.items
      .map(
        (item) => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">R${item.price.toFixed(2)}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">R${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
      `
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
            .order-details { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; }
            .total { font-size: 18px; font-weight: bold; color: #059669; margin-top: 20px; text-align: right; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">Order Confirmation</h1>
              <p style="margin: 10px 0 0 0;">Thank you for your order!</p>
            </div>
            <div class="content">
              <p>Hi ${orderDetails.customerName},</p>
              <p>Your order has been received and is being processed. We'll keep you updated on its progress.</p>
              
              <div class="order-details">
                <h2 style="margin-top: 0;">Order #${orderDetails.orderId}</h2>
                <p><strong>Delivery Method:</strong> ${orderDetails.deliveryMethod}</p>
                <p><strong>Delivery Address:</strong> ${orderDetails.deliveryAddress}</p>
              </div>

              <h3>Order Items:</h3>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
              </table>

              <div class="total">
                Total: R${orderDetails.totalAmount.toFixed(2)}
              </div>

              <p style="margin-top: 30px;">If you have any questions, please don't hesitate to contact our support team.</p>
              <p>Best regards,<br>CBD Shop Team</p>
            </div>
            <div class="footer">
              <p>This is an automated email. Please do not reply directly to this message.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const emailResponse = await sendEmail(
      Deno.env.get("RESEND_API_KEY") ?? "",
      to,
      subject,
      html
    );

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-order-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
