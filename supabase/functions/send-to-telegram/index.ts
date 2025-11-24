import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendTelegramMessage(text: string, threadId?: string) {
  const body: any = {
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: "HTML",
  };

  if (threadId) {
    body.message_thread_id = parseInt(threadId);
  }

  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return await response.json();
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

    const { sessionId, message, visitorName, visitorEmail } = await req.json();

    // Get or create chat session
    let session;
    if (sessionId) {
      const { data } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();
      session = data;
    }

    if (!session) {
      // Create new session
      const { data: newSession, error } = await supabase
        .from("chat_sessions")
        .insert({
          visitor_name: visitorName,
          visitor_email: visitorEmail,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      session = newSession;

      // Create a thread in Telegram for this session
      const telegramMessage = `🆕 <b>New Support Chat</b>\n\n` +
        `👤 <b>Name:</b> ${visitorName || "Anonymous"}\n` +
        `📧 <b>Email:</b> ${visitorEmail || "Not provided"}\n` +
        `💬 <b>Message:</b>\n${message}\n\n` +
        `<i>Session ID: ${session.id.slice(0, 8)}</i>`;

      const telegramResponse = await sendTelegramMessage(telegramMessage);
      
      if (telegramResponse.ok) {
        // Store the thread ID
        await supabase
          .from("chat_sessions")
          .update({ telegram_thread_id: telegramResponse.result.message_id.toString() })
          .eq("id", session.id);
      }
    } else {
      // Send message to existing thread
      const telegramMessage = `💬 <b>${visitorName || "Visitor"}:</b>\n${message}`;
      await sendTelegramMessage(telegramMessage, session.telegram_thread_id);
    }

    // Store message in database
    await supabase.from("chat_messages").insert({
      session_id: session.id,
      sender_type: "visitor",
      message_text: message,
    });

    return new Response(
      JSON.stringify({ success: true, sessionId: session.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-to-telegram:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
