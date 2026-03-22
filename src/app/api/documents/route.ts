import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { getSharedDocuments } from "@/lib/document-access"

// GET /api/documents - Dokümanları listele
export async function GET(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get("parentId")
    const favorites = searchParams.get("favorites") === "true"
    const archived = searchParams.get("archived") === "true"
    const shared = searchParams.get("shared") === "true"
    const all = searchParams.get("all") === "true"

    // Paylaşılan dokümanlar
    if (shared) {
      const sharedDocs = await getSharedDocuments(user.id)
      return NextResponse.json(sharedDocs)
    }

    // Tüm sayfalar (alt sayfalar dahil) — sayfa bağlantısı dialogu için
    if (all) {
      const documents = await prisma.document.findMany({
        where: { userId: user.id, isArchived: false },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          title: true,
          icon: true,
          parentId: true,
        },
      })
      return NextResponse.json(documents)
    }

    const documents = await prisma.document.findMany({
      where: {
        userId: user.id,
        isArchived: archived,
        ...(favorites ? { isFavorite: true, isArchived: false } : {}),
        ...(parentId
          ? { parentId }
          : archived
            ? {}
            : { parentId: null }),
      },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        title: true,
        icon: true,
        coverImage: true,
        isArchived: true,
        isFavorite: true,
        isPublished: true,
        parentId: true,
        createdAt: true,
        updatedAt: true,
        position: true,
        _count: { select: { children: true } },
      },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("List documents error:", error)
    return NextResponse.json(
      { error: "Dokümanlar alınırken bir hata oluştu" },
      { status: 500 }
    )
  }
}

// POST /api/documents - Doküman oluştur
export async function POST(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 })
    }

    const body = await request.json()
    const { title, parentId } = body

    const document = await prisma.document.create({
      data: {
        title: title || "Adsız",
        parentId: parentId || null,
        userId: user.id,
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error("Create document error:", error)
    return NextResponse.json(
      { error: "Doküman oluşturulurken bir hata oluştu" },
      { status: 500 }
    )
  }
}
