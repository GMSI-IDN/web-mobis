# 📋 Rencana Perbaikan: Integrasi Langsung Cek Status Pendaftaran (API Baru)

Dokumen ini berisi rencana teknis untuk memperbaiki fitur Cek Status Pendaftaran, menyesuaikan dengan spesifikasi terbaru dari **API Cek Status Pendaftaran**. Kode saat ini (yang menggunakan `GET` dan parameter lama) harus direfaktor secara total ke standar baru.

---

## 🎯 1. Analisis Masalah Saat Ini (Kenapa Error?)

Berdasarkan dokumen `API Cek Status Pendaftaran.md`, implementasi kita saat ini di `route.ts` dan frontend memiliki beberapa kesalahan fatal:
1. **HTTP Method Salah**: Kita menggunakan `GET`, padahal API Google Script (GAS) terbaru mewajibkan `POST`.
2. **Format Data Salah**: Kita mengirim parameter via URL/Query String. API terbaru mengharuskan pengiriman melalui Body dengan format `application/x-www-form-urlencoded` (bukan JSON, bukan Query Param).
3. **Parameter Kuno**: Kita masih mengirimkan `ca_pref`, `input_type`, `nik_raw`, dll. API baru HANYA menerima `token`, `nik`, `phone`, dan `area`.
4. **URL Endpoint Berubah**: URL lama (`...VvVKE6fElnn...`) sudah tidak dipakai. URL baru adalah `...PHoUv7NMZEHx...`.
5. **Kesalahan Logika Pencarian**: Di form kita, NIK dan Phone bisa diisi sekaligus. API GAS menggunakan logika **OR** (mengutamakan NIK). Jika frontend mengirim NIK orang lain dan Phone sendiri, GAS akan mengembalikan data milik NIK tersebut. Ini perlu divalidasi manual di backend kita.

---

## 🔄 2. Rencana Refaktor: Backend Next.js (`route.ts`)

File `src/app/(payload)/api/widget/status-check/route.ts` akan dirombak dengan spesifikasi berikut:

### A. Persiapan Parameter
Menerima request JSON dari frontend klien (berisi NIK dan/atau No. Handphone).
```typescript
const body = await req.json()
const nik = body.nik ? body.nik.replace(/\D/g, '') : ''
const phone = body.phone ? body.phone.replace(/\D/g, '') : ''
const area = body.area || ''
```

### B. Fetch ke Google Apps Script
Menggunakan metode `POST` dan `URLSearchParams`.
```typescript
const GAS_URL = process.env.MOBIS_GAS_STATUS_CHECK_URL // Update di .env
const GAS_TOKEN = process.env.MOBIS_GAS_SECRET_TOKEN // Update di .env

const gasBody = new URLSearchParams()
gasBody.append('token', GAS_TOKEN)
if (nik) gasBody.append('nik', nik)
if (phone) gasBody.append('phone', phone)
if (area) gasBody.append('area', area)

const res = await fetch(GAS_URL, {
  method: 'POST',
  body: gasBody,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  // pastikan redirect di-follow
  redirect: 'follow',
})

const data = await res.json()
```

### C. Validasi Ganda (Strict Verification)
Karena GAS menggunakan logika "OR", kita wajib melakukan validasi silang jika user sengaja mengisi NIK dan Phone sekaligus:
```typescript
if (data.success && nik && phone) {
  // Jika user menginput KEDUANYA, kita pastikan data yang dikembalikan cocok untuk keduanya.
  const nikMatch = data.nik && data.nik.replace(/\D/g, '') === nik;
  const phoneMatch = data.phone && data.phone.replace(/^62|^0/, '').replace(/\D/g, '') === phone.replace(/^62|^0/, '');
  
  if (!nikMatch || !phoneMatch) {
    // Paksa menjadi tidak ditemukan jika data tidak sinkron
    data.success = false;
    data.message = "<div class=\"contact-social\">Data tidak ditemukan...</div>"; 
  }
}
```

---

## 🖥️ 3. Rencana Refaktor: Frontend UI

Frontend harus diupdate agar bisa menangani variasi response dari API baru.

1. **Format Request ke Internal Next.js**:
   Frontend cukup melakukan fetch POST ke `/api/widget/status-check` dengan payload JSON biasa (tidak perlu `inputType`, langsung kirim field apa adanya).
   
2. **Handling Response "Tidak Ditemukan"**:
   Berdasarkan API doc, jika data tidak ditemukan, properti `data.message` akan berisi tag **HTML** lengkap dengan link sosmed (Whatsapp/Instagram).
   Frontend harus menampilkannya dengan `dangerouslySetInnerHTML`.
   ```tsx
   if (!result.success) {
     return <div dangerouslySetInnerHTML={{ __html: result.message }} />
   }
   ```

3. **Handling Response "Ditemukan" (`success: true`)**:
   Render array `data.timeline` yang formatnya sekarang: `{ title, result, status }`.

---

## 🔒 4. Keamanan & Environment
1. Pastikan `API_TOKEN` dan `GAS_URL` yang baru diupdate ke `.env` server.
2. Endpoint Next.js ini harus mengaplikasikan _Rate Limiting_ dan proteksi CORS yang sama seperti rencana sebelumnya untuk melindungi kebocoran NIK/Phone pendaftar via brute-force.
