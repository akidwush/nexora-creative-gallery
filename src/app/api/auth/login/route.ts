import { NextResponse } from "next/server";

type SupabaseAuthResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  user?: unknown;
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
};

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, key };
}

function jsonNoStore(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      Pragma: "no-cache",
    },
  });
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (Number.isFinite(contentLength) && contentLength > 4096) {
      return jsonNoStore({ error: "Payload login terlalu besar." }, 413);
    }

    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
    };
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return jsonNoStore({ error: "Email dan password wajib diisi." }, 400);
    }

    if (email.length > 254 || password.length > 1024) {
      return jsonNoStore({ error: "Format kredensial tidak valid." }, 400);
    }

    const { url, key } = getSupabaseConfig();

    if (!url || !key) {
      return jsonNoStore(
        {
          error:
            "Environment Supabase belum terbaca di server Vercel. Periksa NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
        },
        500,
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    let response: Response;

    try {
      response = await fetch(
        `${url.replace(/\/$/, "")}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
          cache: "no-store",
          signal: controller.signal,
        },
      );
    } finally {
      clearTimeout(timeoutId);
    }

    const payload = (await response
      .json()
      .catch(() => ({}))) as SupabaseAuthResponse;

    if (!response.ok) {
      const message =
        payload.error_description ??
        payload.msg ??
        payload.message ??
        payload.error ??
        `Supabase mengembalikan HTTP ${response.status}.`;

      return jsonNoStore({ error: message }, response.status);
    }

    if (!payload.access_token || !payload.refresh_token) {
      return jsonNoStore({ error: "Supabase tidak mengirim sesi login." }, 502);
    }

    return jsonNoStore({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_in: payload.expires_in,
      expires_at: payload.expires_at,
      token_type: payload.token_type,
    });
  } catch (error) {
    return jsonNoStore(
      {
        error:
          error instanceof DOMException && error.name === "AbortError"
            ? "Supabase tidak merespons dalam batas waktu."
            : error instanceof Error
              ? error.message
            : "Server gagal memproses login.",
      },
      error instanceof DOMException && error.name === "AbortError" ? 504 : 500,
    );
  }
}
