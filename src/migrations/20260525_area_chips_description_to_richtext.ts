import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_area_chips"
      DROP COLUMN IF EXISTS "description";

    ALTER TABLE "pages_blocks_area_chips"
      ADD COLUMN IF NOT EXISTS "description" jsonb;

    ALTER TABLE "_pages_v_blocks_area_chips"
      DROP COLUMN IF EXISTS "description";

    ALTER TABLE "_pages_v_blocks_area_chips"
      ADD COLUMN IF NOT EXISTS "description" jsonb;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_pages_v_blocks_area_chips"
      DROP COLUMN IF EXISTS "description";

    ALTER TABLE "_pages_v_blocks_area_chips"
      ADD COLUMN IF NOT EXISTS "description" varchar;

    ALTER TABLE "pages_blocks_area_chips"
      DROP COLUMN IF EXISTS "description";

    ALTER TABLE "pages_blocks_area_chips"
      ADD COLUMN IF NOT EXISTS "description" varchar;
  `)
}
