# CLAUDE.md — Astro Project Context

> File ini adalah ground truth untuk AI coding tools (Claude, Cursor, Copilot, dll.).
> **BACA DULU SEBELUM MENULIS KODE APAPUN.**

---

## Stack

| Layer | Tool |
|---|---|
| Framework | **Astro 5.x** (bukan 4.x, bukan Next.js) |
| UI Islands | React (`@astrojs/react`) |
| Styling | Tailwind CSS (`@astrojs/tailwind`) |
| Content | Astro Content Layer API (Astro 5) |
| Deploy | Vercel / Netlify (output: static default) |
| Language | TypeScript |

---

## Struktur Folder

```
src/
  pages/          ← file-based routing (.astro, .md, .ts endpoints)
  layouts/        ← layout wrappers (BaseLayout.astro, dll.)
  components/     ← UI components
    ui/           ← pure .astro, zero JS, no state
    islands/      ← React components dengan client: directive
    server/       ← Astro components dengan server:defer directive
  content/        ← Content Layer (config.ts + koleksi konten)
  actions/        ← Astro Actions (index.ts)
  styles/         ← global CSS
  lib/            ← utilities, helpers, constants
  env.d.ts        ← type declarations (JANGAN DIHAPUS)
public/           ← static assets
astro.config.mjs  ← konfigurasi utama
```

---

## Aturan Utama

1. **Ini BUKAN Next.js.** Jangan gunakan pola, API, atau konvensi Next.js dalam bentuk apapun.
2. **Versi Astro adalah 5.x**, bukan 4.x. Gunakan API Astro 5 (Content Layer, Server Islands, Actions, astro:env).
3. **Default ke `.astro` files.** Hanya gunakan React (`.tsx`) untuk komponen yang butuh interaktivitas klien.
4. **Output mode: static (default Astro 5).** Tambah `export const prerender = false` untuk SSR per-route. Tidak ada konfigurasi `output: 'hybrid'` — itu sudah dihapus di Astro 5.
5. **Gunakan Astro Actions** untuk form submissions dan mutasi data — bukan fetch ke API route manual.
6. **Gunakan `astro:env`** untuk semua environment variables — bukan `import.meta.env` langsung.
7. **Server Islands (`server:defer`)** untuk konten dinamis/personal — bukan full SSR seluruh halaman.

---

## Referensi Cepat

- Docs: https://docs.astro.build
- Content Layer (Astro 5): https://docs.astro.build/en/guides/content-collections/
- Server Islands: https://docs.astro.build/en/guides/server-islands/
- Actions: https://docs.astro.build/en/guides/actions/
- astro:env: https://docs.astro.build/en/guides/environment-variables/
- Upgrade Guide 4→5: https://docs.astro.build/en/guides/upgrade-to/v5/

---

Lihat `docs/` untuk detail lebih lanjut:
- [`docs/architecture.md`](docs/architecture.md) — penjelasan struktur & keputusan desain
- [`docs/patterns.md`](docs/patterns.md) — pola kode yang benar untuk project ini
- [`docs/do-not-use.md`](docs/do-not-use.md) — daftar pola yang DILARANG
