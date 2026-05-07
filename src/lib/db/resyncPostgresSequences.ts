import type { Payload } from 'payload'

const SAFE_IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/

function getCollectionTableNames(payload: Payload): string[] {
  const names = new Set<string>()

  Object.values(payload.collections).forEach((collection: any) => {
    const baseTable = String(collection?.config?.dbName ?? collection?.config?.slug ?? '').trim()
    if (!baseTable || !SAFE_IDENTIFIER_RE.test(baseTable)) return

    names.add(baseTable)

    const hasVersions = Boolean(collection?.config?.versions)
    if (hasVersions) {
      names.add(`_${baseTable}_v`)
    }
  })

  return Array.from(names)
}

export async function resyncTableIdSequence(payload: Payload, tableName: string): Promise<void> {
  if (!SAFE_IDENTIFIER_RE.test(tableName)) {
    throw new Error(`Unsafe table name: ${tableName}`)
  }

  const sql = `
DO $$
DECLARE
  seq_name text;
  max_id bigint;
BEGIN
  IF to_regclass(format('public.%I', '${tableName}')) IS NULL THEN
    RETURN;
  END IF;

  seq_name := pg_get_serial_sequence(format('public.%I', '${tableName}'), 'id');
  IF seq_name IS NULL THEN
    RETURN;
  END IF;

  EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM %I', '${tableName}') INTO max_id;
  PERFORM setval(seq_name, max_id + 1, false);
END $$;
`

  await payload.db.drizzle.execute(sql)
}

export async function resyncPostgresSequencesOnInit(payload: Payload): Promise<void> {
  const tableNames = getCollectionTableNames(payload)

  for (const tableName of tableNames) {
    try {
      await resyncTableIdSequence(payload, tableName)
    } catch (error) {
      payload.logger.warn(
        {
          err: error,
          tableName,
        },
        'Failed to resync Postgres sequence for table',
      )
    }
  }
}
