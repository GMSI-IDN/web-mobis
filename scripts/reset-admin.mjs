import pg from 'pg'
import crypto from 'crypto'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../.env') })

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:1111@127.0.0.1:5432/local_mobis',
})

async function resetAdmin() {
  const email = 'admin@admin.com'
  const password = 'admin' // atau admin123
  console.log(`Setting admin credentials: email="${email}", password="admin123"...`)

  const saltBuffer = crypto.randomBytes(32)
  const salt = saltBuffer.toString('hex')

  const hashBuffer = await new Promise((resolve, reject) => {
    crypto.pbkdf2('admin123', salt, 25000, 512, 'sha256', (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
  })
  const hash = hashBuffer.toString('hex')

  const client = await pool.connect()
  try {
    const res = await client.query(
      `UPDATE "users" 
       SET "email" = $1, 
           "salt" = $2, 
           "hash" = $3, 
           "login_attempts" = 0, 
           "lock_until" = NULL 
       WHERE "id" = 1 
       RETURNING id, email`,
      [email, salt, hash]
    )

    if (res.rows.length === 0) {
      console.log('User id 1 not found, inserting new user...')
      const insertRes = await client.query(
        `INSERT INTO "users" ("email", "salt", "hash", "login_attempts")
         VALUES ($1, $2, $3, 0)
         RETURNING id, email`,
        [email, salt, hash]
      )
      console.log('Created user:', insertRes.rows[0])
    } else {
      console.log('Updated user:', res.rows[0])
    }

    console.log('✅ Admin reset successfully!')
  } catch (err) {
    console.error('Error resetting admin:', err)
  } finally {
    client.release()
    await pool.end()
  }
}

resetAdmin()
