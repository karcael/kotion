import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { getAncestors, getDocumentWithAccess } from "@/lib/document-access"
import { extractPlainText } from "@/lib/tiptap-text"

type RouteParams = { params: Promise<{ documentId: string }> }

// GET /api/documents/[documentId]
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
    }

    const { documentId } = await params
    const access = await getDocumentWithAccess(documentId, user.id)

    if (!access) {
      return NextResponse.json(
        { error: "Doküman bulunamadı." },
        { status: 404 }
      )
    }

    const ancestors = await getAncestors(access.document.parentId)
    return NextResponse.json({ ...access.document, role: access.role, ancestors })
  } catch (error) {
    console.error("Get document error:", error)
    return NextResponse.json(
      { error: "Doküman alınırken bir hata oluştu." },
      { status: 500 }
    )
  }
}

// PATCH /api/documents/[documentId]
export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
    }

    const { documentId } = await params
    const body = await request.json()
    const access = await getDocumentWithAccess(documentId, user.id)

    if (!access) {
      return NextResponse.json(
        { error: "Doküman bulunamadı." },
        { status: 404 }
      )
    }

    // VIEWER düzenleyemez
    if (access.role === "VIEWER") {
      return NextResponse.json(
        { error: "Düzenleme yetkiniz yok." },
        { status: 403 }
      )
    }

    // Sadece sahip arşivleyebilir, silebilir, yayınlayabilir
    const ownerOnlyFields = ["isArchived", "isFavorite", "isPublished"]
    if (access.role !== "OWNER") {
      for (const field of ownerOnlyFields) {
        if (field in body) {
          return NextResponse.json(
            { error: "Bu işlem için sahip olmanız gerekiyor." },
            { status: 403 }
          )
        }
      }
    }

    const allowedFields = [
      "title",
      "content",
      "icon",
      "coverImage",
      "isArchived",
      "isFavorite",
      "isPublished",
    ]
    const updateData: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (field in body) {
        updateData[field] = body[field]
      }
    }
    if ("content" in body) {
      updateData.contentText = extractPlainText(body.content)
    }

    let document
    if (body.isArchived === true) {
      // Sayfayı ve tüm alt ağacını tek transaction içinde arşivle.
      const descendantIds = await collectDescendantIds(documentId)
      document = await prisma.$transaction(async (tx) => {
        if (descendantIds.length > 0) {
          await tx.document.updateMany({
            where: { id: { in: descendantIds } },
            data: { isArchived: true },
          })
        }
        return tx.document.update({ where: { id: documentId }, data: updateData })
      })
    } else if (body.isArchived === false && access.document.parentId) {
      // Geri yüklerken arşivli üst zinciri de aynı transaction içinde geri yükle.
      const ancestorIds = await collectArchivedAncestorIds(
        access.document.parentId
      )
      document = await prisma.$transaction(async (tx) => {
        if (ancestorIds.length > 0) {
          await tx.document.updateMany({
            where: { id: { in: ancestorIds } },
            data: { isArchived: false },
          })
        }
        return tx.document.update({ where: { id: documentId }, data: updateData })
      })
    } else {
      document = await prisma.document.update({
        where: { id: documentId },
        data: updateData,
      })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error("Update document error:", error)
    return NextResponse.json(
      { error: "Doküman güncellenirken bir hata oluştu." },
      { status: 500 }
    )
  }
}

// DELETE /api/documents/[documentId] — sadece sahip
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
    }

    const { documentId } = await params
    const access = await getDocumentWithAccess(documentId, user.id)

    if (!access) {
      return NextResponse.json(
        { error: "Doküman bulunamadı." },
        { status: 404 }
      )
    }

    if (access.role !== "OWNER") {
      return NextResponse.json(
        { error: "Silme yetkisi sadece sayfa sahibine aittir." },
        { status: 403 }
      )
    }

    // Sayfayı ve tüm alt ağacını tek atomik işlemde sil.
    const descendantIds = await collectDescendantIds(documentId)
    await prisma.document.deleteMany({
      where: { id: { in: [documentId, ...descendantIds] } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete document error:", error)
    return NextResponse.json(
      { error: "Doküman silinirken bir hata oluştu." },
      { status: 500 }
    )
  }
}

// Collects all descendant ids of a node level by level (one query per depth
// level instead of one per node). Bounded to avoid runaway loops on cycles.
async function collectDescendantIds(rootId: string): Promise<string[]> {
  const ids: string[] = []
  let frontier = [rootId]
  let depth = 0
  while (frontier.length > 0 && depth < 100) {
    const children = await prisma.document.findMany({
      where: { parentId: { in: frontier } },
      select: { id: true },
    })
    const childIds = children.map((c) => c.id)
    if (childIds.length === 0) break
    ids.push(...childIds)
    frontier = childIds
    depth++
  }
  return ids
}

// Collects ids of archived ancestors walking up the parent chain.
async function collectArchivedAncestorIds(
  parentId: string
): Promise<string[]> {
  const ids: string[] = []
  let currentId: string | null = parentId
  let depth = 0
  while (currentId && depth < 100) {
    const parent: {
      id: string
      isArchived: boolean
      parentId: string | null
    } | null = await prisma.document.findUnique({
      where: { id: currentId },
      select: { id: true, isArchived: true, parentId: true },
    })
    if (!parent || !parent.isArchived) break
    ids.push(parent.id)
    currentId = parent.parentId
    depth++
  }
  return ids
}
