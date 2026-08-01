NEXORA CREATIVE GALLERY — PATCH V6.1 MODAL ARTWORK FILL

PERUBAHAN
- Area kosong kiri dan kanan pada preview karya vertikal kini selalu terisi.
- Gambar karya yang sama dipakai sebagai backdrop blur, gelap, dan edge-to-edge.
- Gambar asli tetap tajam, utuh, berada di tengah, dan tidak dipotong.
- Berlaku untuk karya biasa maupun karya yang memakai proteksi watermark.
- Intensitas blur dikurangi pada HP agar modal tetap ringan.
- Tidak menambah aset gambar, dependency, environment variable, atau SQL.

TERMUX
unzip -o ~/storage/downloads/nexora-gallery-v6.1-modal-art.zip -d ~/nexora-gallery
cd ~/nexora-gallery
npm run check
git add -A
git commit -m "fix: fill modal artwork side space"
git push origin main

Vercel akan redeploy otomatis dari branch main.
