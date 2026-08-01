NEXORA CREATIVE GALLERY — TOTAL FIX V6

PERBAIKAN UTAMA
- Detail karya dipindahkan ke Server Component Next.js 16.
- ID tidak valid dan karya yang tidak tersedia mengirim HTTP 404 sebenarnya.
- Judul, deskripsi, Open Graph, Twitter Card, dan gambar share dibuat per karya.
- Error boundary, halaman not-found, share, kontak, dan karya terkait tetap aktif.
- Endpoint login lama yang tidak digunakan dihapus; login tetap memakai Supabase Auth resmi.
- URL Instagram/portofolio divalidasi dan protokol berbahaya ditolak.
- Nomor WhatsApp divalidasi 8–16 digit dan nomor Indonesia tanpa 0 dinormalisasi.
- Ekstensi file upload sekarang mengikuti MIME type, bukan nama file pengguna.
- Optimasi gambar panorama/portrait mempertahankan rasio asli dan laporan dimensi akurat.
- Filter kategori selalu pulih jika animasi browser dibatalkan.
- Content Security Policy diperketat untuk Next.js dan koneksi Supabase.
- Lockfile diperbarui agar clean install dapat dijalankan lagi.
- Regression test ditambahkan untuk URL, WhatsApp, UUID, nama file, dan rasio gambar.

TIDAK MEMERLUKAN SQL BARU.

INSTALL DARI TERMUX
unzip -o ~/storage/downloads/nexora-gallery-total-fix-v6.zip -d ~/nexora-gallery
cd ~/nexora-gallery
rm -f src/app/api/auth/login/route.ts
npm install
npm run check
git add -A
git commit -m "fix: apply gallery total fix v6"
git push origin main

Vercel akan redeploy otomatis dari branch main.
