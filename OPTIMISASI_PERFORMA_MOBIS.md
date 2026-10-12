# Laporan Optimasi Performa & Web Vitals
**Website:** [rentalmobis.com](https://rentalmobis.com/)  
**Platform:** Next.js (App Router) & Payload CMS  
**Hasil Audit Google Lighthouse (Mobile):**  
- **Performa (Performance): 90+** 🟢  
- **Aksesibilitas (Accessibility): 93** 🟢  
- **Praktik Terbaik (Best Practices): 100** 🟢  
- **SEO: 100** 🟢  

---

## 1. Ringkasan Eksekutif

Optimasi menyeluruh dilakukan pada website **rentalmobis.com** dengan fokus utama pada peningkatan kecepatan muat halaman (*Core Web Vitals* pada perangkat mobile), efisiensi transfer data jaringan, serta kualitas SEO dan Aksesibilitas.

Seluruh peningkatan performa ini dicapai **tanpa mengorbankan fungsionalitas iklan/marketing sedikit pun**:
- **Meta (Facebook) Pixel** dan **TikTok Pixel** tetap aktif 100% dan langsung terdeteksi oleh extension (*Meta Pixel Helper* & *TikTok Pixel Helper*).
- **Meta Conversions API (CAPI)** di sisi server tetap berjalan normal untuk pencatatan *lead* pendaftaran.
- **Logo MOBIS & Ikon Media Sosial** tetap tampil tajam dan responsif.

---

## 2. Masalah Utama Sebelum Optimasi

1. **Largest Contentful Paint (LCP) Lambat & Terjadi Double Download Gambar:**
   - Hero banner di-download dua kali pada perangkat mobile karena tag preload di HTML tidak selaras dengan atribut `srcSet` pada elemen gambar.
2. **Transfer Data Gambar Berlebih (Over-sized Image Payload):**
   - Komponen unit mobil, tentang kami, dan program rental memuat gambar resolusi master asli berukuran besar alih-alih varian thumbnail WebP yang sudah dikompresi.
3. **Render-Blocking CSS dari Icon Font:**
   - File stylesheet icon font eksternal (`bootstrap-icons.css`) memblokir proses rendering awal (*First Contentful Paint*).
4. **Skor Aksesibilitas & SEO Belum Maksimal:**
   - Kurangnya atribut `aria-label` deskriptif pada tombol/link navigasi dan media sosial untuk pembaca layar (*screen reader*).

---

## 3. Rincian Teknis Optimasi yang Diterapkan

### A. Optimasi LCP & Hero Banner Carousel
- **Sinkronisasi Responsive Image Preload:**  
  Menyelaraskan tag `<link rel="preload">` di `src/app/(frontend)/[slug]/page.tsx` dengan menyertakan atribut `imageSrcSet` dan `imageSizes="100vw"`. Browser mobile langsung mengambil varian WebP yang tepat (`600w`/`900w`) sejak byte pertama tanpa download ganda.
- **Priority Fetching:**  
  Menerapkan `fetchPriority="high"` dan `loading="eager"` khusus untuk banner slide pertama, serta menunda pemuatan gambar slide berikutnya hingga halaman selesai dihidrasi.

### B. Optimasi Pengiriman Gambar (Image Delivery)
- **Pemanfaatan Derived WebP Sesuai Rasio Layar:**  
  - Komponen **UnitsAvailable (Daftar Mobil)**: Menggunakan varian `sizes.square` (menghemat ~53.3 KiB per unit).
  - Komponen **AboutSplit (Tentang Kami)**: Menggunakan varian `sizes.medium` / `sizes.small` (menghemat ~22.2 KiB).
  - Komponen **ProgramDual (Program Rental)**: Menggunakan varian `sizes.small` / `sizes.thumbnail` (menghemat ~11.7 KiB).
  - Komponen **Testimonials (Avatar)**: Menggunakan varian `sizes.thumbnail`.
- **Pencegahan Pergeseran Tata Letak (CLS):**  
  Menetapkan atribut `width`, `height`, `loading="lazy"`, dan `decoding="async"` pada seluruh elemen `<img>`.

### C. Eliminasi Render-Blocking & Peningkatan Asset Delivery
- **Penggantian Icon Font dengan SVG Native:**  
  Menghapus dependensi stylesheet `bootstrap-icons.css` dan menggantinya dengan vektor SVG mandiri (`ig_white_logo.svg`, `fb_white_logo.svg`, `wa_white_logo.svg`, `tk_white_logo.svg`, `mobis-white-logo.svg`). Ini memangkas waktu *First Contentful Paint* (FCP).

### D. Aksesibilitas (93/100) & SEO Maksimal (100/100)
- **Label Aksesibilitas Lengkap:**  
  Menambahkan atribut `aria-label` deskriptif pada seluruh icon sosial media, tombol navigasi hamburger, indikator carousel, dan tombol kontrol.
- **Structured Data (JSON-LD):**  
  Mengintegrasikan schema *FAQPage* dan *LocalBusiness* terstruktur agar mesin pencari Google menampilkan rich snippet hasil pencarian.

### E. Ads & Conversions Tracking Tetap Utuh (100% Active)
- **Meta Pixel & TikTok Pixel Client-Side:**  
  Menggunakan `next/script` standar (`strategy="afterInteractive"`) yang langsung aktif seketika halaman dimuat, sehingga terdeteksi sempurna oleh *Meta Pixel Helper* dan *TikTok Pixel Helper* tanpa delay.
- **Server-Side Tracking (Meta Conversions API):**  
  Pencatatan event konversi pendaftaran driver online ke backend Meta tetap berjalan secara atomic dan aman.

---

## 4. Tabel Perbandingan Sebelum & Sesudah

| Aspek Pengukuran | Sebelum Optimasi | Sesudah Optimasi | Keterangan |
|---|---|---|---|
| **Lighthouse Performance (Mobile)** | ~70 – 73 | **90+** | 🟢 Sangat Cepat |
| **Aksesibilitas** | 85 | **93** | 🟢 Standar Aksesibilitas Terpenuhi |
| **Praktik Terbaik (Best Practices)** | 100 | **100** | 🟢 Sesuai Standar Web Modern |
| **SEO** | 100 | **100** | 🟢 Terindeks Maksimal |
| **Status Meta & TikTok Pixel** | Aktif | **100% Aktif & Langsung Terdeteksi** | 🟢 Normal |
| **Ukuran Transfer Aset Gambar** | Besar (Uncompressed) | **Hemat ~87 KiB+** | 🟢 Sangat Ringan |

---

*Laporan teknis ini disusun untuk dokumentasi dan pelaporan manajemen/atasan.*
