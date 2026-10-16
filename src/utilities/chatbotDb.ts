import pg from 'pg'
import type { FaqItem } from '@/components/FaqChatbot/types'

const { Pool } = pg

let pool: pg.Pool | null = null

export function getChatbotDbPool(): pg.Pool {
  if (!pool) {
    const connectionString =
      process.env.CHATBOT_DATABASE_URL ||
      'postgresql://postgres:1111@127.0.0.1:5432/chatBotMobisLocal'

    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
    })
  }
  return pool
}

interface VectorRow {
  id: string
  text: string
  metadata: {
    jawaban?: string
    kategori?: string
    source?: string
    [key: string]: any
  } | null
}

export async function fetchAllVectorFaqs(): Promise<FaqItem[]> {
  const db = getChatbotDbPool()
  const faqs: FaqItem[] = []

  const tableConfigs = [
    { name: 'n8n_vectors_mobis_dm_stg', environment: 'staging' as const, channel: 'dm' as const },
    { name: 'n8n_vectors_mobis_comments_stg', environment: 'staging' as const, channel: 'comment' as const },
    { name: 'n8n_vectors_mobis_dm', environment: 'production' as const, channel: 'dm' as const },
    { name: 'n8n_vectors_mobis_comments', environment: 'production' as const, channel: 'comment' as const },
  ]

  for (const cfg of tableConfigs) {
    try {
      const res = await db.query<VectorRow>(
        `SELECT id, text, metadata FROM "${cfg.name}" ORDER BY text ASC`
      )

      for (let i = 0; i < res.rows.length; i++) {
        const row = res.rows[i]
        const question = (row.text || '(Tanpa judul/pertanyaan)').trim()
        const answer = (
          row.metadata?.jawaban ||
          'Tidak ada template jawaban terpisah pada metadata.'
        ).trim()
        const category = row.metadata?.kategori ? String(row.metadata.kategori).trim() : 'Umum'

        faqs.push({
          id: `${cfg.environment}-${cfg.channel}-${row.id}`,
          uuid: row.id,
          question,
          answer,
          environment: cfg.environment,
          channel: cfg.channel,
          category,
          status: 'active',
          order: i + 1,
        })
      }
    } catch (err) {
      console.warn(`[chatbotDb] Gagal membaca tabel ${cfg.name}:`, err)
    }
  }

  return faqs
}

export interface ApplyProductionResult {
  channel: 'dm' | 'comment'
  tableName: string
  syncedCount: number
}

export interface ApplyProductionResponse {
  results: ApplyProductionResult[]
  backup: ChatbotFaqBackupRow | null
}

export async function applyStagingToProduction(
  channel: 'dm' | 'comment' | 'all' = 'all',
  uuid?: string,
  triggeredBy: string = 'CMS_ADMIN'
): Promise<ApplyProductionResponse> {
  const db = getChatbotDbPool()
  const results: ApplyProductionResult[] = []

  const pairs: { channel: 'dm' | 'comment'; stgTable: string; prodTable: string }[] = []
  if (channel === 'dm' || channel === 'all') {
    pairs.push({
      channel: 'dm',
      stgTable: 'n8n_vectors_mobis_dm_stg',
      prodTable: 'n8n_vectors_mobis_dm',
    })
  }
  if (channel === 'comment' || channel === 'all') {
    pairs.push({
      channel: 'comment',
      stgTable: 'n8n_vectors_mobis_comments_stg',
      prodTable: 'n8n_vectors_mobis_comments',
    })
  }

  const client = await db.connect()
  try {
    await client.query('BEGIN')

    // 1. Ambil snapshot penuh sebelum perubahan terjadi dan simpan ke tabel chatbot_faq_backups
    let backupRecord: ChatbotFaqBackupRow | null = null
    try {
      backupRecord = await createFullFaqBackup(
        client,
        triggeredBy,
        `Snapshot sebelum sinkronisasi (${channel.toUpperCase()})`
      )
    } catch (backupErr) {
      console.error('[applyStagingToProduction] Gagal membuat auto-backup:', backupErr)
      throw new Error(
        `Gagal membuat snapshot backup: ${backupErr instanceof Error ? backupErr.message : String(backupErr)}`
      )
    }

    // 2. Jalankan sinkronisasi Staging ke Production
    for (const pair of pairs) {
      if (uuid) {
        const res = await client.query(
          `
          INSERT INTO "${pair.prodTable}" (id, text, metadata, embedding)
          SELECT id, text, metadata, embedding FROM "${pair.stgTable}"
          WHERE id = $1
          ON CONFLICT (id) DO UPDATE SET
            text = EXCLUDED.text,
            metadata = EXCLUDED.metadata,
            embedding = EXCLUDED.embedding
          RETURNING id;
          `,
          [uuid]
        )
        results.push({
          channel: pair.channel,
          tableName: pair.prodTable,
          syncedCount: res.rowCount ?? 0,
        })
      } else {
        // Mirrored sync: ensure production matches staging exactly
        await client.query(`
          DELETE FROM "${pair.prodTable}"
          WHERE id NOT IN (SELECT id FROM "${pair.stgTable}");
        `)

        const insertRes = await client.query(`
          INSERT INTO "${pair.prodTable}" (id, text, metadata, embedding)
          SELECT id, text, metadata, embedding FROM "${pair.stgTable}"
          ON CONFLICT (id) DO UPDATE SET
            text = EXCLUDED.text,
            metadata = EXCLUDED.metadata,
            embedding = EXCLUDED.embedding;
        `)

        const countRes = await client.query(`SELECT count(*) FROM "${pair.prodTable}"`)
        const totalRows = parseInt(countRes.rows[0].count, 10) || (insertRes.rowCount ?? 0)

        results.push({
          channel: pair.channel,
          tableName: pair.prodTable,
          syncedCount: totalRows,
        })
      }
    }

    await client.query('COMMIT')
    return { results, backup: backupRecord }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function updateStagingVectorFaq({
  uuid,
  channel = 'dm',
  question,
  answer,
  category,
}: {
  uuid: string
  channel?: 'dm' | 'comment'
  question: string
  answer: string
  category?: string
}): Promise<boolean> {
  const db = getChatbotDbPool()
  const tableName = channel === 'comment' ? 'n8n_vectors_mobis_comments_stg' : 'n8n_vectors_mobis_dm_stg'

  const res = await db.query(
    `
    UPDATE "${tableName}"
    SET text = $1,
        metadata = jsonb_set(
          jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{jawaban}',
            to_jsonb($2::text)
          ),
          '{kategori}',
          to_jsonb($3::text)
        )
    WHERE id = $4
    `,
    [question.trim(), answer.trim(), (category || 'Umum').trim(), uuid]
  )

  return (res.rowCount ?? 0) > 0
}

export async function deleteStagingVectorFaq({
  uuid,
  channel = 'dm',
}: {
  uuid: string
  channel?: 'dm' | 'comment'
}): Promise<boolean> {
  const db = getChatbotDbPool()
  const tableName = channel === 'comment' ? 'n8n_vectors_mobis_comments_stg' : 'n8n_vectors_mobis_dm_stg'

  const res = await db.query(`DELETE FROM "${tableName}" WHERE id = $1`, [uuid])

  return (res.rowCount ?? 0) > 0
}

export async function createStagingVectorFaq({
  channel = 'dm',
  question,
  answer,
  category,
}: {
  channel?: 'dm' | 'comment'
  question: string
  answer: string
  category?: string
}): Promise<{ uuid: string }> {
  const db = getChatbotDbPool()
  const tableName = channel === 'comment' ? 'n8n_vectors_mobis_comments_stg' : 'n8n_vectors_mobis_dm_stg'
  const newUuid = crypto.randomUUID()

  const metadata = {
    jawaban: answer.trim(),
    kategori: (category || 'Umum').trim(),
    source: 'CMS_ADMIN',
  }

  await db.query(
    `
    INSERT INTO "${tableName}" (id, text, metadata)
    VALUES ($1, $2, $3::jsonb)
    `,
    [newUuid, question.trim(), JSON.stringify(metadata)]
  )

  return { uuid: newUuid }
}

// ==========================================
// BACKUP & RESTORE SNAPSHOT ENGINE (FASE 1)
// ==========================================

export interface FaqSnapshotItem {
  uuid: string
  channel: 'dm' | 'comment'
  environment: 'staging' | 'production'
  question: string
  answer: string
  category: string
  metadata?: any
}

export interface FaqFullSnapshotData {
  timestamp: string
  summary: {
    total_all: number
    dm: { staging: number; production: number }
    comment: { staging: number; production: number }
  }
  dm: {
    staging: FaqSnapshotItem[]
    production: FaqSnapshotItem[]
  }
  comment: {
    staging: FaqSnapshotItem[]
    production: FaqSnapshotItem[]
  }
}

export interface ChatbotFaqBackupRow {
  id: number
  created_at: string
  backup_name: string
  triggered_by: string
  total_items: number
  total_dm_stg: number
  total_dm_prod: number
  total_comment_stg: number
  total_comment_prod: number
  snapshot_data: FaqFullSnapshotData
  metadata?: any
}

/**
 * Mengambil snapshot utuh dari seluruh 4 tabel FAQ (DM & Comment, Staging & Production)
 * dan menyimpannya ke tabel "chatbot_faq_backups" dalam format JSONB.
 *
 * Menerima client transaksi (opsional) agar dapat dijalankan secara atomik
 * dalam transaksi yang sama saat tombol "Ya, Sinkronkan ke Production" ditekan.
 */
export async function createFullFaqBackup(
  client?: pg.PoolClient,
  triggeredBy: string = 'CMS_ADMIN',
  customNote?: string,
): Promise<ChatbotFaqBackupRow> {
  const executor = client || getChatbotDbPool()

  // 1. Ambil seluruh data dari 4 tabel
  const tables = [
    { name: 'n8n_vectors_mobis_dm_stg', channel: 'dm' as const, env: 'staging' as const },
    { name: 'n8n_vectors_mobis_dm', channel: 'dm' as const, env: 'production' as const },
    { name: 'n8n_vectors_mobis_comments_stg', channel: 'comment' as const, env: 'staging' as const },
    { name: 'n8n_vectors_mobis_comments', channel: 'comment' as const, env: 'production' as const },
  ]

  const snapshot: FaqFullSnapshotData = {
    timestamp: new Date().toISOString(),
    summary: {
      total_all: 0,
      dm: { staging: 0, production: 0 },
      comment: { staging: 0, production: 0 },
    },
    dm: { staging: [], production: [] },
    comment: { staging: [], production: [] },
  }

  for (const t of tables) {
    const res = await executor.query<VectorRow>(
      `SELECT id, text, metadata FROM "${t.name}" ORDER BY text ASC`
    )

    const items: FaqSnapshotItem[] = res.rows.map((row) => ({
      uuid: row.id,
      channel: t.channel,
      environment: t.env,
      question: (row.text || '').trim(),
      answer: (row.metadata?.jawaban || '').trim(),
      category: row.metadata?.kategori ? String(row.metadata.kategori).trim() : 'Umum',
      metadata: row.metadata || undefined,
    }))

    if (t.channel === 'dm') {
      if (t.env === 'staging') {
        snapshot.dm.staging = items
        snapshot.summary.dm.staging = items.length
      } else {
        snapshot.dm.production = items
        snapshot.summary.dm.production = items.length
      }
    } else {
      if (t.env === 'staging') {
        snapshot.comment.staging = items
        snapshot.summary.comment.staging = items.length
      } else {
        snapshot.comment.production = items
        snapshot.summary.comment.production = items.length
      }
    }
  }

  const totalAll =
    snapshot.summary.dm.staging +
    snapshot.summary.dm.production +
    snapshot.summary.comment.staging +
    snapshot.summary.comment.production

  snapshot.summary.total_all = totalAll

  // 2. Format nama backup ramah pengguna
  const now = new Date()
  const dateStr = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Jakarta',
  }).format(now)
  const backupName = customNote ? `${customNote} (${dateStr} WIB)` : `Snapshot ${dateStr} WIB`

  // 3. Simpan ke tabel chatbot_faq_backups
  const insertRes = await executor.query<ChatbotFaqBackupRow>(
    `
    INSERT INTO "chatbot_faq_backups" (
      backup_name,
      triggered_by,
      total_items,
      total_dm_stg,
      total_dm_prod,
      total_comment_stg,
      total_comment_prod,
      snapshot_data,
      metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb)
    RETURNING *;
    `,
    [
      backupName,
      triggeredBy,
      totalAll,
      snapshot.summary.dm.staging,
      snapshot.summary.dm.production,
      snapshot.summary.comment.staging,
      snapshot.summary.comment.production,
      JSON.stringify(snapshot),
      JSON.stringify({ note: customNote || 'Backup otomatis sinkronisasi CMS', createdAtIso: snapshot.timestamp }),
    ]
  )

  return insertRes.rows[0]
}

/**
 * Mengambil daftar riwayat backup untuk Tampilan A (ringkasan tanpa muatan JSON penuh agar cepat).
 */
export async function getFaqBackupsList(limit: number = 50): Promise<Array<Omit<ChatbotFaqBackupRow, 'snapshot_data'>>> {
  const db = getChatbotDbPool()
  const res = await db.query(
    `
    SELECT
      id,
      created_at,
      backup_name,
      triggered_by,
      total_items,
      total_dm_stg,
      total_dm_prod,
      total_comment_stg,
      total_comment_prod,
      metadata
    FROM "chatbot_faq_backups"
    ORDER BY created_at DESC
    LIMIT $1;
    `,
    [limit]
  )

  return res.rows
}

/**
 * Mengambil detail satu snapshot backup lengkap berdasarkan ID (termasuk isi JSONB).
 */
export async function getFaqBackupById(id: number): Promise<ChatbotFaqBackupRow | null> {
  const db = getChatbotDbPool()
  const res = await db.query<ChatbotFaqBackupRow>(
    `SELECT * FROM "chatbot_faq_backups" WHERE id = $1`,
    [id]
  )

  return res.rows[0] || null
}

export interface RestoreBackupOptions {
  backupId: number
  targetEnv: 'staging' | 'production' | 'both'
  targetChannel: 'dm' | 'comment' | 'all'
  triggeredBy?: string
}

export interface RestoreBackupResult {
  success: boolean
  backupId: number
  backupName: string
  targetEnv: 'staging' | 'production' | 'both'
  targetChannel: 'dm' | 'comment' | 'all'
  restoredCounts: Record<string, number>
  totalRestored: number
  message: string
}

/**
 * Memulihkan data FAQ secara selektif dari suatu snapshot backup (Fase 3):
 * - Target Environment: 'staging' saja | 'production' saja | 'both' (keduanya)
 * - Target Channel: 'dm' saja | 'comment' saja | 'all' (keduanya)
 *
 * Dijalankan dalam satu transaksi database atomik (BEGIN ... COMMIT).
 */
export async function restoreFaqBackup(
  options: RestoreBackupOptions
): Promise<RestoreBackupResult> {
  const { backupId, targetEnv, targetChannel, triggeredBy = 'CMS_ADMIN' } = options
  const backup = await getFaqBackupById(backupId)
  if (!backup) {
    throw new Error(`Data backup dengan ID #${backupId} tidak ditemukan.`)
  }

  const snapshot = backup.snapshot_data
  if (!snapshot || !snapshot.dm) {
    throw new Error(`Struktur data backup #${backupId} tidak valid atau rusak.`)
  }

  const targetTables: Array<{
    tableName: string
    channel: 'dm' | 'comment'
    env: 'staging' | 'production'
    items: FaqSnapshotItem[]
  }> = []

  const shouldRestoreDm = targetChannel === 'dm' || targetChannel === 'all'
  const shouldRestoreComment = targetChannel === 'comment' || targetChannel === 'all'

  const shouldRestoreStaging = targetEnv === 'staging' || targetEnv === 'both'
  const shouldRestoreProduction = targetEnv === 'production' || targetEnv === 'both'

  if (shouldRestoreDm) {
    if (shouldRestoreStaging) {
      targetTables.push({
        tableName: 'n8n_vectors_mobis_dm_stg',
        channel: 'dm',
        env: 'staging',
        items: snapshot.dm.staging || [],
      })
    }
    if (shouldRestoreProduction) {
      targetTables.push({
        tableName: 'n8n_vectors_mobis_dm',
        channel: 'dm',
        env: 'production',
        items: snapshot.dm.production || [],
      })
    }
  }

  if (shouldRestoreComment) {
    if (shouldRestoreStaging) {
      targetTables.push({
        tableName: 'n8n_vectors_mobis_comments_stg',
        channel: 'comment',
        env: 'staging',
        items: snapshot.comment.staging || [],
      })
    }
    if (shouldRestoreProduction) {
      targetTables.push({
        tableName: 'n8n_vectors_mobis_comments',
        channel: 'comment',
        env: 'production',
        items: snapshot.comment.production || [],
      })
    }
  }

  const db = getChatbotDbPool()
  const client = await db.connect()
  const restoredCounts: Record<string, number> = {}
  let totalRestored = 0

  try {
    await client.query('BEGIN')

    for (const target of targetTables) {
      // 1. Bersihkan tabel target
      await client.query(`DELETE FROM "${target.tableName}"`)

      // 2. Masukkan seluruh item dari snapshot
      let count = 0
      for (const item of target.items) {
        const metadata = {
          jawaban: item.answer || '',
          kategori: item.category || 'Umum',
          ...(item.metadata || {}),
          restoredFromBackupId: backupId,
          restoredAt: new Date().toISOString(),
          restoredBy: triggeredBy,
        }

        await client.query(
          `
          INSERT INTO "${target.tableName}" (id, text, metadata)
          VALUES ($1, $2, $3::jsonb)
          `,
          [item.uuid, item.question, JSON.stringify(metadata)]
        )
        count++
      }

      restoredCounts[target.tableName] = count
      totalRestored += count
    }

    await client.query('COMMIT')

    const envLabel = targetEnv === 'both' ? 'Staging & Production' : targetEnv.toUpperCase()
    const channelLabel = targetChannel === 'all' ? 'DM & Comment' : targetChannel.toUpperCase()

    return {
      success: true,
      backupId: backup.id,
      backupName: backup.backup_name,
      targetEnv,
      targetChannel,
      restoredCounts,
      totalRestored,
      message: `Berhasil memulihkan ${totalRestored} FAQ (${channelLabel} - ${envLabel}) dari backup #${backup.id}!`,
    }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}


