import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/auth"
import { getDocumentWithAccess } from "@/lib/document-access"

type RouteParams = { params: Promise<{ documentId: string }> }

// GET /api/documents/[documentId]/collaborators
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

    // İşbirlikçi ve davet e-postaları hassas bilgidir; yalnızca sahip görebilir.
    if (access.role !== "OWNER") {
      return NextResponse.json(
        { error: "Bu işlem için sahip olmanız gerekiyor." },
        { status: 403 }
      )
    }

    const [collaborators, invitations] = await Promise.all([
      prisma.collaborator.findMany({
        where: { documentId },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.invitation.findMany({
        where: { documentId, status: "PENDING" },
        select: { id: true, email: true, role: true, status: true, createdAt: true },
      }),
    ])

    return NextResponse.json({
      owner: {
        id: access.document.userId,
      },
      collaborators: collaborators.map((c) => ({
        id: c.id,
        userId: c.user.id,
        name: c.user.name,
        email: c.user.email,
        role: c.role,
      })),
      pendingInvitations: invitations,
    })
  } catch (error) {
    console.error("List collaborators error:", error)
    return NextResponse.json(
      { error: "İşbirlikçiler alınırken bir hata oluştu." },
      { status: 500 }
    )
  }
}

// DELETE /api/documents/[documentId]/collaborators — İşbirlikçi kaldır
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const user = await getSession()
    if (!user) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 })
    }

    const { documentId } = await params
    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get("userId")

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Kaldırılacak kullanıcı ID gerekli." },
        { status: 400 }
      )
    }

    // Sadece sahip kaldırabilir
    const document = await prisma.document.findFirst({
      where: { id: documentId, userId: user.id },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Yetkiniz yok." },
        { status: 403 }
      )
    }

    await prisma.collaborator.deleteMany({
      where: { documentId, userId: targetUserId },
    })

    // İlgili daveti de sil
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { email: true },
    })
    if (targetUser) {
      await prisma.invitation.deleteMany({
        where: { documentId, email: targetUser.email },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Remove collaborator error:", error)
    return NextResponse.json(
      { error: "İşbirlikçi kaldırılırken bir hata oluştu." },
      { status: 500 }
    )
  }
}
