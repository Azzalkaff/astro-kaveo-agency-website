# Patterns — Cara Kode yang Benar (Astro 5)

Referensi pola kode untuk project ini. Semua contoh menggunakan Astro 5 API.

---

## 1. Halaman Dasar

```astro
---
// src/pages/about.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import Card from '../components/ui/Card.astro';

const title = 'Tentang Kami';
const team = [
  { name: 'Budi', role: 'Developer' },
  { name: 'Sari', role: 'Designer' },
];
---

<BaseLayout title={title}>
  <h1>{title}</h1>
  {team.map(member => (
    <Card name={member.name} role={member.role} />
  ))}
</BaseLayout>
```

---

## 2. Content Layer API (Astro 5) — `src/content/config.ts`

Di Astro 5, collections menggunakan `loader`. Ini berbeda dari Astro 2/3.

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders'; // ← Astro 5: import loader

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }), // ← Astro 5
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    image: z.string().optional(),
  }),
});

// Collection dari API eksternal (fitur baru Astro 5)
const products = defineCollection({
  loader: async () => {
    const res = await fetch('https://api.example.com/products');
    const data = await res.json();
    // Harus return array of objects dengan field `id`
    return data.map((item: any) => ({ id: String(item.id), ...item }));
  },
  schema: z.object({
    name: z.string(),
    price: z.number(),
    slug: z.string(),
  }),
});

// Referensi antar collections (relasi)
const authors = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/authors' }),
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    avatar: z.string().optional(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    author: z.string(), // reference ke authors collection
    relatedPosts: z.array(z.string()).optional(),
  }),
});

export const collections = { blog, products, authors, posts };
```

### Mengambil Data dari Collection

```astro
---
import { getCollection, getEntry } from 'astro:content';

// Semua post non-draft, diurutkan terbaru
const posts = (await getCollection('blog', ({ data }) => !data.draft))
  .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());

// Satu entry spesifik
const featured = await getEntry('blog', 'post-unggulan');
---
```

---

## 3. Dynamic Routes

```astro
---
// src/pages/blog/[slug].astro
import { getCollection } from 'astro:content';
import BlogLayout from '../../layouts/BlogLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map(post => ({
    params: { slug: post.id }, // ← Astro 5: gunakan post.id, bukan post.slug
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<BlogLayout title={post.data.title}>
  <Content />
</BlogLayout>
```

> **Catatan Astro 5**: Gunakan `post.id` bukan `post.slug`. Property `slug` sudah deprecated.

---

## 4. Environment Variables dengan `astro:env` (Astro 5)

Jangan pakai `import.meta.env` langsung. Definisikan dulu di `astro.config.mjs`:

```javascript
// astro.config.mjs
import { defineConfig, envField } from 'astro/config';

export default defineConfig({
  env: {
    schema: {
      // Public: aman dibaca browser
      PUBLIC_SITE_URL: envField.string({ context: 'client', access: 'public' }),
      PUBLIC_GA_ID: envField.string({ context: 'client', access: 'public', optional: true }),

      // Server-only: hanya tersedia di server
      DATABASE_URL: envField.string({ context: 'server', access: 'secret' }),
      API_KEY: envField.string({ context: 'server', access: 'secret' }),

      // Public server: readable di server tapi bukan secret
      SITE_NAME: envField.string({ context: 'server', access: 'public', default: 'My Site' }),
    }
  }
});
```

Cara pakai:

```typescript
// Di server (frontmatter .astro, endpoints, actions)
import { DATABASE_URL, API_KEY, SITE_NAME } from 'astro:env/server';

// Di klien (React island, script tags)
import { PUBLIC_SITE_URL, PUBLIC_GA_ID } from 'astro:env/client';
```

---

## 5. Astro Actions (Astro 5) — Pengganti API Routes untuk Mutasi

```typescript
// src/actions/index.ts
import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';

export const server = {
  contact: defineAction({
    accept: 'form', // bisa juga 'json'
    input: z.object({
      name: z.string().min(1),
      email: z.string().email(),
      message: z.string().min(10),
    }),
    handler: async (input) => {
      // Logika server: kirim email, simpan ke DB, dll.
      // import { DATABASE_URL } from 'astro:env/server';
      console.log('Pesan dari:', input.email);
      return { success: true };
    },
  }),

  newsletter: defineAction({
    accept: 'json',
    input: z.object({
      email: z.string().email(),
    }),
    handler: async ({ email }) => {
      // Subscribe ke newsletter
      return { subscribed: true, email };
    },
  }),
};
```

Cara pakai di halaman Astro (form langsung, tanpa JS):

```astro
---
// src/pages/contact.astro
import { actions } from 'astro:actions';

// Cek hasil setelah form submit
const result = Astro.getActionResult(actions.contact);
---

<form method="POST" action={actions.contact}>
  <input name="name" type="text" required />
  <input name="email" type="email" required />
  <textarea name="message" required></textarea>
  <button type="submit">Kirim</button>
  {result?.error && <p class="error">{result.error.message}</p>}
  {result?.data?.success && <p class="success">Pesan terkirim!</p>}
</form>
```

Cara pakai dari React island (dengan JS):

```tsx
// src/components/islands/NewsletterForm.tsx
import { actions } from 'astro:actions';
import { useState } from 'react';

export default function NewsletterForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    const formData = new FormData(e.currentTarget);
    const { error } = await actions.newsletter(Object.fromEntries(formData));
    setStatus(error ? 'idle' : 'done');
  }

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <button type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? 'Mendaftar...' : 'Daftar'}
      </button>
      {status === 'done' && <p>Berhasil! Cek email kamu.</p>}
    </form>
  );
}
```

---

## 6. Server Islands — Konten Dinamis Tanpa Full SSR (Astro 5)

Server Islands = komponen `.astro` yang di-render server setelah halaman load. Gunakan untuk konten personal atau real-time, tanpa harus buat seluruh halaman SSR.

```astro
---
// src/components/server/UserAvatar.astro
// Komponen ini di-render di server on-demand, bukan saat build

const sessionCookie = Astro.cookies.get('session')?.value;
const user = sessionCookie ? await getUserFromSession(sessionCookie) : null;
---

{user
  ? <img src={user.avatarUrl} alt={user.name} class="avatar" />
  : <a href="/login">Masuk</a>
}
```

Cara pakai di halaman (halaman tetap static, hanya UserAvatar yang server-rendered):

```astro
---
// src/pages/index.astro
import BaseLayout from '../layouts/BaseLayout.astro';
import UserAvatar from '../components/server/UserAvatar.astro';
import HeroSection from '../components/ui/HeroSection.astro';
---

<BaseLayout title="Home">
  <!-- Halaman ini tetap static dan bisa di-cache CDN -->
  <HeroSection />

  <!-- Hanya bagian ini yang di-render server, setelah halaman load -->
  <UserAvatar server:defer>
    <!-- Fallback ditampilkan selama server island loading -->
    <div slot="fallback" class="avatar-placeholder"></div>
  </UserAvatar>
</BaseLayout>
```

**Kapan pakai `server:defer` vs `client:*`:**
- `server:defer` → data dari server/database/cookies (avatar user, jumlah notifikasi, harga real-time)
- `client:load` → interaktivitas murni di browser (modal, slider, form validation)

---

## 7. SSR Per-Route (Bukan Full SSR)

Di Astro 5, tidak perlu set `output: 'server'` di config untuk SSR. Cukup tambahkan satu baris di halaman yang butuh SSR:

```astro
---
// src/pages/dashboard.astro
export const prerender = false; // ← halaman ini SSR, yang lain tetap static

import { getUser } from '../lib/auth';

const user = await getUser(Astro.cookies);
if (!user) return Astro.redirect('/login');
---

<BaseLayout title="Dashboard">
  <h1>Selamat datang, {user.name}</h1>
</BaseLayout>
```

```typescript
// src/pages/api/live-data.ts
export const prerender = false; // ← endpoint ini SSR

export async function GET() {
  const data = await fetchLiveData();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

---

## 8. Komponen Astro dengan Props & Slots

```astro
---
// src/components/ui/Card.astro
interface Props {
  title: string;
  description: string;
  href?: string;
  variant?: 'default' | 'featured';
}

const { title, description, href, variant = 'default' } = Astro.props;
---

<article class:list={['card', `card--${variant}`]}>
  <h2>{title}</h2>
  <p>{description}</p>
  {href && <a href={href}>Selengkapnya →</a>}
  <slot name="footer" /> <!-- named slot opsional -->
</article>

<style>
  .card { border-radius: 8px; padding: 1.5rem; }
  .card--featured { border: 2px solid var(--color-accent); }
</style>
```

> Gunakan `class:list` (bukan template literal) untuk conditional classes di Astro.

---

## 9. Layout dengan Named Slots

```astro
---
// src/layouts/BaseLayout.astro
interface Props {
  title: string;
  description?: string;
  ogImage?: string;
}

const {
  title,
  description = 'Deskripsi default site',
  ogImage = '/og-default.png'
} = Astro.props;

import { PUBLIC_SITE_URL } from 'astro:env/client';
---

<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <meta name="description" content={description} />
    <meta property="og:title" content={title} />
    <meta property="og:image" content={ogImage} />
    <title>{title}</title>
    <slot name="head" /> <!-- untuk inject canonical, noindex, dll. per halaman -->
  </head>
  <body>
    <header><slot name="header" /></header>
    <main>
      <slot /> <!-- konten utama halaman -->
    </main>
    <footer><slot name="footer" /></footer>
  </body>
</html>
```

---

## 10. Optimasi Gambar

```astro
---
import { Image, Picture } from 'astro:assets';
import heroImage from '../assets/hero.jpg';
---

<!-- Gambar lokal: Astro otomatis resize, convert ke WebP, lazy load -->
<Image src={heroImage} alt="Hero" width={800} height={400} />

<!-- Picture: untuk art direction / multiple formats -->
<Picture
  src={heroImage}
  formats={['avif', 'webp']}
  alt="Hero"
  width={800}
  height={400}
/>

<!-- Remote image: perlu whitelist domain di astro.config.mjs -->
<Image
  src="https://images.example.com/foto.jpg"
  alt="Foto"
  width={400}
  height={300}
  inferSize
/>
```

Di `astro.config.mjs`:
```javascript
export default defineConfig({
  image: {
    domains: ['images.example.com'],
  }
});
```

---

## 11. View Transitions (Astro 5)

```astro
---
// src/layouts/BaseLayout.astro
import { ViewTransitions } from 'astro:transitions';
---

<head>
  <ViewTransitions /> <!-- aktifkan animasi transisi halaman -->
</head>
```

Di komponen, tambahkan `transition:name` untuk animasi spesifik elemen:

```astro
<!-- Di halaman daftar blog -->
<img src={post.image} transition:name={`hero-${post.id}`} alt="" />

<!-- Di halaman detail blog — elemen dengan nama sama akan dianimasikan -->
<img src={post.image} transition:name={`hero-${post.id}`} alt="" />
```
