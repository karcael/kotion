import { NextResponse } from "next/server"
import { readFile, stat } from "fs/promises"
import { join, resolve, sep } from "path"
import { cookies } from "next/headers"
import { verifyToken, AUTH_COOKIE_NAME } from "@/lib/auth"

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || join(process.cwd(), "data", "uploads")

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Uploaded files are private; require a valid session before serving them.
    const cookieStore = await cookies()
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value
    if (!token || !(await verifyToken(token))) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
    }

    const { path } = await params
    const uploadRoot = resolve(UPLOAD_DIR)
    const filePath = resolve(join(UPLOAD_DIR, ...path))

    // Prevent path traversal; include the separator so sibling dirs sharing the
    // prefix (e.g. uploads-evil) do not pass the check.
    if (filePath !== uploadRoot && !filePath.startsWith(uploadRoot + sep)) {
      return NextResponse.json(
        { error: "Erişim reddedildi." },
        { status: 403 }
      )
    }

    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) {
      return NextResponse.json(
        { error: "Dosya bulunamadı." },
        { status: 404 }
      )
    }

    const buffer = await readFile(filePath)
    const ext = filePath.split(".").pop()?.toLowerCase()
    const contentType = CONTENT_TYPES[ext || ""] || "application/octet-stream"

    const headers: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    }
    // SVG files can embed scripts; serve them as a download instead of inline so
    // they cannot execute in the app origin.
    if (contentType === "image/svg+xml") {
      headers["Content-Disposition"] = "attachment"
    }

    return new NextResponse(new Uint8Array(buffer), { headers })
  } catch {
    return NextResponse.json(
      { error: "Dosya bulunamadı." },
      { status: 404 }
    )
  }
}
