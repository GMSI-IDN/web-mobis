# Analisa Komprehensif Frontend (FE) & Backend (BE): Form Pendaftaran MOBIS

Dokumen ini menyajikan analisa teknis arsitektur **Frontend (FE)** dan **Backend (BE)** untuk antarmuka **Form Pendaftaran Mobil Sewa MOBIS** (`rentalmobis.com`), mengacu pada tampilan UI aktual dan implementasi sistem pada *codebase* Next.js (App Router) dan Payload CMS.

---

## 1. Tinjauan Antarmuka Pengguna (UI & Form Layout)

Berdasarkan tangkapan layar (screenshot), halaman form pendaftaran MOBIS dirancang dengan tata letak modern, bersih, dan berorientasi konversi:

### A. Layout Global & Visual Styling
- **Header & Navigasi**:
  - Logo MOBIS di sisi kiri atas.
  - Menu navigasi utama di sisi kanan: *Unit Mobil*, *Program*, *Alur Pendaftaran!*, *Kata Mitra Kami*, *Tunggu Kami*.
- **Latar Belakang (Background)**:
  - Gradien vertikal dinamis dari putih di bagian atas hingga hijau cerah khas MOBIS (*brand identity*) di bagian bawah.
- **Wadah Formulir (Form Container Card)**:
  - Kartu putih di tengah layar (*centered card layout*) dengan bayangan halus (*box-shadow* / *elevation*), sudut melengkung (*rounded corners*), dan pembatas visual yang ramah di perangkat desktop maupun mobile.
- **Floating Action Widgets (Widget Melayang Sisi Kanan Bawah)**:
  - Tombol aksi kuning: **Status Pendaftaran** (untuk cek status lead/verifikasi).
  - Tombol aksi hijau: **Hubungi Kami** (integrasi WhatsApp Customer Service).

---

## 2. Rincian Pemetaan Field Input (Form Elements Mapping)

Formulir ini memuat 15 kelompok input interaktif dengan validasi bertingkat:

| No | Nama Field di UI | Tipe Kontrol UI | Placeholder / Nilai Default | Logika & Validasi Input |
|---|---|---|---|---|
| 1 | **Nama** | Text Input | `Ketik nama` | Min 2 karakter, max 100 karakter, sanitasi XSS/karakter khusus. |
| 2 | **Tempat & Tanggal Lahir** | 2-Kolom (Text + Date Picker) | `Tempat` & `mm/dd/yyyy` | Tempat lahir teks (min 2 char). Tanggal lahir dibatasi komputasi usia **18 – 62 tahun**. |
| 3 | **No. HP (Whatsapp)** | Number / Tel Input | `Ketik nomor handphone` | Wajib format seluler Indonesia (08xx / 62xx), panjang 10–15 digit numerik. |
| 4 | **Nomor KTP** | Number Input | `Ketik nomor KTP` | *Strict* tepat 16 digit angka numerik. Divalidasi cooldown 3 bulan di database. |
| 5 | **SIM** | Multi-row: Text + Select + Date | `Nomor SIM`, Select `Jenis SIM`, `mm/dd/yyyy` | Nomor SIM valid, pilihan jenis SIM dinamis dari CMS (SIM A, B1, dll), tanggal masa berlaku SIM. |
| 6 | **Domisili** | Dropdown Select | `Pilih domisili` | Pilihan wilayah operasional (Jabodetabek, Surabaya, Bandung, dll) bersumber dari CMS. |
| 7 | **Alamat Lengkap Saat Ini** | Textarea Multiline | `Ketik alamat saat ini` | Alamat domisili fisik terkini pendaftar (minimal 10 karakter). |
| 8 | **Status Kepemilikan Rumah** | Dropdown Select | `- Pilih -` | Opsi kepemilikan (Milik Sendiri, Sewa/Kontrak, Rumah Keluarga/Orang Tua). |
| 9 | **Nama & No. HP Emergency** | 2-Row Grid: Text + Tel + Select | `Ketik nama`, `Ketik nomor HP`, `Hubungan - Pilih -` | Kontak darurat. **No HP darurat tidak boleh sama dengan No HP pendaftar**. Hubungan (Orang Tua, Pasangan, Saudara, Kerabat). |
| 10 | **Aplikasi Driver Online** | Dropdown Select | `Pilih aplikasi driver online` | Platform taksi online (Grab, Gojek, Maxim, InDrive, Belum Ada). Memicu rendering kondisional. |
| 11 | **Akun driver aktif atas nama sendiri?** | Radio Button Group | `Ya` / `Tidak` | Muncul secara kondisional hanya jika pengguna memiliki akun driver online aktif. |
| 12 | **Lama bekerja sebagai driver online?** | Dropdown Select | `Pilih jangka waktu` | Pilihan pengalaman (< 6 bulan, 6-12 bulan, 1-2 tahun, > 2 tahun). Bersifat kondisional. |
| 13 | **Lokasi serah terima unit** | Dropdown Select | `Pilih Lokasi` | Titik pool atau kantor cabang serah terima armada sewa MOBIS. |
| 14 | **Mengetahui Informasi dari** | Dropdown Select (+ Dynamic Input) | `Pilih sumber informasi` | Sumber promosi (Instagram, Facebook, TikTok, Teman/Rekan, Karyawan). Menampilkan input teks dinamis untuk username/link/nama referensi. |
| 15 | **Promo Code** | Text Input | `Masukkan promo code yang dimiliki` | Opsional. Kode voucher diskon/program pendaftaran mitra. |
| 16 | **Persetujuan & Kebijakan Data** | Checkbox Mandatory | Pernyataan kebenaran data | Persetujuan hukum pendaftar bahwa data yang diisi adalah benar dan bersedia diverifikasi tim Mobis. |
| 17 | **Tombol Submit** | Action Button | `Kirim` | Tombol hijau melengkung (*pill button*) dengan *loading state*, spinner, dan proteksi anti-double submit. |

---

## 3. Analisa Arsitektur Frontend (FE)

Komponen frontend diimplementasikan menggunakan Next.js App Router dengan arsitektur **Payload CMS Block Component** (`src/blocks/Mobis/RegistrationForm/Component.tsx`).

### A. State Management & Form Handling
- **Komponen Klien**: Dideklarasikan dengan `'use client'` untuk mengelola interaktivitas formulir secara penuh di sisi browser.
- **Pola State Monolitik Terstruktur**:
  - `values`: Menyimpan seluruh data formulir dalam satu objek `FormValues`.
  - `errors`: Objek pasangan *key-value* untuk pesan kegagalan validasi.
  - `touched`: Menandai field mana saja yang telah diakses/diinteraksi pengguna (*blur event*).
  - `serverFieldErrors`: Menyimpan error kontekstual yang dikembalikan dari API Backend (misalnya error nomor KTP sudah terdaftar).
- **Debounced Validation**:
  - Validasi field menggunakan *debouncing* (~1000ms) melalui timer `scheduleValidation` berbasis `useRef`.
  - Mengurangi beban komputasi re-render pada setiap ketukan keyboard (*keystroke*) dan memberikan pengalaman UX yang tenang tanpa pop-up pesan error seketika saat pengguna masih mengetik.

### B. Validasi Sisi Klien (Client-Side Validation Engine)
- **Kalkulasi Rentang Tanggal Lahir Otomatis**:
  - Menggunakan fungsi helper `getBirthDateRange(minAge: 18, maxAge: 62)`. Tanggal input `max` dan `min` dihitung dinamis dari tanggal hari ini.
- **Cross-Field Validation**:
  - Nomor HP Darurat (`emergencyPhone`) secara dinamis dibandingkan dengan Nomor HP Pendaftar (`phone`). Jika sama, form langsung menampilkan pesan error: *"Nomor darurat tidak boleh sama dengan nomor HP utama"*.
- **Sanitasi Anti-Markup di Sisi Klien**:
  - Menggunakan pola *regular expression* `SUSPICIOUS_INPUT_PATTERN` (`/[<>]|javascript:|data:text\/html|(?:https?|ftp):\/\/|www\.[a-z0-9-]/i`) untuk mencegah injeksi tag HTML/skrip berbahaya langsung pada level UI.

### C. Logika Input Kondisional (Dynamic Visibility)
1. **Field Aplikasi Driver**:
   - Jika `driverApps === 'tidak_ada'` atau `'belum_ada'`, input pertanyaan `activeAccountSelf` dan `driverExperience` disembunyikan.
   - Jika pengguna memilih opsi `'lainnya'`, otomatis muncul input tambahan teks bebas untuk mengetik nama aplikasi driver yang digunakan.
2. **Field Sumber Informasi**:
   - Berdasarkan pilihan `sourceInfo` (misal TikTok, Instagram, Facebook, Teman/Kerabat), konfigurasi `sourceDetailConfig` akan menampilkan input kontekstual yang sesuai (misal: *"Masukkan Link / Username Akun"*, atau *"Masukkan Nama Rekan"*).

### D. Keamanan & Anti-Bot Sisi Depan
- **Honeypot Hidden Field**:
  - Input teks tersembunyi bernama `website` yang ditempatkan di luar layar browser (`position: absolute; left: -9999px`). Form asli tidak diisi oleh manusia, namun bot *auto-fill crawler* akan mengisinya secara otomatis.
- **Form Timing Defense**:
  - Menggunakan `formRenderedAtRef` (`Date.now()`). Waktu render awal dicatat dan dikirimkan saat *submit*. Pengiriman form di bawah 3 detik diidentifikasi sebagai aksi bot otomatis.

### E. Pelacakan Konversi & Analitik (Event Tracking)
- **Meta Pixel & TikTok Pixel**:
  - Terintegrasi langsung pada `handleSubmit` melalui utilitas `trackCustomEvent` dan `trackEventWithDedup`.
- **Deduplikasi CAPI (Client-Server Deduplication)**:
  - FE membuat UUID unik event melalui `crypto.randomUUID()` (`metaEventId`) dan menyertakannya ke dalam payload API pendaftaran. Hal ini menjamin event konversi tidak dihitung ganda antara Meta Pixel (Browser) dan Conversions API (Server).

---

## 4. Analisa Arsitektur Backend (BE)

Backend pendaftaran diimplementasikan via Next.js Route Handler pada `src/app/(payload)/api/registration/route.ts` yang terhubung langsung dengan **Payload CMS Local API**.

```
[Client Submit]
       │
       ▼
[1. Rate Limiting per IP] ── (Exceeded: 429 Rate Limited)
       │
       ▼
[2. Anti-Bot Defense] ──── (Honeypot / < 3s: Return 200 Pseudo-Success)
       │
       ▼
[3. Payload Validation & Sanitization]
       │
       ▼
[4. KTP Cooldown Check (3 Bulan)] ── (Duplicate < 90 Days: 400 KTP_COOLDOWN_ACTIVE)
       │
       ▼
[5. Promo Code Validation Engine] ── (Invalid / Expired: 400 Bad Request)
       │
       ▼
[6. Google Sheets Async/Sync Sync]
       │
       ▼
[7. Payload CMS DB Insert (Customers)] ── (Sequence Conflict: Auto-resync PG & Retry)
       │
       ▼
[8. Atomic Voucher Quota Increment] ──── (Exhausted: Reconcile Record)
       │
       ▼
[9. Meta Conversions API (CAPI)]
       │
       ▼
[Return Response 200 OK]
```

### A. Pipeline Keamanan & Rate Limiting
1. **IP-Based Rate Limiting**:
   - Membatasi 5 percobaan pendaftaran per 10 menit per IP (`checkRateLimit('registration:${clientIp}', { limit: 5, windowMs: 600000 })`). Mencegah serangan *denial of service*, *spamming*, maupun manipulasi kuota voucher.
2. **Penanganan Bot Senyap (Silent Bot Dropping)**:
   - Apabila field *honeypot* terisi atau `elapsedMs < 3000ms`, server merespon dengan status `200 OK` semu tanpa melakukan penulisan ke database atau eksekusi Google Sheets. Pendekatan ini membuat bot mengira serangannya berhasil sehingga tidak mencoba metode bypass lainnya.

### B. Validasi Data & Aturan Bisnis (Business Rules)
1. **Aturan Cooldown Pendaftaran KTP (3 Bulan)**:
   - Server menjalankan kueri ke koleksi `customers` untuk mengecek apakah `ktpNumber` yang sama pernah mendaftar dalam rentang 3 bulan terakhir (`addMonths(new Date(), -3)`).
   - Jika ditemukan, sistem menolak pendaftaran dengan status `400` dan kode `KTP_COOLDOWN_ACTIVE`, menyertakan tanggal kapan KTP tersebut dapat mendaftar kembali (`nextEligibleAt`).
2. **Mesin Validasi Promo & Voucher**:
   - Memeriksa ke koleksi `vouchers` Payload CMS:
     - Apakah kode voucher aktif (`enabled === true`).
     - Apakah tanggal saat ini berada dalam rentang `startAt` dan `endAt`.
     - Apakah sisa kuota masih tersedia (`quota > used`).
   - **Atomic Increment & Concurrency Guard**:
     - Menggunakan helper `incrementVoucherUsed` untuk mengantisipasi *race condition* saat beberapa pendaftar mengklaim voucher terbatas secara serentak.
     - Jika kuota habis di tengah proses transaksi, backend secara otomatis melakukan rekonsiliasi (*reconcile customer promo data*) sehingga tidak terjadi *overselling* kuota.

### C. Persistensi Data (Database Layer)
1. **Koleksi Database `customers`**:
   - Menyimpan seluruh profil terstruktur pendaftar (identitas, SIM, domisili, kontak darurat, preferensi driver, dan status voucher).
2. **Audit Trail Cadangan (`rawPayload`)**:
   - Backend menyimpan seluruh objek JSON mentah yang dikirimkan klien ke dalam field `rawPayload`. Ini berfungsi sebagai *audit log* jika sewaktu-waktu terjadi perubahan skema field di masa mendatang.
3. **Ketahanan Transaksi PostgreSQL (Sequence Auto-Recovery)**:
   - Dilengkapi penanganan error khusus `isIdUniqueValidationError`. Apabila *sequence ID* auto-increment di PostgreSQL mengalami desinkronisasi, server mengeksekusi SQL raw `resyncCollectionIdSequence` dan mengulang operasi `create` secara transparan tanpa memutus request pengguna.

### D. Integrasi Layanan Eksternal (Third-Party Services)
1. **Google Sheets Integration (`appendLeadToSheet`)**:
   - Setiap pendaftaran berhasil dicatat secara langsung ke spreadsheet operasional tim sales MOBIS. Terdapat *toggle environment variable* `REGISTRATION_BYPASS_GOOGLE_SHEETS` untuk mempermudah *staging/testing*.
2. **Meta Conversions API (Server-Side CAPI)**:
   - Mengirimkan event `CompleteRegistration` ke server Meta Graph API.
   - Mengirimkan data terenkripsi *SHA-256 hash* (nomor HP, nama depan, nama belakang), IP pendaftar, User-Agent, serta menangkap cookie browser `_fbc` dan `_fbp` untuk memaksimalkan *Event Quality Score* pada iklan berbayar Meta.

---

## 5. Ringkasan Evaluasi & Rekomendasi Peningkatan

| Aspek | Kondisi Saat Ini | Rekomendasi Optimasi Ke Depan |
|---|---|---|
| **Validasi Skema** | Aturan validasi didefinisikan terpisah di FE (`validateField`) dan BE (`validateRegistrationPayload`). | Mengadopsi skema terpadu (*Single Source of Truth*) menggunakan **Zod Schema** yang di-share antara FE (React Hook Form + `@hookform/resolvers/zod`) dan BE. |
| **Integrasi Eksternal** | Penulisan ke Google Sheets dan Meta CAPI bersifat *synchronous / blocking* di alur request. | Mengalihkan integrasi pihak ketiga ke sistem **Background Job Queue** (misal: Redis BullMQ atau Inngest) agar respon API pendaftaran menjadi instan (< 100ms). |
| **Verifikasi Handphone** | Hanya validasi format digit regex (10-15 angka). | Menambahkan fitur **OTP WhatsApp / SMS** untuk memvalidasi kepemilikan nomor asli dan mengurangi *junk leads*. |
| **Idempotency** | Belum ada token idempoten untuk mencegah double click submit saat koneksi internet lambat. | Menambahkan `idempotency-key` berbasis sesi pada header request agar transaksi ganda tereliminasi secara mutlak. |
