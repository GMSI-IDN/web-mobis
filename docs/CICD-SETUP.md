# Panduan Setup CI/CD — Server & GitHub

Dokumen ini berisi langkah **manual sekali jalan** yang harus dilakukan sebelum pipeline bisa dipakai. File di repo (`.github/`) sudah siap; yang di bawah ini ada di server dan di setting GitHub, jadi tidak bisa di-commit.

Syarat mutlak yang dijaga seluruh setup ini: **pipeline tidak boleh mengubah data pada server maupun database yang sudah berjalan.**

---

## Ringkasan arsitektur

```
push ke branch staging
        │
        ▼
  ci.yml (GitHub cloud runner)        ← tanpa secrets sama sekali
  guard + tsc --noEmit + eslint          tidak bisa menyentuh DB walau mau
        │  gagal → berhenti, server tidak pernah dihubungi
        ▼
  _deploy.yml → ssh ke server
        │
        ▼  remote-deploy.sh (di server)
  git reset --hard  →  compose build  →  compose up -d  →  health check
                          │                                    │
                          gagal:                               gagal:
                          container lama                       rollback otomatis
                          tetap melayani                       ke image :previous
```

Migrasi DB **tidak ada** di alur ini. Migrasi hanya lewat `migrate.yml` (manual dispatch).

---

## 1. Role Postgres read-only untuk build

`next build` mem-prerender `/posts` yang memanggil `getPayload()` → `payload.find()`. Selain itu `onInit` menjalankan `resyncPostgresSequencesOnInit()` yang melakukan `setval()` — sebuah **write**. Dengan role read-only, write itu ditolak DB dan otomatis turun jadi warning karena kodenya sudah membungkus tiap panggilan dengan `try/catch` (lihat `src/lib/db/resyncPostgresSequences.ts:55-65`). Build tetap sukses.

Jalankan sebagai superuser Postgres:

```sql
CREATE ROLE usr_mobis_build LOGIN PASSWORD 'GANTI_PASSWORD_BARU';

GRANT CONNECT ON DATABASE mobis_revamp_2 TO usr_mobis_build;
GRANT USAGE ON SCHEMA public TO usr_mobis_build;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO usr_mobis_build;

-- agar tabel baru di masa depan ikut ter-grant otomatis
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO usr_mobis_build;
```

Verifikasi role benar-benar tidak bisa menulis:

```bash
psql "postgres://usr_mobis_build:PASSWORD@38.47.91.76:5435/mobis_revamp_2" \
  -c "create table _tes_tulis(x int);"
# HARUS gagal: ERROR: permission denied for schema public
```

> Ini satu-satunya perubahan database dalam seluruh setup, dan sifatnya **menambah role** — tidak menyentuh satu baris data pun.

---

## 2. `~/ComapnyProfile/mobis.co.id/build.env`

File baru, `chmod 600`. Isinya khusus untuk **build**, terpisah dari blok `environment:` runtime yang sudah jalan.

```sh
# Dipakai HANYA saat docker compose build. Runtime tetap pakai blok
# `environment:` di docker-compose.yml yang sudah ada.

PAYLOAD_SECRET=26411200edc4609f5f02f3a7

# PERHATIKAN: user read-only. Build tidak boleh bisa menulis.
DATABASE_URL=postgres://usr_mobis_build:GANTI_PASSWORD_BARU@38.47.91.76:5435/mobis_revamp_2

# next.config.js menghitung images.remotePatterns dari variabel ini SAAT BUILD,
# dan semua NEXT_PUBLIC_* di-inline ke bundle client. Diberikan saat runtime saja
# sudah terlambat — bundle-nya sudah terlanjur dibuat tanpa nilai ini.
NEXT_PUBLIC_SERVER_URL=https://stg-mobis.global-mobility-service.co.id
PAYLOAD_PUBLIC_SERVER_URL=https://stg-mobis.global-mobility-service.co.id
NEXT_PUBLIC_SITE_URL=https://stg-mobis.global-mobility-service.co.id
NEXT_PUBLIC_PAYLOAD_API_BASE=
NEXT_PUBLIC_FACEBOOK_PIXEL_ID=999031544681604
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
```

```bash
chmod 600 ~/ComapnyProfile/mobis.co.id/build.env
```

**Kenapa file terpisah, bukan menambah di `environment:`?** `docker compose` menginterpolasi `${VAR}` di `build.args` dari **process environment**, bukan dari blok `environment:` milik service. Jadi menaruhnya di `environment:` tidak akan sampai ke build. Dengan file terpisah, blok `environment:` yang sudah bekerja tidak perlu disentuh sama sekali.

---

## 3. `docker/services/web/web.dockerfile`

**Backup dulu:** `cp web.dockerfile web.dockerfile.bak`

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# ---- KONFIGURASI BUILD-TIME -------------------------------------------------
# .dockerignore mengecualikan .env dari build context, jadi tidak ada yang
# terwariskan otomatis — semua yang dibutuhkan next build harus lewat build arg.
#
# PAYLOAD_SECRET + DATABASE_URL WAJIB karena next build mem-prerender /posts
# (src/app/(frontend)/posts/page.tsx pakai `export const revalidate = 600`) yang
# memanggil getPayload() -> payload.find(). Tanpa secret, build gagal dengan
# "missing secret key. A secret key is needed to secure Payload."
#
# DATABASE_URL di sini HARUS user read-only (usr_mobis_build) — lihat build.env.
ARG PAYLOAD_SECRET
ARG DATABASE_URL
ARG NEXT_PUBLIC_SERVER_URL
ARG PAYLOAD_PUBLIC_SERVER_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_PAYLOAD_API_BASE
ARG NEXT_PUBLIC_FACEBOOK_PIXEL_ID
ARG NEXT_PUBLIC_TIKTOK_PIXEL_ID

ENV PAYLOAD_SECRET=${PAYLOAD_SECRET} \
    DATABASE_URL=${DATABASE_URL} \
    NEXT_PUBLIC_SERVER_URL=${NEXT_PUBLIC_SERVER_URL} \
    PAYLOAD_PUBLIC_SERVER_URL=${PAYLOAD_PUBLIC_SERVER_URL} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_PAYLOAD_API_BASE=${NEXT_PUBLIC_PAYLOAD_API_BASE} \
    NEXT_PUBLIC_FACEBOOK_PIXEL_ID=${NEXT_PUBLIC_FACEBOOK_PIXEL_ID} \
    NEXT_PUBLIC_TIKTOK_PIXEL_ID=${NEXT_PUBLIC_TIKTOK_PIXEL_ID} \
    PAYLOAD_DB_PUSH=false \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run generate:importmap || true
RUN npm run generate:types || true

# #############################################################################
# JANGAN TAMBAHKAN `npm run migrate` DI SINI.
# Build dengan DATABASE_URL live akan diam-diam memigrasi database produksi
# setiap kali ada push. Migrasi dijalankan HANYA lewat workflow manual
# .github/workflows/migrate.yml yang mengambil pg_dump terverifikasi lebih dulu.
# #############################################################################

RUN npm run build


# ---------- RUNNER STAGE ----------
FROM node:20-alpine AS runner
WORKDIR /app

# PAYLOAD_DB_PUSH dipasang di kedua stage supaya tidak mungkin terlupa.
ENV NODE_ENV=production \
    PORT=7884 \
    NEXT_TELEMETRY_DISABLED=1 \
    PAYLOAD_DB_PUSH=false

COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

# Payload runtime butuh config + source. node_modules lengkap + src/migrations/
# inilah yang membuat `payload migrate` bisa dijalankan via docker exec di
# workflow migrasi manual.
COPY --from=builder /app/src ./src
COPY --from=builder /app/src/payload.config.ts ./

# Kredensial service account Google. src/services/googleSheets/client.ts:13
# me-resolve path.join(process.cwd(), GOOGLE_SERVICE_ACCOUNT_JSON_PATH) =
# /app/private/secrets/credentials.json saat runtime. Tanpa baris ini file itu
# tidak ada di image, dan integrasi Google Sheets gagal dengan
# "Credential file not found". Lihat catatan di bawah.
COPY --from=builder /app/private ./private

RUN mkdir -p /app/public/media

EXPOSE 7884
CMD ["npm", "run", "start", "--", "-p", "7884"]
```

Catatan: `PAYLOAD_SECRET` dan `DATABASE_URL` menjadi `ENV` di stage **builder**. Stage builder dibuang dan tidak di-push ke registry mana pun (desain ini tanpa registry), jadi nilai itu tidak ikut ke image yang dijalankan. Kalau nanti menambah registry, ganti ke BuildKit secret mount.

### ⚠️ Soal `COPY /app/private` — cek dulu sebelum menambahkannya

`docker COPY` **gagal build** kalau folder sumbernya tidak ada. Pastikan dulu:

```bash
ls -la ~/ComapnyProfile/mobis.co.id/src/private/secrets/
# harus ada credentials.json
```

- **Ada** → tambahkan baris `COPY --from=builder /app/private ./private` seperti di atas.
- **Tidak ada** → **hapus** baris itu dari dockerfile, kalau tidak build akan gagal. Lalu sadari konsekuensinya di bawah.

**Kenapa ini penting sekarang:** dockerfile server yang berjalan saat ini **tidak** menyalin `private/`, sehingga `/app/private/secrets/credentials.json` tidak ada di container. Integrasi Google Sheets akan melempar `Credential file not found`. Masalah ini sedang **tertutupi** karena `REGISTRATION_BYPASS_GOOGLE_SHEETS=true` di `docker-compose.yml` — begitu diubah ke `false`, pendaftaran akan gagal menulis ke Sheets.

Verifikasi setelah build:
```bash
docker exec stg-mobis ls -la /app/private/secrets/
```

---

## 4. `docker-compose.yml` — hanya tambah `build.args`

Blok `environment:`, `networks:`, `volumes:`, `VIRTUAL_HOST` **jangan disentuh**. Tambahkan di bawah `build:`:

```yaml
    build:
      context: ./src
      dockerfile: ../docker/services/web/web.dockerfile
      args:
        PAYLOAD_SECRET: ${PAYLOAD_SECRET:?build.env belum di-source}
        DATABASE_URL: ${DATABASE_URL:?build.env belum di-source}
        NEXT_PUBLIC_SERVER_URL: ${NEXT_PUBLIC_SERVER_URL}
        PAYLOAD_PUBLIC_SERVER_URL: ${PAYLOAD_PUBLIC_SERVER_URL}
        NEXT_PUBLIC_SITE_URL: ${NEXT_PUBLIC_SITE_URL}
        NEXT_PUBLIC_PAYLOAD_API_BASE: ${NEXT_PUBLIC_PAYLOAD_API_BASE}
        NEXT_PUBLIC_FACEBOOK_PIXEL_ID: ${NEXT_PUBLIC_FACEBOOK_PIXEL_ID}
        NEXT_PUBLIC_TIKTOK_PIXEL_ID: ${NEXT_PUBLIC_TIKTOK_PIXEL_ID}
```

Sintaks `:?` bikin `compose build` gagal cepat kalau `build.env` lupa di-source, bukan menghasilkan image rusak yang baru ketahuan saat runtime.

---

## 5. Akses git dari server ke GitHub

Repo ini privat, dan `remote-deploy.sh` menjalankan `git fetch` di server. Di sesi SSH non-interaktif, `git` **tidak bisa** menanyakan password — kalau kredensialnya belum tersimpan, prosesnya menggantung sampai timeout 30 menit.

### Cek dulu kondisi sekarang

```bash
cd ~/ComapnyProfile/mobis.co.id/src
git remote -v
GIT_TERMINAL_PROMPT=0 git ls-remote origin >/dev/null && echo "GIT OK — tidak perlu apa-apa" || echo "PERLU DIPERBAIKI"
```

`GIT_TERMINAL_PROMPT=0` memaksa `git` gagal cepat alih-alih menunggu input — persis seperti perilakunya nanti di dalam deploy. Kalau hasilnya `GIT OK`, lewati bagian ini.

### Kalau perlu diperbaiki: HTTPS + Personal Access Token

Cara ini tidak butuh menambah SSH key di mana pun.

1. Di GitHub: **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**
   - Repository access: hanya `GMSI-IDN/web-mobis`
   - Permissions → Repository permissions → **Contents: Read-only**
   - Beri masa berlaku, catat tanggalnya — token kedaluwarsa akan mematikan deploy
2. Di server, simpan kredensial:
   ```bash
   cd ~/ComapnyProfile/mobis.co.id/src
   git remote set-url origin https://github.com/GMSI-IDN/web-mobis.git
   git config --global credential.helper store
   GIT_TERMINAL_PROMPT=1 git fetch origin staging
   # saat diminta: Username = username GitHub Anda, Password = TEMPEL TOKEN (bukan password GitHub)
   ```
   Token tersimpan di `~/.git-credentials` (plaintext, mode 600 — `chmod 600 ~/.git-credentials`).
3. Verifikasi non-interaktif:
   ```bash
   GIT_TERMINAL_PROMPT=0 git ls-remote origin >/dev/null && echo "GIT OK"
   ```

### Alternatif: deploy key (kalau bisa menulis ke `~/.ssh`)

Lebih rapi karena tidak ada token yang kedaluwarsa, tapi butuh akses tulis ke `~/.ssh` di server:

```bash
ssh-keygen -t ed25519 -C "mobis-server-deploykey" -f ~/.ssh/id_github_mobis -N ""
cat ~/.ssh/id_github_mobis.pub    # daftarkan di GitHub: Settings -> Deploy keys (JANGAN centang write access)

printf 'Host github.com\n  IdentityFile ~/.ssh/id_github_mobis\n  IdentitiesOnly yes\n' >> ~/.ssh/config
cd ~/ComapnyProfile/mobis.co.id/src
git remote set-url origin git@github.com:GMSI-IDN/web-mobis.git
GIT_SSH_COMMAND="ssh -o BatchMode=yes" git ls-remote origin >/dev/null && echo "GIT OK"
```

> Catatan: ini **deploy key** (server → GitHub, arah keluar), berbeda dari `authorized_keys` (GitHub → server, arah masuk) yang tidak bisa Anda ubah. Keduanya tidak saling bergantung.

---

## 6. Autentikasi SSH (GitHub → server): password

Workflow memakai `sshpass` dengan password, karena akun server tidak bisa menambahkan entri di `~/.ssh/authorized_keys`.

Yang perlu disiapkan hanya dua hal:

**a. Password akun `gmsindonesia`** — nanti masuk ke secret `SSH_PASSWORD`.

**b. Host key server untuk pinning** — jalankan dari laptop:
```bash
ssh-keyscan -p 22 <IP_ATAU_HOSTNAME_SERVER>
```
Salin seluruh outputnya ke secret `SSH_KNOWN_HOSTS`. Ini yang mencegah serangan man-in-the-middle: `StrictHostKeyChecking=yes` akan menolak koneksi kalau host key server tidak cocok.

### Konsekuensi yang perlu diketahui

Password auth memang jalan, tapi lebih lemah dari key dalam beberapa hal konkret:

- Password memberi **shell interaktif penuh** ke akun `gmsindonesia` bila bocor. Key bisa dibatasi (`restrict,pty`, bahkan `command=`).
- Tidak bisa dicabut terpisah — mencabut akses CI berarti mengganti password Anda sendiri.
- **Setiap kali password diganti, semua deploy langsung mati** sampai `SSH_PASSWORD` di GitHub diperbarui. Catat ini di prosedur rotasi password Anda.
- Port SSH terbuka ke internet + password auth = permukaan brute-force. Pertimbangkan `fail2ban` kalau belum ada.

Kalau suatu saat bisa menambah key, ganti ke key auth: hapus `sshpass`, kembalikan `ssh -i ~/.ssh/id_deploy` + `-o BatchMode=yes`, dan ganti secret `SSH_PASSWORD` → `SSH_PRIVATE_KEY`. Petunjuknya sudah ada sebagai komentar di `.github/workflows/_deploy.yml`.

---

## 7. GitHub Environment & Secrets

**Settings → Environments → New environment → `staging`.**

Isi 5 secret di **scope Environment** (bukan repository), supaya production nanti bisa beda nilai dengan nama yang sama:

### Secrets (tab *Secrets*)

| Secret | Isi | Cara dapat |
|---|---|---|
| `SSH_HOST` | IP/hostname asli server | Alias `fms` hanya ada di `~/.ssh/config` lokal Anda — GitHub tidak mengenalnya. Ambil IP asli: `ssh fms "curl -4 -s ifconfig.me"` |
| `SSH_USER` | `gmsindonesia` | — |
| `SSH_PORT` | `22` | Cek `sudo grep -E '^Port' /etc/ssh/sshd_config` di server; kalau tidak ada baris itu, berarti 22 |
| `SSH_PASSWORD` | password akun SSH | Password yang biasa Anda ketik saat SSH |
| `SSH_KNOWN_HOSTS` | output `ssh-keyscan -p 22 <IP_SERVER>` | Salin seluruh barisnya |

### Variables (tab *Variables*)

Konfigurasi host tidak ditulis di kode — semuanya di sini, supaya menambah atau memindahkan server tidak perlu edit workflow.

| Variable | Nilai untuk staging | Cara dapat |
|---|---|---|
| `APP_DIR` | `/home/gmsindonesia/ComapnyProfile/mobis.co.id` | `pwd` di folder compose |
| `COMPOSE_SERVICE` | `mobis-stg` | `grep -A1 '^services:' docker-compose.yml` |
| `CONTAINER_NAME` | `stg-mobis` | `docker ps --format '{{.Names}}'` |
| `APP_PORT` | `7884` | Port yang didengarkan app **di dalam** container |
| `UPLOADS_VOLUME` | `mobiscoid_mobis_stg_payload_uploads` | `docker volume ls \| grep upload` |
| `EXTERNAL_HEALTH_URL` | `https://stg-mobis.global-mobility-service.co.id/api/widget/status-check` | Domain publik + `/api/widget/status-check`. Kosongkan untuk melewati cek eksternal. |
| `HEALTH_PATH` | *(opsional)* | Default `/api/widget/status-check` kalau tidak diisi |

Kalau ada Variable wajib yang kosong, workflow gagal **sebelum menyambung ke server mana pun**, dengan pesan yang menyebut variable mana yang belum diisi.

> ⚠️ `UPLOADS_VOLUME` jangan ditebak. Nama itu dibentuk Docker Compose dari **nama folder** `APP_DIR` — `mobis.co.id` → `mobiscoid` + `_` + nama volume di compose. Salah nilai = pipeline menolak deploy, karena volume di-assert ada sebelum jalan.

### Mana Secret, mana Variable?

Aturannya: **Secret** kalau bocor berbahaya, **Variable** kalau tidak.

Bedanya nyata di log Actions — Variable tampil apa adanya, Secret otomatis disensor jadi `***`. Menaruh password di Variable berarti password Anda tercetak di log yang bisa dibaca siapa pun yang punya akses repo.

| | Tab | Kenapa |
|---|---|---|
| `SSH_PASSWORD` | **Secret** | Memberi shell penuh ke server |
| `SSH_HOST`, `SSH_USER`, `SSH_PORT` | **Secret** | Bukan rahasia besar, tapi tidak perlu diumbar di log — memudahkan pemindaian port |
| `SSH_KNOWN_HOSTS` | **Secret** | Bukan rahasia (ini kunci publik server), tapi diperlakukan sebagai secret agar tidak memenuhi log |
| `APP_DIR`, `COMPOSE_SERVICE`, `CONTAINER_NAME`, `APP_PORT`, `UPLOADS_VOLUME`, `EXTERNAL_HEALTH_URL` | **Variable** | Cuma path dan nama. Justru berguna kalau terlihat di log saat debugging |

### Contoh isian lengkap (staging)

**Tab Secrets** — nilai di bawah hanya contoh format, ganti dengan milik Anda:

```text
SSH_HOST         103.147.22.15
SSH_USER         gmsindonesia
SSH_PORT         22
SSH_PASSWORD     R4hasi4Passw0rd!
SSH_KNOWN_HOSTS  (lihat cara mengisinya di bawah)
```

**Tab Variables:**

```text
APP_DIR              /home/gmsindonesia/ComapnyProfile/mobis.co.id
COMPOSE_SERVICE      mobis-stg
CONTAINER_NAME       stg-mobis
APP_PORT             7884
UPLOADS_VOLUME       mobiscoid_mobis_stg_payload_uploads
EXTERNAL_HEALTH_URL  https://stg-mobis.global-mobility-service.co.id/api/widget/status-check
```

### Cara mengisi `SSH_KNOWN_HOSTS`

Ini "sidik jari" server. Fungsinya: memastikan GitHub menyambung ke server Anda yang asli, bukan ke penyerang yang menyamar. Tanpa ini, `StrictHostKeyChecking=yes` akan menolak semua koneksi.

**Langkah 1** — jalankan dari laptop Anda (bukan di server):

```bash
ssh-keyscan -p 22 103.147.22.15
```

**Langkah 2** — outputnya kira-kira begini:

```text
# 103.147.22.15:22 SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.10
103.147.22.15 ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQDL8xY2n...panjang...==
# 103.147.22.15:22 SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.10
103.147.22.15 ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTY...==
# 103.147.22.15:22 SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.10
103.147.22.15 ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH9k2mQ...==
```

**Langkah 3** — salin **seluruhnya apa adanya** ke secret `SSH_KNOWN_HOSTS`. Baris `#` boleh ikut, tidak masalah. Jangan diedit, jangan diambil satu baris saja.

#### Tiga hal yang membuat ini gagal

**1. Nilai `SSH_HOST` harus sama persis dengan yang di-keyscan.** Ini penyebab kegagalan paling umum. Kalau `SSH_HOST` diisi IP, keyscan IP-nya. Kalau diisi hostname, keyscan hostname-nya. `103.147.22.15` dan `server.example.com` dianggap dua host berbeda walaupun menunjuk mesin yang sama.

**2. Port non-standar mengubah formatnya.** Kalau SSH Anda di port 2222, barisnya jadi `[103.147.22.15]:2222 ssh-ed25519 ...` dengan kurung siku. `ssh-keyscan -p 2222` sudah menghasilkan format itu otomatis — makanya jangan mengetik manual.

**3. Verifikasi sidik jarinya sebelum dipakai.** `ssh-keyscan` mengambil apa pun yang menjawab, jadi kalau dijalankan di jaringan yang sudah disusupi, Anda justru mem-pin kunci penyerang. Bandingkan dengan yang Anda lihat saat SSH manual:

```bash
ssh-keyscan -p 22 103.147.22.15 2>/dev/null | ssh-keygen -lf -
```

Hasilnya harus cocok dengan fingerprint yang ditampilkan saat pertama kali Anda SSH ke server itu.

> Kalau host key server berubah (server dibangun ulang, OpenSSH di-reinstall), semua deploy langsung gagal dengan `Host key verification failed`. Perbaikannya: jalankan ulang `ssh-keyscan` dan perbarui secret-nya.

Untuk environment `production` nanti, tambahkan juga **Required reviewers** — dan wajib untuk migrasi.

> `DATABASE_URL`, `PAYLOAD_SECRET`, dan kredensial Google **tidak pernah** dimasukkan ke GitHub. Semuanya tetap di server. Artinya walau seluruh GitHub Actions run dibajak, ia tidak punya kredensial untuk konek langsung ke `38.47.91.76:5435`.

---

## 8. Uji manual sebelum menyalakan pipeline

Jangan biarkan percobaan pertama dockerfile baru terjadi di dalam pipeline.

```bash
cd ~/ComapnyProfile/mobis.co.id
set -a; . ./build.env; set +a
docker compose build mobis-stg
docker compose up -d mobis-stg
docker exec stg-mobis wget -qO- http://127.0.0.1:7884/api/widget/status-check
# harus: {"ok":true}
```

---

## 9. Baseline verifikasi — jalankan SEBELUM pipeline pertama

Simpan outputnya. Setelah deploy pertama, jalankan lagi dan bandingkan.

```bash
DB="postgres://usr_mobis_2:moBisRevamp2@38.47.91.76:5435/mobis_revamp_2"

psql "$DB" -tAc "
  select 'pages', count(*) from pages union all
  select 'posts', count(*) from posts union all
  select 'media', count(*) from media union all
  select 'customers', count(*) from customers union all
  select 'migrations', count(*) from payload_migrations;"

psql "$DB" -tAc "select name, batch from payload_migrations order by id;" | sha256sum

docker volume inspect mobiscoid_mobis_stg_payload_uploads | jq '{Name,Mountpoint,CreatedAt}'
docker exec stg-mobis sh -c 'find /app/public/media -type f | sort | sha256sum'
sha256sum ~/ComapnyProfile/mobis.co.id/src/.env
find ~/ComapnyProfile/mobis.co.id/src/private -type f | sort | sha256sum
```

### Kriteria lulus sesudah deploy

| Cek | Harus |
|---|---|
| 5 row count | **identik** |
| Hash ledger `payload_migrations` | **identik** — bukti tidak ada migrasi jalan |
| Volume `Name` + `CreatedAt` | **identik** — bukti volume tidak pernah dibuat ulang |
| Hash listing media | **identik** |
| Hash `.env` dan `private/` | **identik** — bukti `git reset --hard` mempertahankannya |
| `docker ps` kolom `Created` | **lebih baru** — bukti deploy memang terjadi |
| `docker images stg-mobis` | ada tag `latest`, `previous`, `rollback-<stamp>` |
| `curl https://stg-mobis.../api/widget/status-check` | `{"ok":true}` |

**Satu hal yang memang berubah, dan itu wajar:** nilai sequence (`select last_value from pages_id_seq`) bisa maju karena `resyncPostgresSequencesOnInit` jalan saat container boot memakai kredensial runtime. Itu bukan data baris, dan sudah terjadi setiap kali Anda restart container secara manual selama ini. Dengan role read-only, hal ini tidak lagi terjadi pada tahap **build**.

---

## 10. Uji jalur gagal — jangan dilewati

Pipeline yang belum pernah gagal dengan benar belum terbukti aman.

1. **Push error TypeScript** → CI merah, dan **nol koneksi SSH ke server** (cek `last` atau `journalctl -u ssh`).
2. **Push kode yang lolos typecheck tapi merusak `next build`** → job merah di step Deploy; `docker ps` menunjukkan **container ID dan uptime sama seperti sebelumnya**; situs tetap melayani.
3. **Arahkan `health_path` ke route yang tidak ada** (sementara, di `deploy.yml`) → rollback jalan; `docker images` menunjukkan `latest` dan `previous` menunjuk image ID yang sama; `git -C src rev-parse HEAD` kembali ke commit sebelumnya; situs sehat.

---

## 11. Menjalankan migrasi (kalau suatu saat perlu)

**Actions → DB Migrate (MANUAL) → Run workflow.**

- `action: status` → murni baca, aman, jalankan kapan saja.
- `action: up` → wajib mengetik `MIGRATE-STAGING` persis di kolom `confirm`, plus approval reviewer. Skrip otomatis `pg_dump` + verifikasi dump (ukuran & `pg_restore --list`) sebelum menulis apa pun.

⚠️ `src/migrations/20260525_area_chips_description_to_richtext.ts` melakukan `DROP COLUMN` lalu re-add di `up()`. Kalau `migrate:status` menunjukkan migrasi itu **pending** pada database yang kolomnya sudah berisi data — **berhenti**, jangan lanjut `up`, tulis migrasi manual.

Dump disimpan di `~/ComapnyProfile/mobis.co.id/backups/` dan **tidak pernah** diunggah sebagai artifact workflow (berisi seluruh koleksi `customers`).

---

## 12. Menambahkan server Production

Production berada di **server berbeda** dengan **struktur direktori berbeda** dari staging. Tidak ada yang dibagi antara keduanya kecuali logika deploy di `_deploy.yml` — host, kredensial, path, nama container, dan volume semuanya per-environment.

### 12a. Kumpulkan 6 nilai dari server production

Jalankan di server production:

```bash
# 1. app_dir — folder yang berisi docker-compose.yml (dan subfolder src/ = checkout git)
pwd

# 2. compose_service — service key di dalam docker-compose.yml
grep -A2 '^services:' docker-compose.yml

# 3. container + 5. port — nama container dan port internal aplikasi
docker ps --format '{{.Names}}\t{{.Ports}}'

# 4. uploads_volume — named volume yang ter-mount ke /app/public/media
docker inspect <NAMA_CONTAINER> --format '{{range .Mounts}}{{.Name}} -> {{.Destination}}{{"\n"}}{{end}}'

# 6. IP publik server (untuk secret SSH_HOST)
curl -4 -s ifconfig.me
```

### 12b. Buat GitHub Environment `production`

**Tidak ada kode yang perlu diubah.** `deploy.yml` sudah punya job `production`; yang membedakannya dari staging hanyalah isi Environment.

**Settings → Environments → New environment → `production`**, lalu isi dua tab:

**Tab *Secrets*** — nama sama dengan staging, nilai berbeda:

| Secret | Nilai production |
|---|---|
| `SSH_HOST` | IP server production |
| `SSH_USER` | user SSH di server production |
| `SSH_PORT` | port SSH server production |
| `SSH_PASSWORD` | password akun tersebut |
| `SSH_KNOWN_HOSTS` | `ssh-keyscan -p <port> <IP_PRODUCTION>` |

**Tab *Variables*** — dari hasil langkah 12a:

| Variable | Contoh nilai production |
|---|---|
| `APP_DIR` | `/home/<user>/ComapnyProfile-production/mobis.co.id` |
| `COMPOSE_SERVICE` | service key di compose production |
| `CONTAINER_NAME` | nama container production |
| `APP_PORT` | port internal app |
| `UPLOADS_VOLUME` | dari `docker volume ls \| grep upload` |
| `EXTERNAL_HEALTH_URL` | `https://<domain-production>/api/widget/status-check` |

Inilah gunanya Environment: nama identik di kedua sisi, sehingga `_deploy.yml` tidak perlu tahu apa pun tentang perbedaan kedua server.

> ⚠️ Folder terakhir `APP_DIR` production bernama sama dengan staging (`mobis.co.id`), jadi nama project Compose-nya juga sama (`mobiscoid`). Aman selama keduanya di server berbeda — tapi kalau suatu saat dijalankan di host yang sama, nama container dan volume akan bertabrakan.

### 12d. Siapkan server production sama seperti staging

Ulangi bagian **1–5 dan 8** dokumen ini di server production, dengan nilai miliknya sendiri:

- Role Postgres read-only (kalau production pakai database berbeda, buat role terpisah di sana)
- `build.env` dengan `NEXT_PUBLIC_SERVER_URL` dll. menunjuk domain production
- `web.dockerfile` dengan blok ARG/ENV
- `build.args` di `docker-compose.yml`
- Akses git non-interaktif (`GIT_TERMINAL_PROMPT=0 git ls-remote origin`)
- Build manual sekali sebelum menyalakan pipeline

⚠️ Jangan menyalin `build.env` staging ke production. Isinya menentukan domain yang di-*inline* ke bundle client saat build — salah nilai berarti situs production memuat aset dari domain staging.

### 12e. Ambil baseline production sebelum deploy pertama

Ulangi bagian 9 di server production dan simpan hasilnya. Deploy production pertama sebaiknya dijalankan lewat **workflow_dispatch** sambil ditonton, walaupun triggernya sudah otomatis.

---

## 13. Urutan rollout

1. Merge PR berisi perubahan repo + `.github/` ke `staging`.
2. Kerjakan bagian 1–7 dokumen ini di server & GitHub.
3. Uji manual (bagian 8), ambil baseline (bagian 9).
4. Jalankan `Deploy` pertama lewat **workflow_dispatch**, tonton langsung.
5. Bandingkan baseline (bagian 9).
6. Uji tiga jalur gagal (bagian 10).
7. Hapus `.github/workflows/nextjs.yml` di branch `production` (workflow GitHub Pages warisan yang tidak kompatibel) dan matikan GitHub Pages di repo settings.
8. Baru setelah staging terbukti stabil: kerjakan bagian 12 untuk server production.

> Jangan menyalakan production sebelum staging melewati ketiga uji jalur gagal di bagian 10. Itulah gunanya staging.

---

## Yang sengaja TIDAK dikerjakan pipeline ini

- **Tidak menjalankan migrasi.** Sama sekali, di jalur mana pun.
- **Tidak menyentuh volume upload.** Hanya di-assert keberadaannya sebelum & sesudah.
- **Tidak menjalankan `npm run build` di GitHub.** Build hanya di server, memakai `.env` dan `private/` yang memang sudah ada di sana.
- **Tidak memakai test bawaan sebagai gate.** `tests/e2e/frontend.e2e.spec.ts` masih boilerplate Payload (meng-assert judul "Payload Website Template") dan `package.json` script test hardcode `pnpm` padahal lockfile-nya npm. Perlu diperbaiki tersendiri sebelum layak jadi gate.
- **Tidak memperbaiki file media yang hilang** di volume `mobiscoid_mobis_stg_payload_uploads` — itu isu terpisah yang belum ketemu sumber filenya.
