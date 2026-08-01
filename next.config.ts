import type { NextConfig } from "next";

function getSupabaseNetworkSources() {
  const fallback = {
    http: "https://*.supabase.co",
    websocket: "wss://*.supabase.co",
  };

  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return {
      http: url.origin,
      websocket: url.origin.replace(/^http/, "ws"),
    };
  } catch {
    return fallback;
  }
}

const supabaseSources = getSupabaseNetworkSources();
const scriptSources = [
  "'self'",
  // Next.js emits inline bootstrap/RSC scripts. A nonce-based policy would
  // require request-scoped middleware, which this static deployment does not use.
  "'unsafe-inline'",
  ...(process.env.NODE_ENV === "development" ? ["'unsafe-eval'"] : []),
].join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src ${scriptSources}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseSources.http} https://*.supabase.co`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseSources.http} ${supabaseSources.websocket} https://*.supabase.co wss://*.supabase.co`,
  `media-src 'self' blob: ${supabaseSources.http} https://*.supabase.co`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(process.env.NODE_ENV === "production"
    ? ["upgrade-insecure-requests"]
    : []),
].join("; ");

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/admin/dashboard",
        destination: "/admin",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
