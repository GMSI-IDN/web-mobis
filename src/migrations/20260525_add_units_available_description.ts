import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_units_available"
      ADD COLUMN IF NOT EXISTS "description" varchar;

    ALTER TABLE "_pages_v_blocks_units_available"
      ADD COLUMN IF NOT EXISTS "description" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_pages_v_blocks_units_available"
      DROP COLUMN IF EXISTS "description";

    ALTER TABLE "pages_blocks_units_available"
      DROP COLUMN IF EXISTS "description";
  `)
}
