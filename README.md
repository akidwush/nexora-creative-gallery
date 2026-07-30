# Nexora Creative Gallery

Website galeri karya visual Nexora menggunakan Next.js 16 dan Supabase.

## Fitur

- Galeri masonry responsif dengan filter kategori dan pencarian.
- Detail karya beserta WhatsApp, Instagram, dan portfolio kreator.
- Login admin/editor menggunakan Supabase Auth.
- Dashboard upload, edit, draft/publikasi, unggulan, dan hapus karya.
- Upload gambar ke Supabase Storage dengan batas 10 MB.
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
npm run build
```

Script build sudah menggunakan Webpack agar kompatibel dengan Android/Termux.

## 4. Deploy

```bash
git add -A
git commit -m "feat: add complete gallery upload management"
git push origin main
```

Vercel akan melakukan deployment otomatis dari branch `main`.
