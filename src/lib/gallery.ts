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
};

export const DEFAULT_GALLERY_CATEGORIES = [
  "Poster",
  "Branding",
  "Illustration",
  "Motion",
  "UI/UX",
  "Lainnya",
] as const;

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

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function normalizeWhatsAppNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return digits;
}

export function getWhatsAppUrl(value: string | null | undefined, title?: string) {
  const number = normalizeWhatsAppNumber(value ?? "");
  if (!number) return null;

  const message = title
    ? `Halo, saya tertarik dengan karya \"${title}\" yang tampil di Nexora Creative Gallery.`
    : "Halo, saya melihat profil Anda di Nexora Creative Gallery.";

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function createSafeFileName(fileName: string) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const baseName = fileName
    .replace(/\.[^/.]+$/, "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return `${baseName || "karya"}.${extension}`;
}
