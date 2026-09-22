# Rencana Implementasi Bertahap (Phased Plan V2): Penambahan Field "Jenis Mobil"

Rencana teknis ini disusun dengan **Frontend (FE) First Approach** yang telah diperbarui secara komprehensif berdasarkan analisa menyeluruh terhadap 4 jalur koneksi sistem (*PostgreSQL Database, Google Sheets, External CRM API, dan Meta CAPI*).

---

## 🧭 Alur Pengerjaan 5 Fase (FE First)

```text
[Phase 1: Frontend UI] ──► [Phase 2: Database & CMS] ──► [Phase 3: Backend API] ──► [Phase 4: Google Sheets & Sync] ──► [Phase 5: QA & Testing]
```

---

## 🔹 Phase 1: Antarmuka Pengguna & Block Form (Frontend UI)
**Fokus**: Memunculkan tampilan visual dropdown "Jenis Mobil" di halaman website agar langsung bisa dicoba interaksinya di browser (`http://localhost:3000`) secara aman tanpa risiko bentrok database PostgreSQL.

1. **State & Opsi Dropdown Armada Mobil**:
   - File: [`src/blocks/Mobis/RegistrationForm/Component.tsx`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/src/blocks/Mobis/RegistrationForm/Component.tsx)
   - Tambahkan 4 opsi unit default:
     ```typescript
     const DEFAULT_CAR_UNIT_OPTS: Option[] = [
       { label: 'Toyota Avanza 2026', value: 'toyota_avanza_2026' },
       { label: 'Toyota Calya 2026', value: 'toyota_calya_2026' },
       { label: 'Daihatsu Sigra', value: 'daihatsu_sigra' },
       { label: 'Toyota Calya', value: 'toyota_calya' },
     ]
     ```
   - Tambahkan `carUnit?: Option[]` pada interface `Props['opts']`.
   - Tambahkan `carUnit: string` ke dalam state `FormValues` (nilai default `''` pada `initialValues`).
   - Inisialisasi opsi dengan fallback:
     ```typescript
     const CAR_UNIT_OPTS = (() => {
       const v = normalizeOptions(opts?.carUnit)
       return v.length ? v : defaults.carUnit
     })()
     ```
2. **Validasi Sisi Klien & Error Mapping**:
   - Tambahkan validasi pada `validateField`:
     ```typescript
     case 'carUnit':
       if (!String(value).trim()) return 'Pilihan jenis mobil wajib dipilih.'
       return ''
     ```
   - Di fungsi `onSubmit`, tangkap error server:
     ```typescript
     if (typeof apiErrors.carUnit === 'string') {
       nextServerFieldErrors.carUnit = apiErrors.carUnit
     }
     ```
3. **Render Komponen Dropdown di UI**:
   - Pasang elemen `<SelectField />` dengan label **"Jenis Mobil"** dan placeholder *"Pilih jenis mobil"*.
   - Posisi tampilan: **Tepat di atas baris "Lokasi serah terima unit"** (baris ~1187).
   - Terapkan styling grid Bootstrap konsisten (`row g-2 align-items-md-center mb-2`).

---

## 🔹 Phase 2: Kontrak Data, Skema Database & CMS (Payload CMS)
**Fokus**: Menyiapkan struktur tipe TypeScript, skema koleksi admin CMS, dan tabel kolom database PostgreSQL (`local_mobis`).

1. **Update Kontrak Data Registrasi**:
   - File: [`src/types/registration.ts`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/src/types/registration.ts)
   - Tambahkan `carUnit?: string` ke interface `RegistrationPayload`.
2. **Update Konfigurasi Block CMS**:
   - File: [`src/blocks/Mobis/RegistrationForm/Config.ts`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/src/blocks/Mobis/RegistrationForm/Config.ts)
   - Daftarkan `makeOptionArray('carUnit', 'Pilihan Jenis Mobil Options')` agar opsi armada dapat disesuaikan admin melalui CMS.
3. **Update Skema Koleksi Customers**:
   - File: [`src/collections/Customers/Customers.ts`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/src/collections/Customers/Customers.ts)
   - Tambahkan field:
     ```typescript
     { name: 'carUnit', type: 'text', label: 'Jenis Mobil' },
     ```
   - Tambahkan `'carUnit'` ke daftar `defaultColumns` dan `listSearchableFields` agar tim operasional langsung dapat melihat pilihan mobil pendaftar pada tabel data utama admin panel.
4. **Migrasi Database PostgreSQL & Sinkronisasi Tipe**:
   - Buat file migrasi SQL/TypeScript untuk tabel relasional block options dan kolom `car_unit` pada tabel `customers`.
   - Jalankan `npm run generate:types` untuk menyelaraskan file `src/payload-types.ts`.

---

## 🔹 Phase 3: Logika Validasi & Pipeline Backend (API Layer)
**Fokus**: Menyaring data masukan pilihan mobil secara aman dari serangan XSS/injeksi dan menyimpannya ke database PostgreSQL.

1. **Sanitasi Sisi Server**:
   - File: [`src/lib/validation/registration.ts`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/src/lib/validation/registration.ts)
   - Tangkap dan sanitasi field `carUnit` menggunakan `optionalText(body.carUnit, 100, 'carUnit')`.
   - Menangkal potensi serangan XSS / suspicious script markup.
2. **Penyimpanan di Route Handler**:
   - File: [`src/app/(payload)/api/registration/route.ts`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/src/app/(payload)/api/registration/route.ts)
   - Teruskan `carUnit: reg.carUnit ?? ''` ke dalam objek `customerData` saat memanggil `payload.create({ collection: 'customers', ... })`.
   - Pastikan data otomatis tercadangkan ke dalam kolom audit `rawPayload`.

---

## 🔹 Phase 4: Integrasi Google Sheets & Sinkronisasi Eksternal
**Fokus**: Menyisipkan kolom baru **Jenis Mobil di Kolom N** pada Google Sheets, menggeser kolom setelahnya mundur 1 kolom, dan menyelaraskan API eksternal.

1. **Formater Label Unit**:
   - File: [`src/services/googleSheets/appendLead.ts`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/src/services/googleSheets/appendLead.ts)
   - Buat helper `mapCarUnitLabel(carUnit?: string)` untuk mengonversi kode slug (misal `toyota_avanza_2026`) menjadi teks rapi (`Toyota Avanza 2026`).
2. **Penyusunan Ulang Kolom Spreadsheet (`buildRow`)**:
   - **Sisipkan Kolom N baru** untuk Jenis Mobil dengan proteksi formula injection: `esc(mapCarUnitLabel(payload.carUnit))`.
   - **Mundurkan kolom setelahnya 1 langkah ke kanan**:
     * Kolom N lama (Info Tambahan/Promo) -> **Kolom O**
     * Kolom O lama ('Website Mobis') -> **Kolom P**
     * Kolom P lama (kosong) -> **Kolom Q**
     * Kolom Q lama (kosong) -> **Kolom R**
     * Kolom R lama (Tanggal) -> **Kolom S**
     * Kolom S lama (Jam) -> **Kolom T**
     * Kolom T lama (WA Emergency) -> **Kolom U**
     * Kolom U lama (Nama Emergency) -> **Kolom V**
     * Kolom V lama (Hubungan Emergency) -> **Kolom W**
     * Kolom W lama (Tempat Lahir) -> **Kolom X**
     * Kolom X lama (Tanggal Lahir) -> **Kolom Y**
     * Kolom Y lama (No SIM) -> **Kolom Z**
     * Kolom Z lama (Jenis SIM) -> **Kolom AA**
     * Kolom AA lama (Masa Berlaku SIM) -> **Kolom AB**
   - Update range append Google Sheets dari `${sheetName}!A:Z` menjadi `${sheetName}!A:AB`.
3. **Penyelarasan External CRM API**:
   - Pada `buildExternalApiPayload()`, tambahkan field armada (misal: `car_preference` dan `lead_car_preference`) agar data mobil juga terkirim ke CRM eksternal jika didukung.

---

## 🔹 Phase 5: Pengujian Menyeluruh (QA & Verification)
**Fokus**: Verifikasi fungsi *end-to-end* dari tampilan browser hingga 4 koneksi data.

1. **TypeScript Typecheck**:
   - Jalankan `npm run typecheck` untuk memastikan nol error kompilasi.
2. **Uji Pengisian Form di Browser**:
   - Buka form di `http://localhost:3000`, pilih salah satu mobil (misal: *Toyota Avanza 2026*), lengkapi data, lalu klik tombol **Kirim**.
3. **Verifikasi ke-4 Jalur Koneksi**:
   - **PostgreSQL (`customers`)**: Periksa baris data pendaftar baru, pastikan kolom `carUnit` terisi unit pilihan dan tampil di tabel Admin Panel (`/admin/collections/customers`).
   - **Google Sheets**: Periksa lembar spreadsheet Leads, pastikan Kolom N mencatat nama mobil dan kolom O s/d AB terisi data sesuai urutan baru.
   - **External CRM API**: Periksa log `externalApiSuccess` pada `sheetMeta`.
   - **Meta CAPI**: Pastikan event `CompleteRegistration` tetap terkirim normal tanpa gangguan.

---

## 📌 Tindakan Persiapan di Google Sheet Manual (User Checklist)
Sebelum Phase 4 di-deploy ke production:
1. Buka spreadsheet target tim sales/operasional di Google Sheets.
2. Klik kanan pada **Header Kolom N** -> Pilih **"Insert 1 column left" (Sisipkan 1 kolom di kiri)**.
3. Beri nama header kolom baru tersebut: **"Jenis Mobil"** atau **"Unit"**.
