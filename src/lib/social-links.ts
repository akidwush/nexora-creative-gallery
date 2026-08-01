export const SOCIAL_PLATFORM_OPTIONS = [
  { value: "instagram", label: "Instagram", mark: "IG" },
  { value: "tiktok", label: "TikTok", mark: "TT" },
  { value: "youtube", label: "YouTube", mark: "YT" },
  { value: "whatsapp", label: "WhatsApp", mark: "WA" },
  { value: "facebook", label: "Facebook", mark: "FB" },
  { value: "x", label: "X / Twitter", mark: "X" },
  { value: "threads", label: "Threads", mark: "TH" },
  { value: "telegram", label: "Telegram", mark: "TG" },
  { value: "discord", label: "Discord", mark: "DC" },
  { value: "website", label: "Website", mark: "WEB" },
  { value: "other", label: "Lainnya", mark: "↗" },
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORM_OPTIONS)[number]["value"];

export type NexoraSocialLink = {
  id: string;
  platform: string;
  label: string;
  url: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SocialLinkForm = {
  platform: SocialPlatform;
  label: string;
  url: string;
  isActive: boolean;
};

export const EMPTY_SOCIAL_LINK_FORM: SocialLinkForm = {
  platform: "instagram",
  label: "Instagram",
  url: "",
  isActive: true,
};

export function getSocialPlatformMeta(platform: string) {
  return (
    SOCIAL_PLATFORM_OPTIONS.find((option) => option.value === platform) ??
    SOCIAL_PLATFORM_OPTIONS[SOCIAL_PLATFORM_OPTIONS.length - 1]
  );
}

export function isSocialPlatform(value: string): value is SocialPlatform {
  return SOCIAL_PLATFORM_OPTIONS.some((option) => option.value === value);
}

export function normalizeSocialLabel(value: string) {
  const label = value.trim().replace(/\s+/g, " ");

  if (label.length < 2 || label.length > 50) {
    throw new Error("Nama sosial media harus berisi 2–50 karakter.");
  }

  return label;
}

export function normalizeSocialUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error("URL sosial media wajib diisi.");
  }

  if (
    /^[a-z][a-z0-9+.-]*:/i.test(trimmed) &&
    !/^https?:\/\//i.test(trimmed)
  ) {
    throw new Error("URL harus menggunakan alamat http:// atau https://.");
  }

  const candidate = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const url = new URL(candidate);

    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      !url.hostname
    ) {
      throw new Error();
    }

    return url.toString();
  } catch {
    throw new Error("URL sosial media tidak valid.");
  }
}

export function getSocialUrlHostname(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Buka tautan";
  }
}
