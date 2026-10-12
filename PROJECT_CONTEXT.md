# 📋 PROJECT_CONTEXT.md — web-mobis

> **Dokumen ini diperuntukkan bagi AI agent (next agent).** Baca seluruh dokumen ini sebelum mengerjakan task apa pun di repo `web-mobis`. Dokumen mencakup: arsitektur, tech stack, konvensi, aturan kritis, status CMS, dan riwayat pekerjaan yang sudah selesai.

---

## 🗺️ Identitas Proyek

| Atribut | Nilai |
|---|---|
| **Nama paket** | `mobis-revamp` |
| **Deskripsi** | Website pemasaran & pendaftaran driver online untuk **MOBIS** (perusahaan rental mobil untuk driver Gojek/Grab/Maxim) |
| **Domain produksi** | `rentalmobis.com` |
| **Admin Payload** | `admin.rentalmobis.com/admin` |
| **Branch deploy** | `production` |
| **Package manager** | `npm` (lockfile: `package-lock.json`) |
| **Node requirement** | `^18.20.2 \|\| >=20.9.0` |

---

## 🏗️ Tech Stack

| Layer | Teknologi |
|---|---|
| **Framework** | Next.js 16 (App Router, standalone output) |
| **CMS** | Payload CMS 3.73.0 |
| **Database** | PostgreSQL (via `@payloadcms/db-postgres`) |
| **Styling** | Bootstrap 5 custom SCSS + CSS global (`style.css`) |
| **Rich Text** | Lexical editor (`@payloadcms/richtext-lexical`) |
| **Tracking** | Meta Conversions API (server-side) + Facebook Pixel + TikTok Pixel (client-side) |
| **Lead CRM** | Google Sheets (via Google Service Account JSON) |
| **Deployment** | Docker → container di server sendiri (bukan Vercel) |
| **CI/CD** | GitHub Actions (`.github/workflows/`) |
| **TypeScript** | v5.7.3 |

---

## 📁 Struktur Direktori Utama

```
web-mobis/
├── src/
│   ├── app/
│   │   ├── (frontend)/         ← Halaman publik Next.js
│   │   │   ├── [slug]/         ← Halaman CMS dinamis (index, dll.)
│   │   │   ├── posts/          ← Halaman blog
│   │   │   ├── search/         ← Halaman pencarian
│   │   │   ├── style.css       ← CSS utama komponen Mobis
│   │   │   └── bootstrap-custom.scss  ← Bootstrap custom build
│   │   └── (payload)/          ← Payload admin + API routes
│   ├── collections/            ← Schema koleksi Payload CMS
│   ├── blocks/Mobis/           ← Block builder (semua blok halaman)
│   ├── components/             ← React components
│   │   └── MobisWidget/        ← Widget Cek Status & Asisten (floating)
│   ├── Header/                 ← Global Header (config + component + Nav)
│   ├── Footer/                 ← Global Footer (config + component)
│   ├── heros/                  ← Hero section variants
│   ├── hooks/                  ← Payload lifecycle hooks
│   ├── access/                 ← Access control functions
│   ├── lib/                    ← Business logic utilities
│   ├── services/
│   │   ├── googleSheets/       ← Integrasi Google Sheets (leads)
│   │   └── meta/               ← Meta CAPI (Conversions API)
│   ├── utilities/              ← Helper functions (getMediaUrl, pixelTracking, dll.)
│   ├── fields/                 ← Reusable Payload field factories
│   ├── types/                  ← TypeScript type definitions
│   └── payload.config.ts       ← Entry point Payload CMS
├── AGENTS.md                   ← Aturan coding Payload CMS (wajib dibaca!)
├── PROJECT_CONTEXT.md          ← File ini
├── Dockerfile                  ← Untuk Docker deploy
├── .env.example                ← Template env vars
└── scripts/                    ← Utility scripts (sync-media, dll.)
```

---

## 🗄️ Collections & Globals Payload CMS

### Collections (Database Tables)

| Slug | Keterangan |
|---|---|
| `pages` | Halaman website utama (block-based, CMS-driven) |
| `posts` | Blog/artikel |
| `media` | Upload gambar/file |
| `categories` | Kategori blog (nested via plugin) |
| `users` | Admin users untuk Payload panel |
| `customers` | **Core bisnis.** Data driver yang mendaftar melalui form |
| `vouchers` | Kode promo/voucher |
| `voucher_categories` | Kategori voucher |

### Globals (Konfigurasi Global)

| Slug | File Config | Keterangan |
|---|---|---|
| `header` | `src/Header/config.ts` | Nav items (link menu) |
| `footer` | `src/Footer/config.ts` | Logo (upload) + Social media links |
| `mobisWidgets` | `src/components/MobisWidget/payload/MobisWidgets.global.ts` | Konfigurasi widget floating (Cek Status, Asisten) |

### Collection `customers` — Field Penting

| Field | Tipe | Keterangan |
|---|---|---|
| `name`, `birthPlace`, `birthDate` | text | Data diri |
| `phone`, `ktpNumber` | text (indexed) | Identifikasi |
| `simNumber`, `simType`, `simValidUntil` | text | Data SIM |
| `domicile`, `currentAddress`, `houseOwnership` | text | Domisili |
| `emergencyName/Phone/Relation` | text | Kontak darurat |
| `driverApps`, `activeAccountSelf`, `driverExperience` | text | Info driver |
| `carUnit` | text | Jenis mobil dipilih (**hardcoded di frontend**, tidak dari CMS) |
| `handoverLocation` | text | Lokasi serah terima → dipakai routing ke Google Sheets |
| `promoCode` | text (indexed) | Kode promo diinput user |
| `promoApplied`, `promoAppliedAt`, `voucher` | mixed | Auto-tracking promo (read-only) |
| `rawPayload` | json | Backup lengkap data kiriman client |
| `sheetMeta` | json | Metadata hasil append ke Google Sheets |

**Access control `customers`:** `read/update/delete` hanya authenticated user, `create: () => false` — hanya via API route internal.

---

## 🧩 Blok Halaman (Blocks) di `src/blocks/Mobis/`

Semua blok dirender melalui `src/blocks/RenderBlocks.tsx`:

| Slug / Component | Keterangan | Status CMS |
|---|---|---|
| `bannerCarousel` | Hero carousel banner dengan gambar desktop/mobile | ✅ Full CMS |
| `about` (`AboutSplit`) | Seksi "Gabung Jadi Mitra MOBIS" (teks RichText + gambar) | ✅ Full CMS |
| `areaChips` | Kartu area/kota yang bisa diklik (modal dengan foto pool) | ✅ Full CMS |
| `programDual` | 2 kartu program rental (Mingguan vs Opsi) | ✅ Full CMS |
| `requirements` | Persyaratan Umum & Dokumen (dua kolom) | ✅ Full CMS |
| `registrationForm` | Form pendaftaran driver (panjang, multi-step) | ✅ Full CMS (kecuali `carUnit`) |
| `testimonials` | Slider ulasan mitra | ✅ Full CMS |
| `unitsAvailable` | Grid kartu unit mobil yang tersedia | ✅ Full CMS |
| `faqAccordion` | Accordion FAQ | ✅ Full CMS |
| `registrationFlow` | Gambar alur pendaftaran (desktop + mobile) | ✅ Full CMS |
| `programCard` | Kartu program rental single | ✅ Full CMS |
| `footerSimple` | Footer sederhana (brand, address, IG, WA) | ✅ Full CMS |

---

## ⚠️ ATURAN KRITIS — WAJIB DIBACA

### 1. Jangan Tambah Field Schema Baru Tanpa Migrasi

Deployment menggunakan Docker build yang **tidak menjalankan migrasi** (`ARG RUN_MIGRATIONS_ON_BUILD=false`). Proses `next build` merender halaman secara statis dan menghubungi database PostgreSQL production. Jika field baru ditambahkan ke `Config.ts` tanpa ada migrasi di database, **build akan error** dengan:

```
error: column pages__blocks_xxx.field_name does not exist
```

**Rule:** Jangan tambah field ke `Config.ts` mana pun tanpa:
1. Membuat file migrasi (`npm run migrate`)
2. Menjalankan migrasi di database production terlebih dahulu
3. Baru lalu deploy kode baru

### 2. Perbaikan Frontend-Only = Aman Tanpa Migrasi

Perbaikan yang hanya mengubah `Component.tsx` (logika render, fallback, dll.) **tidak memerlukan migrasi** dan aman dideploy kapan saja.

### 3. Selalu Validasi TypeScript

Setelah mengubah file TypeScript, jalankan:
```bash
npm run typecheck
```

> Di environment sandbox AI, `npx`/`node` mungkin tidak tersedia di PATH. Gunakan `BypassSandbox: true` untuk menjalankan command ini.

### 4. Generate Types & Import Map

Setelah mengubah schema (`Config.ts`):
```bash
npm run generate:types        # Regenerate payload-types.ts
npm run generate:importmap    # Regenerate app/(payload)/admin/importMap.js
```

### 5. `AGENTS.md` — Rules Payload CMS

File `AGENTS.md` di root berisi panduan lengkap coding Payload CMS (hooks, access control, security patterns, Local API). Baca sebelum mengubah collection/global config.

---

## 🔧 Environment Variables Penting

| Env Var | Keterangan |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `PAYLOAD_SECRET` | JWT encryption secret |
| `PAYLOAD_DB_PUSH` | `true` hanya untuk dev lokal (auto-push schema), `false` di production |
| `PAYLOAD_ENABLE_CUSTOM_ADMIN` | Toggle custom admin UI (Dashboard, Reports) |
| `NEXT_PUBLIC_SERVER_URL` | URL publik server (tanpa trailing slash) |
| `GOOGLE_SHEETS_SPREADSHEET_ID_JABODETABEK` | ID Google Sheets area Jabodetabek |
| `GOOGLE_SHEETS_SPREADSHEET_ID_BANDUNG` | ID Google Sheets area Bandung |
| `GOOGLE_SHEETS_SPREADSHEET_ID_DEFAULT` | ID Google Sheets area default |
| `GOOGLE_SERVICE_ACCOUNT_JSON_PATH` | Path ke credentials.json Google Service Account |
| `REGISTRATION_BYPASS_GOOGLE_SHEETS` | `true` untuk skip append ke Sheets saat testing |
| `FACEBOOK_PIXEL_ID` + `FACEBOOK_CONVERSIONS_API_ACCESS_TOKEN` | Meta CAPI server-side |
| `NEXT_PUBLIC_FACEBOOK_PIXEL_ID` | Facebook Pixel client-side |
| `NEXT_PUBLIC_TIKTOK_PIXEL_ID` | TikTok Pixel client-side |
| `MOBIS_LEAD_API_URL` + `MOBIS_LEAD_API_PUBLIC_KEY` | External Fleet Management System API |
| `MOBIS_GAS_STATUS_CHECK_URL` + `MOBIS_GAS_SECRET_TOKEN` | Google Apps Script untuk Cek Status Pendaftaran |
| `CRON_SECRET` | Secret untuk autentikasi cron jobs |

---

## 🚀 Alur Registrasi Driver

1. User mengisi `RegistrationForm` di halaman web
2. Form submit ke `/api/register` (API route internal Next.js)
3. API route:
   - Validasi promo code (lookup di collection `vouchers`)
   - Simpan ke collection `customers` (Payload Local API)
   - Append lead ke **Google Sheets** yang sesuai berdasarkan `handoverLocation`
   - Kirim event ke **Meta Conversions API** (server-side)
   - Kirim lead ke **Fleet Management System external API**
4. Tracking pixel client-side (Facebook + TikTok) dijalankan setelah sukses

---

## 🌐 Widget Floating (MobisWidget)

File utama: `src/components/MobisWidget/`

Widget floating terdiri dari 2 fitur:
1. **Cek Status Pendaftaran** — User bisa cek status pendaftaran berdasarkan NIK/nomor HP dan area. Daftar area dikonfigurasi di Global `mobisWidgets.statusWidget.areas` di Payload CMS.
2. **Asisten MOBIS** — Chat assistant (LLM-based), endpoint di `/api/assistant`.

Konfigurasi widget (`enabled`, `buttonWidth`, `registerAnchorId`, dll.) dikontrol dari Global `mobisWidgets` di Payload CMS.

---

## 📝 Riwayat Perbaikan CMS (Oktober 2026)

Berikut adalah perbaikan yang telah dikerjakan agar konten tidak di-hardcode:

### ✅ Selesai

| File | Masalah | Perbaikan |
|---|---|---|
| `src/blocks/Mobis/ProgramDual/Component.tsx` | `formatText()` memaksa override teks persyaratan berdasarkan keyword `mojokerto`/`malang` | Dihapus. Teks sepenuhnya dari CMS |
| `src/blocks/Mobis/RegistrationForm/Component.tsx` | `DOMICILE_OPTS` dan `HANDOVER_OPTS` memfilter paksa opsi dari CMS (exclude Bali, Bandung, dll.) meski admin sudah mengatur di CMS | Jika CMS mengisi `opts.dom` / `opts.handover`, data CMS langsung dipakai tanpa filter. Filter exclusion hanya berlaku pada fallback default hardcoded |
| `src/blocks/Mobis/Testimonials/Component.tsx` | `DEFAULT_TESTIS` (Harmaini, Rizal, John, Faris) ditampilkan otomatis jika `items` CMS kosong | Dihapus. Jika `items` kosong, section testimonial disembunyikan (`return null`). Ulasan 100% dari Payload CMS |

### ❌ Sengaja Dibiarkan Hardcode (Keputusan Tim)

| Item | Lokasi | Alasan |
|---|---|---|
| Daftar pilihan unit mobil (`carUnit`) | `RegistrationForm/Component.tsx` | Tidak ada field CMS di `RegistrationFormConfig`. Menambahkan memerlukan migrasi DB |
| Logo header | `src/Header/Nav/Component.client.tsx` | Tidak ada field logo di `Header` global config |
| Logo footer | `src/Footer/Component.tsx` | Field `logo` ada di `Footer` config tapi tim memutuskan tidak perlu dihubungkan |
| Filter area widget Cek Status | `MobisWidgetProvider.tsx` & `StatusModal.tsx` | Daftar area dropdown sudah sesuai yang dikonfigurasi di CMS. Tidak perlu diubah |

---

## 🛠️ Scripts & Commands

| Command | Fungsi |
|---|---|
| `npm run dev` | Jalankan dev server (auto-build Bootstrap CSS dulu) |
| `npm run build` | Build production (jalankan `generate:importmap` dan `build:bootstrap-css` dulu) |
| `npm run typecheck` | Validasi TypeScript (0 error wajib sebelum commit) |
| `npm run generate:types` | Regenerate `src/payload-types.ts` setelah ubah schema |
| `npm run generate:importmap` | Regenerate import map Payload admin |
| `npm run migrate` | Jalankan migrasi database pending |
| `npm run migrate:status` | Cek status migrasi |
| `npm run lint` | Jalankan ESLint |
| `npm run sync:media` | Sync media files ke server |

---

## 📂 File-file Dokumentasi Lain di Root

| File | Isi |
|---|---|
| `AGENTS.md` | Panduan lengkap coding Payload CMS (hooks, access, security) — **wajib dibaca** |
| `ANALISIS_KODE_MOBIS.md` | Analisis mendalam seluruh codebase (status per-komponen, temuan, rekomendasi) |
| `OPTIMISASI_PERFORMA_MOBIS.md` | Catatan optimasi performa (LCP, CLS, image loading, dll.) |
| `ANALISIS_MASALAH_FOTO_LOKASI_POOL.md` | Analisis masalah gambar foto lokasi pool |
| `# API Cek Status Pendaftaran.md` | Dokumentasi API widget Cek Status Pendaftaran |

---

## 🔗 Konvensi Kode

1. **Server Components** adalah default. Gunakan `'use client'` hanya jika perlu state/effects/event handler.
2. **Semua URL media** wajib diproses melalui `getMediaUrl()` dari `@/utilities/getMediaUrl` untuk menormalisasi URL localhost vs production.
3. **Pixel tracking** ada di `@/utilities/pixelTracking` — gunakan `trackCustomEvent()` dan `trackEventWithDedup()`.
4. **Tipe Payload** di-generate ke `src/payload-types.ts` — selalu gunakan tipe dari sini, bukan definisikan manual.
5. **Bootstrap CSS** di-generate dari SCSS (`npm run build:bootstrap-css`) ke `bootstrap-custom.generated.css`. Jangan edit file `.generated.css` langsung.
6. **Commit convention:** `feat(scope): ...`, `fix(scope): ...` — lowercase, ringkas, bahasa Inggris.

---

> **Terakhir diperbarui:** 09 Oktober 2026
> **Oleh:** AI Agent (Antigravity)
