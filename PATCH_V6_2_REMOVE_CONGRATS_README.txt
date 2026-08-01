NEXORA CREATIVE GALLERY — PATCH V6.2 REMOVE CONGRATS CARD

PERUBAHAN
- Menghapus kartu ucapan "SELAMAT / CONGRATS · SUGOI!" dari modal ringkasan karya.
- Menghapus CSS dan keyframe animasi kartu yang sudah tidak dipakai.
- Jarak otomatis dirapatkan sehingga tombol "Lihat detail lengkap" naik setelah deskripsi.
- Bagian gambar, judul, kreator, kategori, deskripsi, dan tombol sosial tetap dipertahankan.
- Tidak menambah dependency, environment variable, aset, atau SQL.

TERMUX
unzip -o ~/storage/downloads/nexora-gallery-v6.2-remove-congrats.zip -d ~/nexora-gallery
cd ~/nexora-gallery
npm run check
git add -A
git commit -m "fix: remove congrats card from artwork modal"
git push origin main

Vercel akan redeploy otomatis dari branch main.
