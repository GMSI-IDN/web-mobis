# API Cek Status Pendaftaran

## Endpoint
```
POST https://script.google.com/macros/s/AKfycbyf0I4_ed09nbhXsbDBoNl4tsD4PHoUv7NMZEHxsgTfug0n1F9YePChPAWg3OURRtUjYA/exec
```
Content-Type: `application/x-www-form-urlencoded` (**bukan JSON**)
Request mengikuti redirect (302). Sebagian besar HTTP client sudah otomatis.

## Parameter

| Parameter | Wajib | Keterangan |
|---|---|---|
| `token` | Ya | API token (diberikan terpisah) |
| `nik` | Salah satu | NIK 16 digit. Karakter selain angka diabaikan |
| `phone` | Salah satu | Nomor telepon/WA |
| `area` | Tidak | `JABODETABEK`, `BALI`, `SURABAYA`, `BANDUNG`. Kosong = cek semua file |

Jangan kirim parameter `debug` di produksi.

### Format nomor telepon
Semua format berikut dianggap nomor yang sama: `081234567890`, `6281234567890`, `+62 812-3456-7890`, `81234567890`.

### Pengaruh `area`
| `area` | Perilaku |
|---|---|
| Valid (misal `BALI`) | Hanya file itu yang dicari |
| Kosong | Semua file dicek |
| Tidak dikenali | Semua file dicek |
| Valid tapi data ada di file lain | Tidak ditemukan |

---

## Mode Pencarian

| Mode | Parameter | Dicari berdasarkan |
|---|---|---|
| A. Hanya NIK | `nik` | NIK |
| B. Hanya telepon | `phone` | Nomor telepon |
| C. Keduanya | `nik` + `phone` | NIK dulu, phone sebagai cadangan |

### Mode A: Hanya NIK
```bash
curl -L -X POST "https://script.google.com/macros/s/AKfycbyf0I4_ed09nbhXsbDBoNl4tsD4PHoUv7NMZEHxsgTfug0n1F9YePChPAWg3OURRtUjYA/exec" \
  -d "token={API_TOKEN}" \
  -d "nik=3175030507850006" \
  -d "area=JABODETABEK"
```
Alur:
```
Cek token → ambil angka dari nik → cari NIK di file
  ├─ ketemu → success:true, matched_by:"nik"
  └─ tidak → pencarian longgar (cocokkan angka di semua kolom)
        ├─ ketemu → success:true
        └─ tidak → success:false (HTML kontak sosmed)
```

### Mode B: Hanya telepon
```bash
curl -L -X POST "https://script.google.com/macros/s/AKfycbyf0I4_ed09nbhXsbDBoNl4tsD4PHoUv7NMZEHxsgTfug0n1F9YePChPAWg3OURRtUjYA/exec" \
  -d "token={API_TOKEN}" \
  -d "phone=081234567890"
```
Alur:
```
Cek token → ambil angka dari phone → buat variasi (0812.., 62812.., 812..)
  → cari di kolom telepon
  ├─ ketemu → success:true, matched_by:"phone"
  └─ tidak → pencarian longgar
        ├─ ketemu → success:true
        └─ tidak → success:false (HTML kontak sosmed)
```

### Mode C: Keduanya
```bash
curl -L -X POST "https://script.google.com/macros/s/AKfycbyf0I4_ed09nbhXsbDBoNl4tsD4PHoUv7NMZEHxsgTfug0n1F9YePChPAWg3OURRtUjYA/exec" \
  -d "token={API_TOKEN}" \
  -d "nik=3175030507850006" \
  -d "phone=081234567890" \
  -d "area=JABODETABEK"
```
Alur (per file):
```
Cek token
 1. Cari berdasarkan NIK
     ├─ ketemu → PAKAI. phone diabaikan.
     └─ tidak ↓
 2. Cari berdasarkan phone
     ├─ ketemu → pakai (matched_by:"phone")
     └─ tidak ↓
 3. Pencarian longgar (NIK dulu, lalu phone)
     ├─ ketemu → pakai
     └─ tidak → file ini tidak punya data

Setelah semua file dicek: ambil hasil dengan tanggal paling baru.
Tidak ada hasil sama sekali → success:false (HTML kontak sosmed)
```
Aturan Mode C:
- Sifatnya **OR**, bukan AND. NIK diprioritaskan, phone hanya cadangan.
- Sistem **tidak memeriksa** bahwa NIK dan phone milik orang yang sama. NIK Budi + phone Andi mengembalikan data Budi tanpa error.
- Prioritas NIK berlaku di dalam satu file. Antar file, yang tanggalnya paling baru menang.
- Selalu cek `matched_by` dan `region` di response.

---

## Contoh Kode

### PHP (WordPress)
```php
$res = wp_remote_post(WEB_APP_URL, [
  'body' => [
    'token' => API_TOKEN,
    'nik'   => $nik,     // boleh dihilangkan
    'phone' => $phone,   // boleh dihilangkan
    'area'  => $area,    // opsional
  ],
  'timeout' => 30,
]);
$data = json_decode(wp_remote_retrieve_body($res), true);
```

### Node.js (server)
```js
const body = new URLSearchParams({
  token: process.env.API_TOKEN,
  nik: '3175030507850006',
  phone: '081234567890',
});
const res = await fetch(process.env.WEB_APP_URL, { method: 'POST', body, redirect: 'follow' });
const data = await res.json();
```

### Postman
Method POST → Body → **x-www-form-urlencoded** → isi `token`, `nik` dan/atau `phone`, `area`. Pastikan *Automatically follow redirects* = ON.

---

## Response

### 1. Ditemukan (by NIK)
```json
{
  "success": true,
  "message": "Data ditemukan.",
  "region": "JABODETABEK",
  "matched_by": "nik",
  "matched_value": "3175030507850006",
  "nik": "3175030507850006",
  "phone": "081234567890",
  "nama": "Budi Santoso",
  "status_leads": "Process",
  "result_survey": "Approve",
  "hand_over": "",
  "all_done": false,
  "timeline": [
    { "title": "Pendaftaran diterima",             "result": "10/09/2026", "status": "success" },
    { "title": "Pendaftaran diproses",             "result": "10/09/2026", "status": "success" },
    { "title": "Pendaftar dihubungi via WhatsApp", "result": "11/09/2026", "status": "success" },
    { "title": "Pengumpulan dokumen",              "result": "12/09/2026", "status": "success" },
    { "title": "Review dokumen",                   "result": "14/09/2026", "status": "success" },
    { "title": "Penjadwalan survey",               "result": "16/09/2026", "status": "success" },
    { "title": "Result survey",                    "result": "Approve",    "status": "success" },
    { "title": "Pembayaran DP",                    "result": null,         "status": null },
    { "title": "Serah Terima kendaraan",           "result": null,         "status": null }
  ]
}
```

### 2. Ditemukan (by phone)
Struktur sama, hanya `matched_by` dan `matched_value` berbeda:
```json
{
  "success": true,
  "message": "Data ditemukan.",
  "region": "JABODETABEK",
  "matched_by": "phone",
  "matched_value": "081234567890",
  "nik": "3175030507850006",
  "phone": "081234567890",
  "nama": "Budi Santoso",
  "timeline": [ ... ]
}
```
`matched_value` adalah nomor sebagaimana tertulis di sheet (bisa beda format dari yang dikirim). Field `nik` dan `phone` selalu dari sheet.

### 3. Tidak ditemukan
```json
{
  "success": false,
  "message": "<div class=\"contact-social\">...HTML kontak sosmed...</div>",
  "timeline": []
}
```
`message` berisi **HTML**, tampilkan dengan `innerHTML`.

### 4. Token salah / kosong
```json
{ "success": false, "message": "Unauthorized", "timeline": [] }
```

### 5. NIK dan phone kosong
```json
{ "success": false, "message": "Harus kirim salah satu: nik atau phone", "timeline": [] }
```

### Field response
| Field | Tipe | Keterangan |
|---|---|---|
| `success` | boolean | `true` jika data ditemukan |
| `message` | string | Teks, atau HTML jika tidak ditemukan |
| `region` | string | File asal data |
| `matched_by` | string | `nik` atau `phone` |
| `matched_value` | string | Nilai yang cocok |
| `nama` | string | Nama |
| `nik` | string | NIK dari sheet |
| `phone` | string | Telepon dari sheet |
| `status_leads` | string | Status leads |
| `result_survey` | string | Hasil survey (bisa kosong) |
| `hand_over` | string | Tanggal serah terima (kosong jika belum) |
| `all_done` | boolean | `true` jika serah terima terisi |
| `timeline` | array | Langkah proses |

Item `timeline`: `title`, `result` (tanggal/teks atau `null`), `status` (`"success"`, `"failed"`, `"in-progress"`, atau `null`).
Langkah "Pendaftaran ditolak" hanya muncul jika gagal/ditolak/cancel, dengan `status: "failed"`.

---

## Contoh Case (NIK + phone dikirim bersamaan)
Data contoh: Budi (NIK `3175030507850006`, HP `081234567890`), Andi (NIK `3175030507850007`, HP `081298765432`).

| # | nik | phone | Hasil |
|---|---|---|---|
| 1 | Budi | Budi | Data Budi, `matched_by: nik` |
| 2 | Budi | Andi | Data **Budi**, `matched_by: nik`, phone Andi diabaikan tanpa error |
| 3 | Budi | tidak ada | Data Budi, `matched_by: nik` |
| 4 | tidak ada | Budi | Data Budi, `matched_by: phone` |
| 5 | tidak ada | tidak ada | Tidak ditemukan (HTML sosmed) |
| 6 | Budi | `6281234567890` | Data Budi, `matched_by: nik` |
| 7 | tidak ada | `+62 812-3456-7890` | Data Budi, `matched_by: phone` |
| 8 | Budi (ada di JABODETABEK) | Budi | `area=BALI` → tidak ditemukan |
| 9 | Budi | Budi | `area=XYZ` → semua file dicek, data Budi |
| 10 | kosong | kosong | "Harus kirim salah satu: nik atau phone" |
| 11 | apa saja | apa saja | Token salah → `Unauthorized` |

---

## Cara Membedakan Hasil
```js
if (data.success) {
  // render data.timeline
} else if (data.message === 'Unauthorized') {
  // token salah: kesalahan konfigurasi
} else if (data.message.startsWith('Harus kirim')) {
  // input kosong
} else {
  // tidak ditemukan: tampilkan data.message sebagai HTML
}
```

### Verifikasi NIK + phone harus milik orang yang sama (di backend)
```php
$digits = fn($s) => preg_replace('/\D+/', '', (string)$s);
$norm   = fn($p) => preg_replace('/^(62|0)/', '', $digits($p));

$nikOk   = $digits($data['nik'] ?? '') === $digits($nik);
$phoneOk = $norm($data['phone'] ?? '') === $norm($phone);

if ($data['success'] && !($nikOk && $phoneOk)) {
    // tidak cocok: perlakukan sebagai tidak ditemukan
}
```

---

## Keamanan
- **Jangan taruh `API_TOKEN` di JavaScript browser.** Panggil dari backend, lalu browser memanggil endpoint backend sendiri.
- Gunakan POST, bukan GET, supaya token tidak tercatat di URL/log.
- Batasi request per IP di backend. Endpoint ini mengembalikan nama, NIK, dan telepon, jadi rawan ditebak satu per satu.
- Jangan log atau tampilkan `nik` dan `phone` di tempat yang bisa diakses umum. Pertimbangkan menyamarkan (misal `3175********0006`).