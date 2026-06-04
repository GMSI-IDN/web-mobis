import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_area_chips_areas"
      ADD COLUMN IF NOT EXISTS "is_partner" boolean DEFAULT false;

    ALTER TABLE "_pages_v_blocks_area_chips_areas"
      ADD COLUMN IF NOT EXISTS "is_partner" boolean DEFAULT false;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_pages_v_blocks_area_chips_areas"
      DROP COLUMN IF EXISTS "is_partner";

    ALTER TABLE "pages_blocks_area_chips_areas"
      DROP COLUMN IF EXISTS "is_partner";
  `)
}
