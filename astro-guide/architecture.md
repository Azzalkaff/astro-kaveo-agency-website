# Architecture

Dokumen ini menjelaskan struktur folder dan keputusan arsitektur project Astro 5 ini.

---

## Prinsip Utama

### 1. Static First, Dynamic When Needed
Astro 5 default ke output static. Semua halaman di-render jadi HTML saat build. Untuk route yang butuh server rendering, tambahkan `export const prerender = false` — tidak perlu ubah konfigurasi global.

### 2. Tiga Jenis Islands
Astro 5 punya dua jenis islands yang berbeda, jangan dicampur:

| Directive | Jenis | Kapan dipakai |
|---|---|---|
| `client:load`, `client:idle`, `client:visible` | **Client Island** | Komponen butuh JS di browser (state, event, animasi) |
| `server:defer` | **Server Island** | Konten dinamis/personal yang di-render server setelah halaman load |
| *(tidak ada directive)* | **Static** | Default — pure HTML, zero JS |

### 3. Content Layer API (Astro 5)
Semua konten terstruktur dikelola lewat Content Layer. Ini berbeda dari Content Collections Astro 2/3 — sekarang bisa load dari mana saja (file lokal, CMS, API eksternal) dengan API yang seragam dan type-safe.

### 4. Actions untuk Mutasi Data
Form submissions, likes, cart updates → pakai Astro Actions. Ini type-safe end-to-end dan tidak butuh fetch ke API route manual.

---

## Penjelasan Setiap Folder

### `src/pages/`
File di sini langsung menjadi URL. Routing sepenuhnya file-based.

```
src/pages/
  index.astro            → /
  about.astro            → /about
  blog/
    index.astro          → /blog
    [slug].astro         → /blog/nama-artikel
  api/
    webhook.ts           → /api/webhook  (Astro endpoint)
  dashboard/
    index.astro          → /dashboard  (export const prerender = false → SSR)
```

**Aturan:**
- File `.astro`, `.md`, `.mdx`, atau `.ts`/`.js` (endpoints) saja.
- Tambah `export const prerender = false` untuk halaman SSR individual.
- Tidak ada file `_app`, `_document`, atau `layout` di sini (itu pola Next.js).

---

### `src/layouts/`
Layout adalah wrapper halaman yang menyediakan struktur HTML berulang.

```
src/layouts/
  BaseLayout.astro     ← layout utama: <html>, <head>, <body>, SEO meta
  BlogLayout.astro     ← extends BaseLayout, tambah sidebar/TOC
  DocsLayout.astro     ← untuk halaman dokumentasi
```

---

### `src/components/`

```
src/components/
  ui/                  ← komponen .astro, pure HTML+CSS, zero JS
    Button.astro
    Card.astro
    Badge.astro
  islands/             ← React .tsx untuk interaktivitas klien
    SearchBar.tsx      → dipakai dengan client:visible
    ContactForm.tsx    → dipakai dengan client:load
    ThemeToggle.tsx    → dipakai dengan client:idle
  server/              ← Astro .astro untuk konten dinamis server
    UserAvatar.astro   → dipakai dengan server:defer
    CartCount.astro    → dipakai dengan server:defer
    RelatedPosts.astro → dipakai dengan server:defer
```

**Perbedaan kritis:**
- `islands/` → React + JS dikirim ke browser → untuk interaktivitas
- `server/` → Astro + di-render di server setelah halaman load → untuk konten dinamis/personal
- `ui/` → Astro + pure HTML → untuk semua yang static

---

### `src/content/`
Dikelola oleh Astro Content Layer API. Schema didefinisikan di `config.ts`.

```
src/content/
  config.ts            ← definisi semua collections dengan loader (WAJIB)
  blog/
    post-pertama.md
    post-kedua.mdx
  projects/
    project-a.json
```

Di Astro 5, `config.ts` menggunakan `loader` untuk menentukan sumber data. Loader bisa berupa file lokal (`glob()`), API eksternal, atau CMS.

---

### `src/actions/`
Astro Actions — fungsi server yang dipanggil langsung dari klien, type-safe.

```
src/actions/
  index.ts             ← semua actions didefinisikan di sini
```

Actions menggantikan pola fetch-ke-API-route untuk mutasi data. Tidak perlu buat endpoint manual untuk form submissions.

---

### `src/lib/`
Utilities murni — fungsi helper, konstanta, tipe TypeScript.

```
src/lib/
  utils.ts             ← helper functions umum
  constants.ts         ← konstanta site (URL, nama, dll.)
  types.ts             ← shared TypeScript types
```

---

### `public/`
Asset statis yang di-serve langsung. Referensi dengan path absolut: `/favicon.svg`.

Untuk gambar yang butuh optimasi, taruh di `src/assets/` dan gunakan `<Image>` dari `astro:assets`.

---

## Alur Data

```
Content Layer (src/content/config.ts)  ←── bisa dari: file lokal / CMS / API
         ↓ getCollection() / getEntry()
Halaman Astro (src/pages/)
         ↓ props ke layouts & komponen
Layout (src/layouts/BaseLayout.astro)
         ↓ slot
Static Components (src/components/ui/)     → pure HTML
Client Islands (src/components/islands/)   → client:* → JS ke browser
Server Islands (src/components/server/)    → server:defer → render di server post-load
         ↑
Astro Actions (src/actions/)               → mutasi data (forms, dll.)
```

---

## Strategi Rendering Per Kasus

| Konten | Strategi | Cara |
|---|---|---|
| Landing page, blog, docs | Static SSG | Default (tidak perlu config) |
| User profile, shopping cart | Server Island | `server:defer` |
| Search, filter, slider | Client Island | `client:visible` |
| Dashboard autentikasi | SSR per-route | `export const prerender = false` |
| Form submit, like, cart add | Action | Astro Actions |
| Data dari CMS / API eksternal | Content Layer | Custom loader di `config.ts` |
