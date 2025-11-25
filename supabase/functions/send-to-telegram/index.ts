import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, getCorsHeaders } from "../_shared/cors.ts";

const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
const TELEGRAM_CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID");
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendTelegramMessage(text: string, replyToMessageId?: string) {
  const body: any = {
    chat_id: TELEGRAM_CHAT_ID,
    text: text,
    parse_mode: "HTML",
  };

  // Use reply_to_message_id instead of message_thread_id
  // This works for all chat types (private, group, etc.)
  if (replyToMessageId) {
    body.reply_to_message_id = parseInt(replyToMessageId);
  }

  const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    console.log('send-to-telegram received request:', JSON.stringify(body));
    
    // Handle webhook registration
    if (body.event === 'register_webhook') {
      console.log('Registering webhook with Telegram');
      const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: body.webhookUrl,
        }),
      });

      const result = await response.json();
      console.log('Webhook registration response:', result);
      
      if (!result.ok) {
        throw new Error(`Failed to register webhook: ${JSON.stringify(result)}`);
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Webhook registered successfully', result }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Handle test message from admin settings
    if (body.event === 'test') {
      console.log('Sending test message to Telegram');
      const testResponse = await sendTelegramMessage(body.message);
      
      if (!testResponse.ok) {
        throw new Error(`Telegram API error: ${JSON.stringify(testResponse)}`);
      }
      
      return new Response(
        JSON.stringify({ success: true, message: 'Test message sent successfully' }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Handle admin reply to support message
    if (body.event === 'admin_reply') {
      const { chatId, message } = body;
      
      if (!chatId || !message) {
        return new Response(
          JSON.stringify({ error: "Missing chatId or message" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `📨 <b>Support Reply</b>\n\n${message}`,
          parse_mode: "HTML",
        }),
      });

      const result = await response.json();
      
      if (!result.ok) {
        throw new Error(`Telegram API error: ${JSON.stringify(result)}`);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Reply sent successfully' }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { sessionId, message, visitorName, visitorEmail } = body;

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
      console.log('Telegram API response for new session:', JSON.stringify(telegramResponse));
      
      if (telegramResponse.ok) {
        const messageId = telegramResponse.result.message_id.toString();
        console.log(`Storing telegram_thread_id: ${messageId} for session: ${session.id}`);
        
        // Store the message ID and chat ID for reply matching
        const { error: updateError } = await supabase
          .from("chat_sessions")
          .update({ 
            telegram_thread_id: messageId,
          })
          .eq("id", session.id);
        
        if (updateError) {
          console.error('Error storing telegram_thread_id:', updateError);
        }
      } else {
        console.error('Telegram API error:', telegramResponse);
      }
    } else {
      // Send message to existing thread - include session context
      const sessionShortId = session.id.slice(0, 8);
      const telegramMessage = `💬 <b>${visitorName || "Visitor"}</b> <i>(${sessionShortId})</i>:\n${message}`;
      
      console.log(`Sending to existing thread: ${session.telegram_thread_id}`);
      // Use reply_to_message_id for visual reply chain
      const response = await sendTelegramMessage(telegramMessage, session.telegram_thread_id);
      console.log('Telegram response for existing thread:', JSON.stringify(response));
      
      // If reply fails (message deleted, etc.), send without reply
      if (!response.ok && response.error_code === 400) {
        console.log('Reply failed, sending as new message');
        const fallbackResponse = await sendTelegramMessage(telegramMessage);
        console.log('Fallback response:', JSON.stringify(fallbackResponse));
        
        // Update telegram_thread_id to new message
        if (fallbackResponse.ok) {
          const messageId = fallbackResponse.result.message_id.toString();
          await supabase.from("chat_sessions")
            .update({ telegram_thread_id: messageId })
            .eq("id", session.id);
          console.log(`Updated telegram_thread_id to ${messageId} after fallback`);
        }
      }
      
      // If session doesn't have telegram_thread_id yet, store it now
      if (!session.telegram_thread_id && response.ok) {
        const messageId = response.result.message_id.toString();
        console.log(`Updating telegram_thread_id: ${messageId} for session: ${session.id}`);
        
        const { error: updateError } = await supabase
          .from("chat_sessions")
          .update({ telegram_thread_id: messageId })
          .eq("id", session.id);
        
        if (updateError) {
          console.error('Error updating telegram_thread_id:', updateError);
        } else {
          console.log(`Successfully stored telegram_thread_id for session ${session.id}`);
        }
      }
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
