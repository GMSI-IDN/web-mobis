# Deployment Guide: Field "Jenis Mobil" (car_unit)

> Dokumen ini berisi panduan lengkap deploy fitur **Jenis Mobil** ke production.

---

## 📋 Ringkasan Perubahan

| # | File | Perubahan |
|---|------|-----------|
| 1 | `src/blocks/Mobis/RegistrationForm/Component.tsx` | Tambah dropdown "Jenis Mobil" di form FE |
| 2 | `src/collections/Customers/Customers.ts` | Tambah field `carUnit` di schema CMS |
| 3 | `src/types/registration.ts` | Tambah `carUnit` di type `RegistrationPayload` |
| 4 | `src/lib/validation/registration.ts` | Tambah validasi & sanitasi `carUnit` |
| 5 | `src/app/(payload)/api/registration/route.ts` | Tambah `carUnit` di `customerData` |
| 6 | `src/services/googleSheets/appendLead.ts` | Tambah kolom N (Jenis Mobil) di row + `car_preference` di External API |
| 7 | `src/payload-types.ts` | Auto-generated types |
| 8 | `src/migrations/add_car_unit.sql` | SQL migration untuk PostgreSQL |

### Pilihan Jenis Mobil (Hardcoded di FE):
- Toyota Avanza 2026
- Toyota Calya 2026
- Daihatsu Sigra
- Toyota Calya

---

## ⚠️ Urutan Deploy (WAJIB BERURUTAN)

### Step 1 — SQL di Database Production

Jalankan query berikut di **database PostgreSQL production**:

```sql
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "car_unit" varchar;
```

> Query ini aman dijalankan berulang (idempotent). Kolom tidak akan dibuat ulang jika sudah ada.

---

### Step 2 — Google Sheets Production

#### 2a. Ganti Header Kolom Q dari "Surveyor" menjadi "Jenis Mobil"

Di **semua spreadsheet production** (Jabodetabek, Bandung, Surabaya, Malang, Bali):

1. Buka tab **`Leads`**.
2. Pada baris 1 kolom **Q** (yang sebelumnya bertuliskan *"Surveyor"*), ganti teksnya menjadi: **`Jenis Mobil`**.
3. **Selesai!** Tidak perlu menyisipkan (*insert*) kolom baru sehingga semua kolom lainnya (A–P dan R–AA) tetap berada di posisi aslinya.

#### 2b. Izin Service Account di Kolom/Sheet yang Diproteksi

Pastikan service account Google berikut memiliki izin edit di sheet production:

```
gmsi-connect-sheet-api@gmsi-305303.iam.gserviceaccount.com
```

---

#### Daftar Spreadsheet ID:

| Area | Variabel Environment | Link Google Spreadsheet Production |
|---|---|---|
| **Jabodetabek & Default** | `GOOGLE_SHEETS_SPREADSHEET_ID_JABODETABEK` | [Buka Sheet Jabodetabek (Prod)](https://docs.google.com/spreadsheets/d/1oUBhDOLlsQ2jSw5qYT9NITu0d0VPLEPhn1zwpJHiJ3Y/edit) |
| **Bandung** | `GOOGLE_SHEETS_SPREADSHEET_ID_BANDUNG` | [Buka Sheet Bandung (Prod)](https://docs.google.com/spreadsheets/d/133BpHSTkcAdHKaY0SLab4SPBH7qKjYoMXEitra8QoPg/edit) |
| **Bali** | `GOOGLE_SHEETS_SPREADSHEET_ID_BALI` | [Buka Sheet Bali (Prod)](https://docs.google.com/spreadsheets/d/1qW_Jt4uCL37QYTO6xzztILba6ixNeOuWArcDrXVDOa8/edit) |
| **Surabaya** | `GOOGLE_SHEETS_SPREADSHEET_ID_SURABAYA` | [Buka Sheet Surabaya (Prod)](https://docs.google.com/spreadsheets/d/1q2MHNnL-J28OcYbBETsI9uUuhqM5ty33UGr_f7D8yYo/edit) |
| **Malang** | `GOOGLE_SHEETS_SPREADSHEET_ID_MALANG` | [Buka Sheet Malang (Prod)](https://docs.google.com/spreadsheets/d/1J8NJZj-RROMDCf6tIlEgzHtrcEB3BjFnrf4yFBHmYxs/edit) |

---

### Step 3 — Git Add, Commit, Push

```bash
git add \
  src/blocks/Mobis/RegistrationForm/Component.tsx \
  src/collections/Customers/Customers.ts \
  src/types/registration.ts \
  src/lib/validation/registration.ts \
  src/app/(payload)/api/registration/route.ts \
  src/services/googleSheets/appendLead.ts \
  src/payload-types.ts \
  src/migrations/add_car_unit.sql \
  md-agents/deploy-jenis-mobil.md

git commit -m "feat: tambah field Jenis Mobil (car_unit) di form, DB, CRM API, dan Kolom Q Google Sheets"

git push origin staging
```

---

### Step 4 — Deploy ke Server Production

Sesuai workflow CI/CD yang berlaku (merge staging → production, atau deploy manual).

---

## 🔍 Cara Verifikasi Setelah Deploy

### 1. PostgreSQL
```sql
SELECT id, name, car_unit, created_at
FROM customers
ORDER BY created_at DESC
LIMIT 5;
```

### 2. Google Sheets
Buka spreadsheet → cek baris terbaru → **Kolom Q** harus terisi nama jenis mobil (contoh: "Toyota Avanza 2026").

### 3. External CRM API (Fleet Management System)
Cek log server atau dashboard FMS. Field `car_preference` dan `lead_car_preference` akan berisi nama jenis mobil yang dipilih.

### 4. Meta Conversions API (Facebook CAPI)
Meta CAPI **tidak mengirim data jenis mobil** — ini sesuai desain karena Meta hanya menerima data pencocokan pengguna (nama, HP, IP). Event `CompleteRegistration` tetap berjalan normal tanpa gangguan.

---

## 🗺️ Mapping Kolom Google Sheets (Kolom A – AA)

| Kolom | Index | Header | Sumber Data |
|-------|-------|--------|-------------|
| A | 0 | Name | `payload.name` |
| B | 1 | No Telephone | `payload.phone` (Link WA) |
| C | 2 | Umur | `calculateAge(payload.birthDate)` |
| D | 3 | No KTP | `payload.ktpNumber` |
| E | 4 | Domisili | `payload.domicile` |
| F | 5 | Alamat Tinggal Saat Ini | `payload.currentAddress` |
| G | 6 | Status Kepemilikan Rumah | `payload.houseOwnership` |
| H | 7 | Pekerjaan Saat Ini | `payload.driverApps` |
| I | 8 | Akun Milik Sendiri | `payload.activeAccountSelf` |
| J | 9 | Lama Bekerja Driver Online | `payload.driverExperience` |
| K | 10 | Lokasi Serah Terima Unit | `payload.handoverLocation` |
| L | 11 | Informasi | `payload.sourceInfo` |
| M | 12 | Akun Facebook | `payload.sourceDetail` |
| N | 13 | Info Tambahan | `payload.promoCode` |
| O | 14 | Mendaftar Dari (LOCKED) | `'Website Mobis'` |
| P | 15 | Mendaftar Dari (EDITABLE) | `''` |
| **Q** | **16** | **Jenis Mobil** ✨ | **`mapCarUnitLabel(payload.carUnit)`** |
| R | 17 | Tanggal Pendaftaran | `datePart` (DD-MM-YYYY) |
| S | 18 | Jam Pendaftaran | `timePart` (HH:mm) |
| T | 19 | No HP Emergency | `payload.emergencyPhone` (Link WA) |
| U | 20 | Nama Kontak Emergency | `payload.emergencyName` |
| V | 21 | Relation Contac Emergency | `payload.emergencyRelation` |
| W | 22 | Place Of Birth | `payload.birthPlace` |
| X | 23 | Date Of Birth | `payload.birthDate` |
| Y | 24 | No SIM | `payload.simNumber` |
| Z | 25 | Type SIM | `simType` |
| AA | 26 | Expired SIM Date | `payload.simValidUntil` |
