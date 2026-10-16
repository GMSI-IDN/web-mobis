import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { applyStagingToProduction, getFaqBackupsList } from '../src/utilities/chatbotDb.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function testPhase2() {
  console.log('[Test Phase 2] Memulai pengujian applyStagingToProduction() dengan auto-backup...')
  try {
    const res = await applyStagingToProduction('dm', undefined, 'TEST_PHASE2_ADMIN')
    console.log('✅ applyStagingToProduction berhasil dijalankan!')
    console.log('- Jumlah tabel tersinkron:', res.results.length)
    console.log('- Detail sync result:', res.results)
    console.log('- Backup record tercipta:', res.backup ? `#${res.backup.id} (${res.backup.backup_name})` : 'NULL')
    console.log('- Total items di backup:', res.backup?.total_items)

    console.log('\n[Test Phase 2] Memeriksa daftar backup terbaru...')
    const list = await getFaqBackupsList(5)
    console.log(`✅ Total riwayat di tabel: ${list.length}`)
    for (const b of list) {
      console.log(`  • ID #${b.id}: "${b.backup_name}" oleh ${b.triggered_by} (${b.total_items} items)`)
    }

    console.log('\n🎉 PENGUJIAN FASE 2 BERHASIL 100%!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Gagal pengujian Phase 2:', err)
    process.exit(1)
  }
}

testPhase2()
