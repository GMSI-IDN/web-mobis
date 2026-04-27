import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_blocks_registration_form_opts_online_app" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar,
      "value" varchar
    );

    CREATE INDEX IF NOT EXISTS "pages_blocks_registration_form_opts_online_app_order_idx"
      ON "pages_blocks_registration_form_opts_online_app" USING btree ("_order");

    CREATE INDEX IF NOT EXISTS "pages_blocks_registration_form_opts_online_app_parent_id_idx"
      ON "pages_blocks_registration_form_opts_online_app" USING btree ("_parent_id");

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'pages_blocks_registration_form_opts_online_app_parent_id_fk'
      ) THEN
        ALTER TABLE "pages_blocks_registration_form_opts_online_app"
          ADD CONSTRAINT "pages_blocks_registration_form_opts_online_app_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "pages_blocks_registration_form"("id")
          ON DELETE CASCADE;
      END IF;
    END
    $$;

    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_registration_form_opts_online_app" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar,
      "value" varchar,
      "_uuid" varchar
    );

    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_registration_form_opts_online_app_order_idx"
      ON "_pages_v_blocks_registration_form_opts_online_app" USING btree ("_order");

    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_registration_form_opts_online_app_parent_id_idx"
      ON "_pages_v_blocks_registration_form_opts_online_app" USING btree ("_parent_id");

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = '_pages_v_blocks_registration_form_opts_online_app_parent_id_fk'
      ) THEN
        ALTER TABLE "_pages_v_blocks_registration_form_opts_online_app"
          ADD CONSTRAINT "_pages_v_blocks_registration_form_opts_online_app_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "_pages_v_blocks_registration_form"("id")
          ON DELETE CASCADE;
      END IF;
    END
    $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_pages_v_blocks_registration_form_opts_online_app"
      DROP CONSTRAINT IF EXISTS "_pages_v_blocks_registration_form_opts_online_app_parent_id_fk";
    DROP INDEX IF EXISTS "_pages_v_blocks_registration_form_opts_online_app_parent_id_idx";
    DROP INDEX IF EXISTS "_pages_v_blocks_registration_form_opts_online_app_order_idx";
    DROP TABLE IF EXISTS "_pages_v_blocks_registration_form_opts_online_app";

    ALTER TABLE "pages_blocks_registration_form_opts_online_app"
      DROP CONSTRAINT IF EXISTS "pages_blocks_registration_form_opts_online_app_parent_id_fk";
    DROP INDEX IF EXISTS "pages_blocks_registration_form_opts_online_app_parent_id_idx";
    DROP INDEX IF EXISTS "pages_blocks_registration_form_opts_online_app_order_idx";
    DROP TABLE IF EXISTS "pages_blocks_registration_form_opts_online_app";
  `)
}
