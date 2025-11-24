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

    // Get retention settings (default: 30 days for system_logs, 90 days for resolved errors)
    const systemLogsRetentionDays = 30;
    const resolvedErrorsRetentionDays = 90;

    const systemLogsDate = new Date();
    systemLogsDate.setDate(systemLogsDate.getDate() - systemLogsRetentionDays);

    const resolvedErrorsDate = new Date();
    resolvedErrorsDate.setDate(resolvedErrorsDate.getDate() - resolvedErrorsRetentionDays);

    // Delete old system logs
    const { error: systemLogsError, count: systemLogsCount } = await supabase
      .from("system_logs")
      .delete({ count: "exact" })
      .lt("created_at", systemLogsDate.toISOString());

    if (systemLogsError) {
      throw systemLogsError;
    }

    // Delete old resolved errors
    const { error: resolvedErrorsError, count: resolvedErrorsCount } = await supabase
      .from("error_tracking")
      .delete({ count: "exact" })
      .eq("is_resolved", true)
      .lt("resolved_at", resolvedErrorsDate.toISOString());

    if (resolvedErrorsError) {
      throw resolvedErrorsError;
    }

    // Delete old audit logs (keep for 1 year)
    const auditLogsDate = new Date();
    auditLogsDate.setDate(auditLogsDate.getDate() - 365);

    const { error: auditLogsError, count: auditLogsCount } = await supabase
      .from("audit_logs")
      .delete({ count: "exact" })
      .lt("created_at", auditLogsDate.toISOString());

    if (auditLogsError) {
      throw auditLogsError;
    }

    console.log("Cleanup completed:", {
      systemLogsDeleted: systemLogsCount,
      resolvedErrorsDeleted: resolvedErrorsCount,
      auditLogsDeleted: auditLogsCount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        systemLogsDeleted: systemLogsCount || 0,
        resolvedErrorsDeleted: resolvedErrorsCount || 0,
        auditLogsDeleted: auditLogsCount || 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in cleanup-logs:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
