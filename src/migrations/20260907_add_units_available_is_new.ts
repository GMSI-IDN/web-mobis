import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_units_available_units"
      ADD COLUMN IF NOT EXISTS "is_new" boolean DEFAULT false;

    ALTER TABLE "_pages_v_blocks_units_available_units"
      ADD COLUMN IF NOT EXISTS "is_new" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_pages_v_blocks_units_available_units"
      DROP COLUMN IF EXISTS "is_new";

    ALTER TABLE "pages_blocks_units_available_units"
      DROP COLUMN IF EXISTS "is_new";
  `)
}
