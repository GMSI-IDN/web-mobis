// [10-09-2026] Script untuk sinkronisasi file media gambar dari CMS Production (admin.rentalmobis.com) ke folder lokal public/media
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PROD_CMS_URL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'https://admin.rentalmobis.com'
const MEDIA_DIR = path.resolve(__dirname, '../public/media')

async function syncMedia() {
  console.log(`\n🚀 Memulai sinkronisasi media dari: ${PROD_CMS_URL}`)
  console.log(`📁 Folder tujuan lokal: ${MEDIA_DIR}\n`)

  if (!fs.existsSync(MEDIA_DIR)) {
    fs.mkdirSync(MEDIA_DIR, { recursive: true })
  }

  try {
    const apiUrl = `${PROD_CMS_URL.replace(/\/+$/, '')}/api/media?limit=200`
    const res = await fetch(apiUrl)
    if (!res.ok) {
      throw new Error(`Gagal mengambil daftar media dari API: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    const docs = data.docs || []
    console.log(`📋 Ditemukan ${docs.length} dokumen media di production.\n`)

    const filesToSync = new Set()

    for (const doc of docs) {
      if (doc.filename) {
        filesToSync.add(doc.filename)
      }
      if (doc.sizes && typeof doc.sizes === 'object') {
        for (const sizeKey of Object.keys(doc.sizes)) {
          const sizeObj = doc.sizes[sizeKey]
          if (sizeObj?.filename) {
            filesToSync.add(sizeObj.filename)
          }
        }
      }
    }

    const fileList = Array.from(filesToSync)
    console.log(`📦 Total ${fileList.length} file gambar (asli + varian ukuran) akan diperiksa.\n`)

    let downloadedCount = 0
    let skippedCount = 0
    let failedCount = 0

    for (let i = 0; i < fileList.length; i++) {
      const filename = fileList[i]
      const localFilePath = path.join(MEDIA_DIR, filename)
      const fileUrl = `${PROD_CMS_URL.replace(/\/+$/, '')}/api/media/file/${encodeURIComponent(filename)}`

      // Periksa apakah file sudah ada dan ukurannya valid (> 500 bytes, bukan file dummy placeholder 68 byte)
      let needsDownload = true
      if (fs.existsSync(localFilePath)) {
        const stats = fs.statSync(localFilePath)
        if (stats.size > 500) {
          needsDownload = false
          skippedCount++
        }
      }

      if (needsDownload) {
        try {
          const fileRes = await fetch(fileUrl)
          if (fileRes.ok) {
            const buffer = Buffer.from(await fileRes.arrayBuffer())
            fs.writeFileSync(localFilePath, buffer)
            downloadedCount++
            const sizeKB = (buffer.length / 1024).toFixed(1)
            console.log(`[${i + 1}/${fileList.length}] ✅ Unduh: "${filename}" (${sizeKB} KB)`)
          } else {
            console.warn(`[${i + 1}/${fileList.length}] ⚠️  Gagal unduh "${filename}": Status ${fileRes.status}`)
            failedCount++
          }
        } catch (err) {
          console.error(`[${i + 1}/${fileList.length}] ❌ Error saat mengunduh "${filename}":`, err.message)
          failedCount++
        }
      } else {
        console.log(`[${i + 1}/${fileList.length}] ⏭️  Sudah ada (valid): "${filename}"`)
      }
    }

    console.log(`\n🎉 Sinkronisasi selesai!`)
    console.log(`- Berhasil diunduh : ${downloadedCount} file`)
    console.log(`- Sudah ada (skip) : ${skippedCount} file`)
    console.log(`- Gagal / Tidak ada: ${failedCount} file\n`)
  } catch (error) {
    console.error(`❌ Terjadi kesalahan saat proses sinkronisasi:`, error)
    process.exit(1)
  }
}

syncMedia()
