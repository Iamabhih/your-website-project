import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, getCorsHeaders } from "../_shared/cors.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  to: string;
  customerName: string;
  orderId: string;
  resetLink: string;
}

async function sendEmail(to: string, customerName: string, orderId: string, resetLink: string) {
  const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
              .order-info { background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #777; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome to Ideal Smoke Supply! 🎉</h1>
              </div>
              <div class="content">
                <h2>Hi ${customerName},</h2>
                <p>Thank you for your order! We've created an account for you to make tracking your order easier.</p>
                
                <div class="order-info">
                  <strong>Order ID:</strong> ${orderId}<br>
                  <strong>Email:</strong> ${to}
                </div>

                <p>To access your account and track your order, please set your password by clicking the button below:</p>
                
                <a href="${resetLink}" class="button">Set Your Password</a>
                
                <p><small>This link will expire in 24 hours for security reasons.</small></p>

                <h3>What's Next?</h3>
                <ul>
                  <li>Set your password using the link above</li>
                  <li>Log in to view your order status</li>
                  <li>Track your shipment in real-time</li>
                  <li>View your order history</li>
                </ul>

                <p>If you didn't place this order, please contact us immediately at support@idealsmokesupply.com</p>

                <p>Thank you for choosing Ideal Smoke Supply!</p>
                
                <p>Best regards,<br><strong>The Ideal Smoke Supply Team</strong></p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Ideal Smoke Supply. All rights reserved.</p>
                <p>You received this email because you placed an order on our website.</p>
              </div>
            </div>
          </body>
        </html>
      `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
    },
    body: JSON.stringify({
      from: 'Ideal Smoke Supply <onboarding@resend.dev>',
      to: [to],
      subject: 'Welcome to Ideal Smoke Supply - Your Account is Ready!',
      html: html,
    }),
  });

  return await response.json();
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const { to, customerName, orderId, resetLink }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", to);

    const emailResponse = await sendEmail(to, customerName, orderId, resetLink);

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
