NEXORA CREATIVE GALLERY — PATCH V4
Winner Gallery Copy + Artwork Protection

PERUBAHAN:
- Seluruh copy publik diubah agar website berfokus pada karya pemenang Nexora.
- CTA bawah menjadi "Hubungi Nexora via WhatsApp".
- Gambar publik tidak lagi memiliki tombol buka resolusi penuh.
- Klik kanan / long-press context menu, drag, dan copy pada gambar diblokir.
- Semua gambar publik diberi watermark tampilan "NEXORA · KARYA PEMENANG".
- Label "KARYA DILINDUNGI" ditampilkan pada karya.
- Header keamanan ditambahkan untuk mencegah website dipasang dalam iframe pihak lain.

KONFIGURASI WHATSAPP:
Tambahkan environment variable berikut di Vercel:
NEXT_PUBLIC_NEXORA_WHATSAPP=628xxxxxxxxxx

Isi hanya angka dengan kode negara 62. Setelah menambah/mengubah environment variable,
redeploy project agar tombol langsung membuka chat admin Nexora.

CATATAN TEKNIS:
Perlindungan browser dapat mencegah pengunduhan kasual melalui klik kanan, long press,
drag, dan tombol resolusi penuh. Website publik tidak dapat menjamin 100% gambar tidak
dapat direkam melalui screenshot atau alat jaringan browser. Watermark membantu menjaga
atribusi saat gambar direkam dari layar.

Tidak membutuhkan SQL baru atau package npm baru.
