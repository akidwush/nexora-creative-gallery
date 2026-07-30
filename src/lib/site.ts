const rawNexoraWhatsApp = process.env.NEXT_PUBLIC_NEXORA_WHATSAPP ?? "";

export const NEXORA_WHATSAPP_NUMBER = rawNexoraWhatsApp.replace(/\D/g, "");

export function getNexoraWhatsAppUrl() {
  const message =
    "Halo Nexora, saya ingin mengonfirmasi atau mengirim karya pemenang untuk Nexora Creative Gallery.";

  if (NEXORA_WHATSAPP_NUMBER) {
    return `https://wa.me/${NEXORA_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  }

  // Tetap membuka WhatsApp. Agar langsung menuju admin Nexora,
  // isi NEXT_PUBLIC_NEXORA_WHATSAPP di Vercel dengan format 628xxxxxxxxxx.
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
