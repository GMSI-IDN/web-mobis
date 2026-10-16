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

export async function applyStagingToProduction(
  channel: 'dm' | 'comment' | 'all' = 'all',
  uuid?: string
): Promise<ApplyProductionResult[]> {
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
    return results
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

