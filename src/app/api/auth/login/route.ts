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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: unknown;
      password?: unknown;
    };
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email dan password wajib diisi." },
        { status: 400 },
      );
    }

    const { url, key } = getSupabaseConfig();

    if (!url || !key) {
      return NextResponse.json(
        {
          error:
            "Environment Supabase belum terbaca di server Vercel. Periksa NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
        },
        { status: 500 },
      );
    }

    const response = await fetch(
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
      },
    );

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

      return NextResponse.json({ error: message }, { status: response.status });
    }

    if (!payload.access_token || !payload.refresh_token) {
      return NextResponse.json(
        { error: "Supabase tidak mengirim sesi login." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      access_token: payload.access_token,
      refresh_token: payload.refresh_token,
      expires_in: payload.expires_in,
      expires_at: payload.expires_at,
      token_type: payload.token_type,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Server gagal memproses login.",
      },
      { status: 500 },
    );
  }
}
