import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { restoreFaqBackup, getFaqBackupsList } from '../src/utilities/chatbotDb.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

async function testPhase3() {
  console.log('[Test Phase 3] Memulai pengujian Selective Restore...')
  try {
    const list = await getFaqBackupsList(1)
    if (list.length === 0) {
      throw new Error('Tidak ada riwayat backup di database untuk diuji!')
    }

    const latestBackup = list[0]
    console.log(`Menggunakan backup #${latestBackup.id}: "${latestBackup.backup_name}"`)

    // Uji coba 1: Restore ke Staging DM saja (aman, tidak mengganggu Production)
    console.log('\n[Uji Coba 1] Memulihkan ke STAGING saja (Channel: DM)...')
    const res1 = await restoreFaqBackup({
      backupId: latestBackup.id,
      targetEnv: 'staging',
      targetChannel: 'dm',
      triggeredBy: 'TEST_PHASE3_SELECTIVE',
    })

    console.log('✅ Uji Coba 1 Berhasil:')
    console.log('- Pesan:', res1.message)
    console.log('- Total dipulihkan:', res1.totalRestored)
    console.log('- Rincian tabel:', res1.restoredCounts)

    console.log('\n🎉 SELURUH PENGUJIAN FASE 3 BERHASIL 100%!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Gagal pengujian Phase 3:', err)
    process.exit(1)
  }
}

testPhase3()
