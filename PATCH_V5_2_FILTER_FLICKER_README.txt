NEXORA CREATIVE GALLERY — PATCH V5.2
Fix: category filter flicker / kedip pada Android

Perbaikan:
- Menghapus kombinasi ganda View Transition API + animasi CSS yang membuat snapshot gambar berkedip.
- Mengubah filter menjadi satu urutan CSS terkontrol: fade-out selesai, data diganti, lalu fade-in.
- Menghilangkan stagger saat keluar agar kartu tidak masih terlihat ketika grid ditukar.
- Grid mempertahankan status scroll-reveal; kartu baru tidak kembali opacity 0 saat kategori berubah.
- Animasi awal galeri, stagger pertama, long-press, intro, dan reduced-motion tetap bekerja.

Tidak perlu SQL atau npm install.
