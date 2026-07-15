// Standalone script (run via `npm run db:backfill-content-text`), not part of
// the Next.js build. `dotenv/config` must be imported explicitly here because
// tsx does not load `.env` automatically outside of the Prisma CLI.
import "dotenv/config"
import { prisma } from "../src/lib/prisma"
import { extractPlainText } from "../src/lib/tiptap-text"

// Backfills contentText for documents that already have JSON content but no
// plain-text copy yet (e.g. rows created before this column existed). Only
// selects contentText: null rows, so re-running after a successful backfill
// is a no-op and safe to run multiple times.
async function main() {
  const docs = await prisma.document.findMany({
    where: { contentText: null },
    select: { id: true, content: true },
  })

  // content is a nullable Json column; documents created without content
  // have nothing to extract, so skip them rather than writing an empty string.
  const pending = docs.filter(
    (doc) => doc.content !== null && doc.content !== undefined
  )

  console.log(`Backfilling ${pending.length} document(s)...`)
  for (const doc of pending) {
    await prisma.document.update({
      where: { id: doc.id },
      data: { contentText: extractPlainText(doc.content) },
    })
  }
  console.log("Done.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
