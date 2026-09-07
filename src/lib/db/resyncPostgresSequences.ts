import type { Payload } from 'payload'

/**
 * Resync all PostgreSQL sequences in the public schema using standard SQL
 * queries (no PL/pgSQL DO $$ blocks) so it works with connection poolers
 * (PgBouncer) and restricted database users in production.
 */
export async function resyncAllPostgresSequences(payload: Payload): Promise<void> {
  // Step 1: Discover all sequences and their owning table+column using standard SQL.
  const sequenceRows = (await payload.db.drizzle.execute(`
    SELECT
      t.relname  AS table_name,
      a.attname  AS column_name,
      s.relname  AS sequence_name
    FROM pg_class s
    JOIN pg_depend d     ON d.objid = s.oid
    JOIN pg_class t      ON t.oid = d.refobjid
    JOIN pg_attribute a  ON a.attrelid = d.refobjid AND a.attnum = d.refobjsubid
    JOIN pg_namespace n  ON n.oid = t.relnamespace
    WHERE s.relkind = 'S'
      AND d.deptype = 'a'
      AND n.nspname = 'public'
  `)) as { rows: Array<{ table_name: string; column_name: string; sequence_name: string }> }

  const rows = sequenceRows.rows ?? sequenceRows
  if (!Array.isArray(rows) || rows.length === 0) return

  // Step 2: For each sequence, run two standard queries (no DO $$ block).
  for (const row of rows) {
    try {
      // Get the current max value of the column
      const maxResult = (await payload.db.drizzle.execute(
        `SELECT COALESCE(MAX("${row.column_name}"), 0) AS max_val FROM "${row.table_name}"`,
      )) as { rows: Array<{ max_val: string | number }> }

      const maxRows = maxResult.rows ?? maxResult
      const maxVal = Number(Array.isArray(maxRows) && maxRows[0] ? maxRows[0].max_val : 0)

      // Set the sequence to max + 1 (false = next nextval() returns max+1)
      await payload.db.drizzle.execute(
        `SELECT setval('"${row.sequence_name}"', ${maxVal + 1}, false)`,
      )
    } catch (err) {
      // Log and continue — one failing table should not block the rest
      payload.logger.warn(
        { err, table: row.table_name, sequence: row.sequence_name },
        'Failed to resync sequence for table',
      )
    }
  }
}

/**
 * Resync the `id` sequence for a single table.
 */
export async function resyncTableIdSequence(payload: Payload, tableName: string): Promise<void> {
  const SAFE_IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/
  if (!SAFE_IDENTIFIER_RE.test(tableName)) {
    throw new Error(`Unsafe table name: ${tableName}`)
  }

  // Check if the sequence exists
  const seqResult = (await payload.db.drizzle.execute(
    `SELECT pg_get_serial_sequence('"${tableName}"', 'id') AS seq_name`,
  )) as { rows: Array<{ seq_name: string | null }> }

  const seqRows = seqResult.rows ?? seqResult
  const seqName = Array.isArray(seqRows) && seqRows[0] ? seqRows[0].seq_name : null
  if (!seqName) return

  // Get the current max id
  const maxResult = (await payload.db.drizzle.execute(
    `SELECT COALESCE(MAX(id), 0) AS max_id FROM "${tableName}"`,
  )) as { rows: Array<{ max_id: string | number }> }

  const maxRows = maxResult.rows ?? maxResult
  const maxId = Number(Array.isArray(maxRows) && maxRows[0] ? maxRows[0].max_id : 0)

  // Set the sequence
  await payload.db.drizzle.execute(`SELECT setval('${seqName}', ${maxId + 1}, false)`)
}

/**
 * Safe wrapper called from payload.config.ts onInit.
 * Catches all errors so the server always starts even if resync fails.
 */
export async function resyncPostgresSequencesOnInit(payload: Payload): Promise<void> {
  try {
    await resyncAllPostgresSequences(payload)
    payload.logger.info('PostgreSQL sequences resynced successfully')
  } catch (error) {
    // Never crash the server — just warn
    payload.logger.warn({ err: error }, 'Failed to resync PostgreSQL sequences on init')
  }
}
