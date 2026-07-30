# Nexora Creative Gallery

Galeri karya visual berbasis Next.js 16, Supabase, dan Vercel. Tampilan galeri
menggunakan masonry sehingga gambar portrait, landscape, persegi, panorama,
dan rasio tinggi tetap mengikuti proporsi aslinya.

## Route

- `/` — galeri publik
- `/karya/[id]` — detail karya dengan metadata sosial
- `/admin/login` — login admin/editor
- `/admin` — dashboard
- `/admin/dashboard` — otomatis dialihkan ke `/admin`

## Environment

Buat `.env.local` untuk penggunaan lokal dan pasang nilai yang sama di Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=KEY_KAMU
NEXT_PUBLIC_SITE_URL=https://nexora-creative-gallery.vercel.app
NEXT_PUBLIC_NEXORA_WHATSAPP=628xxxxxxxxxx
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` tetap didukung sebagai nama alternatif untuk
publishable key. Jangan pernah meletakkan `service_role` key di variabel
`NEXT_PUBLIC_*`.

## Supabase

Jalankan seluruh isi berikut melalui Supabase Dashboard → SQL Editor:

```text
supabase/gallery_setup.sql
```

Script aman dijalankan ulang dan akan:

- menyiapkan `profiles` bila belum ada;
- membuat/memperbarui tabel galeri;
- membuat bucket `gallery-works`;
- memasang RLS;
- mengaktifkan realtime untuk karya dan kategori;
- menambahkan transaksi `save_gallery_work`;
- memastikan hanya satu karya yang berstatus unggulan.

Sesudah membuat akun melalui Supabase Authentication, berikan akses dengan SQL:

```sql
insert into public.profiles (id, display_name, role)
select id, 'Nexora Admin', 'admin'
from auth.users
where email = 'EMAIL_ADMIN_KAMU'
on conflict (id) do update
set display_name = excluded.display_name,
    role = excluded.role;
```

## Validasi

```bash
npm ci
npm run check
```

`npm run check` menjalankan lint tanpa warning lalu production build melalui
Webpack agar tetap kompatibel dengan workflow Android/Termux.

## Deploy dari Termux

Setelah ZIP total fix diekstrak ke `~/nexora-gallery`:

```bash
cd ~/nexora-gallery
git add -A
git commit -m "fix: stabilize Nexora gallery"
git push origin main
```

Vercel akan melakukan deployment otomatis dari branch `main`.

## Catatan watermark

Opsi watermark memblokir long-press, drag, menu konteks biasa, dan menambahkan
watermark visual. Gambar yang memang ditampilkan untuk publik tetap dapat
direkam atau diambil melalui jaringan browser; tidak ada website yang dapat
mencegahnya secara mutlak.
