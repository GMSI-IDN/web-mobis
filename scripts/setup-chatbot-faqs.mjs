import pg from 'pg'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const { Pool } = pg
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1111@127.0.0.1:5432/local_mobis',
})

async function setup() {
  const client = await pool.connect()
  try {
    console.log('Connecting to PostgreSQL to setup chatbot_faqs table...')

    await client.query(`
      DO $$ BEGIN
        CREATE TYPE "enum_chatbot_faqs_environment" AS ENUM('production', 'staging', 'all');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "enum_chatbot_faqs_channel" AS ENUM('dm', 'comment', 'all');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "enum_chatbot_faqs_category" AS ENUM('lepas-kunci', 'driver', 'tarif-promo', 'persyaratan', 'area-jadwal', 'umum');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        CREATE TYPE "enum_chatbot_faqs_status" AS ENUM('active', 'draft', 'archived');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      CREATE TABLE IF NOT EXISTS "chatbot_faqs" (
        "id" serial PRIMARY KEY NOT NULL,
        "uuid" varchar,
        "question" varchar NOT NULL,
        "answer" varchar NOT NULL,
        "environment" "enum_chatbot_faqs_environment" DEFAULT 'staging' NOT NULL,
        "channel" "enum_chatbot_faqs_channel" DEFAULT 'dm' NOT NULL,
        "category" "enum_chatbot_faqs_category" DEFAULT 'umum',
        "status" "enum_chatbot_faqs_status" DEFAULT 'active',
        "order" numeric DEFAULT 10,
        "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
        "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
      );

      ALTER TABLE "chatbot_faqs" ADD COLUMN IF NOT EXISTS "channel" "enum_chatbot_faqs_channel" DEFAULT 'dm' NOT NULL;
      ALTER TABLE "chatbot_faqs" ADD COLUMN IF NOT EXISTS "uuid" varchar;

      CREATE INDEX IF NOT EXISTS "chatbot_faqs_created_at_idx" ON "chatbot_faqs" ("created_at");
      CREATE INDEX IF NOT EXISTS "chatbot_faqs_environment_idx" ON "chatbot_faqs" ("environment");
      CREATE INDEX IF NOT EXISTS "chatbot_faqs_channel_idx" ON "chatbot_faqs" ("channel");
    `)

    console.log('✅ Table chatbot_faqs & column channel verified/created successfully.')

    const countRes = await client.query('SELECT count(*) FROM "chatbot_faqs"')
    const count = parseInt(countRes.rows[0].count, 10)
    console.log(`Current items in chatbot_faqs: ${count}`)

    // If count < 10, seed additional items for Staging DM and Comment
    if (count <= 9) {
      console.log('Seeding initial FAQs into chatbot_faqs...')
      const newItems = [
        {
          question: 'GMS / GMSI, apa itu GMS? Apa itu GMSI?',
          answer: 'GMS (Go-Mobility Solution) / PT Global Mobility Solution Indonesia (GMSI) adalah penyedia solusi mobilitas terpercaya yang mengelola rental kendaraan perorangan, korporasi, serta kemitraan taksi online MOBIS.',
          environment: 'staging',
          channel: 'dm',
          category: 'umum',
          status: 'active',
          order: 1,
        },
        {
          question: 'MOBIS apa itu MOBIS? MOBIS itu apa?',
          answer: 'MOBIS adalah platform rental mobil resmi dari GMSI yang menyediakan sewa lepas kunci, sewa dengan supir, serta program kepemilikan mobil (rent-to-own) untuk pengemudi profesional.',
          environment: 'staging',
          channel: 'dm',
          category: 'umum',
          status: 'active',
          order: 2,
        },
        {
          question: 'Mobil bisa untuk Gojek / Grab / taksi online?',
          answer: 'Bisa! Kami menyediakan armada khusus mitra taksi online (Gojek, Grab) dengan tarif harian atau mingguan yang kompetitif, sudah termasuk perawatan berkala dan asuransi proteksi.',
          environment: 'staging',
          channel: 'dm',
          category: 'tarif-promo',
          status: 'active',
          order: 3,
        },
        {
          question: 'Wilayah operasional area MOBIS melayani mana saja?',
          answer: 'Area operasional MOBIS melayani seluruh kawasan Jabodetabek (Jakarta, Bogor, Depok, Tangerang, Bekasi) termasuk antar-jemput bandara Soekarno-Hatta (CGK) dan Halim Perdanakusuma (HLP).',
          environment: 'staging',
          channel: 'dm',
          category: 'area-jadwal',
          status: 'active',
          order: 4,
        },
        {
          question: 'Asuransi: apakah ada asuransi? Mobil diasuransikan?',
          answer: 'Semua armada kendaraan MOBIS terlindungi oleh asuransi komprehensif (All Risk) standar operasional sehingga perjalanan Anda selalu tenang dan aman.',
          environment: 'staging',
          channel: 'dm',
          category: 'persyaratan',
          status: 'active',
          order: 5,
        },
        {
          question: 'Halo kak, untuk sewa Avanza per hari biayanya berapa ya?',
          answer: 'Halo kak! Untuk All New Avanza tarif sewa harian mulai dari Rp 350.000/hari ya. Mau kami bantu cek ketersediaan unitnya? Silakan DM kami tanggal penggunaannya ya kak! 😊',
          environment: 'staging',
          channel: 'comment',
          category: 'tarif-promo',
          status: 'active',
          order: 1,
        },
        {
          question: 'Bisa lepas kunci ke luar kota gak min?',
          answer: 'Bisa banget kak! Untuk luar kota batas penggunaan maksimal 300 km/hari ya. Silakan kirim pesan via DM untuk konsultasi rute & booking armada terbaik kami ya.',
          environment: 'staging',
          channel: 'comment',
          category: 'lepas-kunci',
          status: 'active',
          order: 2,
        },
      ]

      for (const item of newItems) {
        await client.query(
          `INSERT INTO "chatbot_faqs" ("question", "answer", "environment", "channel", "category", "status", "order")
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [item.question, item.answer, item.environment, item.channel, item.category, item.status, item.order]
        )
      }
      console.log(`✅ Seeded ${newItems.length} FAQs into PostgreSQL table.`)
    }
  } catch (err) {
    console.error('Error setting up chatbot_faqs table:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

setup()
