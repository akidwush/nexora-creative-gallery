import "server-only";

import { cache } from "react";
import { createClient } from "@supabase/supabase-js";
import type { GalleryWork } from "@/lib/gallery";

function createPublicServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Konfigurasi Supabase belum lengkap di environment deployment.",
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export const getPublishedWork = cache(async (id: string) => {
  const supabase = createPublicServerClient();
  const { data, error } = await supabase
    .from("gallery_works")
    .select("*")
    .eq("id", id)
    .eq("is_published", true)
    .maybeSingle();

  if (error) {
    throw new Error(`Detail karya gagal dimuat: ${error.message}`);
  }

  return (data as GalleryWork | null) ?? null;
});

export async function getRelatedPublishedWorks(work: GalleryWork) {
  const supabase = createPublicServerClient();
  const { data, error } = await supabase
    .from("gallery_works")
    .select("*")
    .eq("is_published", true)
    .eq("category", work.category)
    .neq("id", work.id)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    return [];
  }

  return (data ?? []) as GalleryWork[];
}
