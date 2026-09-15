# 📊 Panduan & Rencana Optimasi Lighthouse Website MOBIS

Dokumen ini berisi 2 pilihan strategi optimasi performa dan skor Lighthouse (Performance, Accessibility, Best Practices, SEO) untuk website MOBIS.

---

## 🎯 Perbandingan Ringkas 2 Opsi

| Kategori | Opsi 1: Safe Ads Strategy (Direkomendasikan Awal) | Opsi 2: Maximum Speed Strategy |
|---|---|---|
| **Script Ads (FB/TikTok/Google)** | **TIDAK DISENTUH** (`strategy="afterInteractive"`) | **Di-defer saat Idle** (`strategy="lazyOnload"`) |
| **Keamanan Tracking Ads** | 100% Identik dengan kondisi saat ini | 100% Tetap aktif, dimuat setelah first paint (~200ms) |
| **Estimasi Performance** | 80 - 90+ (Peningkatan signifikan) | 90 - 100 (Maksimal) |
| **Estimasi Accessibility** | 95 - 100 (Hijau) | 95 - 100 (Hijau) |
| **Estimasi Best Practices** | 95 - 100 (Hijau) | 95 - 100 (Hijau) |
| **Estimasi SEO** | 100 (Hijau Sempurna) | 100 (Hijau Sempurna) |

---

## 🟢 OPSI 1: Safe Ads Strategy (Tanpa Menyentuh Script Iklan)

Pada opsi ini, script Facebook Pixel, TikTok Pixel, Google, dan Conversions API dibiarkan **persis seperti aslinya** tanpa perubahan strategi pemuatan. Optimasi difokuskan pada pemangkasan beban render gambar, layout shift (CLS), aksesibilitas form, dan keamanan.

### Phase 1: Optimasi Gambar & Mencegah Layout Shift (CLS)
1. **Logo Navbar**:
   - File: `src/Header/Nav/Component.client.tsx` (Baris 42)
   - Perubahan: Tambahkan atribut eksplisit `width="120" height="40"` dan `decoding="async"`.
2. **Gambar Tentang Kami (About Split)**:
   - File: `src/blocks/Mobis/About/Component.tsx` (Baris 41)
   - Perubahan: Tambahkan `loading="lazy" decoding="async" width="600" height="400"`.
3. **Gambar Unit Mobil Tersedia**:
   - File: `src/blocks/Mobis/UnitsAvailable/Component.tsx` (Baris 64)
   - Perubahan: Tambahkan `loading="lazy" decoding="async" width="500" height="500"`.
4. **Gambar Kartu Program Rental (Program Dual)**:
   - File: `src/blocks/Mobis/ProgramDual/Component.tsx` (Baris 75)
   - Perubahan: Tambahkan `loading="lazy" decoding="async" width="466" height="193"`.
5. **Logo Footer**:
   - File: `src/Footer/Component.tsx` (Baris 65)
   - Perubahan: Tambahkan `loading="lazy" decoding="async" width="120" height="40"`.

### Phase 2: Aksesibilitas Form & Kontras Warna (Accessibility: 95+)
1. **Asosiasi Label Form Input (Penyebab Nilai Rendah di Form Pendaftaran)**:
   - File: `src/blocks/Mobis/RegistrationForm/Component.tsx` (Baris 900 - 1400)
   - Perubahan: Berikan `id` unik pada setiap `<input>` dan `<select>` (seperti `name`, `birthPlace`, `phone`, `ktpNumber`, `simNumber`, dll) serta pasang `htmlFor` pada setiap `<label>` pasangannya.
2. **Perbaikan Kontras Warna Tombol Status Pendaftaran**:
   - File: `src/components/MobisWidget/widgets/FloatingButtons/FloatingButtons.tsx` (Baris 45)
   - Perubahan: Ganti teks putih di atas kuning (`text-white`) menjadi `text-dark fw-bold` agar kontras warna memenuhi standar WCAG AA (>= 4.5:1).
   - Tambahkan `aria-label="Cek Status Pendaftaran"` dan `aria-label="Hubungi Customer Service"`.
3. **Landmark Semantik Widget**:
   - File: `src/components/MobisWidget/MobisWidgetProvider.tsx` (Baris 46)
   - Perubahan: Ganti `<section>` tanpa heading menjadi `<div aria-label="Widget MOBIS">`.
4. **Aria-Label Icon Footer**:
   - File: `src/Footer/Component.tsx` (Baris 77)
   - Perubahan: Perjelas `aria-label={`Kunjungi media sosial ${s?.icon || 'MOBIS'}`}`.

### Phase 3: Best Practices & Security
1. **Atribut Keamanan Tautan Eksternal**:
   - File: `src/Footer/Component.tsx` (Baris 75)
   - Perubahan: Pastikan semua `target="_blank"` memiliki `rel="noopener noreferrer"`.
2. **Konsistensi Rasio Aspek Gambar**:
   - File: `src/app/(frontend)/style.css`
   - Perubahan: Pastikan semua wrapper gambar memiliki rasio aspek responsif untuk mencegah layout shift.

---

## ⚡ OPSI 2: Maximum Speed Strategy (Dengan Defer Script Iklan)

Opsi ini mencakup **seluruh langkah pada Opsi 1** di atas, ditambah penyesuaian strategi pemuatan script iklan agar browser mendahulukan render visual halaman sebelum mengeksekusi script tracking.

### Penyesuaian Tambahan Script Ads:
1. **Facebook Pixel**:
   - File: `src/components/PixelFacebook/index.tsx` (Baris 29)
   - Perubahan:
     ```diff
     - strategy="afterInteractive"
     + strategy="lazyOnload"
     ```
2. **TikTok Pixel**:
   - File: `src/components/PixelTiktok/index.tsx` (Baris 29)
   - Perubahan:
     ```diff
     - strategy="afterInteractive"
     + strategy="lazyOnload"
     ```

---

## 🛠️ Cara Menguji / Menjalankan

1. **Jalankan Pengecekan TypeScript**:
   ```bash
   node ./node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
   ```
2. **Uji di Lighthouse**:
   - Buka Chrome DevTools -> Tab **Lighthouse**.
   - Pilih Mode: **Mobile / Desktop** -> Klik **Analyze page load**.
