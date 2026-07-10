# Mobis Revamp: Website dan API

Dokumentasi ini fokus ke kebutuhan proyek **Website Mobis** dan **API Mobis**.

## Ringkasan

- Frontend website: Next.js App Router
- CMS/Admin: Payload CMS di path `/admin`
- API utama: tersedia di prefix `/api`
- Database: PostgreSQL (via `@payloadcms/db-postgres`)

## Struktur Fitur

### Website

- `/` dan `/<slug>`: halaman dinamis dari collection `pages`
- `/posts`: daftar artikel
- `/posts/page/<pageNumber>`: pagination artikel
- `/posts/<slug>`: detail artikel
- `not-found`: halaman 404 frontend kustom
- Sitemap:
  - `/pages-sitemap.xml`
  - `/posts-sitemap.xml`

### Admin

- `/admin`: dashboard Payload
- `/admin/reports`: laporan statistik custom (tren, jam, summary, riwayat)

## Menjalankan Proyek

### Prasyarat

- Node.js `^18.20.2 || >=20.9.0`
- pnpm `^9 || ^10`
- PostgreSQL

### Development

```bash
cp .env.example .env
pnpm install
pnpm dev
```

### Build Production

```bash
pnpm build
pnpm start

docker ps --format '{{.Names}}\t{{.Image}}'          # cari nama container-nya
docker exec <nama-container> mkdir -p /app/private/secrets
docker cp ./private/secrets/credentials.json <nama-container>:/app/private/secrets/credentials.json
docker exec <nama-container> ls -la /app/private/secrets/credentials.json   # verifikasi
```

### Build Production (Disarankan untuk Staging/Server)

Urutan ini penting agar perubahan schema Payload (blok baru, field baru, tabel/kolom baru) tidak membuat halaman admin seperti `Pages` menjadi blank:

```bash
pnpm migrate:status
pnpm migrate
pnpm generate:importmap
pnpm build
pnpm start
```

Catatan:

- Jangan membuat tabel/kolom Payload manual di DB. Gunakan migration Payload agar tabel `live` dan `versions` (`_pages_v_*`) ikut sinkron.
- Jika muncul gejala blank setelah update schema, cek dulu migration status dan jalankan `pnpm migrate` sebelum build.
- Hindari memakai DB yang sama untuk local dan staging. Jika terpaksa, pastikan `PAYLOAD_DB_PUSH=false` supaya local tidak mengubah schema staging otomatis.

## Environment Variables Penting

### Core

- `DATABASE_URL`
- `PAYLOAD_DB_PUSH` (default `false`, aktifkan `true` hanya jika memang ingin auto push schema)
- `PAYLOAD_ENABLE_CUSTOM_ADMIN` (default `true`, set `false` untuk pakai admin default saat troubleshooting panel blank)
- `PAYLOAD_SECRET`
- `CRON_SECRET`

### URL / CORS

- `NEXT_PUBLIC_SERVER_URL`
- `PAYLOAD_PUBLIC_SERVER_URL`
- `PAYLOAD_LOCAL_SERVER_URL`
- `NEXT_PUBLIC_SITE_URL`

### Google Sheets (registrasi)

- `GOOGLE_SHEETS_SPREADSHEET_ID_JABODETABEK`
- `GOOGLE_SHEETS_SPREADSHEET_ID_BANDUNG`
- `GOOGLE_SHEETS_SPREADSHEET_ID_BALI`
- `GOOGLE_SHEETS_SPREADSHEET_ID_SURABAYA`
- `GOOGLE_SHEETS_SPREADSHEET_ID_MALANG`
- `GOOGLE_SHEETS_SPREADSHEET_ID_DEFAULT`
- `GOOGLE_SHEETS_SHEET_NAME`
- `GOOGLE_SERVICE_ACCOUNT_JSON_PATH`

### Assistant / Status Widget

- `MOBIS_ASSISTANT_API_BASE`
- `MOBIS_ASSISTANT_API_RATING` (opsional)
- `MOBIS_WP_AJAX_NONCE` (opsional)

### Open API Reports (eksternal)

- `REPORTS_OPEN_API_WHITELIST` (JSON array domain + token)

Contoh:

```json
[
  {
    "domain": "https://app-partner.example.com",
    "tokens": ["token-app-1", "token-app-2"]
  },
  {
    "domain": "https://bi-partner.example.com",
    "token": "token-bi-1"
  }
]
```

## API Mobis

Semua endpoint di bawah tersedia di prefix `/api`.

### 1) POST `/api/registration`

Endpoint pendaftaran driver dari website.

Alur utama:

1. Validasi payload (`name`, `phone`, `ktpNumber` wajib, KTP 16 digit)
2. Cek cooldown KTP (3 bulan)
3. Validasi promo code (jika diisi)
4. Simpan ke Google Sheets + kirim ke external lead API
5. Simpan ke collection `customers`
6. Increment `vouchers.used` jika promo valid

Contoh body minimal:

```json
{
  "name": "Budi",
  "phone": "081234567890",
  "ktpNumber": "1234567890123456"
}
```

Contoh field opsional:

- `birthPlace`, `birthDate`, `simNumber`, `simType`
- `domicile`, `simValidUntil`, `currentAddress`, `houseOwnership`
- `emergencyName`, `emergencyPhone`, `emergencyRelation`
- `driverApps`, `activeAccountSelf`, `driverExperience`
- `handoverLocation`, `sourceInfo`, `sourceDetail`
- `promoCode`

Status umum:

- `200`: sukses
- `400`: validasi gagal / promo invalid / cooldown KTP
- `500`: server error

---

### 2) POST `/api/voucher/apply`

Apply voucher ke customer (butuh auth admin Payload via headers/cookie).

Body:

```json
{
  "code": "PROMO10",
  "customerId": 123
}
```

Perilaku:

- Cek voucher aktif, periode, kuota
- Cegah double redeem customer yang sama
- Buat record `voucher_redemptions`
- Update `vouchers.used`

---

### 3) POST `/api/assistant`

Proxy ke assistant API eksternal (`MOBIS_ASSISTANT_API_BASE`).

- Forward body JSON
- Forward header `Authorization` jika ada
- Jika upstream tidak tersedia, mengembalikan stub response

---

### 4) POST `/api/assistant/rating`

Proxy submit rating chatbot.

- Endpoint upstream default: `${MOBIS_ASSISTANT_API_BASE}/rating`
- Bisa override lewat `MOBIS_ASSISTANT_API_RATING`
- Jika upstream kosong, endpoint balas sukses stub

---

### 5) POST `/api/widget/status-check`

Cek status pendaftaran via WordPress AJAX.

Body:

```json
{
  "area": "DKI Jakarta",
  "inputType": "nik",
  "value": "1234567890123456"
}
```

Keterangan:

- `inputType`: `nik` atau `phone`
- Endpoint akan map response WordPress ke format `steps` untuk UI widget
- `GET /api/widget/status-check` tersedia sebagai health check sederhana

---

### 6) GET `/api/open/reports`

Open API read-only statistik pendaftar untuk konsumsi sistem eksternal.

Auth:

- `x-api-key: <TOKEN>` atau `Authorization: Bearer <TOKEN>`
- Domain harus match whitelist
- Browser: domain diambil dari header `Origin`
- Server-to-server: kirim `x-client-domain`

Query params:

- `start`: ISO datetime (default 30 hari ke belakang)
- `end`: ISO datetime (default sekarang)
- `trend`: `day | week | month` (default `day`)
- `regionPeriod`: `day | week | month | year` (default `month`)
- `top`: `3..10` (default `3`)
- `maxPages`: limit batch internal (default `30`)

Contoh:

```bash
curl --location 'https://your-domain.com/api/open/reports?trend=week&regionPeriod=month&top=5' \
  --header 'x-api-key: token-app-1' \
  --header 'x-client-domain: https://app-partner.example.com'
```

Response berisi:

- `summary` (total, promo, growth, average/day)
- `trend.buckets`
- `topHours.buckets`
- `region.summary` (total data periode wilayah, jumlah wilayah unik, start/end periode)
  - `usesRangeFallback=true` artinya periode aktif kosong, sehingga API otomatis pakai data seluruh rentang `start..end`
- `region.pie.buckets` (label, jumlah, persentase)
- `region.rank.buckets` (order, label, jumlah, persentase)
- `region.line` (granularity, labels, series, maxCount) untuk komparasi diagram garis per wilayah

## Catatan Operasional

- API laporan dan dashboard statistik membaca data dari collection `customers` yang sudah ada.
- Implementasi saat ini tidak menambah tabel, kolom, atau database baru untuk fitur laporan.
