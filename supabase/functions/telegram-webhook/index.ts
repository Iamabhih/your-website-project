import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, getCorsHeaders } from "../_shared/cors.ts";

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
    console.log("Telegram webhook update:", JSON.stringify(update));

    const message = update.message;
    if (!message || !message.text) {
      console.log("No message or text in update, skipping");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = message.chat.id.toString();
    const text = message.text;
    const replyToMessageId = message.reply_to_message?.message_id?.toString();
    
    console.log("Processing message:", { chatId, text, replyToMessageId });

    // Check if this is a reply to a previous message (admin replying to customer)
    if (replyToMessageId) {
      console.log(`Looking for session with telegram_thread_id: ${replyToMessageId}`);
      
      const { data: session, error: sessionError } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("telegram_thread_id", replyToMessageId)
        .maybeSingle();

      if (sessionError) {
        console.error("Error querying chat_sessions:", sessionError);
      }

      if (session) {
        console.log(`Found session ${session.id}, storing admin reply`);
        
        // Store admin's reply
        const { error: insertError } = await supabase.from("chat_messages").insert({
          session_id: session.id,
          sender_type: "admin",
          message_text: text,
          telegram_message_id: message.message_id.toString(),
        });

        if (insertError) {
          console.error("Error inserting admin reply:", insertError);
        } else {
          console.log(`Admin replied to session ${session.id}: ${text}`);
        }
        
        // Don't forward to telegram-bot since this is an admin reply
        return new Response(JSON.stringify({ success: true, handled: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        console.log("No matching session found for reply_to_message_id:", replyToMessageId);
      }
    }

    // Forward to telegram-bot for processing
    await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-bot`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
      },
      body: JSON.stringify(update),
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in telegram-webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
