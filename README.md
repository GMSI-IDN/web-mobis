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

### Build Production — Manual

> Deploy ke staging/production sekarang lewat CI/CD, lihat [Deployment (CI/CD)](#deployment-cicd) di bawah. Langkah manual ini untuk troubleshooting atau build lokal.

```bash
pnpm build
pnpm start
```

Jika container belum punya kredensial Google service account (lihat [Isu yang diketahui](#isu-yang-diketahui)):

```bash
docker ps --format '{{.Names}}\t{{.Image}}'          # cari nama container-nya
docker exec <nama-container> mkdir -p /app/private/secrets
docker cp ./private/secrets/credentials.json <nama-container>:/app/private/secrets/credentials.json
docker exec <nama-container> ls -la /app/private/secrets/credentials.json   # verifikasi
```

### Migrasi Schema

Perubahan schema Payload (blok baru, field baru, tabel/kolom baru) **tidak** diterapkan otomatis — `PAYLOAD_DB_PUSH=false` dan pipeline CI/CD sengaja tidak pernah menjalankan migrasi. Kalau schema berubah tapi migrasi belum dijalankan, halaman admin seperti `Pages` bisa blank.

Di server (staging/production), jalankan lewat **Actions → DB Migrate (MANUAL)**. Jangan `pnpm migrate` langsung ke DB live — workflow itu mengambil `pg_dump` terverifikasi lebih dulu.

Untuk development lokal:

```bash
pnpm migrate:status
pnpm migrate
pnpm generate:importmap
pnpm build
```

Catatan:

- Jangan membuat tabel/kolom Payload manual di DB. Gunakan migration Payload agar tabel `live` dan `versions` (`_pages_v_*`) ikut sinkron.
- Hindari memakai DB yang sama untuk local dan staging. Jika terpaksa, pastikan `PAYLOAD_DB_PUSH=false` supaya local tidak mengubah schema staging otomatis.
- `src/migrations/20260525_area_chips_description_to_richtext.ts` melakukan `DROP COLUMN` lalu re-add di `up()`. Kalau `migrate:status` menunjukkannya **pending** pada DB yang kolomnya sudah berisi data — berhenti, tulis migrasi manual.

## Deployment (CI/CD)

Push ke branch `staging` atau `production` memicu deploy otomatis via GitHub Actions. Panduan setup lengkap: **[docs/CICD-SETUP.md](docs/CICD-SETUP.md)**.

```text
push (staging | production)
   ↓
ci.yml — guard + tsc --noEmit + eslint     (tanpa secrets, tidak bisa menyentuh DB)
   ↓ gagal → berhenti, server tidak pernah dihubungi
_deploy.yml — ssh ke server
   ↓
git reset --hard → compose build → compose up -d → health check
      │                                   │
      gagal: container lama               gagal: rollback otomatis
      tetap melayani                      ke image :previous
```

Prinsip yang dijaga: **pipeline tidak mengubah data pada server maupun database yang sudah berjalan.**

- Tidak pernah menjalankan migrasi (dipisah ke workflow manual `migrate.yml`)
- Tidak pernah menyentuh volume upload — hanya di-assert ada sebelum & sesudah
- Build memakai role Postgres **read-only**, jadi terbukti tidak bisa menulis
- `.github/scripts/guard-no-mutations.sh` memblokir merge bila ada `down -v`, `volume rm`, `git clean`, `migrate` di jalur deploy, atau `PAYLOAD_DB_PUSH=true` masuk repo

Staging dan production berada di **server berbeda dengan path berbeda**. Semua nilai spesifik-server tinggal di GitHub Environment (Variables + Secrets), bukan di kode — logika deploy-nya sendiri tidak diduplikasi sama sekali.

### Di mana variabel ditaruh

| Lokasi | Kapan dipakai | Isinya |
|---|---|---|
| **GitHub → Environments → *Secrets*** | Saat workflow jalan | 5 kredensial SSH: `SSH_HOST`, `SSH_USER`, `SSH_PORT`, `SSH_PASSWORD`, `SSH_KNOWN_HOSTS` |
| **GitHub → Environments → *Variables*** | Saat workflow jalan | Konfigurasi host: `APP_DIR`, `COMPOSE_SERVICE`, `CONTAINER_NAME`, `APP_PORT`, `UPLOADS_VOLUME`, `EXTERNAL_HEALTH_URL` (opsional: `HEALTH_PATH`) |
| **Server: `<APP_DIR>/build.env`** (`chmod 600`) | Hanya saat `docker compose build` | `PAYLOAD_SECRET`, `DATABASE_URL` (versi read-only), semua `NEXT_PUBLIC_*`, `PAYLOAD_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_SITE_URL` |
| **Server: `docker-compose.yml` blok `environment:`** | Saat container jalan | Seluruh variabel runtime |
| **Server: `src/private/secrets/credentials.json`** | Runtime, dibaca via `fs` | Service account Google — file, bukan env var |

Tidak ada satu pun path, nama container, atau port yang ditulis di dalam workflow. Menambah atau memindahkan server = ubah Variables di Settings → Environments, tanpa menyentuh kode.

Kredensial database, Payload, dan Google **tidak pernah masuk ke GitHub**. Karena build terjadi di server, semuanya cukup ada di sana.

### Konfigurasi tiap Environment

**Settings → Environments**, buat `staging` dan `production`. Nama variable identik di keduanya, hanya nilainya berbeda:

| Variable | `staging` | `production` |
|---|---|---|
| `APP_DIR` | `/home/gmsindonesia/ComapnyProfile/mobis.co.id` | `/home/<user>/ComapnyProfile-production/mobis.co.id` |
| `COMPOSE_SERVICE` | `mobis-stg` | *cek di server* |
| `CONTAINER_NAME` | `stg-mobis` | *cek di server* |
| `APP_PORT` | `7884` | *cek di server* |
| `UPLOADS_VOLUME` | `mobiscoid_mobis_stg_payload_uploads` | *cek di server* |
| `EXTERNAL_HEALTH_URL` | `https://stg-mobis.global-mobility-service.co.id/api/widget/status-check` | `https://<domain-prod>/api/widget/status-check` |

Ambil nilai yang belum diketahui langsung dari servernya:

```bash
cd <APP_DIR>
grep -A1 '^services:' docker-compose.yml      # -> COMPOSE_SERVICE
docker ps --format '{{.Names}}\t{{.Ports}}'   # -> CONTAINER_NAME + APP_PORT
docker volume ls | grep -i upload             # -> UPLOADS_VOLUME
```

Kalau ada variable wajib yang kosong, workflow berhenti di step pertama dan menyebut variable mana yang belum diisi — **sebelum** menyambung ke server mana pun.

### Mendapatkan nilai Secrets

`SSH_HOST`, `SSH_USER`, dan `SSH_PORT` sebaiknya tidak ditebak — tanyakan ke SSH client sendiri, karena alias di `~/.ssh/config` bisa menyembunyikan host dan port sebenarnya:

```bash
ssh -G <alias-server> | grep -E '^hostname |^port |^user '
```

Kalau `hostname` yang keluar masih berupa alias (bukan IP), pastikan alias itu bisa di-resolve dari luar. Alias yang hanya ada di file `hosts` lokal **tidak akan dikenali GitHub** — pakai IP-nya.

`SSH_KNOWN_HOSTS` adalah sidik jari server, dipakai `StrictHostKeyChecking=yes` untuk memastikan GitHub menyambung ke server yang benar. Ambil dengan host dan port persis dari perintah di atas, lalu salin **seluruh output apa adanya**:

```bash
ssh-keyscan -p <port> <host>
```

Alternatif yang lebih aman — ambil dari kunci yang sudah Anda percayai sejak pertama kali SSH ke sana (tetap berfungsi walau entrinya ter-*hash*):

```bash
ssh-keygen -F <host>
```

Uji dulu sebelum mengisi GitHub. Kalau ini berhasil, workflow juga akan berhasil:

```bash
ssh -o StrictHostKeyChecking=yes -p <port> <user>@<host> "echo CONNECT-OK; docker ps --format '{{.Names}}'"
```

Detail lengkap termasuk contoh output dan penyebab kegagalan umum: [docs/CICD-SETUP.md](docs/CICD-SETUP.md) bagian 7.

Tiga penyebab `Host key verification failed`:

- **`SSH_HOST` tidak sama persis dengan yang di-keyscan.** IP dan hostname dianggap dua host berbeda walau menunjuk mesin yang sama.
- **Port non-standar mengubah format barisnya** jadi `[host]:port ssh-ed25519 ...` dengan kurung siku. `ssh-keyscan -p <port>` menghasilkannya otomatis — jangan mengetik manual.
- **Host key server berubah** karena server dibangun ulang atau OpenSSH di-reinstall. Perbaikannya jalankan ulang `ssh-keyscan` dan perbarui secret-nya.

### File `build.env` di server

File **baru** yang harus dibuat manual di `APP_DIR`, sejajar dengan `docker-compose.yml`. Ini **bukan** `src/.env` — keduanya beda fungsi dan tidak bisa saling menggantikan:

| File | Lokasi | Dipakai saat |
|---|---|---|
| `src/.env` | dalam checkout git | Runtime/lokal. **Tidak terbaca `docker build`** karena `.dockerignore` mengecualikannya |
| `build.env` | `<APP_DIR>/build.env` | Di-*source* skrip deploy agar `${VAR}` di `build.args` terisi |

Tanpa file ini, deploy berhenti di preflight dengan `FATAL: <APP_DIR>/build.env missing` — sebelum menyentuh container yang sedang berjalan.

Contoh isi untuk staging:

```sh
# ~/ComapnyProfile/mobis.co.id/build.env   (chmod 600)

PAYLOAD_SECRET=26411200edc4609f5f02f3a7

# Pakai role read-only (usr_mobis_build), bukan kredensial runtime.
# Build jadi terbukti tidak bisa menulis ke database live.
DATABASE_URL=postgres://usr_mobis_build:<password>@38.47.91.76:5435/mobis_revamp_2

# Wajib saat build: next.config.js menghitung images.remotePatterns dari sini,
# dan semua NEXT_PUBLIC_* di-inline ke bundle client. Runtime sudah terlambat.
NEXT_PUBLIC_SERVER_URL=https://stg-mobis.global-mobility-service.co.id
PAYLOAD_PUBLIC_SERVER_URL=https://stg-mobis.global-mobility-service.co.id
NEXT_PUBLIC_SITE_URL=https://stg-mobis.global-mobility-service.co.id
NEXT_PUBLIC_PAYLOAD_API_BASE=
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=999031544681604
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
```

Isinya **hanya** yang dibutuhkan saat build — bukan seluruh variabel aplikasi. Sisanya (Google Sheets, Meta CAPI, Assistant, Reports, dll.) tetap di blok `environment:` `docker-compose.yml` karena hanya dipakai saat runtime.

Uji dulu sebelum push, jauh lebih cepat daripada menunggu siklus Actions:

```bash
cd <APP_DIR>
set -a; . ./build.env; set +a
docker compose build <COMPOSE_SERVICE>
```

> ⚠️ `build.env` production harus dibuat sendiri dengan nilainya sendiri. Menyalin dari staging berarti domain staging ter-*inline* ke bundle client production — dan itu tidak terlihat sampai ada pengguna yang membukanya.

Dua hal yang mudah terlewat:

- **`UPLOADS_VOLUME` jangan ditebak.** Namanya dibentuk Docker Compose dari nama folder `APP_DIR` (`mobis.co.id` → `mobiscoid`) + nama volume di compose. Salah nilai = pipeline menolak deploy, karena volume di-assert ada sebelum jalan.
- **Folder terakhir kedua server bernama sama** (`mobis.co.id`), jadi project name Compose-nya juga sama. Aman selama keduanya di host berbeda — tapi kalau suatu saat dijalankan di host yang sama, nama container dan volume akan bertabrakan.

Dua hal yang sering tertukar:

- **`build.env` harus file terpisah.** `docker compose` menginterpolasi `${VAR}` di `build.args` dari *process environment*, bukan dari blok `environment:` milik service — jadi nilai di `environment:` tidak akan pernah sampai ke proses build.
- **Beberapa variabel wajib ada saat build, bukan cukup saat runtime.** `PAYLOAD_SECRET` + `DATABASE_URL` karena `next build` mem-prerender `/posts` yang memanggil `getPayload()`; semua `NEXT_PUBLIC_*` karena di-*inline* ke bundle client; `PAYLOAD_PUBLIC_SERVER_URL` dkk karena `next.config.js` menghitung `images.remotePatterns` saat build.

## Isu yang diketahui

- **Kredensial Google tidak ada di image runtime.** Dockerfile server tidak menyalin `private/`, sementara `src/services/googleSheets/client.ts:13` me-resolve `path.join(process.cwd(), GOOGLE_SERVICE_ACCOUNT_JSON_PATH)` = `/app/private/secrets/credentials.json`. Integrasi Google Sheets akan melempar `Credential file not found`. Saat ini tertutupi oleh `REGISTRATION_BYPASS_GOOGLE_SHEETS=true`. Perbaikan ada di [docs/CICD-SETUP.md](docs/CICD-SETUP.md) bagian 3.
- **`GOOGLE_SHEETS_SPREADSHEET_ID_MALANG` dibaca via `getEnv()`** (melempar error kalau kosong) di `src/services/googleSheets/appendLead.ts:35`, tapi tidak ada di `.env.example`. Pendaftaran wilayah Malang akan 500.
- **File media hilang di volume upload staging** — DB punya baris `media` yang menunjuk file yang tidak ada di `mobiscoid_mobis_stg_payload_uploads`. Pesan `File ... is missing on the disk` sengaja diturunkan dari ERROR ke `debug` (lihat `logger` di `src/payload.config.ts`) supaya tidak membanjiri log; set `PAYLOAD_LOG_LEVEL=debug` untuk memunculkannya lagi. Gambarnya tetap rusak sampai filenya dipulihkan. Petunjuk: pola nama `-300x138.webp` adalah konvensi thumbnail WordPress, jadi file aslinya kemungkinan ada di server WordPress lama (lihat `MOBIS_WP_AJAX_URL`).
- **Test bawaan masih boilerplate Payload.** `tests/e2e/frontend.e2e.spec.ts` meng-assert judul "Payload Website Template", dan script `test` di `package.json` hardcode `pnpm` padahal lockfile-nya npm. Karena itu test tidak dipakai sebagai gate CI.

## Environment Variables Penting

Daftar di bawah adalah **nama** variabelnya. Untuk **di mana** masing-masing ditaruh saat deploy (GitHub vs `build.env` vs blok `environment:` compose), lihat [Di mana variabel ditaruh](#di-mana-variabel-ditaruh).

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
