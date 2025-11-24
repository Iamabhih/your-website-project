import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, getCorsHeaders } from "../_shared/cors.ts";

interface LogEvent {
  log_type: "debug" | "info" | "warning" | "error" | "critical";
  source: "frontend" | "edge-function" | "database" | "system";
  category: string;
  message: string;
  stack_trace?: string;
  metadata?: any;
  session_id?: string;
  url?: string;
  user_agent?: string;
}

interface ErrorTrackingEvent {
  error_message: string;
  error_type?: string;
  stack_trace?: string;
  source_file?: string;
  line_number?: number;
  column_number?: number;
  browser_info?: any;
  severity?: "critical" | "error" | "warning" | "info";
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

    const { logs, error: errorEvent } = await req.json();
    
    // Get user context from auth header
    const authHeader = req.headers.get("authorization");
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    // Get IP address
    const ipAddress = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     "unknown";

    // Handle error tracking
    if (errorEvent) {
      const event: ErrorTrackingEvent = errorEvent;
      
      // Create hash for error deduplication
      const hashInput = `${event.error_message}${event.stack_trace || ""}${event.source_file || ""}`;
      const errorHash = Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(hashInput)
          )
        )
      )
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Check if error already exists
      const { data: existingError } = await supabase
        .from("error_tracking")
        .select("id")
        .eq("error_hash", errorHash)
        .single();

      if (existingError) {
        // Increment occurrence count
        await supabase.rpc("increment_error_occurrence", {
          error_hash_param: errorHash,
        });
      } else {
        // Create new error tracking entry
        await supabase.from("error_tracking").insert({
          error_hash: errorHash,
          error_message: event.error_message,
          error_type: event.error_type,
          stack_trace: event.stack_trace,
          source_file: event.source_file,
          line_number: event.line_number,
          column_number: event.column_number,
          browser_info: event.browser_info || {},
          severity: event.severity || "error",
        });
      }
    }

    // Handle batch log events
    if (logs && Array.isArray(logs)) {
      const logEntries = logs.map((log: LogEvent) => ({
        ...log,
        user_id: userId,
        ip_address: ipAddress,
        user_agent: log.user_agent || req.headers.get("user-agent"),
      }));

      const { error: insertError } = await supabase
        .from("system_logs")
        .insert(logEntries);

      if (insertError) {
        console.error("Failed to insert logs:", insertError);
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in log-event:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
