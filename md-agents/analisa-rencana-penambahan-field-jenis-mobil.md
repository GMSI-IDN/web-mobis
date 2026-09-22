# Analisa Komprehensif & Validasi Teknis: Rencana Penambahan Field "Jenis Mobil"

Dokumen ini berisi hasil analisa mendalam terhadap rencana implementasi pada [`md-agents/plan-penambahan-field-jenis-mobil.md`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/md-agents/plan-penambahan-field-jenis-mobil.md) setelah dikorelasikan dan divalidasi langsung dengan *codebase* aktual `web-mobis`.

---

## 1. Ringkasan Eksekutif & Validitas Rencana

Rencana implementasi bertahap (**Frontend First Approach**) yang diajukan sudah **sangat terstruktur, realistis, dan tepat sasaran**. Seluruh file target yang disebutkan dalam rencana benar-benar ada pada arsitektur proyek dan menjalankan peranan sesuai deskripsi.

| Layer | File Terkait di Codebase | Status Relevansi | Catatan Penting |
|---|---|---|---|
| **CMS Block Config** | [`src/blocks/Mobis/RegistrationForm/Config.ts`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/src/blocks/Mobis/RegistrationForm/Config.ts) | ✅ 100% Akurat | Perlu perhatian khusus terkait tabel PostgreSQL relasional array block di Payload. |
| **Frontend UI** | [`src/blocks/Mobis/RegistrationForm/Component.tsx`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/src/blocks/Mobis/RegistrationForm/Component.tsx) | ✅ 100% Akurat | Menambahkan state, opsi default, validasi, dan rendering dropdown sebelum baris `handoverLocation`. |
| **Data Contract** | [`src/types/registration.ts`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/src/types/registration.ts) | ✅ 100% Akurat | Menambahkan `carUnit?: string` ke interface `RegistrationPayload`. |
| **Database Schema** | [`src/collections/Customers/Customers.ts`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/src/collections/Customers/Customers.ts) | ✅ 100% Akurat | Menambahkan kolom `carUnit` ke skema `customers` dan `defaultColumns`. |
| **BE Validation** | [`src/lib/validation/registration.ts`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/src/lib/validation/registration.ts) | ✅ 100% Akurat | Sanitasi `optionalText(body.carUnit, 100, 'carUnit')` dan proteksi suspicious markup. |
| **Route Handler** | [`src/app/(payload)/api/registration/route.ts`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/src/app/(payload)/api/registration/route.ts) | ✅ 100% Akurat | Meneruskan `carUnit` ke `customerData` saat penyimpanan ke database `customers`. |
| **Google Sheets & Sync** | [`src/services/googleSheets/appendLead.ts`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/src/services/googleSheets/appendLead.ts) | ✅ 100% Akurat | Memetakan nilai ke label rapi, penempatan kolom pada baris sheet, dan integrasi API eksternal. |

---

## 2. Analisa Mendalam per Fase (Deep Dive Analysis)

### 🔹 Phase 1: Frontend UI (Tampilan & Interaksi Form)

#### Temuan Kode Terkait:
1. **Konfigurasi Block (`Config.ts`)**:
   - Fungsi pembantu `makeOptionArray(name, label)` saat ini digunakan untuk `sim`, `dom`, `house`, `emRel`, `drvExp`, `handover`, `onlineApp`, dan `source`.
   - Menambahkan `makeOptionArray('carUnit', 'Pilihan Jenis Mobil Options')` akan menyediakan UI di Admin Payload untuk mengelola opsi mobil secara dinamis.
2. **State & Opsi Komponen (`Component.tsx`)**:
   - Pola opsi di `Component.tsx` menggunakan `normalizeOptions(opts?.carUnit)` dengan fallback ke `defaults.carUnit`.
   - Empat opsi default:
     ```typescript
     const DEFAULT_CAR_UNIT_OPTS: Option[] = [
       { label: 'Toyota Avanza 2026', value: 'toyota_avanza_2026' },
       { label: 'Toyota Calya 2026', value: 'toyota_calya_2026' },
       { label: 'Daihatsu Sigra', value: 'daihatsu_sigra' },
       { label: 'Toyota Calya', value: 'toyota_calya' },
     ]
     ```
   - Di `FormValues`, tambahkan `carUnit: string` (nilai awal `''`).
   - Di `validateField`:
     ```typescript
     case 'carUnit':
       if (!String(value).trim()) return 'Pilihan jenis mobil wajib dipilih.'
       return ''
     ```
   - Di `validateForm`, perulangan `Object.keys(currentValues)` otomatis memvalidasi `carUnit` bersama field lainnya.
3. **Penempatan Elemen Dropdown**:
   - Pada `Component.tsx` baris 1187 terdapat blok `"Lokasi serah terima unit"`.
   - Dropdown `<SelectField />` untuk **Jenis Mobil** tepat disisipkan tepat di atas elemen tersebut dengan grid layout Bootstrap standar (`row g-2 align-items-md-center mb-2`).

---

### 🔹 Phase 2: Skema Database & Kontrak Payload CMS

#### Temuan Kode Terkait:
1. **Interface `RegistrationPayload` (`src/types/registration.ts`)**:
   - Penambahan `carUnit?: string` akan langsung menyelaraskan *contract* antara Frontend, Route Handler, dan Google Sheets service.
2. **Koleksi `Customers` (`src/collections/Customers/Customers.ts`)**:
   - Tambahkan field:
     ```typescript
     { name: 'carUnit', type: 'text', label: 'Jenis Mobil' }
     ```
   - Tambahkan `'carUnit'` ke dalam array `defaultColumns` dan `listSearchableFields` agar tim admin bisa langsung melihat dan mencari pendaftar berdasarkan jenis mobil yang diminati di Admin Panel.
3. **Generasi Tipe Data**:
   - Menjalankan `npm run generate:types` akan memperbarui `payload-types.ts` sehingga interface `Customer` dan `RegistrationFormBlock` secara otomatis mendapatkan tipe `carUnit`.

---

### 🔹 Phase 3: Validasi & Route Handler Backend

#### Temuan Kode Terkait:
1. **Sanitasi (`src/lib/validation/registration.ts`)**:
   - Di fungsi `validateRegistrationPayload(body: any)`:
     ```typescript
     carUnit: optionalText(body.carUnit, 100, 'carUnit'),
     ```
   - Ini memanggil fungsi `sanitizeFreeText` (memotong string berlebih & karakter kontrol) dan `assertNoSuspiciousMarkup` (mencegah XSS, tag HTML, atau string URL mencurigakan).
2. **Penyimpanan di Route Handler (`src/app/(payload)/api/registration/route.ts`)**:
   - Di dalam objek `customerData` (baris 427-463):
     ```typescript
     carUnit: reg.carUnit ?? '',
     ```
   - Payload mentah juga otomatis tersimpan di kolom audit `rawPayload: bodyWithoutId`.

---

### 🔹 Phase 4: Integrasi Google Sheets & Sinkronisasi Eksternal

#### Temuan Kode Terkait:
1. **Struktur Kolom di `src/services/googleSheets/appendLead.ts`**:
   - Fungsi `buildRow(payload)` saat ini menyusun 27 elemen kolom baris spreadsheet.
   - Pada baris 248–253 terdapat kolom:
     ```typescript
     esc(payload.promoCode ?? ''),
     'Website Mobis',
     '', // Kolom P kosong
     '', // Kolom Q kosong
     datePart,
     timePart,
     ```
   - Kita dapat menempatkan nilai `carUnit` pada kolom yang sesuai di Google Sheets Leads (misalnya kolom info preferensi unit atau kolom khusus armada), lengkap dengan proteksi formula injection `esc(mapCarUnitLabel(payload.carUnit))`.
2. **Sinkronisasi External Lead API (`sendLeadToExternalApi`)**:
   - Dalam `appendLead.ts` terdapat fungsi `sendLeadToExternalApi` yang mengirim data ke backend CRM eksternal (`MOBIS_LEAD_API_URL`).
   - Objek `buildExternalApiPayload` dapat diselaraskan dengan menambahkan preferensi armada (misal `car_preference` atau `car_unit`) jika API eksternal tersebut mendukungnya.

---

## 3. Temuan Kritis & Rekomendasi Mitigasi (Critical Gotchas)

Berikut adalah beberapa aspek teknis penting yang perlu diantisipasi agar implementasi berjalan mulus tanpa menimbulkan *breaking error*:

### ⚠️ 1. Mekanisme Migrasi PostgreSQL pada Payload CMS
- **Fakta Teknis**: Proyek ini menggunakan `@payloadcms/db-postgres`.
- Di Payload Postgres, jika kita menambahkan `makeOptionArray('carUnit', ...)` ke dalam Block CMS, Payload akan mencari tabel relasional child:
  `pages_blocks_registration_form_opts_car_unit` dan `_pages_v_blocks_registration_form_opts_car_unit`.
- Sebagai bukti, pada migrasi sebelumnya terdapat file:
  [`src/migrations/20260427_072500_fix_registration_form_online_app.ts`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/src/migrations/20260427_072500_fix_registration_form_online_app.ts) yang dibuat khusus untuk membuat tabel opsi block.
- **Rekomendasi**:
  1. Pada **Phase 1**, kita dapat mengimplementasikan opsi default di sisi React terlebih dahulu (`DEFAULT_CAR_UNIT_OPTS`), sehingga tampilan UI di browser bisa langsung aktif tanpa menunggu migrasi tabel CMS.
  2. Saat masuk ke **Phase 2**, buat migrasi database untuk tabel opsi block dan kolom `car_unit` pada tabel `customers`, atau pastikan `PAYLOAD_DB_PUSH=true` aktif saat di-run di lingkungan pengembangan lokal.

### ⚠️ 2. Pemetaan Posisi Kolom Google Sheets
- Spreadsheet Leads yang aktif (`STAGING Program Rental Driver` atau lembar produksi) memiliki urutan *header* kolom yang baku.
- **Rekomendasi**: Pastikan indeks kolom penempatan nilai mobil di `buildRow()` tidak menggeser kolom tanggal, waktu, atau link WhatsApp darurat yang sudah dibaca oleh tim operasional atau skrip formula otomatis di Google Sheets.

### ⚠️ 3. Validasi Error Mapping di Sisi Klien
- Di `Component.tsx`, handler submit membaca response error dari server:
  `nextServerFieldErrors.carUnit = apiErrors.carUnit`.
- Tambahkan baris pemetaan error `carUnit` agar jika terjadi penolakan dari server, pesan error muncul tepat di bawah dropdown "Jenis Mobil".

---

## 4. Kesimpulan & Status Kesiapan

Rencana pada [`md-agents/plan-penambahan-field-jenis-mobil.md`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/md-agents/plan-penambahan-field-jenis-mobil.md) **sangat solid dan siap untuk dieksekusi**. 

Dengan menerapkan prinsip **Frontend-First**:
1. User dapat segera melihat dan mencoba dropdown **Jenis Mobil** di `http://localhost:3000` pada **Phase 1**.
2. Selanjutnya integrasi data ke database PostgreSQL, Route Handler, dan Google Sheets dapat diselesaikan secara aman pada fase berikutnya.
