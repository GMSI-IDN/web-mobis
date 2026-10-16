import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const { Pool } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const connectionString =
  process.env.CHATBOT_DATABASE_URL ||
  'postgresql://postgres:1111@127.0.0.1:5432/chatBotMobisLocal'

const pool = new Pool({ connectionString })

async function run() {
  const client = await pool.connect()
  try {
    console.log(`[Setup Backups] Menghubungkan ke ${connectionString}...`)

    await client.query(`
      CREATE TABLE IF NOT EXISTS "chatbot_faq_backups" (
        "id" SERIAL PRIMARY KEY,
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
        "backup_name" VARCHAR(150) NOT NULL,
        "triggered_by" VARCHAR(100) DEFAULT 'CMS_ADMIN',
        "total_items" INT NOT NULL DEFAULT 0,
        "total_dm_stg" INT NOT NULL DEFAULT 0,
        "total_dm_prod" INT NOT NULL DEFAULT 0,
        "total_comment_stg" INT NOT NULL DEFAULT 0,
        "total_comment_prod" INT NOT NULL DEFAULT 0,
        "snapshot_data" JSONB NOT NULL,
        "metadata" JSONB DEFAULT '{}'::jsonb
      );

      CREATE INDEX IF NOT EXISTS "idx_faq_backups_created_at" ON "chatbot_faq_backups" ("created_at" DESC);
    `)

    console.log('✅ Tabel "chatbot_faq_backups" berhasil dibuat atau sudah ada!')

    const res = await client.query('SELECT count(*) FROM "chatbot_faq_backups"')
    console.log(`[Setup Backups] Jumlah snapshot saat ini: ${res.rows[0].count}`)
  } catch (err) {
    console.error('❌ Gagal membuat tabel chatbot_faq_backups:', err)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

run()
