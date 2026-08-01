export const GALLERY_BUCKET = "gallery-works";

export type GalleryCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type GalleryCreator = {
  id: string;
  name: string;
  slug: string;
  whatsapp: string | null;
  instagram_url: string | null;
  portfolio_url: string | null;
  created_at: string;
};

export type GalleryWork = {
  id: string;
  title: string;
  description: string;
  category: string;
  creator_name: string;
  creator_whatsapp: string | null;
  creator_instagram_url: string | null;
  creator_portfolio_url: string | null;
  image_url: string;
  image_path: string;
  year: number;
  is_featured: boolean;
  is_published: boolean;
  is_protected: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type GalleryWorkForm = {
  title: string;
  description: string;
  category: string;
  creatorName: string;
  creatorWhatsapp: string;
  creatorInstagramUrl: string;
  creatorPortfolioUrl: string;
  year: string;
  isFeatured: boolean;
  isPublished: boolean;
  isProtected: boolean;
};

export const EMPTY_WORK_FORM: GalleryWorkForm = {
  title: "",
  description: "",
  category: "Poster",
  creatorName: "",
  creatorWhatsapp: "",
  creatorInstagramUrl: "",
  creatorPortfolioUrl: "",
  year: String(new Date().getFullYear()),
  isFeatured: false,
  isPublished: true,
  isProtected: false,
};

export const DEFAULT_GALLERY_CATEGORIES = [
  "Poster",
  "Branding",
  "Illustration",
  "Motion",
  "UI/UX",
  "Lainnya",
] as const;

const GALLERY_WORK_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FILE_EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const ALLOWED_FILE_EXTENSIONS = new Set([
  "gif",
  "jpeg",
  "jpg",
  "png",
  "webp",
]);

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function normalizeOptionalUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (
    /^[a-z][a-z0-9+.-]*:/i.test(trimmed) &&
    !/^https?:\/\//i.test(trimmed)
  ) {
    throw new Error(
      "Tautan kreator tidak valid. Gunakan alamat http:// atau https://.",
    );
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
    throw new Error(
      "Tautan kreator tidak valid. Gunakan alamat http:// atau https://.",
    );
  }
}

export function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export function isValidWhatsAppNumber(value: string) {
  return /^[0-9]{8,16}$/.test(value);
}

export function isGalleryWorkId(value: string) {
  return GALLERY_WORK_ID_PATTERN.test(value);
}

export function getWhatsAppUrl(value: string | null | undefined, title?: string) {
  const number = normalizeWhatsAppNumber(value ?? "");
  if (!number || !isValidWhatsAppNumber(number)) return null;

  const message = title
    ? `Halo, saya tertarik dengan karya \"${title}\" yang tampil di Nexora Creative Gallery.`
    : "Halo, saya melihat profil Anda di Nexora Creative Gallery.";

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function createSafeFileName(fileName: string, mimeType?: string) {
  const fileExtension = fileName
    .split(".")
    .pop()
    ?.toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const extension = mimeType
    ? (FILE_EXTENSION_BY_MIME_TYPE[mimeType] ?? "jpg")
    : fileExtension && ALLOWED_FILE_EXTENSIONS.has(fileExtension)
      ? fileExtension
      : "jpg";
  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${baseName || "karya"}.${extension || "jpg"}`;
}
