import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createFullFaqBackup, getFaqBackupsList, getFaqBackupById } from '../src/utilities/chatbotDb.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function test() {
  console.log('[Test Backup Engine] Memulai pengujian createFullFaqBackup()...')
  try {
    const backup = await createFullFaqBackup(undefined, 'TEST_ADMIN', 'Uji Coba Snapshot Pertama')
    console.log('✅ Berhasil membuat snapshot backup!')
    console.log(`- ID Backup: #${backup.id}`)
    console.log(`- Nama: ${backup.backup_name}`)
    console.log(`- Tanggal: ${backup.created_at}`)
    console.log(`- Total FAQ: ${backup.total_items}`)
    console.log(`- DM Staging: ${backup.total_dm_stg}`)
    console.log(`- DM Production: ${backup.total_dm_prod}`)
    console.log(`- Comment Staging: ${backup.total_comment_stg}`)
    console.log(`- Comment Production: ${backup.total_comment_prod}`)

    console.log('\n[Test Backup Engine] Menguji getFaqBackupsList()...')
    const list = await getFaqBackupsList()
    console.log(`✅ Berhasil mengambil daftar riwayat! Ditemukan ${list.length} snapshot.`)
    console.log('Sample list row:', list[0])

    console.log('\n[Test Backup Engine] Menguji getFaqBackupById()...')
    const detail = await getFaqBackupById(backup.id)
    console.log(`✅ Berhasil mengambil detail backup #${backup.id}!`)
    console.log(`- Snapshot timestamp: ${detail?.snapshot_data.timestamp}`)
    console.log(`- DM Staging array length: ${detail?.snapshot_data.dm.staging.length}`)
    console.log(`- Sampel pertanyaan pertama: "${detail?.snapshot_data.dm.staging[0]?.question}"`)

    console.log('\n🎉 SELURUH PENGUJIAN FASE 1 BERHASIL 100%!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Gagal pengujian backup:', err)
    process.exit(1)
  }
}

test()
