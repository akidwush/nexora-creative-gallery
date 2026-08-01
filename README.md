# Nexora Creative Gallery

Website galeri karya visual Nexora menggunakan Next.js 16 dan Supabase.

## Fitur

- Galeri masonry responsif dengan filter kategori dan pencarian.
- Detail karya beserta WhatsApp, Instagram, dan portfolio kreator.
- Detail karya dirender di server dengan HTTP 404 dan metadata sosial dinamis.
- Login admin/editor menggunakan Supabase Auth.
- Dashboard upload, edit, draft/publikasi, unggulan, dan hapus karya.
- Daftar sosial media Nexora dinamis dengan CRUD, status aktif, dan pengurutan dari dashboard admin.
- Upload gambar ke Supabase Storage dengan batas 50 MB.
- Row Level Security untuk tabel dan Storage.

## 1. Konfigurasi environment

Buat `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=KEY_KAMU
```

`NEXT_PUBLIC_SUPABASE_ANON_KEY` juga tetap didukung sebagai nama alternatif key.

## 2. Siapkan database dan Storage

Buka Supabase Dashboard → **SQL Editor**, lalu jalankan seluruh isi:

```text
supabase/gallery_setup.sql
```

Script tersebut membuat tabel `gallery_categories`, `gallery_creators`, `gallery_works`, bucket `gallery-works`, seed enam kategori, trigger, dan seluruh RLS policy.

Untuk deployment lama yang sudah pernah menjalankan `gallery_setup.sql`, jalankan
upgrade berikut sekali saja agar pengelola sosial media tersedia:

```text
supabase/add_nexora_social_links.sql
```

Setelah itu buka dashboard admin untuk menambah, mengedit, mengurutkan,
mengaktifkan, atau menghapus URL sosial media Nexora. URL tidak disimpan di
environment Vercel.

Akun yang boleh mengelola karya harus memiliki baris pada tabel `profiles` dengan:

```text
role = admin
```

atau:

```text
role = editor
```

## 3. Build di Termux

```bash
cd ~/nexora-gallery
npm install
npm test
npm run build
```

Script build sudah menggunakan Webpack agar kompatibel dengan Android/Termux.
Untuk pemeriksaan lengkap sebelum push, jalankan `npm run check`.

Atau gunakan helper Termux agar pemeriksaan, commit, dan push berjalan dalam
satu perintah:

```bash
bash scripts/termux-check-push.sh "feat: manage Nexora social links from admin"
```

## 4. Deploy

```bash
git add -A
git commit -m "feat: add complete gallery upload management"
git push origin main
```

Vercel akan melakukan deployment otomatis dari branch `main`.
