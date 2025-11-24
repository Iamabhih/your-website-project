import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { linkingCode, chatId, email } = await req.json();

    if (!linkingCode || !chatId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Decode the linking code to get user ID
    try {
      const userId = atob(linkingCode);

      // Get user email from auth
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      
      if (userError || !userData.user) {
        throw new Error("Invalid linking code");
      }

      const userEmail = userData.user.email;

      // Update or create telegram_customers record
      const { data: existing } = await supabase
        .from("telegram_customers")
        .select("*")
        .eq("chat_id", chatId)
        .maybeSingle();

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("telegram_customers")
          .update({
            customer_email: userEmail,
            last_interaction: new Date().toISOString(),
          })
          .eq("chat_id", chatId);

        if (updateError) throw updateError;
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from("telegram_customers")
          .insert({
            chat_id: chatId,
            customer_email: userEmail,
            email: email || userEmail,
            last_interaction: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Account linked successfully",
          email: userEmail,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (decodeError) {
      return new Response(
        JSON.stringify({ error: "Invalid linking code format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error: any) {
    console.error("Error in telegram-link-account:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
