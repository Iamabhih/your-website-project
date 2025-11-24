import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const update = await req.json();
    console.log("Telegram webhook update:", JSON.stringify(update));

    const message = update.message;
    if (!message || !message.text) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = message.chat.id.toString();
    const text = message.text;
    const threadId = message.message_thread_id?.toString();

    // If this is a reply in a thread, update the chat session
    if (threadId) {
      const { data: session } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("telegram_thread_id", threadId)
        .maybeSingle();

      if (session) {
        // Store admin's reply
        await supabase.from("chat_messages").insert({
          session_id: session.id,
          sender_type: "admin",
          message_text: text,
          telegram_message_id: message.message_id.toString(),
        });

        // You could implement websocket notification here to show the reply on the website
        console.log(`Admin replied to session ${session.id}: ${text}`);
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
