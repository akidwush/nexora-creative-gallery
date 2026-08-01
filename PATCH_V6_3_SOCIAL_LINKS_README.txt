NEXORA CREATIVE GALLERY — PATCH V6.3 DYNAMIC SOCIAL LINKS

HASIL
- Tombol "Lanjut ke WhatsApp" diganti menjadi "Semua sosial media Nexora".
- Tombol membuka panel responsif berisi seluruh tautan aktif.
- URL tidak memakai hardcode atau environment Vercel.
- Dashboard admin dapat menambah, mengedit, menghapus, mengurutkan, serta
  mengaktifkan/nonaktifkan tautan.
- Perubahan dashboard disinkronkan ke halaman publik melalui Supabase Realtime.
- RLS membatasi perubahan hanya untuk admin/editor; publik hanya membaca URL aktif.
- Saat tabel belum dipasang, galeri tetap berfungsi dan menampilkan empty state aman.

WAJIB — DATABASE
1. Ekstrak ZIP ke proyek.
2. Buka Supabase Dashboard > SQL Editor.
3. Jalankan seluruh isi supabase/add_nexora_social_links.sql satu kali.
4. Buka /admin dan isi tautan sosial media Nexora.

TERMUX — BUILD, COMMIT, DAN PUSH OTOMATIS
unzip -o ~/storage/downloads/nexora-gallery-v6.3-social-links.zip -d ~/nexora-gallery
cd ~/nexora-gallery
bash scripts/termux-check-push.sh "feat: manage Nexora social links from admin"

Skrip akan menjalankan npm run check, git add, git commit, dan git push origin main.
