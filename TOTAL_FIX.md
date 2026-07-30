# Total Fix

Paket ini memperbaiki:

- 404 pada `/admin/dashboard`;
- login yang tampak tidak merespons;
- redirect diam-diam ketika query profil bermasalah;
- risiko gambar terhapus setelah karya sudah tersimpan;
- konflik beberapa karya unggulan;
- setup Supabase yang sebelumnya bergantung pada tabel `profiles` lama;
- realtime yang belum masuk publication;
- detail karya yang sebelumnya mengirim HTTP 200 untuk karya tidak ditemukan;
- metadata judul, deskripsi, Open Graph, dan Twitter per karya;
- distorsi rasio saat optimasi panorama atau gambar sangat tinggi;
- kegagalan animasi filter yang dapat meninggalkan galeri dalam keadaan sibuk;
- akses publik langsung ke daftar kontak tabel kreator;
- lockfile dan dependensi transitif yang tidak konsisten;
- error dan warning lint.

Kode dashboard tetap memiliki fallback aman bila migration SQL belum dijalankan,
tetapi menjalankan `supabase/gallery_setup.sql` tetap diperlukan agar transaksi
database dan realtime bekerja sepenuhnya.
