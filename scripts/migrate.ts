import { sql } from "../lib/db"
import { readFileSync } from "fs"
import { join } from "path"

async function migrate() {
  console.log("Starting database migration...")

  try {
    // Read and execute the schema SQL
    const schemaSQL = readFileSync(join(__dirname, "001_init_schema.sql"), "utf-8")

    // Split by semicolons and execute each statement
    const statements = schemaSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const statement of statements) {
      await sql.unsafe(statement)
    }

    console.log("✓ Database schema created successfully")

    // Verify tables exist
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `

    console.log("\nCreated tables:")
    tables.forEach((table) => console.log(`  - ${table.table_name}`))

    console.log("\n✓ Migration completed successfully!")
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  }
}

migrate()
