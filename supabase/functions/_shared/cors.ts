/**
 * CORS configuration for Edge Functions
 * Configured for idealsupply.online production domain
 */

// Production domain
const PRODUCTION_DOMAIN = "idealsupply.online";

// Get allowed origins from environment or use defaults
const getAllowedOrigins = (): string[] => {
  const envOrigins = Deno.env.get("ALLOWED_ORIGINS");
  if (envOrigins) {
    return envOrigins.split(",").map(origin => origin.trim());
  }

  // Default allowed origins - production and development
  return [
    `https://${PRODUCTION_DOMAIN}`,
    `https://www.${PRODUCTION_DOMAIN}`,
    "http://localhost:5173",
    "http://localhost:4173",
    "http://localhost:8080",
    "https://dljnlqznteqxszbxdelw.supabase.co",
  ];
};

// Trusted domain patterns for Lovable platform
const TRUSTED_DOMAIN_PATTERNS = [
  /^https:\/\/[a-z0-9-]+\.lovableproject\.com$/,
  /^https:\/\/[a-z0-9-]+\.lovable\.app$/,
];

export const getCorsHeaders = (origin?: string | null): Record<string, string> => {
  const allowedOrigins = getAllowedOrigins();

  // Check if origin exactly matches allowed list
  const isExactMatch = origin && allowedOrigins.includes(origin);

  // Check if origin matches trusted patterns (secure regex matching)
  const isTrustedPattern = origin && TRUSTED_DOMAIN_PATTERNS.some(pattern => pattern.test(origin));

  const isAllowed = isExactMatch || isTrustedPattern;

  // Return specific origin if allowed, otherwise return the production domain (not wildcard)
  return {
    "Access-Control-Allow-Origin": isAllowed && origin ? origin : `https://${PRODUCTION_DOMAIN}`,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
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
