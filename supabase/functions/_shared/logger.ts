import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface LogContext {
  [key: string]: any;
}

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

export async function logError(
  functionName: string,
  message: string,
  error: any,
  context?: LogContext
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    await supabase.from("system_logs").insert({
      log_type: "error",
      source: "edge-function",
      category: functionName,
      message,
      stack_trace: error?.stack || String(error),
      metadata: {
        errorMessage: error?.message || String(error),
        ...context,
      },
    });
    
    console.error(`[${functionName}] ${message}`, error, context);
  } catch (logError) {
    console.error("Failed to log error:", logError);
  }
}

export async function logInfo(
  functionName: string,
  message: string,
  context?: LogContext
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    await supabase.from("system_logs").insert({
      log_type: "info",
      source: "edge-function",
      category: functionName,
      message,
      metadata: context || {},
    });
    
    console.log(`[${functionName}] ${message}`, context);
  } catch (logError) {
    console.error("Failed to log info:", logError);
  }
}

export async function logWarning(
  functionName: string,
  message: string,
  context?: LogContext
) {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    await supabase.from("system_logs").insert({
      log_type: "warning",
      source: "edge-function",
      category: functionName,
      message,
      metadata: context || {},
    });
    
    console.warn(`[${functionName}] ${message}`, context);
  } catch (logError) {
    console.error("Failed to log warning:", logError);
  }
}
