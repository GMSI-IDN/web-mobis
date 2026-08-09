import { MigrateDownArgs, MigrateUpArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "pages_blocks_faq_accordion" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "title" varchar,
      "block_name" varchar
    );

    CREATE INDEX IF NOT EXISTS "pages_blocks_faq_accordion_order_idx"
      ON "pages_blocks_faq_accordion" USING btree ("_order");

    CREATE INDEX IF NOT EXISTS "pages_blocks_faq_accordion_parent_id_idx"
      ON "pages_blocks_faq_accordion" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "pages_blocks_faq_accordion_path_idx"
      ON "pages_blocks_faq_accordion" USING btree ("_path");

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'pages_blocks_faq_accordion_parent_id_fk'
      ) THEN
        ALTER TABLE "pages_blocks_faq_accordion"
          ADD CONSTRAINT "pages_blocks_faq_accordion_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "pages"("id")
          ON DELETE CASCADE;
      END IF;
    END
    $$;

    CREATE TABLE IF NOT EXISTS "pages_blocks_faq_accordion_items" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "question" varchar,
      "answer" varchar
    );

    CREATE INDEX IF NOT EXISTS "pages_blocks_faq_accordion_items_order_idx"
      ON "pages_blocks_faq_accordion_items" USING btree ("_order");

    CREATE INDEX IF NOT EXISTS "pages_blocks_faq_accordion_items_parent_id_idx"
      ON "pages_blocks_faq_accordion_items" USING btree ("_parent_id");

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'pages_blocks_faq_accordion_items_parent_id_fk'
      ) THEN
        ALTER TABLE "pages_blocks_faq_accordion_items"
          ADD CONSTRAINT "pages_blocks_faq_accordion_items_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "pages_blocks_faq_accordion"("id")
          ON DELETE CASCADE;
      END IF;
    END
    $$;

    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_faq_accordion" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "_path" text NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "title" varchar,
      "block_name" varchar,
      "_uuid" varchar
    );

    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_faq_accordion_order_idx"
      ON "_pages_v_blocks_faq_accordion" USING btree ("_order");

    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_faq_accordion_parent_id_idx"
      ON "_pages_v_blocks_faq_accordion" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_faq_accordion_path_idx"
      ON "_pages_v_blocks_faq_accordion" USING btree ("_path");

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = '_pages_v_blocks_faq_accordion_parent_id_fk'
      ) THEN
        ALTER TABLE "_pages_v_blocks_faq_accordion"
          ADD CONSTRAINT "_pages_v_blocks_faq_accordion_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "_pages_v"("id")
          ON DELETE CASCADE;
      END IF;
    END
    $$;

    CREATE TABLE IF NOT EXISTS "_pages_v_blocks_faq_accordion_items" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "question" varchar,
      "answer" varchar,
      "_uuid" varchar
    );

    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_faq_accordion_items_order_idx"
      ON "_pages_v_blocks_faq_accordion_items" USING btree ("_order");

    CREATE INDEX IF NOT EXISTS "_pages_v_blocks_faq_accordion_items_parent_id_idx"
      ON "_pages_v_blocks_faq_accordion_items" USING btree ("_parent_id");

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = '_pages_v_blocks_faq_accordion_items_parent_id_fk'
      ) THEN
        ALTER TABLE "_pages_v_blocks_faq_accordion_items"
          ADD CONSTRAINT "_pages_v_blocks_faq_accordion_items_parent_id_fk"
          FOREIGN KEY ("_parent_id")
          REFERENCES "_pages_v_blocks_faq_accordion"("id")
          ON DELETE CASCADE;
      END IF;
    END
    $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "_pages_v_blocks_faq_accordion_items"
      DROP CONSTRAINT IF EXISTS "_pages_v_blocks_faq_accordion_items_parent_id_fk";
    DROP INDEX IF EXISTS "_pages_v_blocks_faq_accordion_items_parent_id_idx";
    DROP INDEX IF EXISTS "_pages_v_blocks_faq_accordion_items_order_idx";
    DROP TABLE IF EXISTS "_pages_v_blocks_faq_accordion_items";

    ALTER TABLE "_pages_v_blocks_faq_accordion"
      DROP CONSTRAINT IF EXISTS "_pages_v_blocks_faq_accordion_parent_id_fk";
    DROP INDEX IF EXISTS "_pages_v_blocks_faq_accordion_path_idx";
    DROP INDEX IF EXISTS "_pages_v_blocks_faq_accordion_parent_id_idx";
    DROP INDEX IF EXISTS "_pages_v_blocks_faq_accordion_order_idx";
    DROP TABLE IF EXISTS "_pages_v_blocks_faq_accordion";

    ALTER TABLE "pages_blocks_faq_accordion_items"
      DROP CONSTRAINT IF EXISTS "pages_blocks_faq_accordion_items_parent_id_fk";
    DROP INDEX IF EXISTS "pages_blocks_faq_accordion_items_parent_id_idx";
    DROP INDEX IF EXISTS "pages_blocks_faq_accordion_items_order_idx";
    DROP TABLE IF EXISTS "pages_blocks_faq_accordion_items";

    ALTER TABLE "pages_blocks_faq_accordion"
      DROP CONSTRAINT IF EXISTS "pages_blocks_faq_accordion_parent_id_fk";
    DROP INDEX IF EXISTS "pages_blocks_faq_accordion_path_idx";
    DROP INDEX IF EXISTS "pages_blocks_faq_accordion_parent_id_idx";
    DROP INDEX IF EXISTS "pages_blocks_faq_accordion_order_idx";
    DROP TABLE IF EXISTS "pages_blocks_faq_accordion";
  `)
}
