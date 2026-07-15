import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

const UPLOAD_DIR =
  process.env.UPLOAD_DIR || join(process.cwd(), "data", "uploads")

export async function POST(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json(
        { error: "Dosya bulunamadı." },
        { status: 400 }
      )
    }

    // Dosya türü doğrulama. SVG script barındırabildiği için desteklenmez.
    // Uzantı, istemcinin verdiği dosya adından değil doğrulanmış MIME türünden
    // türetilir; böylece dizin geçişi ve sahte uzantı riski ortadan kalkar.
    const typeToExt: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
    }
    const ext = typeToExt[file.type]
    if (!ext) {
      return NextResponse.json(
        {
          error:
            "Desteklenmeyen dosya türü. Sadece JPEG, PNG, GIF ve WebP desteklenir.",
        },
        { status: 400 }
      )
    }

    // Dosya boyutu doğrulama (maks 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Dosya boyutu 5MB'dan büyük olamaz." },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${uuidv4()}.${ext}`
    const userDir = join(UPLOAD_DIR, user.id)

    await mkdir(userDir, { recursive: true })
    await writeFile(join(userDir, fileName), buffer)

    const url = `/api/files/${user.id}/${fileName}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Dosya yüklenirken bir hata oluştu." },
      { status: 500 }
    )
  }
}
