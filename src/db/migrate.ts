import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrationClient } from './index'

async function runMigrations() {
  console.log('Running migrations...')
  const db = drizzle(migrationClient)
  await migrate(db, { migrationsFolder: './src/db/migrations' })
  console.log('Migrations completed!')
  await migrationClient.end()
}

runMigrations().catch((err) => {
  console.error('Migration failed!', err)
  process.exit(1)
})