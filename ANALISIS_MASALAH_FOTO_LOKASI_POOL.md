# 🔍 Laporan Analisis Masalah: Foto "No Image" pada Section Lokasi Pool

> **Target Masalah:** Section **LOKASI POOL** di frontend (`rentalmobis.com`) menampilkan placeholder abu-abu bertuliskan **"No Image"**, padahal di Admin Payload CMS gambar pool (`pool-1.webp`) sudah terunggah dan terpasang dengan benar pada setiap Area.  
> **Tanggal:** 24 September 2026  
> **Status:** Root cause ditemukan & perbaikan telah siap.

---

## 📌 Ringkasan Eksekutif

Penyebab utama foto tidak muncul di frontend adalah **kesalahan logika tipe data (*type mismatch bug*) pada pemanggilan fungsi resolusi URL gambar di komponen `AreaChips`**, yang diperkenalkan pada commit `545f287`:

1. Komponen mengekstrak URL gambar menjadi tipe `string` (`poolRawUrl`), lalu mengopernya ke fungsi pembantu `getMediaUrl()`.
2. Di dalam `getMediaUrl()`, terdapat pengecekan:
   ```ts
   if (typeof poolImage === 'string') return null // belum populated
   ```
3. Akibatnya, setiap kali URL berbentuk string masuk, fungsi tersebut mengira data belum ter-populate dan **selalu mengembalikan nilai `null`**.
4. Di sisi JSX, kondisi `{imgUrl ? <img ... /> : <div>No Image</div>}` secara konsisten menampilkan teks **"No Image"**.
5. Di lokal Anda, perbaikan fungsi ini (`resolvePoolImageUrl`) sebenarnya **sudah ditulis**, namun statusnya masih **Unstaged / Uncommitted** di Git lokal sehingga server produksi masih menjalankan kode lama yang bermasalah.

---

## 🔎 Analisis Teknis Mendalam

### 1. Bukti Kode yang Berjalan di Server Produksi (Commit `545f287`)

Pada file [`src/blocks/Mobis/AreaChips/Component.tsx`](file:///c:/Users/pc_it/OneDrive/Documents/codes/web-mobis/src/blocks/Mobis/AreaChips/Component.tsx):

#### A. Definisi Fungsi Pembantu:
```typescript
function getMediaUrl(poolImage: Area['PoolImage']): string | null {
  if (!poolImage) return null
  if (typeof poolImage === 'string') return null // <-- BARIS PENYEBAB BUG!
  return poolImage.url ? formatMediaUrl(poolImage.url) : null
}
```

#### B. Pemanggilan di Dalam Loop Card Area:
```typescript
{(areas ?? []).map((a, i) => {
  const poolMedia =
    typeof a?.PoolImage === 'object' && a?.PoolImage !== null
      ? (a.PoolImage as any)
      : null

  // 1. poolRawUrl bernilai STRING, misal: "/api/media/file/pool-1-300x120.webp"
  const poolRawUrl =
    poolMedia?.sizes?.thumbnail?.url ||
    poolMedia?.sizes?.small?.url ||
    poolMedia?.url ||
    (typeof a?.PoolImage === 'string' ? a.PoolImage : undefined)

  // 2. String poolRawUrl dioper ke getMediaUrl yang mengira parameternya adalah Media Object
  const imgUrl = getMediaUrl(poolRawUrl) 

  // ...
})}
```

#### C. Alur Eksekusi yang Terjadi:
1. Payload CMS berhasil me-load data relasi `PoolImage` sebagai objek Media:
   ```json
   {
     "id": 15,
     "url": "/api/media/file/pool-1.webp",
     "sizes": {
       "thumbnail": { "url": "/api/media/file/pool-1-300x104.webp" }
     }
   }
   ```
2. Komponen mengambil string URL thumbnail:
   `poolRawUrl = "/api/media/file/pool-1-300x104.webp"`.
3. Komponen memanggil `getMediaUrl("/api/media/file/pool-1-300x104.webp")`.
4. Fungsi `getMediaUrl` memeriksa: `if (typeof poolImage === 'string') return null`.
5. Karena tipenya adalah `string`, fungsi **langsung mengembalikan `null`**.
6. Kondisi render di baris 128:
   ```tsx
   {imgUrl ? (
     <img src={imgUrl} alt={alt} ... />
   ) : (
     <div style={{ height: 150, background: '#e9ecef', color: '#6c757d', fontWeight: 600 }}>
       No Image
     </div>
   )}
   ```
   Karena `imgUrl === null`, maka **elemen `<div>No Image</div>` yang selalu dirender**.

---

### 2. Status Perubahan di Komputer Lokal

Di repositori lokal Anda, kode ini telah diperbaiki dengan fungsi baru bernama `resolvePoolImageUrl`:

```typescript
function resolvePoolImageUrl(poolImage: Area['PoolImage']): string | null {
  if (!poolImage) return null

  // Jika string merupakan path URL yang valid, langsung format
  if (typeof poolImage === 'string') {
    if (poolImage.startsWith('/') || poolImage.startsWith('http')) {
      return formatMediaUrl(poolImage)
    }
    return null
  }

  // Jika berupa object Media dari Payload
  const media = poolImage as any
  const rawUrl =
    media?.sizes?.thumbnail?.url ||
    media?.sizes?.small?.url ||
    media?.sizes?.medium?.url ||
    media?.url

  return rawUrl ? formatMediaUrl(rawUrl) : null
}
```

Dan dipanggil secara benar:
```typescript
const imgUrl = resolvePoolImageUrl(a?.PoolImage)
```

**Namun saat diperiksa via `git status`:**
```text
On branch production
Your branch is up to date with 'origin/production'.

Changes not staged for commit:
  modified:   src/blocks/Mobis/AreaChips/Component.tsx
```
File ini **masih berada di working tree lokal** (belum di-stage, belum di-commit, belum di-push, dan belum di-deploy ke server). Oleh karena itu, website produksi (`rentalmobis.com`) masih menjalankan kode versi lama yang bermasalah.

---

## 🛠️ Langkah Solusi (Cara Mengatasinya)

### Langkah 1: Simpan & Commit Perbaikan Lokal
Jalankan perintah berikut di terminal repositori:

```bash
git add src/blocks/Mobis/AreaChips/Component.tsx
git commit -m "fix(area-chips): resolve pool image url properly from media object"
```

### Langkah 2: Push ke Branch Production
```bash
git push origin production
```

### Langkah 3: Deploy ke Server Produksi
Setelah di-push:
* Jika menggunakan **GitHub Actions CI/CD**, pipeline deployment akan otomatis berjalan.
* Jika deployment dilakukan manual di server:
  ```bash
  git pull origin production
  npm run build   # atau docker compose build & restart container
  ```

### Langkah 4: Verifikasi Cache Next.js (ISR)
Halaman home di-cache oleh `unstable_cache` Next.js (`tags: ['page_home']`).  
Setelah deploy selesai:
1. Buka Admin Payload (`/admin`).
2. Masuk ke menu **Pages** -> Buka halaman **Home**.
3. Klik tombol **Save** / **Publish** sekali lagi.
4. Hook `revalidatePage` akan otomatis membersihkan tag cache `page_home`, dan gambar pool akan langsung muncul seketika di website!
