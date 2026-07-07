# Do Not Use — Pola yang DILARANG

Daftar ini mencegah AI coding tools "drift" ke pola Next.js atau pola Astro lama (v2/v3/v4) yang tidak berlaku di Astro 5.

---

## ❌ Next.js — Dilarang Total

### Router & Navigation

| Dilarang | Gantinya |
|---|---|
| `import { useRouter } from 'next/router'` | `Astro.url` di frontmatter, atau `window.location` di island |
| `import { useRouter } from 'next/navigation'` | Link biasa `<a href>` |
| `import Link from 'next/link'` | `<a href="/halaman">` |
| `router.push('/path')` | `window.location.href = '/path'` di island |
| `router.query.slug` | `Astro.params.slug` di frontmatter |

### Data Fetching Next.js

| Dilarang | Gantinya |
|---|---|
| `getServerSideProps()` | `export const prerender = false` + fetch di frontmatter |
| `getStaticProps()` | Fetch data langsung di frontmatter |
| `useSWR()` untuk initial data | Fetch di frontmatter, pass sebagai props ke island |
| `useQuery()` (React Query) untuk SSR | Fetch di frontmatter |

### Struktur File Next.js

| Dilarang | Gantinya |
|---|---|
| Folder `app/` di root | Routing ada di `src/pages/` |
| `app/layout.tsx` | `src/layouts/BaseLayout.astro` |
| `app/page.tsx` | `src/pages/index.astro` |
| `pages/_app.tsx` | `src/layouts/BaseLayout.astro` |
| `pages/_document.tsx` | HTML shell langsung di layout |
| `pages/api/route.ts` dengan `export default` | `src/pages/api/endpoint.ts` dengan `export const GET/POST` |
| `middleware.ts` dengan `NextResponse` | `src/middleware.ts` versi Astro |

### Komponen & Imports Next.js

| Dilarang | Gantinya |
|---|---|
| `import Image from 'next/image'` | `import { Image } from 'astro:assets'` |
| `import Head from 'next/head'` | Tag `<head>` langsung di layout `.astro` |
| `import Script from 'next/script'` | Tag `<script>` di `.astro` |
| `import { Inter } from 'next/font/google'` | Font via `<link>` di layout |
| `'use client'` directive | Komponen `.tsx` di `components/islands/` + `client:` directive |
| `'use server'` directive | Astro Actions (`src/actions/index.ts`) |

---

## ❌ Astro Lama (v2/v3/v4) — Sudah Deprecated di Astro 5

### Content Collections (Pola Lama)

```typescript
// ❌ SALAH — pola Astro 2/3, JANGAN pakai di Astro 5
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content', // ← tidak ada 'type' di Astro 5
  schema: z.object({ ... }),
});
```

```typescript
// ✅ BENAR — Astro 5 Content Layer API
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders'; // ← wajib import loader

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }), // ← gunakan loader
  schema: z.object({ ... }),
});
```

### Property `slug` (Deprecated)

```astro
<!-- ❌ SALAH — post.slug deprecated di Astro 5 -->
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.slug }, // ← deprecated
  }));
}
```

```astro
<!-- ✅ BENAR — gunakan post.id di Astro 5 -->
export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.id }, // ← gunakan id
  }));
}
```

### Output Mode (Deprecated Config)

```javascript
// ❌ SALAH — output: 'hybrid' tidak ada di Astro 5
export default defineConfig({
  output: 'hybrid', // ← dihapus di Astro 5
});
```

```javascript
// ✅ BENAR — Astro 5 default sudah hybrid. Tidak perlu config.
// Untuk SSR per-route, tambahkan di file halaman:
export const prerender = false;
```

### Environment Variables (Pola Lama)

```typescript
// ❌ KURANG BAIK — import.meta.env langsung, tidak type-safe
const apiKey = import.meta.env.API_KEY;
const siteUrl = import.meta.env.PUBLIC_SITE_URL;
```

```typescript
// ✅ BENAR — gunakan astro:env (Astro 5), type-safe dan validated
import { API_KEY } from 'astro:env/server';
import { PUBLIC_SITE_URL } from 'astro:env/client';
```

### API Routes untuk Mutasi (Anti-Pattern)

```typescript
// ❌ ANTI-PATTERN — jangan buat API route hanya untuk form submission
// src/pages/api/contact.ts
export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();
  // ...
};

// Dan di klien:
fetch('/api/contact', { method: 'POST', body: JSON.stringify(data) });
```

```typescript
// ✅ BENAR — gunakan Astro Actions untuk mutasi data
// src/actions/index.ts
export const server = {
  contact: defineAction({
    accept: 'form',
    input: z.object({ name: z.string(), email: z.string().email() }),
    handler: async (input) => { /* ... */ },
  }),
};

// Di halaman: <form action={actions.contact} method="POST">
// Di island: await actions.contact({ name, email })
```

---

## ❌ React di Luar Islands

```astro
<!-- ❌ SALAH — useState tidak bekerja di .astro -->
---
import { useState } from 'react'; // ERROR
const [count, setCount] = useState(0); // ERROR
---
```

```astro
<!-- ❌ SALAH — komponen React tanpa client: = tidak interaktif -->
---
import Counter from '../components/Counter'; // .tsx
---
<Counter /> <!-- tidak ada JS! tombol tidak akan berfungsi -->
```

```astro
<!-- ✅ BENAR -->
<Counter client:load />        <!-- hydrate segera -->
<Counter client:visible />     <!-- hydrate saat masuk viewport (hemat) -->
<Counter client:idle />        <!-- hydrate saat browser idle -->
```

```tsx
// ❌ SALAH — halaman sebagai React component (pola Next.js)
// src/pages/about.tsx
export default function AboutPage() {
  return <div>About</div>;
}
```

```astro
<!-- ✅ BENAR — halaman sebagai Astro component -->
<!-- src/pages/about.astro -->
---
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="About"><div>About</div></BaseLayout>
```

---

## ❌ CSS Patterns yang Salah

| Dilarang | Gantinya |
|---|---|
| CSS Modules (`.module.css`) | `<style>` scoped di dalam `.astro` |
| `import styles from './Card.module.css'` | `<style>` langsung di `Card.astro` |
| `className={styles.card}` | `class="card"` biasa di `.astro` |
| `className` di file `.astro` | `class` (bukan `className`) di `.astro` — `className` hanya untuk `.tsx` |
| Template literal untuk conditional class | `class:list={['base', { active: isActive }]}` |

---

## Tanda Bahaya (Red Flags)

Jika AI menghasilkan salah satu hal berikut, **tolak dan minta ulang**:

- Import dari `'next/*'`
- File bernama `_app.tsx`, `_document.tsx`, `layout.tsx` (tanpa path `layouts/`)
- Folder `app/` di root project
- `export default function Page()` di dalam `src/pages/`
- `getServerSideProps`, `getStaticProps` (versi Next.js)
- `useRouter` dari next/router atau next/navigation
- `process.env.NEXT_PUBLIC_*`
- `output: 'hybrid'` di astro.config.mjs
- `type: 'content'` atau `type: 'data'` di `defineCollection` (pola Astro 2/3)
- `post.slug` (harusnya `post.id` di Astro 5)
- `import.meta.env.SECRET_KEY` di client-side code
- `className={styles.sesuatu}` di file `.astro`
- Fetch ke `/api/...` untuk form submission (harusnya pakai Actions)
