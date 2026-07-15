import "dotenv/config"
import path from "node:path"
import { defineConfig } from "prisma/config"

// Prisma 7 looks for the config file in the project root only. dotenv loads
// DATABASE_URL from .env for CLI commands (db push, studio); Prisma 7 no longer
// loads .env automatically when a config file is present.
//
// The datasource url is only attached when DATABASE_URL is set. Commands that
// need it (db push, studio) will error clearly if it is missing, while commands
// that do not (generate, run during the Docker build without .env) still work.
// No silent fallback url, so we never connect to the wrong database.
const databaseUrl = process.env.DATABASE_URL

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  ...(databaseUrl ? { datasource: { url: databaseUrl } } : {}),
})
