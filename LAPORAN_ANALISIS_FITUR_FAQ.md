# 🤖 Laporan Analisis Mendalam: Fitur Chatbot FAQs (Knowledge Base AI)

> **Proyek:** MOBIS Revamp (`web-mobis` / [rentalmobis.com](https://rentalmobis.com))  
> **Modul:** Chatbot FAQs & AI Assistant Simulator  
> **Lokasi URL Admin:** `/admin/collections/chatbot-faqs` & `/admin/faq-chatbot`  
> **Tanggal Analisis:** Oktober 2026  
> **Status Fitur:** Aktif & Terintegrasi (Database Vektor + Payload CMS + UI Simulator)

---

## 📑 Daftar Isi

1. [Ringkasan Eksekutif & Tujuan Fitur](#1-ringkasan-eksekutif--tujuan-fitur)
2. [Arsitektur Data Multi-Layer (Data Ingestion & Priority)](#2-arsitektur-data-multi-layer-data-ingestion--priority)
   - 2.1 Skema Database Vektor n8n (`chatBotMobisLocal`)
   - 2.2 Hierarki Prioritas Pemuatan Data (3-Layer Fallback)
3. [Rincian Komponen & Struktur Kode](#3-rincian-komponen--struktur-kode)
   - 3.1 Skema Koleksi Payload (`ChatbotFaqs.ts`)
   - 3.2 Server Component (`index.tsx`)
   - 3.3 Client Component UI (`FaqChatbotClient.tsx`)
   - 3.4 Modul Filter (`EnvironmentTabs.tsx`)
   - 3.5 Modal Detail (`FaqDetailModal.tsx`)
   - 3.6 Widget Uji Coba Asisten (`ChatbotFab.tsx` & `AssistantWidget.tsx`)
4. [Kemampuan Fitur Antarmuka Pengguna (UI/UX)](#4-kemampuan-fitur-antarmuka-pengguna-uiux)
5. [Integrasi dengan Engine AI (n8n & Webhook Assistant)](#5-integrasi-dengan-engine-ai-n8n--webhook-assistant)
6. [Analisis Temuan Teknis & Rekomendasi Peningkatan](#6-analisis-temuan-teknis--rekomendasi-peningkatan)

---

## 1. Ringkasan Eksekutif & Tujuan Fitur

Fitur **Chatbot FAQs** adalah modul manajemen basis pengetahuan (*knowledge base*) yang dirancang khusus untuk memantau, menguji, dan mengelola data tanya-jawab (*Q&A*) yang digunakan oleh **AI Assistant MOBIS**.

Asisten AI MOBIS bertugas melayani calon pelanggan dan mitra pengemudi di berbagai saluran komunikasi (WhatsApp/Web Direct Message dan Komentar Media Sosial). Modul ini menyediakan antarmuka terpusat bagi tim operasional dan administrator untuk:
1. **Memantau Pengetahuan Asisten:** Melihat kumpulan dokumen pertanyaan dan template jawaban yang tersimpan di memori vektor AI.
2. **Segmentasi Lingkungan & Saluran:** Memisahkan data antara lingkungan **Staging** (uji coba) vs **Production** (live), serta saluran **Direct Message (DM)** vs **Comment** (komentar publik).
3. **Simulator Interaktif Instan:** Menguji respons AI secara langsung dari dalam panel admin tanpa harus mengisi identitas pendaftar manual.

---

## 2. Arsitektur Data Multi-Layer (Data Ingestion & Priority)

Sistem menggunakan pendekatan *fail-safe* multi-layer untuk menyajikan data FAQ:

```
[Admin Buka /admin/collections/chatbot-faqs]
                     │
                     ▼
  [Layer 1: Baca Database Vektor (chatBotMobisLocal)]
  ├── Tersedia & Ada Data ──> [Tampilkan 336 Vektor Real-time (n8n_vectors_mobis_*)]
  │
  └── Gagal / Kosong
         │
         ▼
  [Layer 2: Fallback ke Koleksi Payload CMS (local_mobis)]
  ├── Ada Data ─────────────> [Tampilkan Data Koleksi chatbot_faqs]
  │
  └── Kosong
         │
         ▼
  [Layer 3: Fallback ke Mock Data Statis (INITIAL_FAQS)]
```

### 2.1 Skema Database Vektor n8n (`chatBotMobisLocal`)
Database vektor PostgreSQL n8n menyimpan data dalam 4 tabel terisolasi:

| Nama Tabel | Environment | Channel | Jumlah Baris Saat Ini | Keterangan |
|---|---|---|:---:|---|
| `n8n_vectors_mobis_dm_stg` | **Staging** | **DM** | **95 records** | Pertanyaan & template jawaban obrolan langsung (Staging) |
| `n8n_vectors_mobis_comments_stg` | **Staging** | **Comment** | **73 records** | Template jawaban untuk auto-reply komentar (Staging) |
| `n8n_vectors_mobis_dm` | **Production** | **DM** | **95 records** | Pengetahuan asisten live untuk direct messages |
| `n8n_vectors_mobis_comments` | **Production** | **Comment** | **73 records** | Pengetahuan asisten live untuk komentar media sosial |
| **Total Vektor** | | | **336 records** | |

#### Struktur Baris Vektor:
* `id` (`uuid`): Identifier unik baris dokumen.
* `text` (`varchar`): Kumpulan varian kata kunci dan frasa pencarian yang di-*embed* ke ruang vektor AI (contoh: `"nomor logistik kontak logistik admin logistik wa logistik nomor pickup"`).
* `metadata` (`jsonb`): Menyimpan payload terstruktur:
  - `metadata.jawaban`: Teks jawaban lengkap yang akan disajikan ke pengguna.
  - `metadata.kategori`: Kategori topik (contoh: `ADMIN_LOGISTIK`, `AKUN_GOCAR`, `TARIF_SEWA`, `APA ITU GMS`).
  - `metadata.source`: Asal dokumen sumber.

### 2.2 Hierarki Pemuatan Data (`src/components/FaqChatbot/index.tsx`)
1. **Layer 1 (Utama):** Memanggil fungsi `fetchAllVectorFaqs()` di `src/utilities/chatbotDb.ts`. Fungsi ini mengeksekusi *query* langsung ke `CHATBOT_DATABASE_URL` pada database `chatBotMobisLocal`. Jika berhasil, data riil dari n8n langsung dirender.
2. **Layer 2 (Payload Collection):** Jika koneksi ke database vektor gagal atau tidak ditemukan baris data, sistem membaca koleksi lokal Payload CMS `chatbot-faqs` di database `local_mobis` (telah berisi 16 baris data lokal).
3. **Layer 3 (Mock Data):** Jika kedua database di atas kosong, sistem menampilkan data bawaan dari `mockData.ts` sehingga tampilan admin tidak pernah rusak atau *blank*.

---

## 3. Rincian Komponen & Struktur Kode

Modul ini diimplementasikan secara rapi dalam direktori `src/components/FaqChatbot/` dan `src/collections/`:

```
src/
├── collections/
│   └── ChatbotFaqs.ts                 # Definisi schema koleksi Payload CMS
├── components/
│   └── FaqChatbot/
│       ├── index.tsx                  # Server Component (Data Fetching & Fallbacks)
│       ├── FaqChatbotClient.tsx       # Client Component (State, Filter, Search & Table)
│       ├── types.ts                   # Type definitions & mapping kategori/label
│       ├── mockData.ts                # Data cadangan statis
│       ├── index.scss                 # Styling SCSS custom (Dark Mode & Native Look)
│       └── components/
│           ├── EnvironmentTabs.tsx    # Filter ganda (Pill switcher Env & Channel)
│           ├── FaqDetailModal.tsx     # Modal detail lengkap + tombol Copy
│           ├── ChatbotFab.tsx         # Floating Action Button simulator asisten
│           └── FaqStatsCards.tsx      # Komponen metrik ringkasan indeks vektor
└── utilities/
    └── chatbotDb.ts                   # Pool PostgreSQL & Query fetch tabel vektor n8n
```

### 3.1 Skema Koleksi Payload (`ChatbotFaqs.ts`)
* **Slug:** `chatbot-faqs`
* **Grup Menu:** `Chatbot` di sidebar Payload CMS.
* **Tampilan List Kustom:** Mengganti tabel bawaan Payload dengan komponen kustom via `admin.components.views.list.Component: '@/components/FaqChatbot'`.
* **Field-field:**
  - `question` (Text): Kalimat pertanyaan / kata kunci.
  - `answer` (Textarea): Template jawaban lengkap.
  - `environment` (Select): `staging`, `production`, atau `all`.
  - `channel` (Select): `dm`, `comment`, atau `all`.
  - `category` (Select): `lepas-kunci`, `driver`, `tarif-promo`, `persyaratan`, `area-jadwal`, `umum`.
  - `status` (Select): `active`, `draft`, `archived`.
  - `order` (Number): Prioritas urutan tampilan.

### 3.2 Simulator Asisten Cerdas (`ChatbotFab.tsx` & `AssistantWidget.tsx`)
Salah satu keunggulan terbesar fitur ini adalah integrasi simulator obrolan:
* Pada `src/components/FaqChatbot/components/ChatbotFab.tsx`, komponen memanggil `AssistantWidget` dengan prop:
  - `initialStage="chat"`: Melewati tahapan form pendaftaran nama/HP yang biasa muncul di sisi publik.
  - `initialUser={{ name: 'Admin MOBIS', phone: '081234567890' }}`: Menetapkan identitas persona admin secara otomatis.
  - `apiBase="/api/assistant"`: Terhubung langsung ke endpoint webhook AI backend yang diamankan dengan tanda tangan HMAC.

---

## 4. Kemampuan Fitur Antarmuka Pengguna (UI/UX)

Sesuai tampilan pada tangkapan layar antarmuka admin:

1. **Header Bersih & Profesional:**
   - Judul **"Chatbot FAQs"** disertai indikator jumlah data yang sedang difilter.
   - Tombol **"Uji Coba Asisten"**: Membuka widget obrolan di sudut kanan bawah.
   - Tombol **"+ Tambah FAQ"**: Membuka form pembuatan dokumen baru di Payload CMS.
2. **Dual-Pill Filter Bar (`EnvironmentTabs`):**
   - **Environment Switcher:** Beralih instan antara `Staging`, `Production`, atau `Semua`.
   - **Channel Switcher:** Beralih antara `Direct Message (DM)`, `Comment`, atau `Semua`.
3. **Pencarian Real-Time & Filter Kategori:**
   - Kotak pencarian responsif yang mencocokkan kata kunci baik pada teks pertanyaan maupun teks jawaban secara *case-insensitive*.
   - Dropdown kategori dinamis yang mengekstrak seluruh kategori unik dari metadata vektor yang ada (misal: `APA ITU GMS`, `AKUN_GOCAR`, `TARIF_SEWA`).
4. **Tabel Data Interaktif:**
   - Kolom nomor urut `#`.
   - Kolom **Pertanyaan** & **Jawaban** dengan pemotongan teks (*ellipsis*) agar tabel tetap rapi.
   - Badge warna untuk kategori.
   - Tombol Aksi:
     - 👁️ **Eye Button:** Membuka `FaqDetailModal` untuk membaca seluruh teks pertanyaan dan jawaban tanpa terpotong, disertai tombol cepat **"Salin Pertanyaan & Jawaban"** ke *clipboard*.
     - ↗️ **External Link Button:** Membuka halaman edit dokumen Payload jika baris berasal dari koleksi CMS.
5. **Floating Action Button (FAB):**
   - Tombol mengambang di pojok kanan bawah bertuliskan **"Test Assistant"** memudahkan pengujian kapan saja saat sedang menginspeksi daftar FAQ.

---

## 5. Integrasi dengan Engine AI (n8n & Webhook Assistant)

Fitur ini menjadi jembatan antara CMS dan alur kerja AI n8n:

```
[Knowledge Base Vektor di PostgreSQL] 
                 ▲
                 │ (Vector Embedding via OpenAI / pgvector)
                 ▼
          [Workflow n8n] 
                 ▲
                 │ (POST /api/assistant dengan HMAC-SHA256 signature)
                 ▼
[Simulator Obrolan Admin & Widget Publik Mobis]
```

Ketika admin mengklik **"Uji Coba Asisten"** dan mengajukan pertanyaan:
1. Pertanyaan dikirimkan ke Next.js internal API `/api/assistant`.
2. Endpoint memverifikasi rate limit dan sanitasi string, kemudian menandatangani paket data menggunakan kunci rahasia `MOBIS_ASSISTANT_SECRET` via algoritma `HMAC-SHA256`.
3. Upstream n8n mencari kecocokan semantik di tabel vektor yang sesuai (`n8n_vectors_mobis_*`).
4. n8n menghasilkan respons kontekstual berdasarkan template jawaban yang tersimpan di metadata FAQ.
5. Hasil obrolan tampil secara instan di jendela simulasi.

---

## 6. Analisis Temuan Teknis & Rekomendasi Peningkatan

Berdasarkan penelusuran kode dan basis data saat ini, berikut evaluasi dan saran pengembangannya:

### ✅ Kelebihan yang Sangat Baik:
1. **Performa Sangat Ringan:** Tampilan tabel menggunakan gaya SCSS kustom modular yang berbaur sempurna dengan tema *native* Payload CMS (Dark Mode & Light Mode).
2. **Konektivitas Vektor Riil:** Mampu membaca 336 vektor riil dari database n8n tanpa perantara rumit.
3. **User Experience Simulator:** Dukungan `initialStage="chat"` pada `AssistantWidget` membuat tim konten tidak perlu membuang waktu mengisi nomor HP berulang-ulang saat menguji respons bot.

### 💡 Rekomendasi untuk Pengembangan Selanjutnya:
1. **Pagination di Sisi Klien / Server:**
   Saat ini, jika filter diset ke `Semua` (All), sistem memuat seluruh 336 baris ke DOM tabel sekaligus. Meskipun ringan untuk ratusan baris, disarankan menambahkan paginasi (misal 20-50 data per halaman) jika basis data vektor bertambah menjadi ribuan.
2. **Sinkronisasi Dua Arah (Two-Way Sync):**
   Saat ini, tombol `+ Tambah FAQ` menyimpan data ke koleksi `chatbot-faqs` di database `local_mobis`. Jika ingin data baru tersebut langsung terbaca oleh AI n8n tanpa menunggu workflow ingestion n8n, dapat dibuatkan hook `afterChange` di `ChatbotFaqs.ts` untuk memicu webhook sinkronisasi ke n8n agar otomatis di-*embed* ke tabel vektor `n8n_vectors_mobis_*`.
3. **Tombol "Terapkan Pertanyaan ke Chat" (Apply Query):**
   Pada `FaqDetailModal`, dapat ditambahkan tombol **"Tanyakan ini ke Asisten"** yang otomatis mengisi input chat di simulator dan langsung mengirimkannya, sehingga admin dapat menguji varian pertanyaan hanya dengan satu klik.

---

*Laporan analisis modul FAQ Chatbot disusun secara komprehensif oleh AI Assistant Antigravity.*
