import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, getCorsHeaders } from "../_shared/cors.ts";

interface NewsletterEmailRequest {
  to: string;
  subject: string;
  content: string;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const { to, subject, content }: NewsletterEmailRequest = await req.json();

    if (!to || !subject || !content) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: to, subject, content" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Sending newsletter to:", to, "Subject:", subject);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: 'Ideal Smoke Supply <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: content,
      }),
    });

    const emailResponse = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", emailResponse);
      return new Response(
        JSON.stringify({ success: false, error: emailResponse.message || "Failed to send email" }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Newsletter sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in send-newsletter function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
