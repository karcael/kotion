import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { getSharedDocuments, getDocumentWithAccess } from "@/lib/document-access"
import { extractPlainText } from "@/lib/tiptap-text"

// GET /api/documents - Dokümanları listele
export async function GET(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get("parentId")
    const favorites = searchParams.get("favorites") === "true"
    const archived = searchParams.get("archived") === "true"
    const shared = searchParams.get("shared") === "true"
    const all = searchParams.get("all") === "true"
    const recent = searchParams.get("recent") === "true"

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

    // Recently updated documents
    if (recent) {
      const documents = await prisma.document.findMany({
        where: {
          isArchived: false,
          OR: [
            { userId: user.id },
            { collaborators: { some: { userId: user.id } } },
          ],
        },
        orderBy: { updatedAt: "desc" },
        take: 6,
        select: { id: true, title: true, icon: true, updatedAt: true, parentId: true },
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
        // Yalnızca arşivlenmemiş çocukları say; aksi halde tüm çocukları çöpe
        // taşınmış bir sayfada boş genişletme oku görünür.
        _count: { select: { children: { where: { isArchived: false } } } },
      },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("List documents error:", error)
    return NextResponse.json(
      { error: "Dokümanlar alınırken bir hata oluştu." },
      { status: 500 }
    )
  }
}

// POST /api/documents - Doküman oluştur
export async function POST(request: Request) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
    }

    const body = await request.json()
    const { title, parentId, content, icon } = body

    // Bir üst sayfaya bağlanıyorsa, kullanıcının o sayfada en az düzenleme
    // yetkisi olduğunu doğrula; aksi halde yabancı bir sayfanın altına ekleme
    // (cross-tenant) yapılabilir.
    if (parentId) {
      const parentAccess = await getDocumentWithAccess(parentId, user.id)
      if (!parentAccess || parentAccess.role === "VIEWER") {
        return NextResponse.json(
          { error: "Üst sayfaya erişim yetkiniz yok." },
          { status: 403 }
        )
      }
    }

    const document = await prisma.document.create({
      data: {
        title: title || "Adsız",
        parentId: parentId || null,
        userId: user.id,
        ...(content ? { content, contentText: extractPlainText(content) } : {}),
        ...(icon ? { icon } : {}),
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error("Create document error:", error)
    return NextResponse.json(
      { error: "Doküman oluşturulurken bir hata oluştu." },
      { status: 500 }
    )
  }
}
