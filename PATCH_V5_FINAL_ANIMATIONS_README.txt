NEXORA CREATIVE GALLERY — FINAL MOTION SYSTEM V5

Fitur yang ditambahkan:
1. Intro/preloader dengan fade-in dan fade-out terkontrol.
2. Tombol "Lewati intro" menutup intro secara instan.
3. Smooth scrolling untuk anchor section.
4. Scroll reveal fade + slide-up berbasis IntersectionObserver.
5. Stagger khusus kartu galeri.
6. Transisi filter dua tahap: fade/scale keluar lalu masuk.
7. Native View Transition API untuk animasi reflow grid, dengan fallback CSS.
8. Hover/focus micro-interaction pada kartu, hero, tombol, dan ikon panah.
9. Animasi masuk halaman detail karya dan related works.
10. prefers-reduced-motion dihormati sepenuhnya.
11. Animasi hanya memakai opacity dan transform agar ringan di HP.

Tidak ada dependency baru.
Tidak perlu npm install.
Tidak perlu SQL Supabase.

INSTALL:
unzip -o ~/storage/downloads/nexora-gallery-final-animations-v5.zip -d ~/nexora-gallery
cd ~/nexora-gallery
rm -rf .next
npx next build --webpack
git add -A
git commit -m "feat: finalize performant gallery animations"
git push origin main
