/**
 * CORS configuration for Edge Functions
 * In production, restrict to your actual domain
 */

// Get allowed origins from environment or use defaults
const getAllowedOrigins = (): string[] => {
  const envOrigins = Deno.env.get("ALLOWED_ORIGINS");
  if (envOrigins) {
    return envOrigins.split(",").map(origin => origin.trim());
  }

  // Default allowed origins - update these for production
  return [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://dljnlqznteqxszbxdelw.supabase.co",
    // Add your production domain here
  ];
};

export const getCorsHeaders = (origin?: string | null): Record<string, string> => {
  const allowedOrigins = getAllowedOrigins();

  // Check if the origin is allowed
  const isAllowed = origin && allowedOrigins.some(allowed =>
    origin === allowed || origin.endsWith(allowed.replace(/^https?:\/\//, ""))
  );

  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : allowedOrigins[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
};

export const handleCors = (req: Request): Response | null => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin");
    return new Response(null, {
      headers: getCorsHeaders(origin),
      status: 204,
    });
  }
  return null;
};
