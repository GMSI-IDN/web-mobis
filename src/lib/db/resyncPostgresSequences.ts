import type { Payload } from 'payload'

const SAFE_IDENTIFIER_RE = /^[A-Za-z_][A-Za-z0-9_]*$/

export async function resyncAllPostgresSequences(payload: Payload): Promise<void> {
  const sql = `
DO $$
DECLARE
  r RECORD;
  max_val bigint;
BEGIN
  FOR r IN (
    SELECT 
      t.relname as table_name,
      a.attname as column_name,
      s.relname as sequence_name
    FROM pg_class s
    JOIN pg_depend d ON d.objid = s.oid
    JOIN pg_class t ON t.oid = d.refobjid
    JOIN pg_attribute a ON (a.attrelid = d.refobjid AND a.attnum = d.refobjsubid)
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE s.relkind = 'S'
      AND d.deptype = 'a'
      AND n.nspname = 'public'
  ) LOOP
    EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', r.column_name, r.table_name) INTO max_val;
    EXECUTE format('SELECT setval(%L, %s, false)', r.sequence_name, max_val + 1);
  END LOOP;
END $$;
`
  await payload.db.drizzle.execute(sql)
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
  try {
    await resyncAllPostgresSequences(payload)
  } catch (error) {
    payload.logger.warn({ err: error }, 'Failed to resync all Postgres sequences on init')
  }
}

